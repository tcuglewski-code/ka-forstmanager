import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withErrorHandler } from "@/lib/api-handler"

// GET /api/baumschulen — public list aktiver Baumschulen (für WP Wizard)
export const GET = withErrorHandler(async () => {
  const baumschulen = await prisma.baumschule.findMany({
    where: { aktiv: true },
    select: {
      id: true,
      name: true,
      ort: true,
      bundesland: true,
      ansprechpartner: true,
      email: true,
      telefon: true,
    },
    orderBy: { name: "asc" },
  })
  return NextResponse.json({ baumschulen })
})
