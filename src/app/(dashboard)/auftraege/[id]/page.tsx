"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft, ExternalLink, Save, Phone, Mail, User, TreePine, MapPin, Calendar,
  FileText, Shield, Sprout, Scissors, Package, Layers, Info, BadgeCheck, ChevronRight, Camera, CheckSquare, Plus
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { PflanzverbandVorschau } from "@/components/auftraege/PflanzverbandVorschau"
import { Breadcrumb } from "@/components/layout/Breadcrumb"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { TagesprotokollFull } from "@/components/tagesprotokoll/TagesprotokollDetail"
import { AbnahmeStatus } from "@/components/abnahme/AbnahmeStatus"
import { AuftragFoerderCheck } from "@/components/foerderung/AuftragFoerderCheck"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Saison { id: string; name: string }
interface Gruppe { id: string; name: string }

interface FlaecheItem {
  ha?: string | number
  plz?: string
  ort?: string
  forstamt?: string
  revier?: string
  pflanzverband?: string
  abstand_p?: string
  abstand_r?: string
  stueckzahl?: number
  baumarten_verteilung?: Record<string, number>
}

interface MaterialBewegung {
  id: string
  typ: string
  menge: number
  createdAt: string
  artikel: { id: string; name: string; einheit: string }
  mitarbeiter?: { id: string; vorname: string; nachname: string } | null
}

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
  lat?: number | null
  lng?: number | null
  plusCode?: string | null
  protokolle?: { id: string; datum: string; gepflanzt?: number | null; witterung?: string | null; ersteller?: string | null; fotos?: string | null }[]
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
          {Array.isArray(w.flaechen) && w.flaechen.length > 0 ? (
            <div className="col-span-2 space-y-2">
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide">
                {w.flaechen.length} Fläche{w.flaechen.length > 1 ? "n" : ""}
              </p>
              {(w.flaechen as FlaecheItem[]).map((fl, i) => (
                <div key={i} className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-3 space-y-1">
                  <p className="text-xs font-semibold text-zinc-200">
                    Fläche {i + 1} — {fl.ha} ha
                  </p>
                  {(fl.plz || fl.ort) && (
                    <Field label="PLZ / Ort" value={`${fl.plz ?? ''} ${fl.ort ?? ''}`.trim()} />
                  )}
                  {fl.forstamt && (
                    <Field label="Forstamt / Revier" value={`${fl.forstamt}${fl.revier ? ' / ' + fl.revier : ''}`} />
                  )}
                  {fl.pflanzverband && (
                    <Field label="Pflanzverband" value={`${fl.abstand_p ?? '2.0'} × ${fl.abstand_r ?? '2.0'} m (${fl.pflanzverband})`} />
                  )}
                  {(fl.stueckzahl ?? 0) > 0 && (
                    <Field label="Stückzahl" value={`≈ ${(fl.stueckzahl as number).toLocaleString('de-DE')} Pflanzen`} />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <>
              <Field label="Forstamt" value={w.flaeche_forstamt} />
              <Field label="Revier" value={w.flaeche_revier} />
              <Field label="PLZ" value={w.flaeche_plz} />
              <Field label="Ort" value={w.flaeche_ort} />
              {w.flaechen_str && <div className="col-span-2"><Field label="Fläche" value={w.flaechen_str} /></div>}
            </>
          )}
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

      {/* Pflanzverband-Vorschau — per Fläche wenn mehrere vorhanden */}
      {Array.isArray(w.flaechen) && w.flaechen.length > 0 ? (
        (w.flaechen as FlaecheItem[]).map((fl, i) => (
          <div key={i}>
            {w.flaechen!.length > 1 && (
              <p className="text-xs text-zinc-500 font-medium mb-1">Fläche {i + 1} — Pflanzverband</p>
            )}
            {(() => {
              // Per-Fläche baumarten aus baumarten_verteilung
              const flBaumarten = fl.baumarten_verteilung && typeof fl.baumarten_verteilung === 'object'
                ? Object.entries(fl.baumarten_verteilung as Record<string, number>)
                    .filter(([, count]) => (count as number) > 0)
                    .map(([name, count]) => `${name}: ${count} Stk.`)
                    .join(', ')
                : w.baumarten
              return (
                <PflanzverbandVorschau
                  pflanzverband={fl.pflanzverband}
                  pflanzabstand={fl.abstand_p ? fl.abstand_p + 'm' : null}
                  reihenabstand={fl.abstand_r ? fl.abstand_r + 'm' : null}
                  baumarten={flBaumarten}
                  pflanzenzahl={fl.stueckzahl}
                  flaeche_ha={fl.ha}
                  aussenreihe={w.aussenreihe}
                  aussenreiheArt={w.aussenreiheArt}
                />
              )
            })()}
          </div>
        ))
      ) : (
        <PflanzverbandVorschau
          pflanzverband={w.pflanzverband}
          pflanzabstand={w.pflanzabstand}
          reihenabstand={w.reihenabstand}
          baumarten={w.baumarten}
          pflanzenzahl={w.pflanzenzahl_gesamt != null ? Number(w.pflanzenzahl_gesamt) : null}
          flaeche_ha={w.flaeche_ha}
          aussenreihe={w.aussenreihe}
          aussenreiheArt={w.aussenreiheArt}
        />
      )}

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
  // System-Konfiguration für konfigurierbare Preise (Sprint P)
  const [sysConfig, setSysConfig] = useState<Record<string, string>>({})

  const [status, setStatus] = useState("")
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [notizen, setNotizen] = useState("")
  const [saisonId, setSaisonId] = useState<string>("")
  const [gruppeId, setGruppeId] = useState<string>("")
  // GPS-Koordinaten (Sprint U)
  const [lat, setLat] = useState<string>("")
  const [lng, setLng] = useState<string>("")
  const [plusCode, setPlusCode] = useState<string>("")

  const [saisons, setSaisons] = useState<Saison[]>([])
  const [gruppen, setGruppen] = useState<Gruppe[]>([])
  const [material, setMaterial] = useState<MaterialBewegung[]>([])
  const [materialLoading, setMaterialLoading] = useState(true)
  const [wirtschaft, setWirtschaft] = useState<{
    stundenAnzahl: number
    lohnkosten: number
    maschinenkosten: number
    gesamtkosten: number
    umsatz: number
    deckungsbeitrag: number
    marge: number
  } | null>(null)

  // Audit-Log (Sprint S)
  const [auftragLog, setAuftragLog] = useState<{ id: string; aktion: string; von?: string | null; nach?: string | null; createdAt: string }[]>([])
  const [tagesprotokolle, setTagesprotokolle] = useState<TagesprotokollFull[]>([])
  const [tagesprotokollExpanded, setTagesprotokollExpanded] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      const [auftragRes, saionsRes, gruppenRes, materialRes] = await Promise.all([
        fetch(`/api/auftraege/${id}`),
        fetch("/api/saisons"),
        fetch("/api/gruppen"),
        fetch(`/api/auftraege/${id}/material`),
      ])
      const a: Auftrag = await auftragRes.json()
      setAuftrag(a)
      setStatus(a.status)
      setNotizen(a.notizen ?? "")
      setSaisonId(a.saisonId ?? "")
      setGruppeId(a.gruppeId ?? "")
      setLat(a.lat != null ? String(a.lat) : "")
      setLng(a.lng != null ? String(a.lng) : "")
      setPlusCode(a.plusCode ?? "")
      setSaisons(saionsRes.ok ? await saionsRes.json() : [])
      setGruppen(gruppenRes.ok ? await gruppenRes.json() : [])
      if (materialRes.ok) { const mat = await materialRes.json(); setMaterial(Array.isArray(mat) ? mat : []) }
      setMaterialLoading(false)
      setLoading(false)
    }
    fetchData()
  }, [id])

  useEffect(() => {
    if (auftrag?.id) {
      fetch(`/api/auftraege/${auftrag.id}/wirtschaftlichkeit`)
        .then(r => r.json())
        .then(setWirtschaft)
        .catch(() => {})
    }
  }, [auftrag?.id])

  useEffect(() => {
    if (id) {
      fetch(`/api/auftraege/${id}/log`)
        .then(r => r.json())
        .then(data => setAuftragLog(Array.isArray(data) ? data : []))
        .catch(() => {})
    }
  }, [id])

  // Lade Tagesprotokolle für diesen Auftrag
  useEffect(() => {
    if (id) {
      fetch(`/api/tagesprotokoll?auftragId=${id}`)
        .then(r => r.json())
        .then(data => setTagesprotokolle(Array.isArray(data) ? data : []))
        .catch(() => {})
    }
  }, [id])

  // Lade System-Konfiguration für konfigurierbaren Preis pro ha (Sprint P)
  useEffect(() => {
    fetch("/api/einstellungen/config").then(r => r.json()).then(setSysConfig).catch(() => {})
  }, [])

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
        lat: lat !== "" ? lat : null,
        lng: lng !== "" ? lng : null,
        plusCode: plusCode || null,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    const res = await fetch(`/api/auftraege/${id}`)
    setAuftrag(await res.json())
  }

  async function handleStatusChange(newStatus: string) {
    await fetch(`/api/auftraege/${auftrag!.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    setStatus(newStatus)
    setAuftrag(prev => prev ? { ...prev, status: newStatus } : prev)
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
      <Breadcrumb items={[{ label: "Aufträge", href: "/auftraege" }, { label: auftrag.titel }]} />
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
          <div className="flex items-center gap-2 flex-wrap">
            {/* Arbeitsanweisung drucken (Sprint V) */}
            <a
              href={`/auftraege/${auftrag.id}/arbeitsanweisung`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 border border-zinc-600 text-zinc-400 rounded-lg text-sm hover:border-zinc-400 hover:text-white transition-colors"
            >
              🖨️ Arbeitsanweisung
            </a>
            {/* GPS-Export (nur wenn Koordinaten vorhanden) */}
            {auftrag.lat != null && auftrag.lng != null && (
              <>
                <a
                  href={`/api/auftraege/${auftrag.id}/export?format=gpx`}
                  className="flex items-center gap-1.5 px-3 py-2 border border-zinc-600 text-zinc-400 rounded-lg text-sm hover:border-zinc-400 hover:text-white transition-colors"
                  title="GPS-Koordinaten als GPX exportieren"
                >
                  📍 GPX
                </a>
                <a
                  href={`/api/auftraege/${auftrag.id}/export?format=kml`}
                  className="flex items-center gap-1.5 px-3 py-2 border border-zinc-600 text-zinc-400 rounded-lg text-sm hover:border-zinc-400 hover:text-white transition-colors"
                  title="GPS-Koordinaten als KML exportieren"
                >
                  🗺️ KML
                </a>
              </>
            )}
            {auftrag.status === "anfrage" && (
              <button
                onClick={async () => {
                  const r = await fetch("/api/angebote", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      auftragId: auftrag.id,
                      waldbesitzerName: auftrag.waldbesitzer,
                      waldbesitzerEmail: auftrag.waldbesitzerEmail,
                      flaeche_ha: auftrag.flaeche_ha,
                      beschreibung: auftrag.titel,
                    }),
                  })
                  if (r.ok) {
                    const data = await r.json()
                    toast.success(`Angebot ${data.nummer} erstellt`)
                  } else {
                    toast.error("Fehler beim Erstellen des Angebots")
                  }
                }}
                className="px-4 py-2 bg-blue-500/20 border border-blue-500/40 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
              >
                📋 Angebot erstellen
              </button>
            )}
            {/* Sprint FQ (B3): Gegenangebot erstellen */}
            {(auftrag.status === "angebot" || auftrag.status === "angenommen") && (
              <button
                onClick={async () => {
                  const r = await fetch("/api/angebote", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      auftragId: auftrag.id,
                      waldbesitzerName: auftrag.waldbesitzer,
                      waldbesitzerEmail: auftrag.waldbesitzerEmail,
                      flaeche_ha: auftrag.flaeche_ha,
                      beschreibung: `Gegenangebot zu ${auftrag.nummer ?? auftrag.titel}`,
                    }),
                  })
                  if (r.ok) {
                    const data = await r.json()
                    toast.success(`Gegenangebot ${data.nummer} erstellt`)
                    router.push(`/angebote`)
                  } else {
                    toast.error("Fehler beim Erstellen des Gegenangebots")
                  }
                }}
                className="px-4 py-2 bg-violet-500/20 border border-violet-500/40 text-violet-400 rounded-lg text-sm hover:bg-violet-500/30 transition-colors"
              >
                📝 Gegenangebot
              </button>
            )}
            {/* Sprint FW (E4): Schnelllink Rechnung erstellen */}
            {auftrag.status === "abgeschlossen" && (
              <a
                href={`/rechnungen/neu?auftragId=${auftrag.id}`}
                className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/30 transition-colors"
              >
                💰 Rechnung erstellen
              </a>
            )}
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
              onClick={() => { if (s.value !== status) setPendingStatus(s.value) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                status === s.value ? s.color : "border-[#2a2a2a] text-zinc-500 hover:text-zinc-300 hover:border-zinc-500"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Status-Bestätigungs-Dialog */}
        <ConfirmDialog
          open={!!pendingStatus}
          title="Status ändern"
          message={`Auftragsstatus auf "${STATUS_LIST.find(s => s.value === pendingStatus)?.label ?? pendingStatus}" setzen?`}
          danger={false}
          confirmLabel="Status setzen"
          onCancel={() => setPendingStatus(null)}
          onConfirm={async () => {
            if (!pendingStatus) return
            await handleStatusChange(pendingStatus)
            setPendingStatus(null)
          }}
        />
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

          {/* Wirtschaftlichkeits-Widget */}
          {wirtschaft && (
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 mb-0">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Wirtschaftlichkeit</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Stunden", value: `${wirtschaft.stundenAnzahl}h`, color: "text-white" },
                  { label: "Lohnkosten", value: wirtschaft.lohnkosten.toLocaleString("de-DE", { style: "currency", currency: "EUR" }), color: "text-amber-400" },
                  { label: "Umsatz", value: wirtschaft.umsatz.toLocaleString("de-DE", { style: "currency", currency: "EUR" }), color: "text-emerald-400" },
                  { label: "Marge", value: `${wirtschaft.marge}%`, color: wirtschaft.marge > 20 ? "text-emerald-400" : wirtschaft.marge > 0 ? "text-amber-400" : "text-red-400" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-3">
                    <p className="text-xs text-zinc-500 mb-1">{label}</p>
                    <p className={`text-lg font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
              {wirtschaft.deckungsbeitrag !== 0 && (
                <p className="text-xs text-zinc-500 mt-2">
                  Deckungsbeitrag:{" "}
                  <span className={wirtschaft.deckungsbeitrag >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {wirtschaft.deckungsbeitrag.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Tagesprotokolle */}
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <SectionHeading icon={<FileText className="w-4 h-4" />} label={`Tagesprotokolle (${tagesprotokolle.length})`} />
              <Link
                href={`/auftraege/${auftrag.id}/protokoll/neu`}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-400 hover:bg-emerald-500/30 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Neues Tagesprotokoll
              </Link>
            </div>
            {tagesprotokolle.length === 0 ? (
              <p className="text-zinc-600 text-sm">Noch keine Tagesprotokolle vorhanden.</p>
            ) : (
              <div className="space-y-2">
                {tagesprotokolle.map(p => {
                  const statusColors: Record<string, string> = {
                    entwurf: "bg-zinc-700 text-zinc-300 border-zinc-600",
                    eingereicht: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
                    genehmigt: "bg-blue-500/20 text-blue-400 border-blue-500/40",
                    abgelehnt: "bg-red-500/20 text-red-400 border-red-500/40",
                  }
                  const statusLabels: Record<string, string> = {
                    entwurf: "Entwurf", eingereicht: "Eingereicht",
                    genehmigt: "Genehmigt", abgelehnt: "Abgelehnt",
                  }
                  const isExpanded = tagesprotokollExpanded === p.id
                  return (
                    <div key={p.id} className="border border-[#2a2a2a] rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setTagesprotokollExpanded(isExpanded ? null : p.id)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-[#111] hover:bg-[#181818] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-zinc-300">
                            {new Date(p.datum).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })}
                          </span>
                          {p.ersteller && <span className="text-xs text-zinc-500">{p.ersteller}</span>}
                          {p.witterung && <span className="text-xs text-zinc-600">{p.witterung}</span>}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[p.status] ?? "bg-zinc-700 text-zinc-400 border-zinc-600"}`}>
                          {statusLabels[p.status] ?? p.status}
                        </span>
                      </button>
                      {isExpanded && (
                        <div className="p-4 bg-[#0d0d0d]">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-zinc-400">
                            {p.forstamt && <div><span className="text-zinc-600 block">Forstamt</span>{p.forstamt}</div>}
                            {p.revier && <div><span className="text-zinc-600 block">Revier</span>{p.revier}</div>}
                            {p.waldbesitzerName && <div><span className="text-zinc-600 block">Waldbesitzer</span>{p.waldbesitzerName}</div>}
                            {p.witterung && <div><span className="text-zinc-600 block">Witterung</span>{p.witterung}</div>}
                            {(p.std_handpflanzung ?? 0) > 0 && <div><span className="text-zinc-600 block">Pflanzung (Std)</span>{p.std_handpflanzung}</div>}
                            {(p.stk_pflanzung ?? 0) > 0 && <div><span className="text-zinc-600 block">Gepflanzt (Stk)</span>{p.stk_pflanzung?.toLocaleString()}</div>}
                          </div>
                          {p.kommentar && (
                            <p className="mt-3 text-xs text-zinc-400 whitespace-pre-wrap border-t border-[#2a2a2a] pt-3">{p.kommentar}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Abnahmen ──────────────────────────────────────────── */}
          {auftrag.abnahmen && auftrag.abnahmen.length > 0 && (
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                  <CheckSquare className="w-4 h-4 text-zinc-500" />
                  Abnahmen ({auftrag.abnahmen.length})
                </h2>
                {/* Rechnung erstellen: nur wenn noch keine existiert */}
                {auftrag.abnahmen.some(a => a.status === "bestanden") && (!auftrag.rechnungen || auftrag.rechnungen.length === 0) && (
                  <button
                    onClick={async () => {
                      // Preis pro ha aus System-Konfiguration (Sprint P4)
                      const preisProHa = parseFloat(sysConfig.preis_pro_ha ?? "1800")
                      const res = await fetch("/api/rechnungen", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          auftragId: auftrag.id,
                          nummer: `RE-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
                          betrag: (auftrag.flaeche_ha ?? 1) * preisProHa,
                          notizen: `Rechnung für: ${auftrag.titel}`,
                          faelligAm: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                          status: "offen"
                        })
                      })
                      if (res.ok) {
                        toast.success("Rechnung erstellt")
                        router.refresh()
                      } else {
                        toast.error("Fehler beim Erstellen der Rechnung")
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-400 hover:bg-emerald-500/30 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Rechnung erstellen
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {auftrag.abnahmen.map(abnahme => (
                  <div key={abnahme.id} className="flex items-center justify-between p-3 bg-[#0f0f0f] rounded-lg border border-[#2a2a2a]">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        abnahme.status === "bestanden" ? "bg-emerald-500" :
                        abnahme.status === "offen" ? "bg-amber-400" : "bg-red-400"
                      }`} />
                      <div>
                        <p className="text-sm text-white">{new Date(abnahme.datum).toLocaleDateString("de-DE")}</p>
                        {abnahme.notizen && <p className="text-xs text-zinc-500 mt-0.5">{abnahme.notizen}</p>}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      abnahme.status === "bestanden" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                      abnahme.status === "offen" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                      "bg-red-500/20 text-red-400 border-red-500/30"
                    }`}>
                      {abnahme.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Abnahme-Workflow ───────────────────────────────────── */}
          {auftrag && <AbnahmeStatus auftragId={auftrag.id} />}

          {/* ── Materialzuweisung ──────────────────────────────────── */}
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
            <SectionHeading icon={<Package className="w-4 h-4" />} label="Materialzuweisung" />
            {materialLoading ? (
              <p className="text-zinc-600 text-sm mt-2">Laden...</p>
            ) : material.length === 0 ? (
              <p className="text-zinc-600 text-sm mt-2">Noch kein Material zugewiesen</p>
            ) : (
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a2a2a]">
                      <th className="text-left pb-2 text-zinc-500 font-medium text-xs">Datum</th>
                      <th className="text-left pb-2 text-zinc-500 font-medium text-xs">Artikel</th>
                      <th className="text-right pb-2 text-zinc-500 font-medium text-xs">Menge</th>
                      <th className="text-left pb-2 text-zinc-500 font-medium text-xs pl-3">Typ</th>
                      <th className="text-left pb-2 text-zinc-500 font-medium text-xs pl-3">Mitarbeiter</th>
                    </tr>
                  </thead>
                  <tbody>
                    {material.map(b => (
                      <tr key={b.id} className="border-b border-[#1e1e1e] hover:bg-[#1c1c1c] transition-colors">
                        <td className="py-2.5 text-zinc-500 text-xs whitespace-nowrap">
                          {new Date(b.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
                        </td>
                        <td className="py-2.5 text-white text-xs">{b.artikel.name}</td>
                        <td className="py-2.5 text-right text-white text-xs">{b.menge} {b.artikel.einheit}</td>
                        <td className="py-2.5 pl-3">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-[#2a2a2a] text-zinc-400">{b.typ}</span>
                        </td>
                        <td className="py-2.5 pl-3">
                          {b.mitarbeiter ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-violet-500/20 text-violet-400">
                              {b.mitarbeiter.vorname} {b.mitarbeiter.nachname}
                            </span>
                          ) : (
                            <span className="text-zinc-600 text-xs">–</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* ── Right (sidebar) ─────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Förderprüfung */}
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
            <SectionHeading icon={<TreePine className="w-4 h-4" />} label="Förderprogramm-Check" />
            <AuftragFoerderCheck
              auftragId={auftrag.id}
              bundesland={auftrag.bundesland ?? null}
              flaeche_ha={auftrag.flaeche_ha ?? null}
              baumarten={auftrag.baumarten ?? null}
            />
          </div>

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
              {/* GPS-Koordinaten (Sprint U) */}
              <div>
                <h4 className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Standort GPS
                </h4>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Breitengrad (lat)</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={lat}
                      onChange={e => setLat(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
                      placeholder="z.B. 50.123456"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Längengrad (lng)</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={lng}
                      onChange={e => setLng(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
                      placeholder="z.B. 8.654321"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Plus Code (optional)</label>
                  <input
                    type="text"
                    value={plusCode}
                    onChange={e => setPlusCode(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
                    placeholder="z.B. 8FWH4HGW+QV"
                  />
                </div>
                {lat && lng && (
                  <a
                    href={`https://www.google.com/maps?q=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300"
                  >
                    <MapPin className="w-3 h-3" /> In Google Maps öffnen
                  </a>
                )}
                {plusCode && (
                  <a
                    href={`https://plus.codes/${plusCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-400"
                  >
                    Plus Code: {plusCode}
                  </a>
                )}
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

          {/* Rechnungen */}
          {auftrag.rechnungen && auftrag.rechnungen.length > 0 && (
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Rechnungen</p>
              <div className="space-y-1.5">
                {auftrag.rechnungen.map(r => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">{r.nummer}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{r.betrag.toFixed(2)} €</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        r.status === "bezahlt" ? "bg-emerald-500/20 text-emerald-400" :
                        r.status === "offen" ? "bg-amber-500/20 text-amber-400" :
                        "bg-zinc-500/20 text-zinc-400"
                      }`}>{r.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* Kundenportal-Link */}
          {auftrag.waldbesitzerEmail && (
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-2">Kundenportal</p>
              <a
                href={`https://peru-otter-113714.hostingersite.com/kundenportal/?auftrag=${auftrag.wpProjektId ?? auftrag.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Im Kundenportal ansehen
              </a>
            </div>
          )}

        </div>
      </div>

      {/* Audit-Log Timeline (Sprint S) */}
      {auftragLog.length > 0 && (
        <div className="mt-6 bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Verlauf</h3>
          <div className="space-y-2">
            {auftragLog.map((l) => (
              <div key={l.id} className="flex items-start gap-3 text-xs">
                <span className="text-zinc-600 whitespace-nowrap">{new Date(l.createdAt).toLocaleString("de-DE")}</span>
                <span className="text-zinc-400">
                  {l.aktion === "status_geaendert"
                    ? `Status: ${l.von ?? "—"} → ${l.nach ?? "—"}`
                    : l.aktion}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
