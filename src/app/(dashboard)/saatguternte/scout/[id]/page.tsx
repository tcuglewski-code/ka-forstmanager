import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ScoutClient } from "./ScoutClient"

export default async function ScoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const flaeche = await prisma.registerFlaeche.findUnique({
    where: { id },
    select: {
      id: true,
      registerNr: true,
      baumart: true,
      forstamt: true,
      revier: true,
      bundesland: true,
      latDez: true,
      lonDez: true,
      flaecheHa: true,
      hoeheVon: true,
      hoeheBis: true,
      profil: {
        select: {
          status: true,
          bewertung: true,
          notizen: true,
        },
      },
    },
  })

  if (!flaeche) notFound()

  return <ScoutClient flaeche={flaeche} />
}
