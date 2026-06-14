/**
 * A1 — GET /api/angebote/track/[pixelId] (ANG-031)
 * 1×1-Tracking-Pixel. Loggt das Öffnen DSGVO-konform (IP nur als SHA-256-Hash,
 * keine Klartext-IP). Respektiert trackingOptOut. Liefert immer ein gültiges GIF.
 */
import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// 1×1 transparentes GIF
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
)

function pixelResponse(): NextResponse {
  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "Content-Length": String(PIXEL.length),
    },
  })
}

export async function GET(req: Request, { params }: { params: Promise<{ pixelId: string }> }) {
  try {
    const { pixelId } = await params
    const angebot = await prisma.angebot.findUnique({
      where: { trackingPixelId: pixelId },
      select: { id: true, trackingOptOut: true },
    })
    if (angebot && !angebot.trackingOptOut) {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        ""
      const salt = process.env.NEXTAUTH_SECRET ?? "ka-salt"
      const ipHash = ip ? crypto.createHash("sha256").update(ip + salt).digest("hex") : null
      await prisma.angebotsTracking.create({
        data: {
          angebotId: angebot.id,
          ereignis: "geoeffnet",
          ipHash,
          userAgent: req.headers.get("user-agent")?.slice(0, 256) ?? null,
        },
      })
    }
  } catch {
    // niemals Fehler an den Mail-Client durchreichen
  }
  return pixelResponse()
}
