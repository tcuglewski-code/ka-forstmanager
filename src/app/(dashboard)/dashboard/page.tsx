import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Users, Sprout, ClipboardList, TrendingUp, Package, AlertTriangle, Wrench, Clock, BookOpen, CheckSquare, DollarSign, FileText, CalendarClock, UserCheck, Leaf } from "lucide-react"
import Link from "next/link"
import { FoerderungWidget } from "@/components/foerderung/FoerderungWidget"

async function getStats() {
  try {
    const heute = new Date()
    const in30Tagen = new Date(heute.getTime() + 30 * 24 * 60 * 60 * 1000)
    const in7Tagen = new Date(heute.getTime() + 7 * 24 * 60 * 60 * 1000)
    const heuteStart = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate())
    const heuteEnde = new Date(heuteStart.getTime() + 24 * 60 * 60 * 1000)

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
      offeneFoerderantraege,
      faelligeRechnungen7Tage,
      aktiveMitarbeiterHeute,
      saatgutLagerstand,
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
      // Q023: Offene Förderanträge (Angebote mit Status versendet)
      prisma.angebot.count({
        where: { status: "versendet" },
      }),
      // Q023: Fällige Rechnungen in nächsten 7 Tagen
      prisma.rechnung.count({
        where: {
          faelligAm: { lte: in7Tagen, gte: heute },
          status: { not: "bezahlt" },
        },
      }),
      // Q023: Aktive Mitarbeiter heute (mit Stundeneintrag)
      prisma.stundeneintrag.groupBy({
        by: ["mitarbeiterId"],
        where: {
          datum: { gte: heuteStart, lt: heuteEnde },
        },
      }).then(r => r.length),
      // Q023: Saatgut-Lagerstand (Summe Bestand für Kategorie saatgut)
      prisma.lagerArtikel.aggregate({
        where: { kategorie: "saatgut" },
        _sum: { bestand: true },
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
      offeneFoerderantraege,
      faelligeRechnungen7Tage,
      aktiveMitarbeiterHeute,
      saatgutLagerstand: saatgutLagerstand._sum?.bestand ?? 0,
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
      offeneFoerderantraege: 0,
      faelligeRechnungen7Tage: 0,
      aktiveMitarbeiterHeute: 0,
      saatgutLagerstand: 0,
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
  anfrage: "bg-[#dedad0] text-[#4b6457]",
  geprueft: "bg-[#cde9d9] text-[#026c47]",
  angebot: "bg-[#e6e2d8] text-[#3f4942]",
  bestaetigt: "bg-[#f2eee3] text-[#865300]",
  in_ausfuehrung: "bg-[#cde9d9] text-[#026c47]",
  abgeschlossen: "bg-[#e6e2d8] text-[#6f7a72]",
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
        <h1
          className="text-3xl font-extrabold tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-on-surface)" }}
        >
          Guten Tag, {session?.user?.name?.split(" ")[0] ?? "Admin"} 👋
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-on-surface-variant)" }}>{heute}</p>
      </div>

      {/* KI-Insight Karte (immer sichtbar als Demo) */}
      <div
        className="ai-insight-card rounded-xl p-5 mb-6 ambient-shadow"
        style={{ borderLeft: "4px solid var(--color-tertiary)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p
              className="text-xs font-semibold tracking-widest mb-1"
              style={{ color: "var(--color-tertiary)", fontFamily: "var(--font-display)" }}
            >
              ✨ KI-OPTIMIERUNGSVORSCHLAG
            </p>
            <p
              className="text-base font-bold mb-1"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-on-surface)" }}
            >
              Betriebsübersicht analysiert
            </p>
            <p className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
              Alle offenen Aufträge, Stunden und Lagerbestände sind auf dem aktuellen Stand.
            </p>
          </div>
          <span
            className="text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0"
            style={{ backgroundColor: "rgba(134,83,0,0.1)", color: "var(--color-tertiary)" }}
          >
            INFO
          </span>
        </div>
      </div>

      {/* Warnungen */}
      {(stats.ablaufendeQualifikationen > 0 || stats.faelligeWartungen > 0 || stats.lagerUnterMindest > 0) && (
        <div className="mb-6 space-y-2">
          {stats.ablaufendeQualifikationen > 0 && (
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ backgroundColor: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "#d97706" }} />
              <p className="text-sm" style={{ color: "#d97706" }}>
                {stats.ablaufendeQualifikationen} Qualifikation{stats.ablaufendeQualifikationen > 1 ? "en" : ""} läuft in den nächsten 30 Tagen ab
              </p>
            </div>
          )}
          {stats.faelligeWartungen > 0 && (
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ backgroundColor: "rgba(186,26,26,0.08)", border: "1px solid rgba(186,26,26,0.2)" }}
            >
              <Wrench className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-error)" }} />
              <p className="text-sm" style={{ color: "var(--color-error)" }}>
                {stats.faelligeWartungen} fällige Wartung{stats.faelligeWartungen > 1 ? "en" : ""} ausstehend
              </p>
            </div>
          )}
          {stats.lagerUnterMindest > 0 && (
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ backgroundColor: "rgba(234,88,12,0.08)", border: "1px solid rgba(234,88,12,0.2)" }}
            >
              <Package className="w-4 h-4 flex-shrink-0" style={{ color: "#ea580c" }} />
              <p className="text-sm" style={{ color: "#ea580c" }}>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

      {/* Q023: Neue KPI-Reihe */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Offene Förderanträge"
          value={stats.offeneFoerderantraege.toString()}
          icon={<FileText className={`w-5 h-5 ${stats.offeneFoerderantraege > 0 ? "text-blue-400" : "text-emerald-400"}`} />}
          href="/angebote?status=versendet"
          alert={stats.offeneFoerderantraege > 3}
        />
        <StatCard
          label="Fällige Rechnungen (7T)"
          value={stats.faelligeRechnungen7Tage.toString()}
          icon={<CalendarClock className={`w-5 h-5 ${stats.faelligeRechnungen7Tage > 0 ? "text-amber-400" : "text-emerald-400"}`} />}
          href="/rechnungen?faellig=7"
          alert={stats.faelligeRechnungen7Tage > 0}
        />
        <StatCard
          label="Aktiv heute"
          value={stats.aktiveMitarbeiterHeute.toString()}
          icon={<UserCheck className="w-5 h-5 text-emerald-400" />}
          href="/stunden?datum=heute"
        />
        <StatCard
          label="Saatgut Lager (kg)"
          value={stats.saatgutLagerstand.toFixed(1)}
          icon={<Leaf className={`w-5 h-5 ${stats.saatgutLagerstand < 10 ? "text-amber-400" : "text-emerald-400"}`} />}
          href="/lager?kategorie=saatgut"
          alert={stats.saatgutLagerstand < 10}
        />
      </div>

      {/* Wirtschaftlichkeits-Widget */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="rounded-xl p-5 ambient-shadow-md"
          style={{ backgroundColor: "var(--color-surface-container-low)" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: "var(--color-on-surface-variant)", fontFamily: "var(--font-body)" }}
          >
            Gesamtstunden
          </p>
          <p
            className="text-3xl font-bold"
            style={{ fontFamily: "var(--font-mono)", color: "var(--color-on-surface)" }}
          >
            {(stats.stundenGesamt._sum?.stunden ?? 0).toFixed(0)}h
          </p>
        </div>
        <div
          className="rounded-xl p-5 ambient-shadow-md"
          style={{ backgroundColor: "var(--color-surface-container-low)" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: "var(--color-on-surface-variant)", fontFamily: "var(--font-body)" }}
          >
            Gesamtumsatz
          </p>
          <p
            className="text-3xl font-bold"
            style={{ fontFamily: "var(--font-mono)", color: "var(--color-primary)" }}
          >
            {((stats.rechnungenGesamt._sum?.betrag ?? 0)).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
          </p>
        </div>
        <div
          className="rounded-xl p-5 ambient-shadow-md"
          style={{ backgroundColor: "var(--color-surface-container-low)" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: "var(--color-on-surface-variant)", fontFamily: "var(--font-body)" }}
          >
            Geschätzter Lohn
          </p>
          <p
            className="text-3xl font-bold"
            style={{ fontFamily: "var(--font-mono)", color: "var(--color-tertiary)" }}
          >
            {(stats.geschaetzterLohn ?? 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2
          className="text-xs font-semibold mb-3 uppercase tracking-widest"
          style={{ color: "var(--color-outline)", fontFamily: "var(--font-display)" }}
        >
          Schnellzugriff
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "WP-Sync", href: "/auftraege", icon: "🔄", desc: "Aufträge synchronisieren" },
            { label: "Neuer Mitarbeiter", href: "/mitarbeiter", icon: "👤", desc: "Mitarbeiter anlegen" },
            { label: "Neue Saison", href: "/saisons", icon: "🌱", desc: "Saison starten" },
            { label: "Wissensbank", href: "/wissensbank", icon: "📚", desc: "Förderinfo & Betriebe" },
          ].map(action => (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col gap-1 p-4 rounded-xl tonal-transition ambient-shadow-md group"
              style={{ backgroundColor: "var(--color-surface-container-low)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-surface-container)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-surface-container-low)")}
            >
              <span className="text-2xl">{action.icon}</span>
              <span
                className="text-sm font-semibold mt-1"
                style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-display)" }}
              >
                {action.label}
              </span>
              <span className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>{action.desc}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Neueste Aufträge */}
      {stats.neuesteAuftraege.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--color-outline)", fontFamily: "var(--font-display)" }}
            >
              Neueste Aufträge
            </h2>
            <Link
              href="/auftraege"
              className="text-xs font-medium"
              style={{ color: "var(--color-primary)" }}
            >
              Alle anzeigen →
            </Link>
          </div>
          <div
            className="rounded-xl overflow-hidden ambient-shadow-md"
            style={{ backgroundColor: "var(--color-surface-container-low)" }}
          >
            {stats.neuesteAuftraege.map((a, i) => (
              <Link
                key={a.id}
                href={`/auftraege/${a.id}`}
                className="flex items-center justify-between px-4 py-3 tonal-transition"
                style={i > 0 ? { borderTop: "1px solid var(--color-surface-container-high)" } : {}}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--color-surface-container)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <div>
                  <p
                    className="text-sm font-medium truncate max-w-xs"
                    style={{ color: "var(--color-on-surface)" }}
                  >
                    {a.titel}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-on-surface-variant)" }}>
                    {a.waldbesitzer || "—"} · {a.bundesland || "—"}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    a.status === "abgeschlossen" ? "bg-[#e6e2d8] text-[#3f4942]" :
                    a.status === "laufend" ? "bg-[#cde9d9] text-[#026c47]" :
                    "bg-[#dedad0] text-[#4b6457]"
                  }`}
                >
                  {a.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Letzte Aktivitäten */}
      {(stats.letzteProtokolle.length > 0 || stats.letzteAbnahmen.length > 0) && (
        <div className="mt-6">
          <h2
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--color-outline)", fontFamily: "var(--font-display)" }}
          >
            Letzte Aktivitäten
          </h2>
          <div
            className="rounded-xl overflow-hidden ambient-shadow-md"
            style={{ backgroundColor: "var(--color-surface-container-low)" }}
          >
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
                <Link
                  key={i}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 tonal-transition"
                  style={i > 0 ? { borderTop: "1px solid var(--color-surface-container-high)" } : {}}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--color-surface-container)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <span className="text-lg">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm truncate" style={{ color: "var(--color-on-surface)" }}>{item.text}</p>
                    <p className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>{item.sub}</p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {/* Auftrags-Status */}
        <div
          className="rounded-xl p-6 ambient-shadow-md"
          style={{ backgroundColor: "var(--color-surface-container-low)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
            <h2
              className="font-semibold"
              style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-display)" }}
            >
              Auftrags-Status
            </h2>
          </div>
          {stats.auftragStatusVerteilung.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--color-outline)" }}>Keine Aufträge</p>
          ) : (
            <div className="space-y-2">
              {stats.auftragStatusVerteilung.map((s) => (
                <div key={s.status} className="flex items-center justify-between">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: "var(--color-secondary-container)",
                      color: "var(--color-on-secondary-container)",
                    }}
                  >
                    {STATUS_LABELS[s.status] ?? s.status}
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{ fontFamily: "var(--font-mono)", color: "var(--color-on-surface)" }}
                  >
                    {s._count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nächste Schulungen */}
        <div
          className="rounded-xl p-6 ambient-shadow-md"
          style={{ backgroundColor: "var(--color-surface-container-low)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
            <h2
              className="font-semibold"
              style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-display)" }}
            >
              Nächste Schulungen
            </h2>
          </div>
          {stats.naechsteSchulungen.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--color-outline)" }}>Keine Schulungen geplant</p>
          ) : (
            <div className="space-y-3">
              {stats.naechsteSchulungen.map((s) => (
                <Link
                  key={s.id}
                  href={`/schulungen/${s.id}`}
                  className="block rounded-lg p-2 -mx-2 tonal-transition"
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--color-surface-container)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs"
                      style={{
                        backgroundColor: "var(--color-surface-container-high)",
                        color: "var(--color-on-surface-variant)",
                      }}
                    >
                      {s.typ}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: "var(--color-on-surface)" }}>{s.titel}</p>
                  {s.datum && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-on-surface-variant)" }}>
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
        <div
          className="rounded-xl p-6 ambient-shadow-md"
          style={{ backgroundColor: "var(--color-surface-container-low)" }}
        >
          <h2
            className="font-semibold mb-4"
            style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-display)" }}
          >
            Schnellzugriff
          </h2>
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
    <Link
      href={href}
      className="block rounded-xl p-5 tonal-transition ambient-shadow-md"
      style={{
        backgroundColor: alert ? "rgba(186,26,26,0.05)" : "var(--color-surface-container-low)",
        outline: alert ? "1px solid rgba(186,26,26,0.2)" : "none",
      }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = alert ? "rgba(186,26,26,0.08)" : "var(--color-surface-container)")}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = alert ? "rgba(186,26,26,0.05)" : "var(--color-surface-container-low)")}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: "var(--color-on-surface-variant)" }}
        >
          {label}
        </span>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: alert ? "rgba(186,26,26,0.1)" : "var(--color-secondary-container)" }}
        >
          {icon}
        </div>
      </div>
      <p
        className="text-3xl font-bold"
        style={{
          fontFamily: "var(--font-mono)",
          color: alert ? "var(--color-error)" : "var(--color-on-surface)",
        }}
      >
        {value}
      </p>
    </Link>
  )
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block px-3 py-2 rounded-lg text-sm tonal-transition"
      style={{ color: "var(--color-on-surface-variant)" }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-surface-container)"
        ;(e.currentTarget as HTMLElement).style.color = "var(--color-primary)"
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLElement).style.backgroundColor = "transparent"
        ;(e.currentTarget as HTMLElement).style.color = "var(--color-on-surface-variant)"
      }}
    >
      {label}
    </Link>
  )
}
