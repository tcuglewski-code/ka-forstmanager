import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import SaisonDetailClient from "./SaisonDetailClient"
import { Breadcrumb } from "@/components/layout/Breadcrumb"

// W2: Erweiterter Query mit allen benötigten Relations
async function getSaison(id: string) {
  return prisma.saison.findUnique({
    where: { id },
    include: {
      anmeldungen: {
        include: {
          mitarbeiter: {
            select: { id: true, vorname: true, nachname: true, rolle: true, stundenlohn: true },
          },
        },
      },
      gruppen: {
        include: {
          mitglieder: {
            include: {
              mitarbeiter: { select: { id: true, vorname: true, nachname: true } },
            },
          },
        },
      },
      auftraege: {
        orderBy: { createdAt: "desc" },
        include: {
          protokolle: { orderBy: { datum: "desc" } },
          stundeneintraege: {
            include: {
              mitarbeiter: { select: { vorname: true, nachname: true } },
            },
          },
          logs: { orderBy: { createdAt: "desc" }, take: 5 },
          gruppe: { select: { name: true } },
        },
      },
      dokumente: { orderBy: { createdAt: "desc" } },
      lohnabrechnungen: { select: { id: true, mitarbeiterId: true } },
    },
  })
}

const statusBadge: Record<string, string> = {
  planung: "bg-blue-500/20 text-blue-400",
  aktiv: "bg-emerald-500/20 text-emerald-400",
  abgeschlossen: "bg-zinc-500/20 text-zinc-400",
  archiviert: "bg-zinc-700/50 text-zinc-600",
}

export default async function SaisonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await auth()
  const { id } = await params
  const saison = await getSaison(id)
  if (!saison) notFound()

  // W2: Statistiken serverseitig berechnen
  const gesamtPflanzen = saison.auftraege.reduce(
    (sum, a) =>
      sum + a.protokolle.reduce((s2, p) => s2 + (p.gepflanzt ?? 0), 0),
    0
  )
  const gesamtStunden = saison.auftraege.reduce(
    (sum, a) =>
      sum + a.stundeneintraege.reduce((s2, s) => s2 + s.stunden, 0),
    0
  )
  const gesamtFlaeche = saison.auftraege.reduce(
    (sum, a) => sum + (a.flaeche_ha ?? 0),
    0
  )

  return (
    <div className="max-w-5xl mx-auto">
      <Breadcrumb
        items={[{ label: "Saisons", href: "/saisons" }, { label: saison.name }]}
      />
      <Link
        href="/saisons"
        className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-6 transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> Zurück zu Saisons
      </Link>

      {/* Header */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">{saison.name}</h1>
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${statusBadge[saison.status] ?? "bg-zinc-700 text-zinc-400"}`}
              >
                {saison.status}
              </span>
            </div>
            {saison.beschreibung && (
              <p className="text-zinc-400 text-sm mb-2">{saison.beschreibung}</p>
            )}
            <div className="flex gap-4 text-sm text-zinc-400">
              {saison.startDatum && (
                <span>
                  Start: {new Date(saison.startDatum).toLocaleDateString("de-DE")}
                </span>
              )}
              {saison.endDatum && (
                <span>
                  Ende: {new Date(saison.endDatum).toLocaleDateString("de-DE")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* W2: Statistiken und erweiterte Daten an Client übergeben */}
      <SaisonDetailClient
        saison={saison}
        saisonId={id}
        gesamtPflanzen={gesamtPflanzen}
        gesamtStunden={gesamtStunden}
        gesamtFlaeche={gesamtFlaeche}
      />
    </div>
  )
}
