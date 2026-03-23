import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const data = await prisma.schulung.findMany({
    include: { teilnehmer: true },
    orderBy: { datum: "desc" },
  })
  const result = data.map((s) => ({ ...s, teilnehmerCount: s.teilnehmer.length }))
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const schulung = await prisma.schulung.create({
    data: {
      titel: body.titel,
      typ: body.typ,
      beschreibung: body.beschreibung,
      datum: body.datum ? new Date(body.datum) : null,
      ort: body.ort,
      maxTeilnehmer: body.maxTeilnehmer ? parseInt(body.maxTeilnehmer) : null,
      status: body.status ?? "geplant",
    },
  })
  return NextResponse.json(schulung, { status: 201 })
}
