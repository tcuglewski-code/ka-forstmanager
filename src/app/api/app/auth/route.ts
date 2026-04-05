import { prisma } from "@/lib/prisma"
import { signAppToken } from "@/lib/app-jwt"
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import { parseUserAgent } from "@/lib/device-parser"

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
    
    // Sprint KK: Device Tracking - Create session record
    const userAgent = req.headers.get("user-agent") || undefined
    const forwardedFor = req.headers.get("x-forwarded-for")
    const realIp = req.headers.get("x-real-ip")
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || "Unbekannt"
    
    const deviceInfo = parseUserAgent(userAgent)
    const sessionToken = randomBytes(32).toString("hex")
    
    await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        userAgent: userAgent,
        deviceType: deviceInfo.deviceType,
        deviceName: deviceInfo.deviceName,
        ipAddress: ipAddress,
        lastActiveAt: new Date(),
      },
    })
    
    return NextResponse.json({
      token,
      sessionToken, // For device tracking
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
