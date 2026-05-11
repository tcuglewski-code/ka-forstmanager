/**
 * POST /api/zeiterfassung/pause — Stempeluhr Pause start/end (App-Alias)
 * Body: { user_id?: string, session_id?: string, pause_start: boolean, timestamp?: number }
 * Response: { success: true }
 *
 * Pausen werden client-seitig aggregiert; Server bestätigt nur den Aufruf
 * und cancelled keine aktive Session.
 */
import { NextRequest, NextResponse } from "next/server"
import { getAppUser } from "@/lib/app-auth"

export async function POST(req: NextRequest) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { pause_start } = body as { pause_start?: boolean }

  return NextResponse.json({
    success: true,
    pause_start: !!pause_start,
  })
}
