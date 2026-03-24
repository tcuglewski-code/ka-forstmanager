import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { isAdmin } from "@/lib/permissions"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden – nur Admins dürfen Users bearbeiten" }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const updateData: Record<string, unknown> = {}
  if (body.name) updateData.name = body.name
  if (body.email) updateData.email = body.email
  if (body.role) updateData.role = body.role
  if (body.active !== undefined) updateData.active = body.active
  if (body.password) updateData.password = await bcrypt.hash(body.password, 10)
  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, active: true },
  })
  return NextResponse.json(user)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden – nur Admins dürfen Users löschen" }, { status: 403 })
  }
  const { id } = await params
  // Eigenen Account nicht löschbar machen
  if ((session.user as any).id === id) {
    return NextResponse.json({ error: "Eigener Account kann nicht gelöscht werden" }, { status: 400 })
  }
  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
