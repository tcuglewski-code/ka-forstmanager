import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/saatguternte/medien/zuordnung
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { flaecheId, nextcloudPath, dateiname, typ, datum, mission } = body

    if (!nextcloudPath || !dateiname || !typ) {
      return NextResponse.json(
        { error: "nextcloudPath, dateiname und typ sind erforderlich" },
        { status: 400 }
      )
    }

    const zuordnung = await prisma.mediaZuordnung.create({
      data: {
        flaecheId: flaecheId ?? null,
        nextcloudPath,
        dateiname,
        typ,
        datum: datum ? new Date(datum) : null,
        mission: mission ?? null,
      },
    })

    return NextResponse.json({ zuordnung }, { status: 201 })
  } catch (err) {
    console.error("[medien/zuordnung] POST error:", err)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}
