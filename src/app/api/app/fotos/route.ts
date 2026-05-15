import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"
import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-handler"

// POST /api/app/fotos
// Speichert Foto-Metadaten (URL/Nextcloud-Pfad) als Foto-Record.
// Datei-Upload erfolgt separat (z. B. via /api/upload oder direkt zu Nextcloud).
//
// Body:
//   - url          (required): Nextcloud-URL oder Public-URL
//   - nextcloudPath (optional): Pfad auf Nextcloud
//   - caption       (optional): Bildunterschrift
//   - lat, lon      (optional): GPS-Koordinaten
//   - auftragId / auftrag_id    (optional): Zuordnung zu Auftrag
//   - protokollId / protokoll_id (optional): Zuordnung zu Tagesprotokoll
export const POST = withErrorHandler(async (req: NextRequest) => {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const mitarbeiterId = (appUser.mitarbeiterId as string | null) ?? null
  if (!mitarbeiterId) {
    return NextResponse.json({ error: "Kein Mitarbeiter-Profil verknüpft" }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))

  const url = typeof body.url === "string" ? body.url : null
  if (!url) {
    return NextResponse.json({ error: "Feld 'url' ist erforderlich" }, { status: 400 })
  }

  const auftragId = body.auftragId ?? body.auftrag_id ?? null
  const protokollId = body.protokollId ?? body.protokoll_id ?? null

  const foto = await prisma.foto.create({
    data: {
      url,
      nextcloudPath: body.nextcloudPath ?? body.nextcloud_path ?? null,
      caption: body.caption ?? null,
      lat: typeof body.lat === "number" ? body.lat : null,
      lon: typeof body.lon === "number" ? body.lon : null,
      auftragId,
      protokollId,
      mitarbeiterId,
    },
  })

  return NextResponse.json(foto, { status: 201 })
})

// GET /api/app/fotos?auftragId=...&protokollId=...&limit=...
// Listet Fotos. Standardmäßig eigene Fotos; Admin sieht alle.
export const GET = withErrorHandler(async (req: NextRequest) => {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const auftragId = url.searchParams.get("auftragId") || url.searchParams.get("auftrag_id")
  const protokollId = url.searchParams.get("protokollId") || url.searchParams.get("protokoll_id")
  const limitRaw = parseInt(url.searchParams.get("limit") ?? "100", 10)
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 500) : 100

  const mitarbeiterId = (appUser.mitarbeiterId as string | null) ?? null
  const role = (appUser.role as string | undefined) ?? (appUser.rolle as string | undefined)
  const isAdmin = role === "ka_admin" || role === "admin" || role === "administrator"

  const where: any = {}
  if (auftragId) where.auftragId = auftragId
  if (protokollId) where.protokollId = protokollId
  if (!isAdmin) {
    if (!mitarbeiterId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    where.mitarbeiterId = mitarbeiterId
  }

  const rows = await prisma.foto.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  })

  return NextResponse.json(rows)
})
