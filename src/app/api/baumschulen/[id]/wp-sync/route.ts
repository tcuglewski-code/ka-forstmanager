import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const WP_BASE_URL = process.env.WP_BASE_URL || "https://peru-otter-113714.hostingersite.com/wp-json"
const WP_USER = process.env.WP_USER || ""
const WP_PASSWORD = process.env.WP_PASSWORD || ""

// POST: Sortiment nach WordPress synchronisieren
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const { id: baumschuleId } = await params

  const baumschule = await prisma.baumschule.findUnique({
    where: { id: baumschuleId },
    select: { id: true, name: true, userId: true },
  })
  if (!baumschule) {
    return NextResponse.json({ error: "Baumschule nicht gefunden" }, { status: 404 })
  }

  const userRole = (session.user as any).role
  if (userRole === "baumschule" && baumschule.userId !== session.user.id) {
    return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 })
  }

  const sortiment = await prisma.baumschulPreisliste.findMany({
    where: { baumschuleId, verfuegbar: true },
    orderBy: { baumart: "asc" },
  })

  // Build sortiment payload
  const sortimentData = sortiment.map((e) => ({
    baumart: e.baumart,
    preis: e.preis,
    einheit: e.einheit,
    menge: e.menge,
    saison: e.saison,
    notizen: e.notizen,
  }))

  // If WP credentials are not configured, return success with hint
  if (!WP_USER || !WP_PASSWORD) {
    console.log(`[WP-Sync] Sortiment für ${baumschule.name}: ${sortiment.length} Einträge (WP nicht konfiguriert)`)
    return NextResponse.json({
      message: `${sortiment.length} Einträge bereit — WP-Endpoint konfigurieren (WP_USER + WP_PASSWORD setzen)`,
      synced: false,
      sortiment: sortimentData,
    })
  }

  const credentials = Buffer.from(`${WP_USER}:${WP_PASSWORD}`).toString("base64")
  const authHeader = `Basic ${credentials}`

  // Try custom endpoint first: POST /wp-json/ka/v1/sortiment
  try {
    const response = await fetch(`${WP_BASE_URL}/ka/v1/sortiment`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        baumschule: baumschule.name,
        baumschuleId: baumschule.id,
        sortiment: sortimentData,
      }),
    })

    if (response.ok) {
      const result = await response.json()
      return NextResponse.json({
        message: `${sortiment.length} Einträge nach WordPress synchronisiert`,
        synced: true,
        endpoint: "ka/v1/sortiment",
        result,
      })
    }

    // Custom endpoint not available — log and return success with hint
    console.log(`[WP-Sync] Custom endpoint /ka/v1/sortiment nicht verfügbar (${response.status}), Fallback`)
  } catch (error) {
    console.log(`[WP-Sync] Custom endpoint nicht erreichbar: ${error instanceof Error ? error.message : "unknown"}`)
  }

  // Fallback: log the update and return success with configuration hint
  console.log(`[WP-Sync] Sortiment für ${baumschule.name}: ${sortiment.length} Einträge bereit`)
  return NextResponse.json({
    message: `${sortiment.length} Einträge bereit — WP Custom Endpoint /ka/v1/sortiment konfigurieren`,
    synced: false,
    sortiment: sortimentData,
  })
}
