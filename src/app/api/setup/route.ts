import { NextResponse } from "next/server"

// ⛔ SETUP PERMANENT DEAKTIVIERT — DB bereits initialisiert (2026-04)
// Bei Bedarf: Route aus Git wiederherstellen und SETUP_DISABLED=false setzen

export async function GET() {
  return NextResponse.json(
    { error: "Setup ist deaktiviert." },
    { status: 403 }
  )
}
