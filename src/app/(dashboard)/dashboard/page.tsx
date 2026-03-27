import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Users, Sprout, ClipboardList, TrendingUp, Package, AlertTriangle, Wrench, Clock, BookOpen, CheckSquare, DollarSign } from "lucide-react"
import Link from "next/link"
import { FoerderungWidget } from "@/components/foerderung/FoerderungWidget"

async function getStats() {
  try {
    const heute = new Date()
    const in30Tagen = new Date(heute.getTime() + 30 * 24 * 60 * 60 * 1000)

    const [
      aktiveMitarbeiter,
      aktiveSaisons,
      offeneAuftraege,
      auftragStatusVerteilung,
      lagerUnterMindest,
      ablaufendeQualifikationen,
      faelligeWartungen,
      naechsteSchulungen,
      offeneAbnahmen,
      stundenAusstehend,
      vorschuessOffen,
    ] = await Promise.all([
      prisma.mitarbeiter.count({ where: { status: "aktiv" } }),
      prisma.saison.count({ where: { status: "aktiv" } }),
      prisma.auftrag.count({ where: { status: { notIn: ["abgeschlossen"] } } }),
      prisma.auftrag.groupBy({ by: ["status"], _count: true }),
      prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*)::int as count FROM "LagerArtikel" WHERE bestand < mindestbestand`
        .then(r => Number(r[0]?.count ?? 0))
        .catch(() => 0),
      prisma.mitarbeiterQualifikation.count({
        where: { ablaufDatum: { lte: in30Tagen, gte: heute } },
      }),
      prisma.wartung.count({ where: { erledigt: false, datum: { lte: heute } } }),
      prisma.schulung.findMany({
        where: { datum: { gte: heute }, status: { not: "abgeschlossen" } },
        orderBy: { datum: "asc" },
        take: 3,
        select: { id: true, titel: true, datum: true, typ: true },
      }),
      prisma.abnahme.count({ where: { status: "offen" } }),
      prisma.stundeneintrag.count({ where: { genehmigt: false } }),
      prisma.vorschuss.aggregate({
        where: { genehmigt: false },
        _sum: { betrag: true },
      }),
    ])

    const neuesteAuftraege = await prisma.auftrag.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, titel: true, status: true, waldbesitzer: true, createdAt: true, bundesland: true }
    })

    // Letzte Aktivitäten (aus verschiedenen Tabellen)
    const letzteProtokolle = await prisma.tagesprotokoll.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        datum: true,
        ersteller: true,
        auftrag: { select: { titel: true, id: true } }
      }
    })

    const letzteAbnahmen = await prisma.abnahme.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        datum: true,
        status: true,
        auftrag: { select: { titel: true, id: true } }
      }
    })

    // Wirtschaftlichkeits-Kalkulation
    const stundenGesamt = await prisma.stundeneintrag.aggregate({
      _sum: { stunden: true }
    })
    const rechnungenGesamt = await prisma.rechnung.aggregate({
      _sum: { betrag: true }
    })
    const mitarbeiterLohn = await prisma.mitarbeiter.aggregate({
      _avg: { stundenlohn: true }
    })
    const durchschnittslohn = mitarbeiterLohn._avg?.stundenlohn ?? 12
    const geschaetzterLohn = (stundenGesamt._sum?.stunden ?? 0) * durchschnittslohn

    return {
      aktiveMitarbeiter,
      aktiveSaisons,
      offeneAuftraege,
      auftragStatusVerteilung,
      lagerUnterMindest,
      ablaufendeQualifikationen,
      faelligeWartungen,
      naechsteSchulungen,
      offeneAbnahmen,
      stundenAusstehend,
      vorschuessOffen: vorschuessOffen._sum.betrag ?? 0,
      neuesteAuftraege,
      letzteProtokolle,
      letzteAbnahmen,
      stundenGesamt,
      rechnungenGesamt,
      geschaetzterLohn,
    }
  } catch {
    return {
      aktiveMitarbeiter: 0,
      aktiveSaisons: 0,
      offeneAuftraege: 0,
      auftragStatusVerteilung: [],
      lagerUnterMindest: 0,
      ablaufendeQualifikationen: 0,
      faelligeWartungen: 0,
      naechsteSchulungen: [],
      offeneAbnahmen: 0,
      stundenAusstehend: 0,
      vorschuessOffen: 0,
      neuesteAuftraege: [],
      letzteProtokolle: [] as { id: string; datum: Date | string; ersteller: string | null; auftrag: { titel: string; id: string } | null }[],
      letzteAbnahmen: [] as { id: string; datum: Date | string; status: string; auftrag: { titel: string; id: string } | null }[],
      stundenGesamt: { _sum: { stunden: 0 } },
      rechnungenGesamt: { _sum: { betrag: 0 } },
      geschaetzterLohn: 0,
    }
  }
}

const STATUS_LABELS: Record<string, string> = {
  anfrage: "Anfrage",
  geprueft: "Geprüft",
  angebot: "Angebot",
  bestaetigt: "Bestätigt",
  in_ausfuehrung: "In Ausführung",
  abgeschlossen: "Abgeschlossen",
}

const STATUS_FARBEN: Record<string, string> = {
  anfrage: "bg-blue-500/20 text-blue-400",
  geprueft: "bg-sky-500/20 text-sky-400",
  angebot: "bg-violet-500/20 text-violet-400",
  bestaetigt: "bg-amber-500/20 text-amber-400",
  in_ausfuehrung: "bg-emerald-500/20 text-emerald-400",
  abgeschlossen: "bg-zinc-500/20 text-zinc-400",
}

const SCHULUNG_TYP: Record<string, string> = {
  pflicht: "bg-red-500/20 text-red-400",
  freiwillig: "bg-blue-500/20 text-blue-400",
  auffrischung: "bg-amber-500/20 text-amber-400",
}

export default async function DashboardPage() {
  const session = await auth()
  const stats = await getStats()

  const heute = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="max-w-6xl mx-auto">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Guten Tag, {session?.user?.name?.split(" ")[0] ?? "Admin"} 👋
        </h1>
        <p className="text-zinc-500 mt-1">{heute}</p>
      </div>

      {/* Warnungen */}
      {(stats.ablaufendeQualifikationen > 0 || stats.faelligeWartungen > 0 || stats.lagerUnterMindest > 0) && (
        <div className="mb-6 space-y-2">
          {stats.ablaufendeQualifikationen > 0 && (
            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-400">
                {stats.ablaufendeQualifikationen} Qualifikation{stats.ablaufendeQualifikationen > 1 ? "en" : ""} läuft in den nächsten 30 Tagen ab
              </p>
            </div>
          )}
          {stats.faelligeWartungen > 0 && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              <Wrench className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">
                {stats.faelligeWartungen} fällige Wartung{stats.faelligeWartungen > 1 ? "en" : ""} ausstehend
              </p>
            </div>
          )}
          {stats.lagerUnterMindest > 0 && (
            <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/20 rounded-lg px-4 py-3">
              <Package className="w-4 h-4 text-orange-400 flex-shrink-0" />
              <p className="text-sm text-orange-400">
                {stats.lagerUnterMindest} Lagerartikel unter Mindestbestand
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Aktive Mitarbeiter" value={stats.aktiveMitarbeiter.toString()} icon={<Users className="w-5 h-5 text-emerald-400" />} href="/mitarbeiter" />
        <StatCard label="Aktive Saisons" value={stats.aktiveSaisons.toString()} icon={<Sprout className="w-5 h-5 text-emerald-400" />} href="/saisons" />
        <StatCard label="Offene Aufträge" value={stats.offeneAuftraege.toString()} icon={<ClipboardList className="w-5 h-5 text-emerald-400" />} href="/auftraege" />
        <StatCard label="Lager-Alerts" value={stats.lagerUnterMindest.toString()} icon={<Package className={`w-5 h-5 ${stats.lagerUnterMindest > 0 ? "text-red-400" : "text-emerald-400"}`} />} href="/lager" alert={stats.lagerUnterMindest > 0} />
      </div>

      {/* New Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Offene Abnahmen"
          value={stats.offeneAbnahmen.toString()}
          icon={<CheckSquare className={`w-5 h-5 ${stats.offeneAbnahmen > 0 ? "text-amber-400" : "text-emerald-400"}`} />}
          href="/abnahmen"
          alert={stats.offeneAbnahmen > 0}
        />
        <StatCard
          label="Stunden ausstehend"
          value={stats.stundenAusstehend.toString()}
          icon={<Clock className={`w-5 h-5 ${stats.stundenAusstehend > 0 ? "text-amber-400" : "text-emerald-400"}`} />}
          href="/stunden?genehmigt=false"
          alert={stats.stundenAusstehend > 0}
        />
        <StatCard
          label="Vorschüsse offen"
          value={`${stats.vorschuessOffen.toFixed(0)} €`}
          icon={<DollarSign className={`w-5 h-5 ${stats.vorschuessOffen > 0 ? "text-amber-400" : "text-emerald-400"}`} />}
          href="/vorschuesse"
          alert={stats.vorschuessOffen > 0}
        />
        <StatCard
          label="Qual. ablaufend"
          value={stats.ablaufendeQualifikationen.toString()}
          icon={<AlertTriangle className={`w-5 h-5 ${stats.ablaufendeQualifikationen > 0 ? "text-amber-400" : "text-emerald-400"}`} />}
          href="/qualifikationen"
          alert={stats.ablaufendeQualifikationen > 0}
        />
      </div>

      {/* Wirtschaftlichkeits-Widget */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Gesamtstunden</p>
          <p className="text-2xl font-bold text-white">{(stats.stundenGesamt._sum?.stunden ?? 0).toFixed(0)}h</p>
        </div>
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Gesamtumsatz</p>
          <p className="text-2xl font-bold text-emerald-400">{((stats.rechnungenGesamt._sum?.betrag ?? 0)).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</p>
        </div>
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Geschätzter Lohn</p>
          <p className="text-2xl font-bold text-amber-400">{(stats.geschaetzterLohn ?? 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Schnellzugriff</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "WP-Sync", href: "/auftraege", icon: "🔄", desc: "Aufträge synchronisieren" },
            { label: "Neuer Mitarbeiter", href: "/mitarbeiter", icon: "👤", desc: "Mitarbeiter anlegen" },
            { label: "Neue Saison", href: "/saisons", icon: "🌱", desc: "Saison starten" },
            { label: "Wissensbank", href: "/wissensbank", icon: "📚", desc: "Förderinfo & Betriebe" },
          ].map(action => (
            <Link key={action.label} href={action.href}
              className="flex flex-col gap-1 p-4 bg-[#161616] border border-[#2a2a2a] rounded-xl hover:border-emerald-500/30 hover:bg-[#1a1a1a] transition-all group">
              <span className="text-2xl">{action.icon}</span>
              <span className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">{action.label}</span>
              <span className="text-xs text-zinc-500">{action.desc}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Neueste Aufträge */}
      {stats.neuesteAuftraege.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Neueste Aufträge</h2>
            <Link href="/auftraege" className="text-xs text-emerald-500 hover:text-emerald-400">Alle anzeigen →</Link>
          </div>
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
            {stats.neuesteAuftraege.map((a, i) => (
              <Link key={a.id} href={`/auftraege/${a.id}`}
                className={`flex items-center justify-between px-4 py-3 hover:bg-[#1e1e1e] transition-colors ${i > 0 ? "border-t border-[#2a2a2a]" : ""}`}>
                <div>
                  <p className="text-sm text-white font-medium truncate max-w-xs">{a.titel}</p>
                  <p className="text-xs text-zinc-500">{a.waldbesitzer || "—"} · {a.bundesland || "—"}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  a.status === "abgeschlossen" ? "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" :
                  a.status === "laufend" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                  "bg-blue-500/20 text-blue-400 border-blue-500/30"
                }`}>{a.status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Letzte Aktivitäten */}
      {(stats.letzteProtokolle.length > 0 || stats.letzteAbnahmen.length > 0) && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Letzte Aktivitäten</h2>
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
            {[
              ...stats.letzteProtokolle.map(p => ({
                type: "protokoll" as const,
                icon: "📋",
                text: `Protokoll: ${p.auftrag?.titel?.slice(0, 30) || "Unbekannt"}`,
                sub: `${p.ersteller || "—"} · ${new Date(p.datum).toLocaleDateString("de-DE")}`,
                href: p.auftrag ? `/auftraege/${p.auftrag.id}` : "#",
                ts: new Date(p.datum)
              })),
              ...stats.letzteAbnahmen.map(a => ({
                type: "abnahme" as const,
                icon: "✅",
                text: `Abnahme: ${a.auftrag?.titel?.slice(0, 30) || "Unbekannt"}`,
                sub: `Status: ${a.status} · ${new Date(a.datum).toLocaleDateString("de-DE")}`,
                href: a.auftrag ? `/auftraege/${a.auftrag.id}` : "#",
                ts: new Date(a.datum)
              }))
            ]
              .sort((a, b) => b.ts.getTime() - a.ts.getTime())
              .slice(0, 6)
              .map((item, i) => (
                <Link key={i} href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-[#1e1e1e] transition-colors ${i > 0 ? "border-t border-[#2a2a2a]" : ""}`}>
                  <span className="text-lg">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{item.text}</p>
                    <p className="text-xs text-zinc-500">{item.sub}</p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {/* Auftrags-Status */}
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h2 className="font-semibold text-white">Auftrags-Status</h2>
          </div>
          {stats.auftragStatusVerteilung.length === 0 ? (
            <p className="text-zinc-600 text-sm">Keine Aufträge</p>
          ) : (
            <div className="space-y-2">
              {stats.auftragStatusVerteilung.map((s) => (
                <div key={s.status} className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_FARBEN[s.status] ?? "bg-zinc-700 text-zinc-300"}`}>
                    {STATUS_LABELS[s.status] ?? s.status}
                  </span>
                  <span className="text-sm text-zinc-400 font-medium">{s._count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nächste Schulungen */}
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h2 className="font-semibold text-white">Nächste Schulungen</h2>
          </div>
          {stats.naechsteSchulungen.length === 0 ? (
            <p className="text-zinc-600 text-sm">Keine Schulungen geplant</p>
          ) : (
            <div className="space-y-3">
              {stats.naechsteSchulungen.map((s) => (
                <Link key={s.id} href={`/schulungen/${s.id}`} className="block hover:bg-[#1e1e1e] rounded-lg p-2 -mx-2 transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${SCHULUNG_TYP[s.typ] ?? "bg-zinc-700 text-zinc-400"}`}>
                      {s.typ}
                    </span>
                  </div>
                  <p className="text-sm text-white">{s.titel}</p>
                  {s.datum && (
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {new Date(s.datum).toLocaleDateString("de-DE")}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Förderprogramme Widget */}
        <FoerderungWidget />

        {/* Schnellzugriff */}
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
          <h2 className="font-semibold text-white mb-4">Schnellzugriff</h2>
          <div className="space-y-1.5">
            <QuickLink href="/auftraege" label="→ Aufträge" />
            <QuickLink href="/gruppen" label="→ Gruppen" />
            <QuickLink href="/mitarbeiter" label="→ Mitarbeiter" />
            <QuickLink href="/stunden" label="→ Stunden" />
            <QuickLink href="/lager" label="→ Lager" />
            <QuickLink href="/rechnungen" label="→ Rechnungen" />
            <QuickLink href="/reports" label="→ Reports" />
            <QuickLink href="/einstellungen" label="→ Einstellungen" />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, href, alert }: { label: string; value: string; icon: React.ReactNode; href: string; alert?: boolean }) {
  return (
    <Link href={href} className={`block bg-[#161616] border rounded-xl p-5 hover:border-zinc-500 transition-all ${alert ? "border-red-500/30" : "border-[#2a2a2a]"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-zinc-400">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${alert ? "bg-red-500/10" : "bg-[#2C3A1C]/40"}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </Link>
  )
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="block px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-[#1e1e1e] hover:text-white transition-all">
      {label}
    </Link>
  )
}
