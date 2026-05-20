import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const unterkunft = await prisma.unterkunft.findUnique({
    where: { auftragId: id },
  })
  return NextResponse.json(unterkunft)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()

    if (!body?.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "name erforderlich" }, { status: 400 })
    }

    const data = {
      name: body.name,
      adresse: body.adresse ?? null,
      maxPersonen: body.maxPersonen != null ? Number(body.maxPersonen) : null,
      preisNacht: body.preisNacht != null ? Number(body.preisNacht) : null,
      kontakt: body.kontakt ?? null,
      externeUrl: body.externeUrl ?? null,
      notizen: body.notizen ?? null,
    }

    const unterkunft = await prisma.unterkunft.upsert({
      where: { auftragId: id },
      create: { ...data, auftragId: id },
      update: data,
    })

    return NextResponse.json(unterkunft)
  } catch (e) {
    console.error("[Unterkunft] POST error:", e)
    return NextResponse.json(
      { error: "Speichern fehlgeschlagen" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    await prisma.unterkunft.delete({ where: { auftragId: id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[Unterkunft] DELETE error:", e)
    return NextResponse.json(
      { error: "Löschen fehlgeschlagen" },
      { status: 500 }
    )
  }
}
