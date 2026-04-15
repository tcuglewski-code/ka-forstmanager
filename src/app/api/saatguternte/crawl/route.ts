import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if ((session.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { quelleId } = body

    if (!quelleId) {
      return NextResponse.json({ error: "quelleId erforderlich" }, { status: 400 })
    }

    const quelle = await prisma.ernteRegisterQuelle.findUnique({ where: { id: quelleId } })
    if (!quelle) {
      return NextResponse.json({ error: "Quelle nicht gefunden" }, { status: 404 })
    }

    // Status auf "running" setzen
    await prisma.ernteRegisterQuelle.update({
      where: { id: quelleId },
      data: { crawlStatus: "running" },
    })

    // Mock-Crawl: nach 2 Sek. auf "success" setzen (fire-and-forget)
    setTimeout(async () => {
      try {
        await prisma.ernteRegisterQuelle.update({
          where: { id: quelleId },
          data: {
            crawlStatus: "success",
            letzterCrawl: new Date(),
            crawlLog: `Mock-Crawl erfolgreich abgeschlossen am ${new Date().toISOString()}`,
          },
        })
      } catch (err) {
        console.error("Crawl-Status-Update fehlgeschlagen:", err)
        await prisma.ernteRegisterQuelle.update({
          where: { id: quelleId },
          data: { crawlStatus: "error" },
        }).catch(console.error)
      }
    }, 2000)

    return NextResponse.json({ ok: true, message: "Crawl gestartet" })
  } catch (err) {
    console.error("POST /api/saatguternte/crawl", err)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}
