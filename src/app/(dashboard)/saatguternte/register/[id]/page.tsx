import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, MapPin, Phone, Mail, ExternalLink, Database } from "lucide-react"
import { FlaechenProfilForm } from "./FlaechenProfilForm"
import { RohdatenToggle } from "./RohdatenToggle"

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
      profil: true,
    },
  })

  if (!flaeche) notFound()

  function formatDatum(d: Date | null) {
    if (!d) return "–"
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  const lat = flaeche.latDez
  const lon = flaeche.lonDez
  const hasKoord = lat != null && lon != null

  // OSM iframe bbox
  let osmUrl: string | null = null
  if (hasKoord && lat != null && lon != null) {
    const delta = 0.05
    const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`
    osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Linke Spalte */}
        <div className="space-y-6">
          {/* Grunddaten */}
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">Grunddaten</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ["Register-Nr", flaeche.registerNr],
                ["Bundesland", flaeche.bundesland],
                ["Baumart", flaeche.baumart],
                ["Baumart wiss.", flaeche.baumartWiss ?? "–"],
                ["Baumart-Code", flaeche.baumartCode ?? "–"],
                ["Kategorie", flaeche.kategorie ?? "–"],
                ["Ausgangsmaterial", flaeche.ausgangsmaterial ?? "–"],
                ["Herkunftsgebiet", flaeche.herkunftsgebiet ?? "–"],
                ["Fläche gesamt (ha)", flaeche.flaecheHa?.toFixed(2) ?? "–"],
                ["Fläche reduziert (ha)", flaeche.flaecheRedHa?.toFixed(2) ?? "–"],
                ["Höhe von", flaeche.hoeheVon ? `${flaeche.hoeheVon} m` : "–"],
                ["Höhe bis", flaeche.hoeheBis ? `${flaeche.hoeheBis} m` : "–"],
                ["Zulassung von", formatDatum(flaeche.zulassungVon)],
                ["Zulassung bis", flaeche.zulassungBisText ?? formatDatum(flaeche.zulassungBis)],
                ["Erstes Jahr", flaeche.erstesJahr?.toString() ?? "–"],
                ["Alter", flaeche.alter ?? "–"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-zinc-600 text-xs">{label}</dt>
                  <dd className="text-zinc-300 mt-0.5">{value}</dd>
                </div>
              ))}
            </div>
          </div>

          {/* Standort */}
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">Standort</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-4">
              {[
                ["Forstamt", flaeche.forstamt ?? "–"],
                ["Revier", flaeche.revier ?? "–"],
                ["Landkreis", flaeche.landkreis ?? "–"],
                ["Wuchsbezirk", flaeche.wuchsbezirk ?? "–"],
                ["Besitzart", flaeche.besitzart ?? "–"],
                ["Eigentumsart", flaeche.eigentumsart ?? "–"],
                ["Koordinaten", hasKoord ? `${lat?.toFixed(4)}°N, ${lon?.toFixed(4)}°O` : "–"],
                ["Koordinaten (roh)", flaeche.koordinatenRaw ?? "–"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-zinc-600 text-xs">{label}</dt>
                  <dd className="text-zinc-300 mt-0.5">{value}</dd>
                </div>
              ))}
            </div>

            {/* OSM Karte */}
            {osmUrl && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs text-zinc-500">OpenStreetMap</span>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=13/${lat}/${lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
                  >
                    Vollbild <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <iframe
                  src={osmUrl}
                  className="w-full h-64 rounded-lg border border-[#2a2a2a]"
                  style={{ border: 0 }}
                  loading="lazy"
                />
              </div>
            )}
          </div>

          {/* Flächenprofil */}
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">
              Internes Flächenprofil
            </h2>
            <FlaechenProfilForm
              flaecheId={flaeche.id}
              initialStatus={flaeche.profil?.status ?? "ungeprüft"}
              initialNotizen={flaeche.profil?.notizen ?? null}
            />
          </div>
        </div>

        {/* Rechte Spalte */}
        <div className="space-y-4">
          {/* Quelle */}
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Registerquelle</h2>
            <div className="space-y-2 text-sm">
              <div>
                <dt className="text-zinc-600 text-xs">Name</dt>
                <dd className="text-zinc-300">{flaeche.quelle.name}</dd>
              </div>
              <div>
                <dt className="text-zinc-600 text-xs">Kürzel</dt>
                <dd>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs font-medium">
                    {flaeche.quelle.kuerzel}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-zinc-600 text-xs">Bundesländer</dt>
                <dd className="text-zinc-300 text-xs">{flaeche.quelle.bundeslaender.join(", ")}</dd>
              </div>
              {flaeche.quelle.baseUrl && (
                <div>
                  <a
                    href={flaeche.quelle.baseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
                  >
                    Zur Quelle <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {flaeche.quelleUrl && (
                <div>
                  <a
                    href={flaeche.quelleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-500 hover:text-zinc-400 flex items-center gap-1 break-all"
                  >
                    Direktlink <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>
              )}
              <div>
                <dt className="text-zinc-600 text-xs">Datenstand</dt>
                <dd className="text-zinc-400 text-xs">
                  {flaeche.datenstand ?? formatDatum(flaeche.letzteAktualisierung)}
                </dd>
              </div>
            </div>
          </div>

          {/* Ansprechpartner */}
          {(flaeche.ansprechpartner || flaeche.ansprechpartnerTel || flaeche.ansprechpartnerEmail) && (
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Ansprechpartner</h2>
              <div className="space-y-2 text-sm">
                {flaeche.ansprechpartner && (
                  <div className="text-zinc-300">{flaeche.ansprechpartner}</div>
                )}
                {flaeche.hoheitlicheStelle && (
                  <div className="text-zinc-500 text-xs">{flaeche.hoheitlicheStelle}</div>
                )}
                {flaeche.ansprechpartnerTel && (
                  <a
                    href={`tel:${flaeche.ansprechpartnerTel}`}
                    className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {flaeche.ansprechpartnerTel}
                  </a>
                )}
                {flaeche.ansprechpartnerEmail && (
                  <a
                    href={`mailto:${flaeche.ansprechpartnerEmail}`}
                    className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {flaeche.ansprechpartnerEmail}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Zusätzliche Infos */}
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Weitere Angaben</h2>
            <div className="space-y-2 text-xs">
              {[
                ["Verwendungszweck", flaeche.verwendungszweck],
                ["Genetisch untersucht", flaeche.genetischUntersucht ? "Ja" : "Nein"],
                ["Verkehrsbeschränkung", flaeche.verkehrsbeschraenkung ? "Ja" : "Nein"],
                ["Zulässige Flächen", flaeche.zulaessigeFlaechen],
              ].map(([label, value]) =>
                value ? (
                  <div key={label as string}>
                    <dt className="text-zinc-600">{label}</dt>
                    <dd className="text-zinc-400 mt-0.5">{value as string}</dd>
                  </div>
                ) : null
              )}
            </div>
          </div>

          {/* Rohdaten */}
          {flaeche.rohdaten && (
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-3.5 h-3.5 text-zinc-600" />
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Rohdaten (JSON)</h2>
              </div>
              <RohdatenToggle data={flaeche.rohdaten} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
