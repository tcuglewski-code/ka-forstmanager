import { NextResponse } from "next/server"
import { querySecondBrain } from "@/lib/secondbrain-db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const [forstamter, baumschulen, foerderprogramme, wissen] = await Promise.all([
      querySecondBrain("SELECT COUNT(*) as total FROM forstamt_kontakte"),
      querySecondBrain("SELECT COUNT(*) as total FROM baumschulen"),
      querySecondBrain("SELECT COUNT(*) as total FROM foerderprogramme"),
      querySecondBrain("SELECT COUNT(*) as total FROM forst_wissen"),
    ])

    return NextResponse.json({
      forstamter: parseInt(forstamter[0]?.total || "0"),
      baumschulen: parseInt(baumschulen[0]?.total || "0"),
      foerderprogramme: parseInt(foerderprogramme[0]?.total || "0"),
      wissen: parseInt(wissen[0]?.total || "0"),
    })
  } catch (error) {
    console.error("SecondBrain counts error:", error)
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 })
  }
}
