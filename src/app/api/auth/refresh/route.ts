import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { SignJWT, jwtVerify } from "jose"

const getSecret = () => new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || process.env.APP_JWT_SECRET || "forstmanager-app-secret-2026"
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { refresh_token } = body

    if (!refresh_token) {
      return NextResponse.json({ error: "Kein Refresh-Token" }, { status: 400 })
    }

    // Verify refresh token
    let payload: Record<string, unknown>
    try {
      const { payload: p } = await jwtVerify(refresh_token, getSecret())
      payload = p as Record<string, unknown>
    } catch {
      return NextResponse.json({ error: "Ungültiger Refresh-Token" }, { status: 401 })
    }

    // User aus DB laden
    const user = await prisma.user.findUnique({
      where: { id: payload.sub as string },
      select: {
        id: true, email: true, name: true, role: true, active: true,
        tokenVersion: true, mustChangePassword: true
      }
    })

    if (!user || !user.active) {
      return NextResponse.json({ error: "User nicht gefunden oder deaktiviert" }, { status: 401 })
    }

    // tokenVersion prüfen (invalidiert alle alten Tokens nach PW-Änderung)
    if (payload.tv !== undefined && user.tokenVersion !== undefined) {
      if (payload.tv !== user.tokenVersion) {
        return NextResponse.json({ error: "Token wurde invalidiert" }, { status: 401 })
      }
    }

    // Neuer Access Token
    const secret = getSecret()
    const newToken = await new SignJWT({
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

    // Neuer Refresh Token (rolling)
    const newRefreshToken = await new SignJWT({
      sub: user.id,
      type: "refresh",
      tv: user.tokenVersion,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secret)

    return NextResponse.json({
      token: newToken,
      refresh_token: newRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        roles: [user.role],
        mustChangePassword: user.mustChangePassword ?? false,
      }
    })

  } catch (error) {
    console.error("[auth/refresh]", error)
    return NextResponse.json({ error: "Server-Fehler" }, { status: 500 })
  }
}
