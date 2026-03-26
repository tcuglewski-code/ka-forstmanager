import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { FlaecheDetailTabs } from "./FlaecheDetailTabs"

export default async function FlaecheDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const flaeche = await prisma.registerFlaeche.findUnique({
    where: { id },
    include: {
      quelle: true,
      profil: {
        include: {
          ernten: {
            include: {
              positionen: true,
            },
            orderBy: { datum: "desc" },
          },
        },
      },
    },
  })

  if (!flaeche) notFound()

  const lat = flaeche.latDez
  const lon = flaeche.lonDez
  const hasKoord = lat != null && lon != null

  let osmUrl: string | null = null
  if (hasKoord && lat != null && lon != null) {
    const delta = 0.05
    const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`
    osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`
  }

  // Serialize for client component
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serialized: any = {
    ...flaeche,
    zulassungVon: flaeche.zulassungVon?.toISOString() ?? null,
    zulassungBis: flaeche.zulassungBis?.toISOString() ?? null,
    letzteAktualisierung: flaeche.letzteAktualisierung?.toISOString() ?? null,
    osmUrl,
    profil: flaeche.profil
      ? {
          ...flaeche.profil,
          letzteInspektion: flaeche.profil.letzteInspektion?.toISOString() ?? null,
          naechsteErnte: flaeche.profil.naechsteErnte?.toISOString() ?? null,
          createdAt: flaeche.profil.createdAt?.toISOString() ?? null,
          updatedAt: flaeche.profil.updatedAt?.toISOString() ?? null,
          ernten: (flaeche.profil.ernten ?? []).map((e) => ({
            ...e,
            datum: e.datum?.toISOString() ?? null,
            createdAt: e.createdAt?.toISOString() ?? null,
            updatedAt: e.updatedAt?.toISOString() ?? null,
            positionen: e.positionen.map((p) => ({
              ...p,
              datum: p.datum?.toISOString() ?? null,
              createdAt: p.createdAt?.toISOString() ?? null,
            })),
          })),
        }
      : null,
    quelle: {
      ...flaeche.quelle,
      letzterCrawl: flaeche.quelle.letzterCrawl?.toISOString() ?? null,
      naechsterCrawl: flaeche.quelle.naechsterCrawl?.toISOString() ?? null,
      createdAt: flaeche.quelle.createdAt?.toISOString() ?? null,
      updatedAt: flaeche.quelle.updatedAt?.toISOString() ?? null,
    },
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/saatguternte/register"
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Register-Übersicht
        </Link>
        <span className="text-zinc-700">/</span>
        <span className="text-sm text-zinc-400 font-mono">{flaeche.registerNr}</span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-2 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-mono">{flaeche.registerNr}</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {flaeche.baumart} · {flaeche.bundesland}
          </p>
        </div>
        <span
          className={`mt-1 ml-3 px-2.5 py-1 rounded-full text-xs font-medium ${
            flaeche.zugelassen
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {flaeche.zugelassen ? "Zugelassen" : "Widerruf/Abgelaufen"}
        </span>
        {hasKoord && (
          <a
            href={`/saatguternte/scout/${flaeche.id}`}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-[#1e1e1e] border border-[#2a2a2a] hover:border-emerald-500 rounded-lg text-xs text-zinc-400 hover:text-emerald-400 transition-all"
          >
            📱 Scout-Ansicht <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Tab System */}
      <FlaecheDetailTabs flaeche={serialized} />
    </div>
  )
}
