"use client"

import { Clock, MapPin, Leaf, Drill, Scissors, Shield, Fence, Wrench, Cloud, MessageSquare } from "lucide-react"

interface TagesprotokollDetailProps {
  protokoll: TagesprotokollFull
}

export interface TagesprotokollFull {
  id: string
  datum: string
  status: string
  ersteller?: string | null
  auftrag?: { titel: string; nummer?: string | null } | null
  // Sektion 1
  forstamt?: string | null
  revier?: string | null
  revierleiter?: string | null
  abteilung?: string | null
  waldbesitzerName?: string | null
  // Sektion 2
  zeitBeginn?: string | null
  zeitEnde?: string | null
  pausezeit?: number | null
  // Sektion 3
  std_einschlag?: number | null
  std_handpflanzung?: number | null
  stk_pflanzung?: number | null
  // Sektion 4
  std_zum_bohrer?: number | null
  std_mit_bohrer?: number | null
  stk_pflanzung_mit_bohrer?: number | null
  // Sektion 5
  std_freischneider?: number | null
  std_motorsaege?: number | null
  // Sektion 6
  std_wuchshuellen?: number | null
  stk_wuchshuellen?: number | null
  std_netze_staebe_spiralen?: number | null
  stk_netze_staebe_spiralen?: number | null
  // Sektion 7
  std_zaunbau?: number | null
  stk_drahtverbinder?: number | null
  lfm_zaunbau?: number | null
  // Sektion 8
  std_nachbesserung?: number | null
  stk_nachbesserung?: number | null
  std_sonstige_arbeiten?: number | null
  // Sektion 9
  witterung?: string | null
  gpsStartLat?: number | null
  gpsStartLon?: number | null
  // Sektion 10
  kommentar?: string | null
  bericht?: string | null
  // meta
  eingereichtAm?: string | null
}

function hasValue(v: unknown): boolean {
  if (v === null || v === undefined) return false
  if (typeof v === "number") return v !== 0
  if (typeof v === "string") return v.trim() !== ""
  return true
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    entwurf: "bg-zinc-700 text-zinc-300 border-zinc-600",
    eingereicht: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    genehmigt: "bg-blue-500/20 text-blue-400 border-blue-500/40",
    abgelehnt: "bg-red-500/20 text-red-400 border-red-500/40",
  }
  const labelMap: Record<string, string> = {
    entwurf: "Entwurf",
    eingereicht: "Eingereicht",
    genehmigt: "Genehmigt",
    abgelehnt: "Abgelehnt",
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${map[status] ?? "bg-zinc-700 text-zinc-400 border-zinc-600"}`}>
      {labelMap[status] ?? status}
    </span>
  )
}

function DetailSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="border border-[#2a2a2a] rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#111]">
        <span className="text-zinc-500">{icon}</span>
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{title}</span>
      </div>
      <div className="p-4 bg-[#0d0d0d]">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {children}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, unit = "" }: { label: string; value: unknown; unit?: string }) {
  if (!hasValue(value)) return null
  return (
    <>
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-sm text-white text-right">
        {typeof value === "number"
          ? `${value.toLocaleString("de-DE")}${unit ? " " + unit : ""}`
          : String(value)}
        {typeof value !== "number" && unit ? ` ${unit}` : ""}
      </span>
    </>
  )
}

function fmt(dt: string) {
  try {
    return new Date(dt).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dt
  }
}

export default function TagesprotokollDetail({ protokoll: p }: TagesprotokollDetailProps) {
  // Gesamtstunden
  const stdFields = [
    p.std_einschlag,
    p.std_handpflanzung,
    p.std_zum_bohrer,
    p.std_mit_bohrer,
    p.std_freischneider,
    p.std_motorsaege,
    p.std_wuchshuellen,
    p.std_netze_staebe_spiralen,
    p.std_zaunbau,
    p.std_nachbesserung,
    p.std_sonstige_arbeiten,
  ]
  const gesamtStd = stdFields.reduce((sum: number, v) => sum + (v ?? 0), 0)

  const hasRevier = hasValue(p.forstamt) || hasValue(p.revier) || hasValue(p.revierleiter) || hasValue(p.abteilung) || hasValue(p.waldbesitzerName)
  const hasArbeitszeit = hasValue(p.zeitBeginn) || hasValue(p.zeitEnde) || hasValue(p.pausezeit)
  const hasHandpflanzung = hasValue(p.std_einschlag) || hasValue(p.std_handpflanzung) || hasValue(p.stk_pflanzung)
  const hasBohrer = hasValue(p.std_zum_bohrer) || hasValue(p.std_mit_bohrer) || hasValue(p.stk_pflanzung_mit_bohrer)
  const hasFreischneider = hasValue(p.std_freischneider) || hasValue(p.std_motorsaege)
  const hasPflanzenschutz = hasValue(p.std_wuchshuellen) || hasValue(p.stk_wuchshuellen) || hasValue(p.std_netze_staebe_spiralen) || hasValue(p.stk_netze_staebe_spiralen)
  const hasZaunbau = hasValue(p.std_zaunbau) || hasValue(p.stk_drahtverbinder) || hasValue(p.lfm_zaunbau)
  const hasNachbesserung = hasValue(p.std_nachbesserung) || hasValue(p.stk_nachbesserung) || hasValue(p.std_sonstige_arbeiten)
  const hasWitterung = hasValue(p.witterung) || hasValue(p.gpsStartLat) || hasValue(p.gpsStartLon)
  const hasKommentar = hasValue(p.kommentar) || hasValue(p.bericht)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-white text-base">
            {p.auftrag?.titel ?? "Protokoll"}
          </h3>
          <p className="text-sm text-zinc-500 mt-0.5">
            {new Date(p.datum).toLocaleDateString("de-DE", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <StatusBadge status={p.status} />
      </div>
      {p.ersteller && (
        <p className="text-xs text-zinc-500">Gruppenführer: <span className="text-zinc-300">{p.ersteller}</span></p>
      )}

      {/* Revier */}
      {hasRevier && (
        <DetailSection icon={<Leaf className="w-4 h-4" />} title="Revier und Gruppe">
          <Row label="Forstamt" value={p.forstamt} />
          <Row label="Revier" value={p.revier} />
          <Row label="Revierleiter" value={p.revierleiter} />
          <Row label="Abteilung" value={p.abteilung} />
          <Row label="Waldbesitzer" value={p.waldbesitzerName} />
        </DetailSection>
      )}

      {/* Arbeitszeit */}
      {hasArbeitszeit && (
        <DetailSection icon={<Clock className="w-4 h-4" />} title="Arbeitszeit vor Ort">
          {p.zeitBeginn && <Row label="Beginn" value={fmt(p.zeitBeginn)} />}
          {p.zeitEnde && <Row label="Ende" value={fmt(p.zeitEnde)} />}
          <Row label="Pause" value={p.pausezeit} unit="Min." />
        </DetailSection>
      )}

      {/* Handpflanzung */}
      {hasHandpflanzung && (
        <DetailSection icon={<Leaf className="w-4 h-4" />} title="Pflanzung mit Hand">
          <Row label="Einschlag" value={p.std_einschlag} unit="Std." />
          <Row label="Handpflanzung" value={p.std_handpflanzung} unit="Std." />
          <Row label="Stückzahl" value={p.stk_pflanzung} unit="Stk." />
        </DetailSection>
      )}

      {/* Bohrer */}
      {hasBohrer && (
        <DetailSection icon={<Drill className="w-4 h-4" />} title="Pflanzung mit Bohrer">
          <Row label="Handpflanzung zum Bohrer" value={p.std_zum_bohrer} unit="Std." />
          <Row label="Laufzeit Bohrer" value={p.std_mit_bohrer} unit="Std." />
          <Row label="Stückzahl" value={p.stk_pflanzung_mit_bohrer} unit="Stk." />
        </DetailSection>
      )}

      {/* Freischneider */}
      {hasFreischneider && (
        <DetailSection icon={<Scissors className="w-4 h-4" />} title="Freischneider & Motorsäge">
          <Row label="Freischneider" value={p.std_freischneider} unit="Std." />
          <Row label="Motorsäge" value={p.std_motorsaege} unit="Std." />
        </DetailSection>
      )}

      {/* Pflanzenschutz */}
      {hasPflanzenschutz && (
        <DetailSection icon={<Shield className="w-4 h-4" />} title="Pflanzenschutz">
          <Row label="Wuchshüllen anbringen" value={p.std_wuchshuellen} unit="Std." />
          <Row label="Stk. Wuchshüllen" value={p.stk_wuchshuellen} unit="Stk." />
          <Row label="Netz/Stäbe/Spiralen" value={p.std_netze_staebe_spiralen} unit="Std." />
          <Row label="Stk. Netz/Stäbe/Spiralen" value={p.stk_netze_staebe_spiralen} unit="Stk." />
        </DetailSection>
      )}

      {/* Zaunbau */}
      {hasZaunbau && (
        <DetailSection icon={<Fence className="w-4 h-4" />} title="Zaunbau">
          <Row label="Std. Zaunbau" value={p.std_zaunbau} unit="Std." />
          <Row label="Drahtverbinder" value={p.stk_drahtverbinder} unit="Stk." />
          <Row label="Laufmeter" value={p.lfm_zaunbau} unit="lfm" />
        </DetailSection>
      )}

      {/* Nachbesserung */}
      {hasNachbesserung && (
        <DetailSection icon={<Wrench className="w-4 h-4" />} title="Nachbesserung">
          <Row label="Nachbesserung" value={p.std_nachbesserung} unit="Std." />
          <Row label="Stk. Nachbesserung" value={p.stk_nachbesserung} unit="Stk." />
          <Row label="Sonstige Arbeiten" value={p.std_sonstige_arbeiten} unit="Std." />
        </DetailSection>
      )}

      {/* Witterung */}
      {hasWitterung && (
        <DetailSection icon={<Cloud className="w-4 h-4" />} title="Witterung & Standort">
          <Row label="Witterung" value={p.witterung} />
          <Row label="GPS Lat" value={p.gpsStartLat} />
          <Row label="GPS Lon" value={p.gpsStartLon} />
        </DetailSection>
      )}

      {/* Kommentar */}
      {hasKommentar && (
        <DetailSection icon={<MessageSquare className="w-4 h-4" />} title="Kommentar & Bericht">
          {p.kommentar && (
            <div className="col-span-2">
              <p className="text-xs text-zinc-500 mb-1">Kommentar</p>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{p.kommentar}</p>
            </div>
          )}
          {p.bericht && (
            <div className="col-span-2 mt-2">
              <p className="text-xs text-zinc-500 mb-1">Bericht (intern)</p>
              <p className="text-sm text-zinc-400 whitespace-pre-wrap">{p.bericht}</p>
            </div>
          )}
        </DetailSection>
      )}

      {/* Stunden-Zusammenfassung */}
      {gesamtStd > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-emerald-400 font-medium">Gesamtstunden</span>
          <span className="text-lg font-bold text-emerald-400">{gesamtStd.toFixed(2)} Std.</span>
        </div>
      )}
    </div>
  )
}
