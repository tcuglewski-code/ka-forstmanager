/**
 * DOK-003: /api/dokumente/scans
 * (Hinweis: /api/dokumente ist bereits durch Mitarbeiter-Dokumente belegt,
 *  daher liegt die A3 Dokumenten-KI unter /scans.)
 *
 * GET  — paginierte Liste der DokumentenScans (Filter: status, typ)
 * POST — Datei-Upload (multipart/form-data, Feld "file"):
 *        Validierung, SHA-256, Storage, Scan + Audit anlegen
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { DokStatus, DokTyp } from "@prisma/client"
import { getStorage, sha256 } from "@/lib/dokumente/storage-adapter"
import { erkenneDokTyp } from "@/lib/dokumente/typ-erkennung"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME = ["application/pdf", "application/xml", "text/xml", "image/jpeg", "image/png"]
const ALLOWED_EXTENSIONS = [".pdf", ".xml", ".jpg", ".jpeg", ".png"]

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

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Feld 'file' fehlt" }, { status: 400 })
    }
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Datei leer oder größer als 10 MB" }, { status: 400 })
    }

    const ext = (file.name.match(/\.[a-zA-Z0-9]+$/)?.[0] || "").toLowerCase()
    if (!ALLOWED_MIME.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: "Nur PDF, XML, JPG oder PNG erlaubt" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
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

    const userId = (session.user as { id?: string }).id || session.user.email || "unbekannt"
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null

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

    // DOK-006: Verarbeitung sofort anstoßen (fire-and-forget; täglicher Cron
    // ist nur Sweeper, Hobby-Plan erlaubt keine Minuten-Crons)
    if (process.env.CRON_SECRET) {
      const baseUrl = process.env.NEXTAUTH_URL || `https://${req.headers.get("host")}`
      fetch(`${baseUrl}/api/dokumente/process`, {
        method: "POST",
        headers: { "x-cron-secret": process.env.CRON_SECRET },
      }).catch(() => {}) // non-blocking; Fehler holt der Sweeper-Cron nach
    }

    return NextResponse.json({ scan, duplikatVon: duplikat?.id ?? null }, { status: 201 })
  } catch (error) {
    console.error("[DokumentenScan] Upload fehlgeschlagen:", error)
    return NextResponse.json({ error: "Upload fehlgeschlagen" }, { status: 500 })
  }
}
