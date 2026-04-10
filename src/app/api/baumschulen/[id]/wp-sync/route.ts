import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const WP_BASE_URL = process.env.WP_BASE_URL || "https://peru-otter-113714.hostingersite.com/wp-json"
const WP_USER = process.env.WP_USER || "openclaw"
const WP_PASSWORD = process.env.WP_PASSWORD || ""

// POST: Sortiment in WordPress synchronisieren
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

  const credentials = Buffer.from(`${WP_USER}:${WP_PASSWORD}`).toString("base64")
  const authHeader = `Basic ${credentials}`

  const results: Array<{ baumart: string; success: boolean; error?: string }> = []

  for (const eintrag of sortiment) {
    try {
      const response = await fetch(`${WP_BASE_URL}/wp/v2/posts`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `${eintrag.baumart} — ${baumschule.name}`,
          content: `<p><strong>Baumart:</strong> ${eintrag.baumart}</p>
<p><strong>Preis:</strong> ${eintrag.preis} €/${eintrag.einheit}</p>
${eintrag.menge != null ? `<p><strong>Verfügbare Menge:</strong> ${eintrag.menge} ${eintrag.einheit}</p>` : ""}
${eintrag.saison ? `<p><strong>Saison:</strong> ${eintrag.saison}</p>` : ""}
${eintrag.notizen ? `<p><strong>Hinweise:</strong> ${eintrag.notizen}</p>` : ""}`,
          status: "draft",
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        results.push({ baumart: eintrag.baumart, success: false, error: `${response.status}: ${errorText.slice(0, 200)}` })
      } else {
        results.push({ baumart: eintrag.baumart, success: true })
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500))
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unbekannter Fehler"
      results.push({ baumart: eintrag.baumart, success: false, error: message })
    }
  }

  const erfolg = results.filter((r) => r.success).length
  const fehler = results.filter((r) => !r.success).length

  return NextResponse.json({
    message: `${erfolg} synchronisiert, ${fehler} fehlgeschlagen`,
    results,
  })
}
