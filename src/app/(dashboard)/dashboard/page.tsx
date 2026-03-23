import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Users, Sprout, ClipboardList, TrendingUp } from "lucide-react"

async function getStats() {
  try {
    const [aktiveMitarbeiter, aktuellesSaison] = await Promise.all([
      prisma.mitarbeiter.count({ where: { status: "aktiv" } }),
      prisma.saison.findFirst({ where: { status: "aktiv" }, orderBy: { createdAt: "desc" } }),
    ])
    return { aktiveMitarbeiter, aktuellesSaison }
  } catch {
    return { aktiveMitarbeiter: 0, aktuellesSaison: null }
  }
}

export default async function DashboardPage() {
  const session = await auth()
  const { aktiveMitarbeiter, aktuellesSaison } = await getStats()

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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Aktive Mitarbeiter"
          value={aktiveMitarbeiter.toString()}
          icon={<Users className="w-5 h-5 text-emerald-400" />}
          change="+2 diesen Monat"
        />
        <StatCard
          label="Aktuelle Saison"
          value={aktuellesSaison?.name ?? "Keine aktive Saison"}
          icon={<Sprout className="w-5 h-5 text-emerald-400" />}
          change={aktuellesSaison ? `Status: ${aktuellesSaison.status}` : "Neue Saison anlegen"}
          small
        />
        <StatCard
          label="Offene Aufträge"
          value="–"
          icon={<ClipboardList className="w-5 h-5 text-emerald-400" />}
          change="Modul in Planung"
          disabled
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h2 className="font-semibold text-white">Schnellzugriff</h2>
          </div>
          <div className="space-y-2">
            <QuickLink href="/mitarbeiter" label="Mitarbeiter verwalten" />
            <QuickLink href="/saisons" label="Saisons & Planung" />
            <QuickLink href="/mitarbeiter" label="Mitarbeiter hinzufügen" />
          </div>
        </div>

        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
          <h2 className="font-semibold text-white mb-4">System-Info</h2>
          <div className="space-y-2 text-sm">
            <InfoRow label="Version" value="ForstManager v1.0" />
            <InfoRow label="Mandant" value="Koch Aufforstung GmbH" />
            <InfoRow label="Rolle" value={(session?.user as any)?.role ?? "–"} />
            <InfoRow label="Status" value="✅ Aktiv" />
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
  change,
  disabled,
  small,
}: {
  label: string
  value: string
  icon: React.ReactNode
  change?: string
  disabled?: boolean
  small?: boolean
}) {
  return (
    <div
      className={`bg-[#161616] border border-[#2a2a2a] rounded-xl p-5 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-zinc-400">{label}</span>
        <div className="w-9 h-9 rounded-lg bg-[#2C3A1C]/40 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className={`font-bold text-white ${small ? "text-lg" : "text-2xl"}`}>{value}</p>
      {change && <p className="text-xs text-zinc-500 mt-1">{change}</p>}
    </div>
  )
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="block px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-[#1e1e1e] hover:text-white transition-all"
    >
      → {label}
    </a>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-300">{value}</span>
    </div>
  )
}
