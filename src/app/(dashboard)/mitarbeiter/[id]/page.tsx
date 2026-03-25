import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, User, MapPin, Phone, Mail, CreditCard, AlertTriangle } from "lucide-react"
import { Breadcrumb } from "@/components/layout/Breadcrumb"
import { StatistikWidget } from "./StatistikWidget"
import { AbwesenheitenSection } from "./AbwesenheitenSection"

// Sprint Q: RolleBadge Komponente
function RolleBadge({ rolle }: { rolle: string }) {
  if (rolle === "gf_senior" || rolle === "ka_admin") {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/40">🏅 Senior GF</span>
  }
  if (rolle === "gf_standard" || rolle === "gruppenführer" || rolle === "ka_gruppenführer" || rolle === "gruppenfuehrer") {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-500/20 text-zinc-300 border border-zinc-500/40">👷 Gruppenführer</span>
  }
  if (rolle === "admin") {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">Admin</span>
  }
  if (rolle === "buero") {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">Büro</span>
  }
  if (rolle === "ka_mitarbeiter" || rolle === "mitarbeiter") {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">Mitarbeiter</span>
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs text-zinc-500 border border-zinc-700">{rolle}</span>
}

const statusBadge: Record<string, string> = {
  aktiv: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  inaktiv: "bg-red-500/20 text-red-400 border-red-500/30",
  beurlaubt: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
}

async function getMitarbeiter(id: string) {
  return prisma.mitarbeiter.findUnique({
    where: { id },
    include: {
      qualifikationenRel: { include: { qualifikation: true } },
      schulungen: { include: { schulung: true } },
      stundeneintraege: { orderBy: { datum: "desc" }, take: 20 },
      lohneintraege: { orderBy: [{ jahr: "desc" }, { monat: "desc" }], take: 12 },
      abwesenheiten: { orderBy: { von: "desc" }, take: 10 },
      gruppen: { include: { gruppe: { select: { id: true, name: true } } } },
    },
  })
}

async function getSaisons() {
  return prisma.saison.findMany({ select: { id: true, name: true }, orderBy: { startDatum: "desc" } })
}

export default async function MitarbeiterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await auth()
  const { id } = await params
  const [ma, saisons] = await Promise.all([getMitarbeiter(id), getSaisons()])
  if (!ma) notFound()

  const tabs = [
    { key: "stammdaten", label: "Stammdaten" },
    { key: "qualifikationen", label: "Qualifikationen" },
    { key: "schulungen", label: "Schulungen" },
    { key: "stunden", label: "Stunden" },
    { key: "lohn", label: "Lohn" },
    { key: "abwesenheiten", label: "Abwesenheiten" },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <Breadcrumb items={[{ label: "Mitarbeiter", href: "/mitarbeiter" }, { label: `${ma.vorname} ${ma.nachname}` }]} />
      <Link href="/mitarbeiter" className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-6 transition-all">
        <ArrowLeft className="w-4 h-4" /> Zurück zu Mitarbeiter
      </Link>

      {/* Profil Header */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#2C3A1C] flex items-center justify-center flex-shrink-0">
            <User className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{ma.vorname} {ma.nachname}</h1>
              <RolleBadge rolle={ma.rolle} />
              <span className={`px-2 py-0.5 rounded-full text-xs border ${statusBadge[ma.status] ?? "bg-zinc-700 text-zinc-400"}`}>{ma.status}</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
              {ma.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {ma.email}</span>}
              {ma.telefon && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {ma.telefon}</span>}
              {ma.ort && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ma.ort}</span>}
              {ma.stundenlohn && <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> {ma.stundenlohn} €/h</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Notfallkontakt (Sprint U) */}
      {(ma.notfallName || ma.notfallTelefon) && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-4">
          <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Notfallkontakt
          </h4>
          <p className="text-sm font-medium text-white">{ma.notfallName}</p>
          {ma.notfallBeziehung && <p className="text-xs text-zinc-400">{ma.notfallBeziehung}</p>}
          {ma.notfallTelefon && (
            <a
              href={`tel:${ma.notfallTelefon}`}
              className="text-sm text-blue-400 hover:underline mt-1 block"
            >
              📞 {ma.notfallTelefon}
            </a>
          )}
        </div>
      )}

      {/* Sprint R: Statistik-Widget */}
      <StatistikWidget mitarbeiterId={ma.id} saisons={saisons} />

      {/* Content Sections */}
      <div className="space-y-6">

        {/* Stammdaten */}
        <Section title="Stammdaten">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Vorname" value={ma.vorname} />
            <Field label="Nachname" value={ma.nachname} />
            <Field label="E-Mail" value={ma.email} />
            <Field label="Telefon" value={ma.telefon} />
            <Field label="Mobil" value={ma.mobil} />
            <Field label="Adresse" value={ma.adresse} />
            <Field label="PLZ / Ort" value={[ma.plz, ma.ort].filter(Boolean).join(" ")} />
            <Field label="Geburtsdatum" value={ma.geburtsdatum ? new Date(ma.geburtsdatum).toLocaleDateString("de-DE") : null} />
            <Field label="Eintrittsdatum" value={ma.eintrittsdatum ? new Date(ma.eintrittsdatum).toLocaleDateString("de-DE") : null} />
            <Field label="Stundenlohn" value={ma.stundenlohn ? `${ma.stundenlohn} €/h` : null} />
            <Field label="Bankname" value={ma.bankname} />
            <Field label="IBAN" value={ma.iban} />
            <Field label="Notfallkontakt (alt)" value={ma.notfallkontakt} />
            <Field label="Notfalltelefon (alt)" value={ma.notfalltelefon} />
            <Field label="Notfallkontakt Name" value={ma.notfallName} />
            <Field label="Notfall Beziehung" value={ma.notfallBeziehung} />
            <Field label="Notfall Telefon" value={ma.notfallTelefon} />
          </div>
          {ma.notizen && (
            <div className="mt-4">
              <p className="text-xs text-zinc-500 mb-1">Notizen</p>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{ma.notizen}</p>
            </div>
          )}
        </Section>

        {/* Qualifikationen */}
        <Section title={`Qualifikationen (${ma.qualifikationenRel.length})`} link="/qualifikationen">
          {ma.qualifikationenRel.length === 0 ? (
            <p className="text-zinc-600 text-sm">Keine Qualifikationen</p>
          ) : (
            <div className="space-y-2">
              {ma.qualifikationenRel.map((q) => {
                const heute = new Date()
                const ablauf = q.ablaufDatum ? new Date(q.ablaufDatum) : null
                const abgelaufen = ablauf && ablauf < heute
                const kritisch = ablauf && !abgelaufen && (ablauf.getTime() - heute.getTime()) < 30 * 24 * 60 * 60 * 1000
                return (
                  <div key={q.id} className="flex items-center justify-between py-2 border-b border-[#2a2a2a] last:border-0">
                    <div>
                      <p className="text-sm text-white">{q.qualifikation.name}</p>
                      <p className="text-xs text-zinc-500">{q.qualifikation.typ}</p>
                    </div>
                    <div className="text-right">
                      {q.erworbenAm && <p className="text-xs text-zinc-500">Erworben: {new Date(q.erworbenAm).toLocaleDateString("de-DE")}</p>}
                      {ablauf && (
                        <p className={`text-xs ${abgelaufen ? "text-red-400" : kritisch ? "text-amber-400" : "text-zinc-500"}`}>
                          Ablauf: {ablauf.toLocaleDateString("de-DE")}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Section>

        {/* Schulungen */}
        <Section title={`Schulungen (${ma.schulungen.length})`} link="/schulungen">
          {ma.schulungen.length === 0 ? (
            <p className="text-zinc-600 text-sm">Keine Schulungen</p>
          ) : (
            <div className="space-y-2">
              {ma.schulungen.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-[#2a2a2a] last:border-0">
                  <div>
                    <p className="text-sm text-white">{s.schulung.titel}</p>
                    <p className="text-xs text-zinc-500">{s.schulung.typ} • {s.schulung.datum ? new Date(s.schulung.datum).toLocaleDateString("de-DE") : "—"}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${s.status === "abgeschlossen" ? "bg-emerald-500/20 text-emerald-400" : s.status === "abgebrochen" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Stunden */}
        <Section title={`Stunden (letzte 20)`} link={`/stunden?mitarbeiterId=${ma.id}`}>
          {ma.stundeneintraege.length === 0 ? (
            <p className="text-zinc-600 text-sm">Keine Stundeneinträge</p>
          ) : (
            <table className="w-full">
              <thead><tr className="border-b border-[#2a2a2a]">
                <th className="text-left py-2 text-xs text-zinc-500">Datum</th>
                <th className="text-left py-2 text-xs text-zinc-500">Stunden</th>
                <th className="text-left py-2 text-xs text-zinc-500">Typ</th>
                <th className="text-left py-2 text-xs text-zinc-500">Status</th>
              </tr></thead>
              <tbody>
                {ma.stundeneintraege.map((s) => (
                  <tr key={s.id} className="border-b border-[#2a2a2a] last:border-0">
                    <td className="py-2 text-sm text-zinc-400">{new Date(s.datum).toLocaleDateString("de-DE")}</td>
                    <td className="py-2 text-sm font-medium text-emerald-400">{s.stunden} h</td>
                    <td className="py-2 text-sm text-zinc-400">{s.typ}</td>
                    <td className="py-2">
                      <span className={`text-xs ${s.genehmigt ? "text-emerald-400" : "text-amber-400"}`}>
                        {s.genehmigt ? "✓" : "○"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* Lohn */}
        <Section title="Lohn (letzte 12 Monate)" link="/lohn">
          {ma.lohneintraege.length === 0 ? (
            <p className="text-zinc-600 text-sm">Keine Lohneinträge</p>
          ) : (
            <table className="w-full">
              <thead><tr className="border-b border-[#2a2a2a]">
                <th className="text-left py-2 text-xs text-zinc-500">Monat/Jahr</th>
                <th className="text-left py-2 text-xs text-zinc-500">Stunden</th>
                <th className="text-left py-2 text-xs text-zinc-500">Brutto</th>
                <th className="text-left py-2 text-xs text-zinc-500">Ausgezahlt</th>
              </tr></thead>
              <tbody>
                {ma.lohneintraege.map((l) => (
                  <tr key={l.id} className="border-b border-[#2a2a2a] last:border-0">
                    <td className="py-2 text-sm text-zinc-400">{l.monat}/{l.jahr}</td>
                    <td className="py-2 text-sm text-zinc-400">{l.stunden} h</td>
                    <td className="py-2 text-sm font-medium text-white">{l.brutto.toFixed(2)} €</td>
                    <td className="py-2">
                      <span className={`text-xs ${l.ausgezahlt ? "text-emerald-400" : "text-amber-400"}`}>
                        {l.ausgezahlt ? "Ja" : "Nein"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* Abwesenheiten (Sprint S: interaktive Client-Komponente) */}
        <Section title={`Abwesenheiten`} link="/stunden">
          <AbwesenheitenSection
            mitarbeiterId={ma.id}
            initialAbwesenheiten={ma.abwesenheiten.map(a => ({
              id: a.id,
              von: a.von.toISOString(),
              bis: a.bis.toISOString(),
              typ: a.typ,
              genehmigt: a.genehmigt,
              notiz: a.notiz,
            }))}
          />
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

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
      <p className="text-sm text-zinc-300">{value ?? "—"}</p>
    </div>
  )
}
