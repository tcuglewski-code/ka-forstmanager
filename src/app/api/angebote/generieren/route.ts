/**
 * A1 — POST /api/angebote/generieren (ANG-021)
 * Kill-Switch (NEVER #21): wenn ang_agent_aktiv != "true" → 503.
 * Erzeugt aus roher Anfrage einen KI-Angebotsentwurf (Parser → Kalkulation → RAG).
 */
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isAdminOrGF } from "@/lib/permissions"
import { withErrorHandler } from "@/lib/api-handler"
import { isAgentAktiv } from "@/lib/angebote/config"
import { generiereAngebot } from "@/lib/angebote/generieren"
import type { InputTyp } from "@/lib/angebote/parsing/anfrage-parser"

const ERLAUBTE_TYPEN: InputTyp[] = ["freitext", "wizard", "email"]

export const POST = withErrorHandler(async (req: Request) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Kill-Switch
  if (!(await isAgentAktiv())) {
    return NextResponse.json(
      { error: "KI-Angebotsgenerierung deaktiviert", code: "AGENT_INAKTIV" },
      { status: 503 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const roheAnfrage = typeof body.roheAnfrage === "string" ? body.roheAnfrage.trim() : ""
  if (!roheAnfrage) {
    return NextResponse.json({ error: "roheAnfrage erforderlich" }, { status: 400 })
  }
  const inputTyp: InputTyp = ERLAUBTE_TYPEN.includes(body.inputTyp) ? body.inputTyp : "freitext"

  const userId = (session.user as { id?: string } | undefined)?.id ?? null
  const ergebnis = await generiereAngebot(roheAnfrage, inputTyp, userId)

  return NextResponse.json(ergebnis, { status: 201 })
})
