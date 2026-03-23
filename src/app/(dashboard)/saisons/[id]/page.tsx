import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import SaisonDetailClient from "./SaisonDetailClient"

async function getSaison(id: string) {
  return prisma.saison.findUnique({
    where: { id },
    include: {
      anmeldungen: {
        include: { mitarbeiter: { select: { id: true, vorname: true, nachname: true, rolle: true } } },
      },
      gruppen: { include: { mitglieder: { include: { mitarbeiter: { select: { id: true, vorname: true, nachname: true } } } } } },
      auftraege: { orderBy: { createdAt: "desc" } },
      dokumente: { orderBy: { createdAt: "desc" } },
    },
  })
}

const statusBadge: Record<string, string> = {
  planung: "bg-blue-500/20 text-blue-400",
  aktiv: "bg-emerald-500/20 text-emerald-400",
  abgeschlossen: "bg-zinc-500/20 text-zinc-400",
  archiviert: "bg-zinc-700/50 text-zinc-600",
}

export default async function SaisonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await auth()
  const { id } = await params
  const saison = await getSaison(id)
  if (!saison) notFound()

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/saisons" className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-6 transition-all">
        <ArrowLeft className="w-4 h-4" /> Zurück zu Saisons
      </Link>

      {/* Header */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">{saison.name}</h1>
              <span className={`px-2 py-0.5 rounded-full text-xs ${statusBadge[saison.status] ?? "bg-zinc-700 text-zinc-400"}`}>
                {saison.status}
              </span>
            </div>
            {saison.beschreibung && <p className="text-zinc-400 text-sm mb-2">{saison.beschreibung}</p>}
            <div className="flex gap-4 text-sm text-zinc-400">
              {saison.startDatum && <span>Start: {new Date(saison.startDatum).toLocaleDateString("de-DE")}</span>}
              {saison.endDatum && <span>Ende: {new Date(saison.endDatum).toLocaleDateString("de-DE")}</span>}
            </div>
          </div>
        </div>
      </div>

      <SaisonDetailClient saison={saison} saisonId={id} />
    </div>
  )
}
