// KU-1: Lieferanten-Preisliste Verwaltung
// Upload CSV oder manuelle Eingabe von Artikelpreisen

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { Breadcrumb } from "@/components/layout/Breadcrumb"
import PreislisteClient from "./PreislisteClient"

interface Props {
  params: Promise<{ id: string }>
}

async function getLieferantMitArtikeln(id: string) {
  const lieferant = await prisma.lieferant.findUnique({
    where: { id },
    include: {
      artikel: {
        orderBy: { name: "asc" }
      }
    }
  })
  return lieferant
}

export default async function LieferantenPreislistePage({ params }: Props) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const { id } = await params
  const lieferant = await getLieferantMitArtikeln(id)

  if (!lieferant) {
    notFound()
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Breadcrumb 
        items={[
          { label: "Lager", href: "/lager" },
          { label: "Lieferanten", href: "/lager/lieferanten" },
          { label: lieferant.name, href: `/lager/lieferanten/${id}` },
          { label: "Preisliste" }
        ]} 
      />
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>Preisliste: {lieferant.name}</h1>
        <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
          Verwalte Artikel und Preise für diesen Lieferanten
        </p>
      </div>

      <PreislisteClient 
        lieferant={{
          id: lieferant.id,
          name: lieferant.name,
          artikel: lieferant.artikel.map((a: typeof lieferant.artikel[number]) => ({
            id: a.id,
            name: a.name,
            kategorie: a.kategorie,
            einheit: a.einheit,
            einkaufspreis: a.einkaufspreis,
            verkaufspreis: a.verkaufspreis,
            lieferantPreis: a.lieferantPreis ? Number(a.lieferantPreis) : null,
            lieferantBestellnummer: a.lieferantBestellnummer,
            bestand: a.bestand,
            updatedAt: a.updatedAt
          }))
        }}
      />
    </div>
  )
}
