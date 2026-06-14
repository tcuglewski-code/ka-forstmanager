/**
 * A2 — POST /api/material-bedarf/berechnen (MAT-008)
 * Kill-Switch (NEVER #21): wenn mat_agent_aktiv != "true" → 503.
 * Body: { angebotId } ODER { inputSpezifikation } (+ optional auftragId).
 */
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isAdminOrGF } from "@/lib/permissions"
import { withErrorHandler } from "@/lib/api-handler"
import { isMatAgentAktiv } from "@/lib/material/config"
import { berechneMaterialBedarf } from "@/lib/material/berechnen"
import { spezifikationAusAngebot } from "@/lib/material/aus-angebot"
import { llmMaterialFallback } from "@/lib/material/llm-fallback"
import { MatInputSpezifikationSchema } from "@/lib/material/zod-schemas"

export const POST = withErrorHandler(async (req: Request) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Kill-Switch
  if (!(await isMatAgentAktiv())) {
    return NextResponse.json(
      { error: "Material-Bedarf-Agent deaktiviert", code: "MAT_AGENT_INAKTIV" },
      { status: 503 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const userId = (session.user as { id?: string } | undefined)?.id ?? null

  let spez: unknown
  let angebotId: string | null = null
  const auftragId: string | null = typeof body.auftragId === "string" ? body.auftragId : null

  if (typeof body.angebotId === "string" && body.angebotId.length > 0) {
    angebotId = body.angebotId
    const ausAngebot = await spezifikationAusAngebot(angebotId)
    if (!ausAngebot) {
      return NextResponse.json({ error: "Angebot nicht gefunden" }, { status: 404 })
    }
    spez = ausAngebot
  } else if (body.inputSpezifikation) {
    const parsed = MatInputSpezifikationSchema.safeParse(body.inputSpezifikation)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ungültige inputSpezifikation", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    spez = parsed.data
  } else {
    return NextResponse.json(
      { error: "angebotId oder inputSpezifikation erforderlich" },
      { status: 400 }
    )
  }

  const ergebnis = await berechneMaterialBedarf(spez, {
    angebotId,
    auftragId,
    userId,
    llmFallback: llmMaterialFallback,
  })

  return NextResponse.json(ergebnis, { status: 201 })
})
