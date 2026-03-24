import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { isAdmin } from "@/lib/permissions"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden – nur Admins dürfen Users verwalten" }, { status: 403 })
  }
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden – nur Admins dürfen Users anlegen" }, { status: 403 })
  }
  const body = await req.json()
  if (!body.name || !body.email || !body.password) {
    return NextResponse.json({ error: "name, email und password sind Pflichtfelder" }, { status: 400 })
  }
  const hashedPassword = await bcrypt.hash(body.password, 10)
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: hashedPassword,
      role: body.role ?? "mitarbeiter",
      active: true,
    },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  })
  return NextResponse.json(user, { status: 201 })
}
