import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"
import { NextRequest, NextResponse } from "next/server"
import { sendKANotification } from "@/lib/telegram-notify"
import { withErrorHandler } from "@/lib/api-handler"


export const POST = withErrorHandler(async (req: NextRequest) => {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()

  // FIX 3: Idempotency — same mitarbeiter + auftrag + same day returns existing
  const mitarbeiterId = (appUser.mitarbeiterId as string | null) ?? null
  const auftragId = body.auftragId ?? null
  const datumInput = body.datum ? new Date(body.datum) : new Date()

  if (mitarbeiterId && auftragId && !Number.isNaN(datumInput.getTime())) {
    const dayStart = new Date(
      datumInput.getFullYear(),
      datumInput.getMonth(),
      datumInput.getDate(),
    )
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

    const existing = await prisma.tagesprotokoll.findFirst({
      where: {
        auftragId,
        erstellerId: mitarbeiterId,
        datum: { gte: dayStart, lt: dayEnd },
      },
    })
    if (existing) {
      return NextResponse.json(existing, { status: 200 })
    }
  }

  const proto = await prisma.tagesprotokoll.create({
    data: {
      auftragId: body.auftragId ?? null,
      gruppeId: body.gruppeId ?? null,
      datum: datumInput,
      ersteller: body.ersteller ?? String(appUser.email ?? ""),
      erstellerId: mitarbeiterId,
      bericht: body.bericht ?? null,
      gepflanzt: body.gepflanzt ? parseInt(body.gepflanzt) : null,
      witterung: body.witterung ?? null,
      fotos: body.fotos ?? null,
    },
  })
  // KA-Bot: Protokoll eingereicht (fire-and-forget)
  sendKANotification({
    event: "protokoll_eingereicht",
    data: { auftrag: body.auftragId ?? "—", ersteller: body.ersteller ?? String(appUser.email ?? "App") },
  }).catch(() => {})

  return NextResponse.json(proto, { status: 201 })
})
