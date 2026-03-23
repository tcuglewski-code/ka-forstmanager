import { prisma } from "@/lib/prisma"
import { signAppToken } from "@/lib/app-jwt"
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.active) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }
    const mitarbeiter = await prisma.mitarbeiter.findUnique({ where: { userId: user.id } })
    const token = await signAppToken({
      userId: user.id,
      mitarbeiterId: mitarbeiter?.id ?? null,
      email: user.email,
      rolle: user.role,
    })
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        rolle: user.role,
        mitarbeiterId: mitarbeiter?.id ?? null,
      },
    })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
