import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"
import { loginRateLimit } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    // Rate-limiting: 5 Versuche pro IP pro 15 Minuten
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.ip || "unknown"
    const { success, remaining } = await loginRateLimit.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: "Zu viele Anmeldeversuche. Bitte warten Sie 15 Minuten." },
        { status: 429, headers: { "Retry-After": "900", "X-RateLimit-Remaining": "0" } }
      )
    }

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
    const userSelect = {
      id: true,
      email: true,
      username: true,
      name: true,
      role: true,
      active: true,
      password: true,
      tokenVersion: true,
      mustChangePassword: true,
      mitarbeiter: { select: { id: true } },
    } as const
    const user = isEmail
      ? await prisma.user.findUnique({ where: { email: username }, select: userSelect })
      : await prisma.user.findUnique({ where: { username: username }, select: userSelect })

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
    const mitarbeiterId = user.mitarbeiter?.id ?? null
    const access_token = await new SignJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      tv: user.tokenVersion,
      mitarbeiterId,
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
