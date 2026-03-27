import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
// Sprint AG: E-Mail-Benachrichtigung bei Status-Änderung
import { emailService } from "@/lib/email"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auftrag = await prisma.auftrag.findUnique({
    where: { id },
    include: {
      saison: true,
      gruppe: true,
      abnahmen: true,
      protokolle: true,
      rechnungen: true,
    },
  })
  if (!auftrag) return NextResponse.json({ error: "Not found" }, { status: 404 })
  // wizardDaten is already included via findUnique (no select restriction)
  return NextResponse.json(auftrag)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()

    // Vorherigen Status laden für Audit-Log
    const auftragVorher = body.status
      ? await prisma.auftrag.findUnique({ where: { id }, select: { status: true } })
      : null

    // Build update data, only include fields that are present in the body
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {}

    const allowedFields = [
      "titel", "typ", "status", "beschreibung", "standort", "bundesland",
      "waldbesitzer", "waldbesitzerEmail", "waldbesitzerTelefon",
      "baumarten", "zeitraum", "notizen", "neuFlag",
      "saisonId", "gruppeId", "plusCode",
    ]

    for (const field of allowedFields) {
      if (field in body) {
        data[field] = body[field]
      }
    }

    if ("flaeche_ha" in body) {
      data.flaeche_ha = body.flaeche_ha != null ? parseFloat(body.flaeche_ha) : null
    }
    if ("startDatum" in body) {
      data.startDatum = body.startDatum ? new Date(body.startDatum) : null
    }
    if ("endDatum" in body) {
      data.endDatum = body.endDatum ? new Date(body.endDatum) : null
    }
    // GPS-Koordinaten (Sprint U)
    if ("lat" in body) {
      data.lat = body.lat != null && body.lat !== "" ? parseFloat(String(body.lat)) : null
    }
    if ("lng" in body) {
      data.lng = body.lng != null && body.lng !== "" ? parseFloat(String(body.lng)) : null
    }

    const auftrag = await prisma.auftrag.update({
      where: { id },
      data,
      include: {
        saison: { select: { id: true, name: true } },
        gruppe: { select: { id: true, name: true } },
      },
    })

    // Audit-Log: Status-Änderung protokollieren
    if (body.status && auftragVorher && body.status !== auftragVorher.status) {
      await prisma.auftragLog.create({
        data: {
          auftragId: id,
          aktion: "status_geaendert",
          von: auftragVorher.status ?? null,
          nach: body.status,
          userId: (session?.user as { id?: string })?.id ?? null,
        },
      }).catch(() => {}) // Silent fail — Log ist nicht kritisch

      // Sprint AG: E-Mail-Benachrichtigung — Auftrag Status-Update
      emailService.auftragStatusUpdate({
        auftragId: id,
        auftragNummer: auftrag.nummer ?? id,
        auftragTitel: auftrag.titel,
        alterStatus: auftragVorher.status ?? "unbekannt",
        neuerStatus: body.status,
        waldbesitzerEmail: auftrag.waldbesitzerEmail ?? undefined,
      }).catch((err) => console.error("[Email] auftragStatusUpdate fehlgeschlagen:", err))
    }

    return NextResponse.json(auftrag)
  } catch (error) {
    console.error("[Auftraege PATCH]", error)
    return NextResponse.json({ error: "Interner Serverfehler", details: String(error) }, { status: 500 })
  }
}

const WP_API_URL = "https://peru-otter-113714.hostingersite.com/wp-json/wp/v2/ka_projekt"
const WP_USER = process.env.WP_USER ?? "openclaw"
const WP_PASS = process.env.WP_PASSWORD ?? ""
const WP_AUTH = Buffer.from(`${WP_USER}:${WP_PASS}`).toString("base64")
const WP_CLEANUP_URL = "https://peru-otter-113714.hostingersite.com/wp-json/ka/v1/wp-projekt"
const WP_FM_SECRET = process.env.WP_FM_SECRET ?? "ka-forstmanager-sync-2026"

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params

    // wpProjektId holen bevor wir löschen
    const auftrag = await prisma.auftrag.findUnique({
      where: { id },
      select: { wpProjektId: true },
    })

    // Aus ForstManager DB löschen
    await prisma.auftrag.delete({ where: { id } })

    if (auftrag?.wpProjektId) {
      // WP-ID zur Sync-Blockliste hinzufügen (verhindert Re-Import beim nächsten Sync)
      try {
        const config = await prisma.systemConfig.findUnique({ where: { key: "sync_blocked_wp_ids" } })
        const blocked: string[] = config?.value ? JSON.parse(config.value as string) : []
        if (!blocked.includes(auftrag.wpProjektId)) {
          blocked.push(auftrag.wpProjektId)
          await prisma.systemConfig.upsert({
            where: { key: "sync_blocked_wp_ids" },
            create: { key: "sync_blocked_wp_ids", value: JSON.stringify(blocked) },
            update: { value: JSON.stringify(blocked) },
          })
        }
      } catch (err) {
        console.warn("[Auftraege DELETE] Blocklist-Update fehlgeschlagen:", err)
      }

      // WP-Post ebenfalls löschen via Custom Cleanup-Endpoint (Secret-Auth)
      try {
        const wpRes = await fetch(`${WP_CLEANUP_URL}/${auftrag.wpProjektId}`, {
          method: "DELETE",
          headers: { "X-FM-Secret": WP_FM_SECRET },
        })
        if (!wpRes.ok) {
          console.warn(`[Auftraege DELETE] WP-Post ${auftrag.wpProjektId} konnte nicht gelöscht werden: ${wpRes.status}`)
        }
      } catch (err) {
        console.warn("[Auftraege DELETE] WP-Post-Löschung fehlgeschlagen:", err)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[Auftraege DELETE]", error)
    return NextResponse.json({ error: "Interner Serverfehler", details: String(error) }, { status: 500 })
  }
}
