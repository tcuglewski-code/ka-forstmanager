import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: "Benutzername/E-Mail und Passwort erforderlich" },
        { status: 400 }
      )
    }

    // Support login via email or username
    const isEmail = username.includes("@")
    const user = isEmail
      ? await prisma.user.findUnique({
          where: { email: username },
          select: { id: true, email: true, username: true, name: true, role: true, active: true, password: true, tokenVersion: true, mustChangePassword: true }
        })
      : await prisma.user.findUnique({
          where: { username: username },
          select: { id: true, email: true, username: true, name: true, role: true, active: true, password: true, tokenVersion: true, mustChangePassword: true }
        })

    if (!user || !user.active) {
      return NextResponse.json(
        { error: "Ungültige Anmeldedaten" },
        { status: 401 }
      )
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json(
        { error: "Ungültige Anmeldedaten" },
        { status: 401 }
      )
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // Create JWT
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "forstmanager-app-secret-2026")
    const access_token = await new SignJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      tv: user.tokenVersion,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret)

    // Refresh Token
    const refresh_token = await new SignJWT({
      sub: user.id,
      type: "refresh",
      tv: user.tokenVersion,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secret)

    return NextResponse.json({
      access_token,
      refresh_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        roles: [user.role],
        mustChangePassword: user.mustChangePassword ?? false,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Server-Fehler bei der Anmeldung" },
      { status: 500 }
    )
  }
}
