"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft, ExternalLink, Save, Phone, Mail, User, TreePine, MapPin, Calendar,
  FileText, Shield, Sprout, Scissors, Package, Layers, Info, BadgeCheck, ChevronRight
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { PflanzverbandVorschau } from "@/components/auftraege/PflanzverbandVorschau"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Saison { id: string; name: string }
interface Gruppe { id: string; name: string }

interface FlaecheVorbereitung {
  nr: number
  ha: string
  aufwuchsarten?: string
  methode?: string
  hangneigung?: string
  zugaenglichkeit?: string
  besonderheiten?: string
  forstamt?: string
  revier?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WizardDaten = Record<string, any>

interface Auftrag {
  id: string
  titel: string
  typ: string
  status: string
  beschreibung?: string | null
  flaeche_ha?: number | null
  standort?: string | null
  bundesland?: string | null
  waldbesitzer?: string | null
  waldbesitzerEmail?: string | null
  waldbesitzerTelefon?: string | null
  baumarten?: string | null
  zeitraum?: string | null
  notizen?: string | null
  neuFlag?: boolean
  wpProjektId?: string | null
  saisonId?: string | null
  gruppeId?: string | null
  saison?: { id: string; name: string } | null
  gruppe?: { id: string; name: string } | null
  startDatum?: string | null
  endDatum?: string | null
  createdAt: string
  wizardDaten?: WizardDaten | null
  protokolle?: { id: string; datum: string; gepflanzt?: number | null; witterung?: string | null; ersteller?: string | null }[]
  abnahmen?: { id: string; datum: string; status: string; notizen?: string | null }[]
  rechnungen?: { id: string; nummer: string; betrag: number; status: string }[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LIST = [
  { value: "anfrage", label: "Anfrage", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "angebot", label: "Angebot", color: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
  { value: "auftrag", label: "Auftrag", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { value: "laufend", label: "Laufend", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { value: "abgeschlossen", label: "Abgeschlossen", color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" },
]

const TYP_LABEL: Record<string, string> = {
  pflanzung: "Pflanzung",
  flaechenvorbereitung: "Flächenvorbereitung",
  flachenvorbereitung: "Flächenvorbereitung",
  foerderberatung: "Förderberatung",
  foerdermittelberatung: "Förderberatung",
  zaunbau: "Zaunbau",
  kulturschutz: "Kulturschutz",
  kulturpflege: "Kulturpflege",
  saatguternte: "Saatguternte",
  pflanzenbeschaffung: "Pflanzenbeschaffung",
  unbekannt: "Unbekannt",
}

const TYP_FARBEN: Record<string, string> = {
  pflanzung: "bg-emerald-500/20 text-emerald-400",
  flaechenvorbereitung: "bg-blue-500/20 text-blue-400",
  flachenvorbereitung: "bg-blue-500/20 text-blue-400",
  foerderberatung: "bg-purple-500/20 text-purple-400",
  foerdermittelberatung: "bg-purple-500/20 text-purple-400",
  zaunbau: "bg-orange-500/20 text-orange-400",
  kulturschutz: "bg-amber-500/20 text-amber-400",
  kulturpflege: "bg-yellow-500/20 text-yellow-400",
  saatguternte: "bg-lime-500/20 text-lime-400",
}

// ─── Helper components ────────────────────────────────────────────────────────

function SectionHeading({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <h2 className="font-semibold text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
      <span className="text-zinc-500">{icon}</span>
      {label}
    </h2>
  )
}

function Field({ label, value, className }: { label: string; value?: string | number | null; className?: string }) {
  if (value == null || value === "" || value === "–" || value === "-") return null
  return (
    <div>
      <span className="text-zinc-500 text-xs block mb-0.5">{label}</span>
      <span className={`text-sm ${className ?? "text-zinc-200"}`}>{value}</span>
    </div>
  )
}

function FieldFull({ label, value, pre }: { label: string; value?: string | null; pre?: boolean }) {
  if (!value || value.trim() === "") return null
  return (
    <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
      <span className="text-zinc-500 text-xs block mb-1.5">{label}</span>
      {pre
        ? <pre className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">{value}</pre>
        : <p className="text-zinc-200 text-sm leading-relaxed">{value}</p>
      }
    </div>
  )
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">{children}</div>
}

// ─── Wizard Detail Renderers ──────────────────────────────────────────────────

function WizardPflanzung({ w }: { w: WizardDaten }) {
  return (
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 space-y-4">
      <SectionHeading icon={<TreePine className="w-4 h-4" />} label="🌳 Pflanzung – Details" />

      {/* Baumarten */}
      {(w.baumarten || w.pflanzenzahl_gesamt) && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 mb-2">
          {w.baumarten && <p className="text-emerald-300 text-sm font-medium">{w.baumarten}</p>}
          {w.pflanzenzahl_gesamt && (
            <p className="text-zinc-400 text-xs mt-1">Gesamt: {Number(w.pflanzenzahl_gesamt).toLocaleString("de-DE")} Stk.</p>
          )}
        </div>
      )}

      {/* FoRVG */}
      {w.forvg_herkunft && (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3">
          <span className="text-xs text-zinc-500 block mb-1">FoRVG-Herkunftsnachweise</span>
          <pre className="text-zinc-300 text-sm whitespace-pre-wrap font-sans">{w.forvg_herkunft}</pre>
        </div>
      )}

      {/* Standort */}
      <div>
        <p className="text-xs text-zinc-500 mb-2 font-medium">Standort</p>
        <Grid2>
          <Field label="Forstamt" value={w.flaeche_forstamt} />
          <Field label="Revier" value={w.flaeche_revier} />
          <Field label="PLZ" value={w.flaeche_plz} />
          <Field label="Ort" value={w.flaeche_ort} />
          {w.flaechen_str && <div className="col-span-2"><Field label="Fläche" value={w.flaechen_str} /></div>}
        </Grid2>
      </div>

      {/* Pflanzverband */}
      {(w.pflanzabstand || w.reihenabstand || w.pflanzverband) && (
        <div className="pt-3 border-t border-[#2a2a2a]">
          <p className="text-xs text-zinc-500 mb-2 font-medium">Pflanzverband</p>
          <Grid2>
            <Field label="Pflanzabstand" value={w.pflanzabstand} />
            <Field label="Reihenabstand" value={w.reihenabstand} />
            <Field label="Verband" value={w.pflanzverband} />
          </Grid2>
        </div>
      )}

      {/* Pflanzverband-Vorschau */}
      <PflanzverbandVorschau
        pflanzverband={w.pflanzverband}
        pflanzabstand={w.pflanzabstand}
        reihenabstand={w.reihenabstand}
        baumarten={w.baumarten}
        baumart={w.baumart}
        pflanzenzahl={w.pflanzenzahl_gesamt ? Number(w.pflanzenzahl_gesamt) : null}
        flaeche_ha={w.flaeche_ha}
        aussenreihe={w.aussenreihe === true || w.aussenreihe === 'true'}
        aussenreiheArt={w.aussenreiheArt || null}
        aussenreiheArtName={w.aussenreiheArt ? String(w.aussenreiheArt) : null}
      />

      {/* Bezugsquelle */}
      {(w.bezugsquelle || w.lieferant || w.lieferort || w.lieferAdresse) && (
        <div className="pt-3 border-t border-[#2a2a2a]">
          <p className="text-xs text-zinc-500 mb-2 font-medium">Bezugsquelle & Lieferung</p>
          <Grid2>
            <Field label="Bezugsquelle" value={w.bezugsquelle} />
            {w.lieferant && <Field label="Lieferant" value={w.lieferant} />}
            {w.lieferort && <Field label="Lieferort" value={w.lieferort} />}
            {w.lieferAdresse && <div className="col-span-2"><Field label="Lieferadresse" value={w.lieferAdresse} /></div>}
            {w.lieferMapsLink && (
              <div className="col-span-2">
                <span className="text-xs text-zinc-500 block mb-0.5">Maps-Link</span>
                <a href={w.lieferMapsLink} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline text-sm break-all">{w.lieferMapsLink}</a>
              </div>
            )}
          </Grid2>
        </div>
      )}

      {w.befahrbarkeit && (
        <div className="pt-3 border-t border-[#2a2a2a]">
          <Field label="Befahrbarkeit" value={w.befahrbarkeit} />
        </div>
      )}

      {/* Förderung */}
      {(w.foerderProgramme || w.foerderBeratungS2 || w.beratungsgespraech || w.darmstaedter_angebote) && (
        <div className="pt-3 border-t border-[#2a2a2a]">
          <p className="text-xs text-zinc-500 mb-2 font-medium">Förderung</p>
          <Grid2>
            <Field label="Förderprogramm" value={w.foerderProgramme} className="text-emerald-400" />
            <Field label="Beratungsanfrage" value={w.foerderBeratungS2} />
            <Field label="Beratungsgespräch" value={w.beratungsgespraech} />
            {w.darmstaedter_angebote && <Field label="Darmstädter Angebote" value={w.darmstaedter_angebote} />}
          </Grid2>
        </div>
      )}

      {w.bemerkung && <FieldFull label="Bemerkung" value={w.bemerkung} />}
    </div>
  )
}

function WizardFlaechenvorbereitung({ w }: { w: WizardDaten }) {
  const flaechen: FlaecheVorbereitung[] = Array.isArray(w.flaechen) ? w.flaechen : []

  return (
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 space-y-4">
      <SectionHeading icon={<Layers className="w-4 h-4" />} label="🌿 Flächenvorbereitung – Details" />

      {/* Flächen-Cards */}
      {flaechen.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500 font-medium">{flaechen.length} Fläche{flaechen.length > 1 ? "n" : ""}</p>
          {flaechen.map((f, i) => (
            <div key={i} className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full text-xs flex items-center justify-center font-bold">{f.nr ?? i + 1}</span>
                <span className="text-white text-sm font-medium">{f.ha ? `${f.ha} ha` : "—"}</span>
              </div>
              <Grid2>
                <Field label="Aufwuchsarten" value={f.aufwuchsarten} />
                <Field label="Methode" value={f.methode} />
                <Field label="Hangneigung" value={f.hangneigung} />
                <Field label="Zugänglichkeit" value={f.zugaenglichkeit} />
                <Field label="Forstamt" value={f.forstamt} />
                <Field label="Revier" value={f.revier} />
                {f.besonderheiten && <div className="col-span-2"><Field label="Besonderheiten" value={f.besonderheiten} /></div>}
              </Grid2>
            </div>
          ))}
        </div>
      )}

      {/* Allgemeine Infos */}
      <div className="pt-3 border-t border-[#2a2a2a]">
        <Grid2>
          <Field label="Zeitpunkt" value={w.zeitpunkt} />
          <Field label="Turnus" value={w.turnus} />
          <Field label="Ziel" value={w.ziel} />
          <Field label="PLZ / Ort" value={w.plz_ort} />
          <Field label="Waldbesitzertyp" value={w.waldbesitzertyp} />
          <Field label="Fördercheck" value={w.foerdercheck} />
          {w.foerderprogramme && <Field label="Förderprogramm" value={w.foerderprogramme} className="text-emerald-400" />}
          {w.bundesland && <Field label="Bundesland" value={w.bundesland} />}
        </Grid2>
      </div>
    </div>
  )
}

function WizardKulturschutz({ w }: { w: WizardDaten }) {
  const kostenMin = w.kostenindikation_min
  const kostenMax = w.kostenindikation_max
  const kosten = kostenMin && kostenMax ? `${Number(kostenMin).toLocaleString("de-DE")} – ${Number(kostenMax).toLocaleString("de-DE")} €` : null

  return (
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 space-y-4">
      <SectionHeading icon={<Shield className="w-4 h-4" />} label="🛡 Kulturschutz – Details" />

      {/* Main info */}
      <Grid2>
        <Field label="Schutzart" value={w.schutzart} className="text-amber-300" />
        <Field label="Fläche (ha)" value={w.ha} />
        <Field label="Pflanzenzahl" value={w.pflanzenzahl_gesamt ? `${Number(w.pflanzenzahl_gesamt).toLocaleString("de-DE")} Stk.` : null} />
        <Field label="Robinienstab" value={w.robinienstab} />
      </Grid2>

      {/* Schutzoptionen */}
      {(w.einzelschutz_optionen || w.flaechenschutz_typ) && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          {w.einzelschutz_optionen && w.einzelschutz_optionen !== "–" && (
            <p className="text-amber-300 text-sm">{w.einzelschutz_optionen}</p>
          )}
          {w.flaechenschutz_typ && w.flaechenschutz_typ !== "–" && (
            <p className="text-amber-300 text-sm">{w.flaechenschutz_typ}</p>
          )}
        </div>
      )}

      {/* Baumarten & Wildarten */}
      <div className="pt-3 border-t border-[#2a2a2a]">
        <Grid2>
          <Field label="Baumarten" value={w.baumarten} />
          <Field label="Alter der Kultur" value={w.alter_kultur} />
          <Field label="Wildarten" value={w.wildarten} />
          <Field label="Verbissdruck" value={w.verbissdruck} />
          <Field label="Schälrisiko" value={w.schaelrisiko} />
        </Grid2>
      </div>

      {/* Ausführung */}
      <div className="pt-3 border-t border-[#2a2a2a]">
        <Grid2>
          <Field label="Ausführungszeitraum" value={w.ausfuehrungszeitraum} />
          <Field label="Schutzdauer" value={w.schutzdauer} />
          <Field label="Wartung" value={w.wartung} />
          <Field label="Fördergebiet" value={w.foerdergebiet} />
          <Field label="Waldbesitztyp" value={w.waldbesitztyp} />
        </Grid2>
      </div>

      {/* Kosten */}
      {kosten && (
        <div className="mt-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
          <span className="text-xs text-zinc-500 block mb-0.5">Kostenindikation</span>
          <p className="text-emerald-400 font-semibold text-lg">{kosten}</p>
        </div>
      )}
    </div>
  )
}

function WizardKulturpflege({ w }: { w: WizardDaten }) {
  return (
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 space-y-4">
      <SectionHeading icon={<Scissors className="w-4 h-4" />} label="✂️ Kulturpflege – Details" />

      {/* Maßnahme highlight */}
      {w.massnahme && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-2">
          <span className="text-xs text-zinc-500 block mb-0.5">Maßnahme</span>
          <p className="text-yellow-300 text-sm font-medium">{w.massnahme}</p>
        </div>
      )}

      {/* Standort */}
      <div>
        <p className="text-xs text-zinc-500 mb-2 font-medium">Standort</p>
        <Grid2>
          <Field label="Fläche (ha)" value={w.ha} />
          <Field label="PLZ" value={w.plz} />
          <Field label="Ort" value={w.ort} />
          <Field label="Forstamt" value={w.forstamt} />
          <Field label="Revier" value={w.revier} />
        </Grid2>
      </div>

      {/* Bestand */}
      <div className="pt-3 border-t border-[#2a2a2a]">
        <p className="text-xs text-zinc-500 mb-2 font-medium">Bestandsdaten</p>
        <Grid2>
          <Field label="Bestandsalter" value={w.bestandsalter} />
          <Field label="Baumarten" value={w.baumarten} />
          <Field label="Dichte" value={w.dichte} />
          <Field label="Pflegeziel" value={w.pflegeziel} />
          <Field label="Vegetation" value={w.vegetation} />
          <Field label="Intensität" value={w.intensitaet} />
        </Grid2>
      </div>

      {/* Planung */}
      <div className="pt-3 border-t border-[#2a2a2a]">
        <p className="text-xs text-zinc-500 mb-2 font-medium">Planung</p>
        <Grid2>
          <Field label="Zeitpunkt" value={w.zeitpunkt} />
          <Field label="Folgepflege" value={w.folgepflege} />
          <Field label="Dringlichkeit" value={w.dringlichkeit} />
          <Field label="Wiederkehrend" value={w.wiederkehrend} />
        </Grid2>
      </div>

      {/* Förderung */}
      {(w.foerderberatung || w.foerderprogramme) && (
        <div className="pt-3 border-t border-[#2a2a2a]">
          <Grid2>
            <Field label="Förderberatung" value={w.foerderberatung} />
            {w.foerderprogramme && <Field label="Förderprogramm" value={w.foerderprogramme} className="text-emerald-400" />}
          </Grid2>
        </div>
      )}

      {/* Kosten */}
      {w.kostenindikation && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
          <span className="text-xs text-zinc-500 block mb-0.5">Kostenindikation</span>
          <p className="text-emerald-400 font-semibold text-lg">{w.kostenindikation}</p>
        </div>
      )}
    </div>
  )
}

function WizardSaatguternte({ w }: { w: WizardDaten }) {
  return (
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 space-y-4">
      <SectionHeading icon={<Package className="w-4 h-4" />} label="🌰 Saatguternte – Details" />

      {/* Baumarten + Menge */}
      {(w.baumarten || w.gesamtmenge_kg) && (
        <div className="bg-lime-500/10 border border-lime-500/20 rounded-lg p-3 mb-2">
          {w.baumarten && <p className="text-lime-300 text-sm font-medium">{w.baumarten}</p>}
          {w.gesamtmenge_kg && (
            <p className="text-zinc-400 text-xs mt-1">Gesamtmenge: {w.gesamtmenge_kg} kg</p>
          )}
        </div>
      )}

      {/* FoRVG */}
      {w.forvg_herkunft && (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3">
          <span className="text-xs text-zinc-500 block mb-1">FoRVG-Herkunftsnachweise</span>
          <pre className="text-zinc-300 text-sm whitespace-pre-wrap font-sans">{w.forvg_herkunft}</pre>
        </div>
      )}

      {/* Details */}
      <Grid2>
        <Field label="Verwendungszweck" value={w.verwendungszweck} />
        <Field label="Bestandsregister" value={w.bestandsregister} />
        <Field label="Logistik" value={w.logistik} />
        <Field label="Erntejahr" value={w.erntejahr} />
        <Field label="Erntefenster" value={w.erntefenster} />
        <Field label="Planungshorizont" value={w.planungshorizont} />
      </Grid2>

      {/* Kosten */}
      {w.kostenindikation && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
          <span className="text-xs text-zinc-500 block mb-0.5">Kostenindikation</span>
          <p className="text-emerald-400 font-semibold text-lg">{w.kostenindikation}</p>
        </div>
      )}
    </div>
  )
}

function WizardDetails({ auftrag }: { auftrag: Auftrag }) {
  const w = auftrag.wizardDaten
  if (!w) return null

  const leistung = (w.leistung ?? auftrag.typ ?? "").toLowerCase()

  if (leistung.includes("pflanzung")) return <WizardPflanzung w={w} />
  if (leistung.includes("flaechenvorbereitung") || leistung.includes("flachenvorbereitung") || leistung.includes("flächen")) return <WizardFlaechenvorbereitung w={w} />
  if (leistung.includes("kulturschutz")) return <WizardKulturschutz w={w} />
  if (leistung.includes("kulturpflege")) return <WizardKulturpflege w={w} />
  if (leistung.includes("saatguternte")) return <WizardSaatguternte w={w} />

  // Fallback: show raw data nicely
  return (
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
      <SectionHeading icon={<Info className="w-4 h-4" />} label="Wizard-Daten" />
      <div className="grid grid-cols-2 gap-3 text-sm">
        {Object.entries(w)
          .filter(([, v]) => v != null && v !== "" && typeof v !== "object")
          .map(([k, v]) => (
            <div key={k}>
              <span className="text-zinc-500 text-xs block">{k}</span>
              <span className="text-zinc-200">{String(v)}</span>
            </div>
          ))}
      </div>
    </div>
  )
}

function KostenVorschau({ auftrag }: { auftrag: Auftrag }) {
  const w = auftrag.wizardDaten
  if (!w) return null

  let kosten: string | null = null

  if (w.kostenindikation) {
    kosten = String(w.kostenindikation)
  } else if (w.kostenindikation_min && w.kostenindikation_max) {
    kosten = `${Number(w.kostenindikation_min).toLocaleString("de-DE")} – ${Number(w.kostenindikation_max).toLocaleString("de-DE")} €`
  }

  if (!kosten) return null

  return (
    <div className="bg-[#161616] border border-emerald-500/30 rounded-xl p-6">
      <h2 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
        <BadgeCheck className="w-4 h-4 text-emerald-500" />
        Kosten-Vorschau
      </h2>
      <div className="bg-emerald-500/10 rounded-lg p-4 text-center">
        <p className="text-3xl font-bold text-emerald-400">{kosten}</p>
        <p className="text-zinc-500 text-xs mt-1">Kostenindikation (unverbindlich)</p>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AuftragDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [auftrag, setAuftrag] = useState<Auftrag | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [status, setStatus] = useState("")
  const [notizen, setNotizen] = useState("")
  const [saisonId, setSaisonId] = useState<string>("")
  const [gruppeId, setGruppeId] = useState<string>("")

  const [saisons, setSaisons] = useState<Saison[]>([])
  const [gruppen, setGruppen] = useState<Gruppe[]>([])

  useEffect(() => {
    async function fetchData() {
      const [auftragRes, saionsRes, gruppenRes] = await Promise.all([
        fetch(`/api/auftraege/${id}`),
        fetch("/api/saisons"),
        fetch("/api/gruppen"),
      ])
      const a: Auftrag = await auftragRes.json()
      setAuftrag(a)
      setStatus(a.status)
      setNotizen(a.notizen ?? "")
      setSaisonId(a.saisonId ?? "")
      setGruppeId(a.gruppeId ?? "")
      setSaisons(saionsRes.ok ? await saionsRes.json() : [])
      setGruppen(gruppenRes.ok ? await gruppenRes.json() : [])
      setLoading(false)
    }
    fetchData()
  }, [id])

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/auftraege/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        notizen: notizen || null,
        saisonId: saisonId || null,
        gruppeId: gruppeId || null,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    const res = await fetch(`/api/auftraege/${id}`)
    setAuftrag(await res.json())
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center h-64">
        <p className="text-zinc-600 animate-pulse">Laden...</p>
      </div>
    )
  }

  if (!auftrag) {
    return (
      <div className="max-w-5xl mx-auto">
        <p className="text-zinc-500">Auftrag nicht gefunden.</p>
      </div>
    )
  }

  const statusObj = STATUS_LIST.find(s => s.value === status) ?? STATUS_LIST[0]
  const wpAdminUrl = auftrag.wpProjektId
    ? `https://peru-otter-113714.hostingersite.com/wp-admin/post.php?post=${auftrag.wpProjektId}&action=edit`
    : null

  // Extract wizard data for contact/project info section
  const w = auftrag.wizardDaten as WizardDaten | null | undefined

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back */}
      <Link href="/auftraege" className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-6 transition-all">
        <ArrowLeft className="w-4 h-4" />
        <span>Zurück zu Aufträge</span>
      </Link>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-xl font-bold text-white leading-tight">{auftrag.titel}</h1>
              {auftrag.neuFlag && (
                <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-300 rounded text-xs font-bold border border-emerald-500/40">NEU</span>
              )}
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYP_FARBEN[auftrag.typ] ?? "bg-zinc-700/50 text-zinc-400"}`}>
                {TYP_LABEL[auftrag.typ] ?? auftrag.typ}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs border ${statusObj.color}`}>
                {statusObj.label}
              </span>
            </div>
            <p className="text-zinc-500 text-xs">Erstellt: {new Date(auftrag.createdAt).toLocaleDateString("de-DE")}</p>
          </div>
          <div className="flex items-center gap-2">
            {wpAdminUrl && (
              <a
                href={wpAdminUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-[#2a2a2a] hover:bg-[#333] text-zinc-400 hover:text-white rounded-lg text-xs transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                WP Admin
              </a>
            )}
          </div>
        </div>

        {/* Status-Switch */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {STATUS_LIST.map(s => (
            <button
              key={s.value}
              onClick={() => setStatus(s.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                status === s.value ? s.color : "border-[#2a2a2a] text-zinc-500 hover:text-zinc-300 hover:border-zinc-500"
              }`}
            >
              {s.label}
            </button>
          ))}
          {status !== auftrag.status && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all"
            >
              <ChevronRight className="w-3 h-3" />
              {saving ? "..." : "Speichern"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left (main content) ─────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Kontakt */}
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
            <SectionHeading icon={<User className="w-4 h-4" />} label="Kontakt" />
            {auftrag.waldbesitzer || auftrag.waldbesitzerEmail || auftrag.waldbesitzerTelefon ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {auftrag.waldbesitzer && (
                  <div>
                    <span className="text-zinc-500 text-xs block mb-0.5">Name</span>
                    <span className="text-white">{auftrag.waldbesitzer}</span>
                  </div>
                )}
                {auftrag.waldbesitzerEmail && (
                  <div>
                    <span className="text-zinc-500 text-xs block mb-0.5">E-Mail</span>
                    <a href={`mailto:${auftrag.waldbesitzerEmail}`} className="text-emerald-400 hover:underline flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />{auftrag.waldbesitzerEmail}
                    </a>
                  </div>
                )}
                {auftrag.waldbesitzerTelefon && (
                  <div>
                    <span className="text-zinc-500 text-xs block mb-0.5">Telefon</span>
                    <a href={`tel:${auftrag.waldbesitzerTelefon}`} className="text-emerald-400 hover:underline flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />{auftrag.waldbesitzerTelefon}
                    </a>
                  </div>
                )}
                {w?.plz_ort && (
                  <div>
                    <span className="text-zinc-500 text-xs block mb-0.5">PLZ / Ort</span>
                    <span className="text-zinc-200">{w.plz_ort}</span>
                  </div>
                )}
                {w?.waldbesitzertyp && (
                  <div>
                    <span className="text-zinc-500 text-xs block mb-0.5">Waldbesitzertyp</span>
                    <span className="text-zinc-200">{w.waldbesitzertyp}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-zinc-600 text-sm">Keine Kontaktdaten vorhanden</p>
            )}
          </div>

          {/* Projekt-Info */}
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
            <SectionHeading icon={<TreePine className="w-4 h-4" />} label="Projekt-Info" />
            <Grid2>
              <div>
                <span className="text-zinc-500 text-xs block mb-0.5">Leistungsart</span>
                <span className={`text-sm px-2 py-0.5 rounded-full ${TYP_FARBEN[auftrag.typ] ?? "text-zinc-200"}`}>
                  {TYP_LABEL[auftrag.typ] ?? auftrag.typ}
                </span>
              </div>
              {auftrag.bundesland && <Field label="Bundesland" value={auftrag.bundesland} />}
              {auftrag.zeitraum && (
                <div>
                  <span className="text-zinc-500 text-xs block mb-0.5 flex items-center gap-1"><Calendar className="w-3 h-3" />Zeitraum</span>
                  <span className="text-zinc-200 text-sm">{auftrag.zeitraum}</span>
                </div>
              )}
              {auftrag.flaeche_ha != null && (
                <div>
                  <span className="text-zinc-500 text-xs block mb-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />Gesamtfläche</span>
                  <span className="text-zinc-200 text-sm">{auftrag.flaeche_ha} ha</span>
                </div>
              )}
              {w?.zeitpunkt && <Field label="Zeitpunkt" value={w.zeitpunkt} />}
              {w?.turnus && <Field label="Turnus" value={w.turnus} />}
              {w?.ziel && <Field label="Ziel" value={w.ziel} />}
            </Grid2>
          </div>

          {/* Wizard-Details (typ-spezifisch) */}
          {auftrag.wizardDaten && <WizardDetails auftrag={auftrag} />}

          {/* Kosten-Vorschau */}
          {auftrag.wizardDaten && <KostenVorschau auftrag={auftrag} />}

          {/* Tagesprotokolle */}
          {auftrag.protokolle && auftrag.protokolle.length > 0 && (
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
              <SectionHeading icon={<FileText className="w-4 h-4" />} label={`Tagesprotokolle (${auftrag.protokolle.length})`} />
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a2a2a]">
                    <th className="text-left py-2 text-xs text-zinc-500">Datum</th>
                    <th className="text-left py-2 text-xs text-zinc-500">Ersteller</th>
                    <th className="text-left py-2 text-xs text-zinc-500">Gepflanzt</th>
                    <th className="text-left py-2 text-xs text-zinc-500">Witterung</th>
                  </tr>
                </thead>
                <tbody>
                  {auftrag.protokolle.map(p => (
                    <tr key={p.id} className="border-b border-[#1e1e1e] last:border-0">
                      <td className="py-2 text-zinc-400">{new Date(p.datum).toLocaleDateString("de-DE")}</td>
                      <td className="py-2 text-zinc-400">{p.ersteller ?? "—"}</td>
                      <td className="py-2 text-emerald-400">{p.gepflanzt != null ? `${p.gepflanzt.toLocaleString()} Stk.` : "—"}</td>
                      <td className="py-2 text-zinc-400">{p.witterung ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[#2a2a2a]">
                    <td colSpan={2} className="py-2 text-xs text-zinc-500 font-medium">Gesamt:</td>
                    <td className="py-2 text-sm font-bold text-emerald-400">
                      {auftrag.protokolle.reduce((s, p) => s + (p.gepflanzt ?? 0), 0).toLocaleString()} Stk.
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

        </div>

        {/* ── Right (sidebar) ─────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Interne Verwaltung */}
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
            <SectionHeading icon={<Sprout className="w-4 h-4" />} label="Interne Verwaltung" />
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Saison</label>
                <select
                  value={saisonId}
                  onChange={e => setSaisonId(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Keine Saison</option>
                  {saisons.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Gruppe</label>
                <select
                  value={gruppeId}
                  onChange={e => setGruppeId(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Keine Gruppe</option>
                  {gruppen.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Notizen
                </label>
                <textarea
                  value={notizen}
                  onChange={e => setNotizen(e.target.value)}
                  rows={4}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="Interne Notizen..."
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  saved
                    ? "bg-emerald-700 text-emerald-100"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                } disabled:opacity-50`}
              >
                <Save className="w-4 h-4" />
                {saving ? "Speichern..." : saved ? "Gespeichert ✓" : "Speichern"}
              </button>
            </div>
          </div>

          {/* WP Info */}
          {auftrag.wpProjektId && (
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-2">WordPress Post</p>
              <p className="text-xs font-mono text-zinc-400 mb-3">ID: {auftrag.wpProjektId}</p>
              {wpAdminUrl && (
                <a
                  href={wpAdminUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Im WP-Admin öffnen
                </a>
              )}
            </div>
          )}

        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={() => router.back()}
          className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
        >
          ← Zurück
        </button>
      </div>
    </div>
  )
}
