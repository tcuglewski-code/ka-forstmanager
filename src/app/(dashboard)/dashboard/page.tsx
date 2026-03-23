import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Users, Sprout, ClipboardList, TrendingUp, Package, AlertTriangle, Wrench } from "lucide-react"
import Link from "next/link"

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
    ])

    return {
      aktiveMitarbeiter,
      aktiveSaisons,
      offeneAuftraege,
      auftragStatusVerteilung,
      lagerUnterMindest,
      ablaufendeQualifikationen,
      faelligeWartungen,
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Aktive Mitarbeiter"
          value={stats.aktiveMitarbeiter.toString()}
          icon={<Users className="w-5 h-5 text-emerald-400" />}
          href="/mitarbeiter"
        />
        <StatCard
          label="Aktive Saisons"
          value={stats.aktiveSaisons.toString()}
          icon={<Sprout className="w-5 h-5 text-emerald-400" />}
          href="/saisons"
        />
        <StatCard
          label="Offene Aufträge"
          value={stats.offeneAuftraege.toString()}
          icon={<ClipboardList className="w-5 h-5 text-emerald-400" />}
          href="/auftraege"
        />
        <StatCard
          label="Lager-Alerts"
          value={stats.lagerUnterMindest.toString()}
          icon={<Package className={`w-5 h-5 ${stats.lagerUnterMindest > 0 ? "text-red-400" : "text-emerald-400"}`} />}
          href="/lager"
          alert={stats.lagerUnterMindest > 0}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Auftrags-Status Verteilung */}
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h2 className="font-semibold text-white">Auftrags-Status</h2>
          </div>
          {stats.auftragStatusVerteilung.length === 0 ? (
            <p className="text-zinc-600 text-sm">Keine Aufträge vorhanden</p>
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

        {/* Schnellzugriff */}
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
          <h2 className="font-semibold text-white mb-4">Schnellzugriff</h2>
          <div className="space-y-1.5">
            <QuickLink href="/auftraege" label="→ Aufträge verwalten" />
            <QuickLink href="/gruppen" label="→ Gruppen verwalten" />
            <QuickLink href="/mitarbeiter" label="→ Mitarbeiter verwalten" />
            <QuickLink href="/lager" label="→ Lager & Bestände" />
            <QuickLink href="/fuhrpark" label="→ Fuhrpark & Geräte" />
            <QuickLink href="/lohn" label="→ Lohnabrechnungen" />
            <QuickLink href="/kontakte" label="→ Kontakte & Förster" />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  href,
  alert,
}: {
  label: string
  value: string
  icon: React.ReactNode
  href: string
  alert?: boolean
}) {
  return (
    <Link href={href} className={`block bg-[#161616] border rounded-xl p-5 hover:border-zinc-500 transition-all ${alert ? "border-red-500/30" : "border-[#2a2a2a]"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-zinc-400">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${alert ? "bg-red-500/10" : "bg-[#2C3A1C]/40"}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </Link>
  )
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-[#1e1e1e] hover:text-white transition-all"
    >
      {label}
    </Link>
  )
}
