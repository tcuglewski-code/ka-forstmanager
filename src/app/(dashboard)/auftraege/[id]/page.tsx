import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"

const statusBadge: Record<string, string> = {
  anfrage: "bg-blue-500/20 text-blue-400",
  geprueft: "bg-sky-500/20 text-sky-400",
  angebot: "bg-violet-500/20 text-violet-400",
  bestaetigt: "bg-amber-500/20 text-amber-400",
  in_ausfuehrung: "bg-emerald-500/20 text-emerald-400",
  abgeschlossen: "bg-zinc-500/20 text-zinc-400",
}

const statusLabel: Record<string, string> = {
  anfrage: "Anfrage",
  geprueft: "Geprüft",
  angebot: "Angebot",
  bestaetigt: "Bestätigt",
  in_ausfuehrung: "In Ausführung",
  abgeschlossen: "Abgeschlossen",
}

const abnahmeBadge: Record<string, string> = {
  offen: "bg-blue-500/20 text-blue-400",
  bestanden: "bg-emerald-500/20 text-emerald-400",
  nicht_bestanden: "bg-red-500/20 text-red-400",
}

const dokTypBadge: Record<string, string> = {
  foto: "bg-purple-500/20 text-purple-400",
  karte: "bg-blue-500/20 text-blue-400",
  protokoll: "bg-amber-500/20 text-amber-400",
  foerderantrag: "bg-emerald-500/20 text-emerald-400",
  rechnung: "bg-red-500/20 text-red-400",
  sonstiges: "bg-zinc-700/50 text-zinc-400",
}

const rechnungStatusBadge: Record<string, string> = {
  offen: "bg-blue-500/20 text-blue-400",
  freigegeben: "bg-amber-500/20 text-amber-400",
  bezahlt: "bg-emerald-500/20 text-emerald-400",
  storniert: "bg-red-500/20 text-red-400",
}

async function getAuftrag(id: string) {
  return prisma.auftrag.findUnique({
    where: { id },
    include: {
      saison: { select: { id: true, name: true } },
      gruppe: { select: { id: true, name: true } },
      protokolle: { orderBy: { datum: "desc" } },
      abnahmen: { orderBy: { datum: "desc" } },
      dokumente: { orderBy: { createdAt: "desc" } },
      rechnungen: { orderBy: { createdAt: "desc" } },
    },
  })
}

export default async function AuftragDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await auth()
  const { id } = await params
  const auftrag = await getAuftrag(id)
  if (!auftrag) notFound()

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/auftraege" className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-6 transition-all">
        <ArrowLeft className="w-4 h-4" /> Zurück zu Aufträge
      </Link>

      {/* Header */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{auftrag.titel}</h1>
              <span className={`px-2 py-0.5 rounded-full text-xs ${statusBadge[auftrag.status] ?? "bg-zinc-700 text-zinc-400"}`}>
                {statusLabel[auftrag.status] ?? auftrag.status}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-zinc-700/50 text-zinc-400">{auftrag.typ}</span>
            </div>
            {auftrag.beschreibung && <p className="text-zinc-400 text-sm mb-3">{auftrag.beschreibung}</p>}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {auftrag.standort && <div><span className="text-zinc-500">Standort</span><p className="text-zinc-300">{auftrag.standort}</p></div>}
              {auftrag.flaeche_ha && <div><span className="text-zinc-500">Fläche</span><p className="text-zinc-300">{auftrag.flaeche_ha} ha</p></div>}
              {auftrag.waldbesitzer && <div><span className="text-zinc-500">Waldbesitzer</span><p className="text-zinc-300">{auftrag.waldbesitzer}</p></div>}
              {auftrag.saison && <div><span className="text-zinc-500">Saison</span><Link href={`/saisons/${auftrag.saison.id}`} className="text-emerald-400 hover:underline">{auftrag.saison.name}</Link></div>}
              {auftrag.gruppe && <div><span className="text-zinc-500">Gruppe</span><Link href={`/gruppen/${auftrag.gruppe.id}`} className="text-emerald-400 hover:underline">{auftrag.gruppe.name}</Link></div>}
              {auftrag.startDatum && <div><span className="text-zinc-500">Start</span><p className="text-zinc-300">{new Date(auftrag.startDatum).toLocaleDateString("de-DE")}</p></div>}
              {auftrag.endDatum && <div><span className="text-zinc-500">Ende</span><p className="text-zinc-300">{new Date(auftrag.endDatum).toLocaleDateString("de-DE")}</p></div>}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">

        {/* Protokolle */}
        <Section title={`Tagesprotokolle (${auftrag.protokolle.length})`} link="/protokolle">
          {auftrag.protokolle.length === 0 ? (
            <p className="text-zinc-600 text-sm">Keine Protokolle</p>
          ) : (
            <table className="w-full">
              <thead><tr className="border-b border-[#2a2a2a]">
                <th className="text-left py-2 text-xs text-zinc-500">Datum</th>
                <th className="text-left py-2 text-xs text-zinc-500">Ersteller</th>
                <th className="text-left py-2 text-xs text-zinc-500">Gepflanzt</th>
                <th className="text-left py-2 text-xs text-zinc-500">Witterung</th>
              </tr></thead>
              <tbody>
                {auftrag.protokolle.map((p) => (
                  <tr key={p.id} className="border-b border-[#2a2a2a] last:border-0">
                    <td className="py-2 text-sm text-zinc-400">{new Date(p.datum).toLocaleDateString("de-DE")}</td>
                    <td className="py-2 text-sm text-zinc-400">{p.ersteller ?? "—"}</td>
                    <td className="py-2 text-sm text-emerald-400">{p.gepflanzt !== null ? `${p.gepflanzt?.toLocaleString()} Stk.` : "—"}</td>
                    <td className="py-2 text-sm text-zinc-400">{p.witterung ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#2a2a2a]">
                  <td colSpan={2} className="py-2 text-xs text-zinc-500 font-medium">Gesamt gepflanzt:</td>
                  <td className="py-2 text-sm font-bold text-emerald-400">{auftrag.protokolle.reduce((s, p) => s + (p.gepflanzt ?? 0), 0).toLocaleString()} Stk.</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}
        </Section>

        {/* Abnahmen */}
        <Section title={`Abnahmen (${auftrag.abnahmen.length})`} link="/abnahmen">
          {auftrag.abnahmen.length === 0 ? (
            <p className="text-zinc-600 text-sm">Keine Abnahmen</p>
          ) : (
            <div className="space-y-2">
              {auftrag.abnahmen.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-[#2a2a2a] last:border-0">
                  <div>
                    <p className="text-sm text-white">{new Date(a.datum).toLocaleDateString("de-DE")}</p>
                    <p className="text-xs text-zinc-500">Förster: {a.foersterId ?? "—"}</p>
                    {a.notizen && <p className="text-xs text-zinc-400 mt-1">{a.notizen}</p>}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${abnahmeBadge[a.status] ?? "bg-zinc-700 text-zinc-400"}`}>
                    {a.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Dokumente */}
        <Section title={`Dokumente (${auftrag.dokumente.length})`} link="/dokumente">
          {auftrag.dokumente.length === 0 ? (
            <p className="text-zinc-600 text-sm">Keine Dokumente</p>
          ) : (
            <div className="space-y-2">
              {auftrag.dokumente.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-2 border-b border-[#2a2a2a] last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${dokTypBadge[d.typ] ?? "bg-zinc-700 text-zinc-400"}`}>{d.typ}</span>
                    <p className="text-sm text-white">{d.name}</p>
                  </div>
                  <a href={d.url} target="_blank" rel="noreferrer" className="text-zinc-600 hover:text-emerald-400">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Rechnungen */}
        <Section title={`Rechnungen (${auftrag.rechnungen.length})`} link="/rechnungen">
          {auftrag.rechnungen.length === 0 ? (
            <p className="text-zinc-600 text-sm">Keine Rechnungen</p>
          ) : (
            <table className="w-full">
              <thead><tr className="border-b border-[#2a2a2a]">
                <th className="text-left py-2 text-xs text-zinc-500">Nummer</th>
                <th className="text-left py-2 text-xs text-zinc-500">Betrag</th>
                <th className="text-left py-2 text-xs text-zinc-500">Status</th>
                <th className="text-left py-2 text-xs text-zinc-500">Fällig</th>
              </tr></thead>
              <tbody>
                {auftrag.rechnungen.map((r) => (
                  <tr key={r.id} className="border-b border-[#2a2a2a] last:border-0">
                    <td className="py-2 text-sm font-mono text-white">{r.nummer}</td>
                    <td className="py-2 text-sm font-medium text-white">{r.betrag.toFixed(2)} €</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${rechnungStatusBadge[r.status] ?? "bg-zinc-700 text-zinc-400"}`}>{r.status}</span>
                    </td>
                    <td className="py-2 text-sm text-zinc-400">{r.faelligAm ? new Date(r.faelligAm).toLocaleDateString("de-DE") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children, link }: { title: string; children: React.ReactNode; link?: string }) {
  return (
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-white">{title}</h2>
        {link && (
          <Link href={link} className="text-xs text-emerald-400 hover:text-emerald-300">
            Alle ansehen →
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}
