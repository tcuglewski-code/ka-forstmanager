// KH-2: Unterkunftsplanung Seite
// Sucht Hotels/Pensionen in der Nähe von Aufträgen via Overpass API

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Breadcrumb } from "@/components/layout/Breadcrumb"
import UnterkunftPageClient from "./UnterkunftPageClient"

async function getAuftraegeWithCoords() {
  return prisma.auftrag.findMany({
    where: {
      lat: { not: null },
      lng: { not: null },
      status: { notIn: ["abgeschlossen", "storniert"] },
    },
    select: {
      id: true,
      titel: true,
      nummer: true,
      standort: true,
      waldbesitzer: true,
      lat: true,
      lng: true,
      status: true,
      startDatum: true,
      endDatum: true,
    },
    orderBy: { startDatum: "asc" },
  })
}

export default async function UnterkunftePage() {
  await auth()
  const auftraege = await getAuftraegeWithCoords()

  return (
    <div className="max-w-7xl mx-auto">
      <Breadcrumb items={[{ label: "Unterkünfte" }]} />
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Unterkunftsplanung</h1>
        <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
          Finde Hotels und Pensionen in der Nähe von Aufträgen
        </p>
      </div>

      <UnterkunftPageClient auftraege={auftraege} />
    </div>
  )
}
