import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdminOrGF } from "@/lib/permissions"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  const updated = await prisma.lohnabrechnung.update({
    where: { id },
    data: {
      status: body.status ?? undefined,
      auszahlung: body.auszahlung !== undefined ? parseFloat(body.auszahlung) : undefined,
      vorschuesse: body.vorschuesse !== undefined ? parseFloat(body.vorschuesse) : undefined,
      notizen: body.notizen ?? undefined,
    },
  })
  return NextResponse.json(updated)
}
