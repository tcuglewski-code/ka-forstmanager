import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/saatguternte/medien?flaecheId=xxx
// Holt MediaZuordnung aus DB für diese Fläche
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const flaecheId = searchParams.get("flaecheId")

    if (!flaecheId) {
      return NextResponse.json({ error: "flaecheId erforderlich" }, { status: 400 })
    }

    const medien = await prisma.mediaZuordnung.findMany({
      where: { flaecheId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ medien })
  } catch (err) {
    console.error("[medien] GET error:", err)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}
