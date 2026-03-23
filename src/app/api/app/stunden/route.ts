import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const mitarbeiterId = appUser.mitarbeiterId as string | null
  if (!mitarbeiterId) return NextResponse.json({ error: "No mitarbeiter profile" }, { status: 400 })
  const body = await req.json()
  const entry = await prisma.stundeneintrag.create({
    data: {
      mitarbeiterId,
      datum: body.datum ? new Date(body.datum) : new Date(),
      stunden: parseFloat(body.stunden),
      typ: body.typ ?? "arbeit",
      auftragId: body.auftragId ?? null,
      notiz: body.notiz ?? null,
      genehmigt: false,
    },
  })
  return NextResponse.json(entry, { status: 201 })
}
