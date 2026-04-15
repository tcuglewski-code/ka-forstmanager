import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"
import { NextRequest, NextResponse } from "next/server"
import { sendKANotification } from "@/lib/telegram-notify"
import { withErrorHandler } from "@/lib/api-handler"


export const POST = withErrorHandler(async (req: NextRequest) => {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const proto = await prisma.tagesprotokoll.create({
    data: {
      auftragId: body.auftragId ?? null,
      gruppeId: body.gruppeId ?? null,
      datum: body.datum ? new Date(body.datum) : new Date(),
      ersteller: body.ersteller ?? String(appUser.email ?? ""),
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
