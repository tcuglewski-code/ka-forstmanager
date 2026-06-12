/**
 * DOK-003: /api/dokumente/scans
 * (Hinweis: /api/dokumente ist bereits durch Mitarbeiter-Dokumente belegt,
 *  daher liegt die A3 Dokumenten-KI unter /scans.)
 *
 * GET  — paginierte Liste der DokumentenScans (Filter: status, typ)
 * POST — Datei-Upload (multipart/form-data, Feld "file", mehrfach möglich):
 *        DOK-022-026: File-Validator (Magic-Bytes, aktive PDF-Inhalte, XXE),
 *        Rate-Limit 20 Uploads/h je Benutzer, SHA-256, Storage, Scan + Audit
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { DokStatus, DokTyp } from "@prisma/client"
import { getStorage, sha256 } from "@/lib/dokumente/storage-adapter"
import { erkenneDokTyp } from "@/lib/dokumente/typ-erkennung"
import { validiereDatei } from "@/lib/dokumente/file-validator"
import { dokUploadRateLimit } from "@/lib/rate-limit"

const MAX_DATEIEN_PRO_REQUEST = 10

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(parseInt(searchParams.get("page") || "1"), 1)
  const limit = Math.min(parseInt(searchParams.get("limit") || "25"), 100)
  const status = searchParams.get("status")
  const typ = searchParams.get("typ")

  if (status && !Object.keys(DokStatus).includes(status)) {
    return NextResponse.json({ error: "Ungültiger Status" }, { status: 400 })
  }
  if (typ && !Object.keys(DokTyp).includes(typ)) {
    return NextResponse.json({ error: "Ungültiger Typ" }, { status: 400 })
  }

  const where = {
    deletedAt: null,
    ...(status ? { status: status as DokStatus } : {}),
    ...(typ ? { typ: typ as DokTyp } : {}),
  }

  const [items, total] = await Promise.all([
    prisma.dokumentenScan.findMany({
      where,
      orderBy: { erstelltAm: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      include: { _count: { select: { positionen: true } } },
    }),
    prisma.dokumentenScan.count({ where }),
  ])

  return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) })
}

interface UploadErgebnis {
  dateiName: string
  ok: boolean
  scanId?: string
  duplikatVon?: string | null
  fehler?: string
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as { id?: string }).id || session.user.email || "unbekannt"
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null

  try {
    const formData = await req.formData()
    const dateien = formData.getAll("file").filter((f): f is File => f instanceof File)
    if (dateien.length === 0) {
      return NextResponse.json({ error: "Feld 'file' fehlt" }, { status: 400 })
    }
    if (dateien.length > MAX_DATEIEN_PRO_REQUEST) {
      return NextResponse.json(
        { error: `Maximal ${MAX_DATEIEN_PRO_REQUEST} Dateien pro Request` },
        { status: 400 }
      )
    }

    // DOK-026: Rate-Limit 20 Uploads/h je Benutzer (jede Datei zählt)
    for (let i = 0; i < dateien.length; i++) {
      const { success } = await dokUploadRateLimit.limit(userId)
      if (!success) {
        return NextResponse.json(
          { error: "Upload-Limit erreicht (20 Dokumente pro Stunde)" },
          { status: 429 }
        )
      }
    }

    const ergebnisse: UploadErgebnis[] = []

    for (const file of dateien) {
      const buffer = Buffer.from(await file.arrayBuffer())

      // DOK-022-025: File-Validator (Magic-Bytes, aktive Inhalte, XXE, Namen)
      const validierung = validiereDatei(buffer, file.name)
      if (!validierung.ok) {
        ergebnisse.push({ dateiName: file.name, ok: false, fehler: validierung.grund })
        continue
      }

      const hash = sha256(buffer)

      // Hinweis auf identische Datei (kein harter Block — Routing entscheidet später)
      const duplikat = await prisma.dokumentenScan.findFirst({
        where: { originalDateiHash: hash, deletedAt: null },
        select: { id: true },
      })

      const erkannterTyp = erkenneDokTyp(buffer, file.name)
      const typ: DokTyp = erkannterTyp === "UNBEKANNT" ? "PDF_RECHNUNG" : erkannterTyp

      const stored = await getStorage().put(
        file.name,
        buffer,
        file.type || "application/octet-stream"
      )

      const scan = await prisma.dokumentenScan.create({
        data: {
          typ,
          status: "AUSSTEHEND",
          originalDateiUrl: stored.url,
          originalDateiName: file.name,
          originalDateiHash: hash,
          erstelltVon: userId,
          auditLog: {
            create: {
              aktion: "HOCHGELADEN",
              userId,
              ipAdresse: ip,
              details: {
                dateiName: file.name,
                groesse: file.size,
                duplikatVon: duplikat?.id ?? null,
              },
            },
          },
        },
      })

      ergebnisse.push({
        dateiName: file.name,
        ok: true,
        scanId: scan.id,
        duplikatVon: duplikat?.id ?? null,
      })
    }

    const erfolgreich = ergebnisse.filter((e) => e.ok)

    // DOK-006: Verarbeitung sofort anstoßen (fire-and-forget; täglicher Cron
    // ist nur Sweeper, Hobby-Plan erlaubt keine Minuten-Crons)
    if (erfolgreich.length > 0 && process.env.CRON_SECRET) {
      const baseUrl = process.env.NEXTAUTH_URL || `https://${req.headers.get("host")}`
      fetch(`${baseUrl}/api/dokumente/process`, {
        method: "POST",
        headers: { "x-cron-secret": process.env.CRON_SECRET },
      }).catch(() => {}) // non-blocking; Fehler holt der Sweeper-Cron nach
    }

    if (erfolgreich.length === 0) {
      return NextResponse.json(
        { error: ergebnisse[0]?.fehler ?? "Keine Datei akzeptiert", ergebnisse },
        { status: 400 }
      )
    }

    // Abwärtskompatibel: bei Einzel-Upload weiterhin { scan, duplikatVon }
    if (dateien.length === 1) {
      const e = ergebnisse[0]
      return NextResponse.json(
        { scan: { id: e.scanId }, duplikatVon: e.duplikatVon ?? null, ergebnisse },
        { status: 201 }
      )
    }
    return NextResponse.json({ ergebnisse }, { status: 201 })
  } catch (error) {
    console.error("[DokumentenScan] Upload fehlgeschlagen:", error)
    return NextResponse.json({ error: "Upload fehlgeschlagen" }, { status: 500 })
  }
}
