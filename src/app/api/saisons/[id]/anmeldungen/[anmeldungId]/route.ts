import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; anmeldungId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { anmeldungId } = await params
  const body = await req.json()
  const anmeldung = await prisma.saisonAnmeldung.update({
    where: { id: anmeldungId },
    data: { status: body.status },
  })
  return NextResponse.json(anmeldung)
}
