import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: artikelId } = await params
  const body = await req.json()
  const menge = parseFloat(body.menge)

  const bewegung = await prisma.lagerBewegung.create({
    data: {
      artikelId,
      typ: body.typ,
      menge,
      referenz: body.referenz ?? null,
      notiz: body.notiz ?? null,
    },
  })

  // Update bestand
  const delta = body.typ === "eingang" ? menge : body.typ === "ausgang" ? -menge : menge
  await prisma.lagerArtikel.update({
    where: { id: artikelId },
    data: { bestand: { increment: delta } },
  })

  return NextResponse.json(bewegung, { status: 201 })
}
