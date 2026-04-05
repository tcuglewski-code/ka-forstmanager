import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// ============================================================
// SOS Events SSE — Sprint JM (SOS-06)
// Server-Sent Events für Echtzeit SOS-Updates im Koordinator-Screen
// ============================================================

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if SSE requested
  const acceptHeader = req.headers.get("accept")
  
  if (acceptHeader?.includes("text/event-stream")) {
    // SSE Stream
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        // Initial data
        const events = await prisma.sOSEvent.findMany({
          where: {
            status: { in: ["pending", "sent", "acknowledged"] },
          },
          orderBy: { ausgeloestAt: "desc" },
          take: 50,
        })
        
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "init", events })}\n\n`)
        )

        // Poll for updates every 3 seconds
        const interval = setInterval(async () => {
          try {
            const activeEvents = await prisma.sOSEvent.findMany({
              where: {
                status: { in: ["pending", "sent", "acknowledged"] },
              },
              orderBy: { ausgeloestAt: "desc" },
              take: 50,
            })
            
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "update", events: activeEvents })}\n\n`)
            )
          } catch (error) {
            console.error("[SSE] Poll error:", error)
          }
        }, 3000)

        // Cleanup on close
        req.signal.addEventListener("abort", () => {
          clearInterval(interval)
          controller.close()
        })
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
  }

  // Standard JSON response
  const { searchParams } = new URL(req.url)
  const activeOnly = searchParams.get("active") === "true"
  const limit = parseInt(searchParams.get("limit") || "50")

  const where = activeOnly
    ? { status: { in: ["pending", "sent", "acknowledged"] as const } }
    : {}

  const events = await prisma.sOSEvent.findMany({
    where,
    orderBy: { ausgeloestAt: "desc" },
    take: limit,
  })

  // Count active
  const activeCount = await prisma.sOSEvent.count({
    where: { status: { in: ["pending", "sent", "acknowledged"] } },
  })

  return NextResponse.json({ events, activeCount })
}
