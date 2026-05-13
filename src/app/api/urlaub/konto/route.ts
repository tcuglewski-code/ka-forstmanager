import { NextRequest, NextResponse } from "next/server"
import { getAppUser } from "@/lib/app-auth"
import { getUrlaubKontoFor, resolveMitarbeiterId } from "@/lib/urlaub-helper"

// GET /api/urlaub/konto — Urlaubssaldo des aktuellen Users (aktuelles Jahr)
export async function GET(req: NextRequest) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const mitarbeiterId = await resolveMitarbeiterId(
      appUser as Record<string, unknown>
    )
    if (!mitarbeiterId) {
      // Stub-Fallback: leeres Konto zurückgeben statt 404
      return NextResponse.json({
        user_id: 0,
        jahr: new Date().getFullYear(),
        urlaubstage_gesamt: 30,
        urlaubstage_genommen: 0,
        urlaubstage_beantragt: 0,
        urlaubstage_verbleibend: 30,
      })
    }

    const konto = await getUrlaubKontoFor(mitarbeiterId)
    return NextResponse.json(konto)
  } catch (error) {
    console.error("[/api/urlaub/konto] Error:", error)
    return NextResponse.json({
      user_id: 0,
      jahr: new Date().getFullYear(),
      urlaubstage_gesamt: 30,
      urlaubstage_genommen: 0,
      urlaubstage_beantragt: 0,
      urlaubstage_verbleibend: 30,
    })
  }
}
