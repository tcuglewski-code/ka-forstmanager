import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const prioritaet = searchParams.get("prioritaet")

    const where: Record<string, unknown> = { aktiv: true }
    if (prioritaet && prioritaet !== "ALLE") {
      where.prioritaet = prioritaet
    }

    const news = await prisma.foerderNews.findMany({
      where,
      orderBy: [
        { prioritaet: "asc" },
        { createdAt: "desc" },
      ],
    })

    return Response.json(news)
  } catch (error) {
    console.error("[Foerder-News] Error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
