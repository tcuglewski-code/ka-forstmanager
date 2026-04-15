import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-handler"


export const PATCH = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const entry = await prisma.mitarbeiterQualifikation.update({
    where: { id },
    data: {
      erworbenAm: body.erworbenAm ? new Date(body.erworbenAm) : undefined,
      ablaufDatum: body.ablaufDatum ? new Date(body.ablaufDatum) : undefined,
      notiz: body.notiz,
    },
  })
  return NextResponse.json(entry)
})

export const DELETE = withErrorHandler(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.mitarbeiterQualifikation.delete({ where: { id } })
  return NextResponse.json({ ok: true })
})
