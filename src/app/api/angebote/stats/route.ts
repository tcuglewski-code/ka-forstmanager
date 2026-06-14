/**
 * A1 — GET /api/angebote/stats (ANG-034)
 * Dashboard-KPIs für KI-Angebote: Anzahl je Status, Conversion, offene
 * Follow-ups, KI-Kosten gesamt.
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { withErrorHandler } from "@/lib/api-handler"

export const GET = withErrorHandler(async () => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [statusGruppen, kiAggregat, offeneFollowUps] = await Promise.all([
    prisma.angebot.groupBy({ by: ["status"], _count: { _all: true }, where: { kiGeneriert: true } }),
    prisma.angebot.aggregate({
      where: { kiGeneriert: true },
      _sum: { kiKostenCent: true },
      _count: { _all: true },
    }),
    prisma.angebotsFollowUp.count({ where: { status: "offen" } }),
  ])

  const proStatus: Record<string, number> = {}
  for (const g of statusGruppen) proStatus[g.status] = g._count._all

  const gesamt = kiAggregat._count._all
  const angenommen = proStatus["angenommen"] ?? 0
  const versendet = (proStatus["versendet"] ?? 0) + angenommen + (proStatus["abgelehnt"] ?? 0)
  const conversion = versendet > 0 ? Math.round((angenommen / versendet) * 100) : 0

  return NextResponse.json({
    gesamt,
    proStatus,
    conversionProzent: conversion,
    offeneFollowUps,
    kiKostenEur: Math.round((kiAggregat._sum.kiKostenCent ?? 0)) / 100,
  })
})
