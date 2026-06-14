/**
 * A1 — POST /api/angebote/[id]/versenden (ANG-029)
 * Versendet ein freigegebenes Angebot per E-Mail (PDF + Tracking). Kill-Switch
 * greift NICHT (Versand ist menschlich freigegeben), aber Freigabe ist Pflicht.
 */
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isAdminOrGF } from "@/lib/permissions"
import { withErrorHandler } from "@/lib/api-handler"
import { versendeAngebot } from "@/lib/angebote/versand/email-versand"

export const POST = withErrorHandler(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const ergebnis = await versendeAngebot(id, typeof body.email === "string" ? body.email : undefined)
    if (!ergebnis.ok) {
      return NextResponse.json({ error: ergebnis.fehler }, { status: 400 })
    }
    return NextResponse.json(ergebnis)
  }
)
