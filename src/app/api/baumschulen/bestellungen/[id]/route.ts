import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { withErrorHandler } from "@/lib/api-handler"
import { sendEmail } from "@/lib/email"
import crypto from "crypto"

const ADMIN_ROLES = ["admin", "ka_admin", "administrator", "supervisor"]
const VALID_STATUS = ["neu", "zugewiesen", "angeboten", "bestaetigt", "geliefert", "storniert"]

// Erlaubte Übergänge — verhindert Rückwärtssprünge aus Endzuständen.
const STATUS_TRANSITIONS: Record<string, string[]> = {
  neu: ["zugewiesen", "storniert"],
  zugewiesen: ["angeboten", "bestaetigt", "storniert", "neu"],
  angeboten: ["bestaetigt", "storniert", "zugewiesen"],
  bestaetigt: ["geliefert", "storniert"],
  geliefert: [],
  storniert: [],
}

// PATCH: Bestellung aktualisieren (Baumschule zuweisen, Status ändern)
export const PATCH = withErrorHandler(async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  const role = session.user.role ?? ""
  if (!ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 })
  }

  const { id } = await params
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ error: "Ungültiger Request-Body" }, { status: 400 })

  const existing = await prisma.baumschulBestellung.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Bestellung nicht gefunden" }, { status: 404 })

  const data: Record<string, unknown> = {}

  if (body.baumschuleId !== undefined) {
    if (body.baumschuleId === null || body.baumschuleId === "") {
      data.baumschuleId = null
    } else if (typeof body.baumschuleId === "string" && body.baumschuleId.trim()) {
      const bs = await prisma.baumschule.findUnique({
        where: { id: body.baumschuleId },
        select: { id: true },
      })
      if (!bs) {
        return NextResponse.json({ error: "Baumschule nicht gefunden" }, { status: 404 })
      }
      data.baumschuleId = body.baumschuleId
      // Bei Zuweisung automatisch Status hochsetzen, falls noch "neu"
      if (existing.status === "neu" && !body.status) {
        data.status = "zugewiesen"
      }
    }
  }

  if (typeof body.status === "string") {
    if (!VALID_STATUS.includes(body.status)) {
      return NextResponse.json(
        { error: `Ungültiger Status. Erlaubt: ${VALID_STATUS.join(", ")}` },
        { status: 400 }
      )
    }
    // State-Machine prüfen, außer Status ist bereits identisch
    if (body.status !== existing.status) {
      const allowed = STATUS_TRANSITIONS[existing.status] ?? []
      if (!allowed.includes(body.status)) {
        return NextResponse.json(
          {
            error: `Status-Übergang ${existing.status} → ${body.status} nicht erlaubt`,
          },
          { status: 400 }
        )
      }
    }
    data.status = body.status
  }

  if (body.notizen !== undefined) {
    data.notizen =
      typeof body.notizen === "string" ? body.notizen.trim().slice(0, 2000) || null : null
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Keine Änderungen" }, { status: 400 })
  }

  const updated = await prisma.baumschulBestellung.update({
    where: { id },
    data,
    include: {
      baumschule: { select: { id: true, name: true, ort: true, bundesland: true, email: true, ansprechpartner: true, status: true } },
    },
  })

  // BS-MKT-01 Phase 2 (A3): Bei *neu* Zuweisung einer Baumschule → Notification-Mail
  // Trigger: zuvor keine Baumschule, jetzt eine Baumschule zugewiesen, Status = "zugewiesen"
  const istNeueZuweisung =
    existing.baumschuleId !== updated.baumschuleId &&
    updated.baumschuleId !== null &&
    updated.baumschule?.email &&
    updated.baumschule?.status === "aktiv"

  if (istNeueZuweisung && updated.baumschule) {
    // Frischen Login-Token generieren (72h gültig), damit die Baumschule
    // direkt aus der Mail ins Portal springen kann
    const token = crypto.randomBytes(32).toString("hex")
    const tokenExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000)
    await prisma.baumschule.update({
      where: { id: updated.baumschule.id },
      data: { loginToken: token, loginTokenExpiry: tokenExpiry },
    }).catch((e) => console.warn("[Bestellung] Token-Refresh fehlgeschlagen:", e))

    const baseUrl = process.env.NEXTAUTH_URL ?? "https://ka-forstmanager.vercel.app"
    const loginLink = `${baseUrl}/baumschule/login?token=${token}`

    void sendEmail({
      to: updated.baumschule.email!,
      subject: `🌱 Neue Pflanzanfrage: ${updated.baumart}`,
      html: `
        <p>Hallo ${escapeHtml(updated.baumschule.ansprechpartner || updated.baumschule.name)},</p>
        <p>Sie haben über Koch Aufforstung eine neue Pflanzanfrage erhalten:</p>
        <table style="border-collapse:collapse; margin: 16px 0;">
          <tr><td style="padding: 4px 16px 4px 0; color:#666;">Baumart:</td><td style="font-weight:600;">${escapeHtml(updated.baumart)}</td></tr>
          ${updated.menge > 0 ? `<tr><td style="padding: 4px 16px 4px 0; color:#666;">Menge:</td><td>${updated.menge} ${escapeHtml(updated.einheit || "Stück")}</td></tr>` : ""}
          ${updated.flaecheHa ? `<tr><td style="padding: 4px 16px 4px 0; color:#666;">Fläche:</td><td>${updated.flaecheHa} ha</td></tr>` : ""}
          ${updated.bundesland ? `<tr><td style="padding: 4px 16px 4px 0; color:#666;">Bundesland:</td><td>${escapeHtml(updated.bundesland)}</td></tr>` : ""}
        </table>
        <p>Bitte öffnen Sie Ihr Baumschul-Portal, um die Anfrage einzusehen und zu beantworten:</p>
        <p style="margin: 20px 0;">
          <a href="${loginLink}"
             style="display:inline-block; padding: 12px 24px; background:#012d1d; color:#fff; border-radius:8px; text-decoration:none; font-weight:bold;">
            🌲 Portal öffnen
          </a>
        </p>
        <p style="font-size: 11px; color: #888;">
          Link 72h gültig (bis ${tokenExpiry.toLocaleDateString("de-DE")}).
        </p>
        <p>Mit freundlichen Grüßen<br>Koch Aufforstung GmbH</p>
      `,
    }).catch((e) => console.warn("[Bestellung] Zuweisungs-Mail fehlgeschlagen:", e))
  }

  return NextResponse.json(updated)
})

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

// GET: einzelne Bestellung (Admin)
export const GET = withErrorHandler(async (
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  const role = session.user.role ?? ""
  if (!ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 })
  }
  const { id } = await params
  const bestellung = await prisma.baumschulBestellung.findUnique({
    where: { id },
    include: {
      baumschule: { select: { id: true, name: true, ort: true, bundesland: true } },
    },
  })
  if (!bestellung) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  return NextResponse.json(bestellung)
})
