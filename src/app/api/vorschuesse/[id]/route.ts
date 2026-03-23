import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const vs = await prisma.vorschuss.update({
    where: { id },
    data: {
      ...(body.genehmigt !== undefined && { genehmigt: body.genehmigt }),
      ...(body.zurueckgezahlt !== undefined && { zurueckgezahlt: body.zurueckgezahlt }),
      ...(body.grund !== undefined && { grund: body.grund }),
    },
    include: { mitarbeiter: { select: { id: true, vorname: true, nachname: true } } },
  })
  return NextResponse.json(vs)
}
