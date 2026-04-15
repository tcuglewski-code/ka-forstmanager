import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-handler"


export const GET = withErrorHandler(async () => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const data = await prisma.qualifikation.findMany({
    include: { mitarbeiter: true },
    orderBy: { name: "asc" },
  })
  const result = data.map((q) => ({ ...q, mitarbeiterCount: q.mitarbeiter.length }))
  return NextResponse.json(result)
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const qual = await prisma.qualifikation.create({ data: { name: body.name, typ: body.typ, beschreibung: body.beschreibung } })
  return NextResponse.json(qual, { status: 201 })
})
