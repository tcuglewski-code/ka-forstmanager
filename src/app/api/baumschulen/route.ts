import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withErrorHandler } from "@/lib/api-handler"

// GET /api/baumschulen — public list aktiver Baumschulen (für WP Wizard)
// AUDIT-FIX T-025: DSGVO-Datenminimierung — email/telefon/ansprechpartner aus öffentlicher Response entfernt
export const GET = withErrorHandler(async () => {
  const baumschulen = await prisma.baumschule.findMany({
    where: { aktiv: true },
    select: {
      id: true,
      name: true,
      ort: true,
      bundesland: true,
    },
    orderBy: { name: "asc" },
  })
  return NextResponse.json({ baumschulen })
})
