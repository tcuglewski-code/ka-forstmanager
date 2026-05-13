import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"

// POST /api/signaturen
// Mobile App speichert Auftrag-Signaturen (gf + foerster) als Dokument.
// Body: { auftrag_id, gf_signature?, foerster_signature?, datum?, ort? }
export async function POST(req: NextRequest) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({}))
    const auftragId: string | undefined =
      body.auftrag_id ?? body.auftragId ?? undefined

    if (!auftragId) {
      return NextResponse.json(
        { error: "auftrag_id ist erforderlich" },
        { status: 400 }
      )
    }

    const sub = typeof appUser.sub === "string" ? appUser.sub : null
    let mitarbeiterId =
      (appUser.mitarbeiterId as string | null) ??
      (typeof (appUser as Record<string, unknown>).mitarbeiterId === "string"
        ? ((appUser as Record<string, unknown>).mitarbeiterId as string)
        : null)
    if (!mitarbeiterId && sub) {
      const linked = await prisma.mitarbeiter.findFirst({
        where: { userId: sub },
        select: { id: true },
      })
      mitarbeiterId = linked?.id ?? null
    }

    // Signatur-Daten (Base64 oder URL) im Dokument-URL-Feld ablegen
    const payload = {
      gf_signature: body.gf_signature ?? null,
      foerster_signature: body.foerster_signature ?? null,
      datum: body.datum ?? null,
      ort: body.ort ?? null,
    }
    const url = `data:application/json;base64,${Buffer.from(
      JSON.stringify(payload)
    ).toString("base64")}`

    const doc = await prisma.dokument.create({
      data: {
        name: `Signatur Auftrag ${auftragId}`,
        typ: "signatur",
        kategorie: "signatur",
        auftragId,
        mitarbeiterId: mitarbeiterId ?? undefined,
        hochgeladenVon: sub ?? undefined,
        url,
        mimeType: "application/json",
        beschreibung: body.ort ?? null,
      },
    })

    return NextResponse.json(
      {
        id: doc.id,
        auftragId: doc.auftragId,
        url: doc.url,
        createdAt: doc.createdAt,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[/api/signaturen] Error:", error)
    return NextResponse.json(
      { error: "Fehler beim Speichern der Signatur" },
      { status: 500 }
    )
  }
}
