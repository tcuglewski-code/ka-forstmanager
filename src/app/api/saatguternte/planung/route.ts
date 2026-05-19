import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const planungen = await prisma.flaechenPlanung.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(planungen)
  } catch (err) {
    console.error("GET /api/saatguternte/planung", err)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { name, flaechenIds, notizen } = body

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name fehlt" }, { status: 400 })
    }
    if (!Array.isArray(flaechenIds) || flaechenIds.length === 0) {
      return NextResponse.json({ error: "Keine Flächen ausgewählt" }, { status: 400 })
    }

    const planung = await prisma.flaechenPlanung.create({
      data: {
        name,
        flaechenIds,
        notizen: notizen ?? null,
        erstelltVon: (session.user as { name?: string; email?: string } | undefined)?.name ??
          (session.user as { email?: string } | undefined)?.email ??
          null,
      },
    })
    return NextResponse.json(planung)
  } catch (err) {
    console.error("POST /api/saatguternte/planung", err)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const id = req.nextUrl.searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID fehlt" }, { status: 400 })

    await prisma.flaechenPlanung.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("DELETE /api/saatguternte/planung", err)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}
