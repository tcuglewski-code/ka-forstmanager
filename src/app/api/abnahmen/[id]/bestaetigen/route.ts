import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-handler"


// POST /api/abnahmen/[id]/bestaetigen — Schnell-Bestätigung mit optionaler Signatur
export const POST = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { signaturUrl, notizen, fotos } = body

  const abnahme = await prisma.abnahme.findUnique({ where: { id } })
  if (!abnahme) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })

  // AUDIT-FIX: [K10] Abnahme-Bestätigung + Rechnungs-Freigabe atomar in einer Transaktion
  const [updated] = await prisma.$transaction([
    prisma.abnahme.update({
      where: { id },
      data: {
        status: "bestätigt",
        signaturUrl: signaturUrl ?? null,
        notizen: notizen ?? abnahme.notizen,
        fotos: fotos ?? abnahme.fotos ?? undefined,
        rechnungFreigegeben: true,
        freigegebenAm: new Date(),
        freigegebenVon: (session as any).user?.id ?? null,
      },
    }),
    // Rechnungen mit Status 'entwurf' oder 'erstellt' freigeben
    prisma.rechnung.updateMany({
      where: {
        auftragId: abnahme.auftragId,
        status: { in: ["entwurf", "erstellt"] },
      },
      data: { status: "freigegeben" },
    }),
  ])

  return NextResponse.json({ ok: true, abnahme: updated })
})
