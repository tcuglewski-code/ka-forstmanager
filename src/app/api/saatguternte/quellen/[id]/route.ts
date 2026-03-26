import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, kuerzel, bundeslaender, baseUrl, crawlUrl, loginRequired } = body

    const quelle = await prisma.ernteRegisterQuelle.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(kuerzel !== undefined && { kuerzel }),
        ...(bundeslaender !== undefined && { bundeslaender }),
        ...(baseUrl !== undefined && { baseUrl }),
        ...(crawlUrl !== undefined && { crawlUrl }),
        ...(loginRequired !== undefined && { loginRequired }),
      },
    })

    return NextResponse.json(quelle)
  } catch (err) {
    console.error("PATCH /api/saatguternte/quellen/[id]", err)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}
