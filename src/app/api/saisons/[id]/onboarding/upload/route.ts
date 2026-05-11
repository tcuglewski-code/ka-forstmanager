import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { dateiHochladen } from "@/lib/nextcloud"
import { withErrorHandler } from "@/lib/api-handler"

const MAX_SIZE = 25 * 1024 * 1024 // 25 MB

// POST — Lädt eine PDF-Datei in den Nextcloud-Ordner /Koch-Aufforstung/Onboarding/<saisonId>/
// hoch und gibt die WebDAV-URL zurück. Caller speichert URL in dokumentVorlageUrl per PATCH.
export const POST = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (session.user as any)?.role as string
  if (!["admin", "ka_admin"].includes(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id: saisonId } = await params

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Keine Datei hochgeladen" }, { status: 400 })

  const allowed = ["application/pdf"]
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Nur PDF-Dateien erlaubt" }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: `Datei zu groß (max ${MAX_SIZE / 1024 / 1024} MB)` }, { status: 400 })
  }

  // Dateiname säubern: nur a-z, A-Z, 0-9, _, -, .
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const timestamp = Date.now()
  const zielpfad = `/Koch-Aufforstung/Onboarding/${saisonId}/${timestamp}-${safeName}`

  const arrayBuffer = await file.arrayBuffer()
  const ergebnis = await dateiHochladen(new Uint8Array(arrayBuffer), zielpfad, file.type)

  if (!ergebnis.erfolg) {
    return NextResponse.json({ error: ergebnis.fehler ?? "Upload fehlgeschlagen" }, { status: 500 })
  }

  // Download-URL über authentifizierten Proxy
  const proxyUrl = `/api/saisons/${saisonId}/onboarding/download?path=${encodeURIComponent(ergebnis.pfad)}`

  return NextResponse.json({
    success: true,
    pfad: ergebnis.pfad,
    url: proxyUrl,
    name: safeName,
  })
})
