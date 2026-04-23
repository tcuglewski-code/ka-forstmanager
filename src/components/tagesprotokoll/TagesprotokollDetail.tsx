"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Clock, MapPin, Leaf, Drill, Scissors, Shield, Fence, Wrench, Cloud, MessageSquare, CheckCircle, XCircle, Loader2, Bot, FileText } from "lucide-react"
import { toast } from "sonner"

interface TagesprotokollDetailProps {
  protokoll: TagesprotokollFull
  onStatusChange?: (id: string, newStatus: string) => void
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
  genehmigungsKommentar?: string | null
  lockedAt?: string | null
}

function hasValue(v: unknown): boolean {
  if (v === null || v === undefined) return false
  if (typeof v === "number") return v !== 0
  if (typeof v === "string") return v.trim() !== ""
  return true
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    entwurf: "bg-[var(--color-surface-container-high)] text-zinc-300 border-zinc-600",
    eingereicht: "bg-emerald-100 text-emerald-800 border-emerald-500/40",
    genehmigt: "bg-blue-100 text-blue-800 border-blue-500/40",
    abgelehnt: "bg-red-100 text-red-800 border-red-500/40",
  }
  const labelMap: Record<string, string> = {
    entwurf: "Entwurf",
    eingereicht: "Eingereicht",
    genehmigt: "Genehmigt",
    abgelehnt: "Abgelehnt",
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${map[status] ?? "bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] border-zinc-600"}`}>
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
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-surface-container-low)]">
        <span className="text-[var(--color-on-surface-variant)]">{icon}</span>
        <span className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">{title}</span>
      </div>
      <div className="p-4 bg-[var(--color-surface-container)]">
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
      <span className="text-xs text-[var(--color-on-surface-variant)]">{label}</span>
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

export default function TagesprotokollDetail({ protokoll: p, onStatusChange }: TagesprotokollDetailProps) {
  const { data: session } = useSession()
  const userRole = (session?.user as { role?: string })?.role
  const canApprove = userRole === 'admin' || userRole === 'ka_admin' || userRole === 'supervisor'

  // Genehmigungs-Workflow State
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectComment, setRejectComment] = useState("")
  const [localStatus, setLocalStatus] = useState(p.status)
  const [localKommentar, setLocalKommentar] = useState(p.genehmigungsKommentar ?? null)

  // KI-Zusammenfassung State
  const [zusammenfassung, setZusammenfassung] = useState<string | null>(null)
  const [loadingZf, setLoadingZf] = useState(false)

  async function handleGenehmigen() {
    if (!confirm('Protokoll genehmigen?')) return
    setApproving(true)
    try {
      const res = await fetch(`/api/tagesprotokoll/${p.id}/genehmigen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Fehler beim Genehmigen')
        return
      }
      setLocalStatus('genehmigt')
      toast.success('Protokoll genehmigt')
      onStatusChange?.(p.id, 'genehmigt')
    } catch {
      toast.error('Netzwerkfehler')
    } finally {
      setApproving(false)
    }
  }

  async function handleAblehnen() {
    if (!rejectComment.trim()) {
      toast.error('Bitte Ablehnungsgrund angeben')
      return
    }
    setRejecting(true)
    try {
      const res = await fetch(`/api/tagesprotokoll/${p.id}/ablehnen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kommentar: rejectComment.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Fehler beim Ablehnen')
        return
      }
      setLocalStatus('abgelehnt')
      setLocalKommentar(rejectComment.trim())
      setShowRejectModal(false)
      setRejectComment("")
      toast.success('Protokoll abgelehnt')
      onStatusChange?.(p.id, 'abgelehnt')
    } catch {
      toast.error('Netzwerkfehler')
    } finally {
      setRejecting(false)
    }
  }

  async function handleZusammenfassung() {
    if (zusammenfassung) return
    setLoadingZf(true)
    try {
      const res = await fetch(`/api/protokoll/${p.id}/zusammenfassung`)
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'KI-Zusammenfassung fehlgeschlagen')
        return
      }
      const data = await res.json()
      setZusammenfassung(data.zusammenfassung)
    } catch {
      toast.error('Netzwerkfehler')
    } finally {
      setLoadingZf(false)
    }
  }

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
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-0.5">
            {new Date(p.datum).toLocaleDateString("de-DE", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <StatusBadge status={localStatus} />
      </div>
      {p.ersteller && (
        <p className="text-xs text-[var(--color-on-surface-variant)]">Gruppenführer: <span className="text-zinc-300">{p.ersteller}</span></p>
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
              <p className="text-xs text-[var(--color-on-surface-variant)] mb-1">Kommentar</p>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{p.kommentar}</p>
            </div>
          )}
          {p.bericht && (
            <div className="col-span-2 mt-2">
              <p className="text-xs text-[var(--color-on-surface-variant)] mb-1">Bericht (intern)</p>
              <p className="text-sm text-[var(--color-on-surface-variant)] whitespace-pre-wrap">{p.bericht}</p>
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

      {/* Genehmigungs-Kommentar anzeigen */}
      {localKommentar && (
        <div className={`rounded-lg px-4 py-3 border ${localStatus === 'abgelehnt' ? 'bg-red-500/10 border-red-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
          <p className="text-xs text-[var(--color-on-surface-variant)] mb-1">Genehmigungs-Kommentar</p>
          <p className={`text-sm whitespace-pre-wrap ${localStatus === 'abgelehnt' ? 'text-red-300' : 'text-blue-300'}`}>{localKommentar}</p>
        </div>
      )}

      {/* Genehmigungs-Buttons (nur Admin/Supervisor, nur bei 'eingereicht') */}
      {canApprove && localStatus === 'eingereicht' && (
        <div className="flex gap-3">
          <button
            onClick={handleGenehmigen}
            disabled={approving}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Genehmigen
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Ablehnen
          </button>
        </div>
      )}

      {/* PDF-Export (bei eingereicht oder genehmigt) */}
      {(localStatus === 'eingereicht' || localStatus === 'genehmigt') && (
        <button
          onClick={() => window.open(`/api/tagesprotokoll/${p.id}/pdf`, '_blank')}
          className="flex items-center gap-2 text-sm text-[var(--color-on-surface-variant)] hover:text-white border border-border px-4 py-2 rounded-lg hover:bg-[var(--color-surface-container-lowest)] transition-colors"
        >
          <FileText className="w-4 h-4" />
          PDF exportieren
        </button>
      )}

      {/* KI-Zusammenfassung (bei eingereicht oder genehmigt) */}
      {(localStatus === 'eingereicht' || localStatus === 'genehmigt') && (
        <div>
          {!zusammenfassung ? (
            <button
              onClick={handleZusammenfassung}
              disabled={loadingZf}
              className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 px-4 py-2 rounded-lg hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
            >
              {loadingZf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
              {loadingZf ? 'Generiere...' : 'KI-Zusammenfassung generieren'}
            </button>
          ) : (
            <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">KI-Zusammenfassung</span>
              </div>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{zusammenfassung}</p>
            </div>
          )}
        </div>
      )}

      {/* Ablehnen-Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowRejectModal(false)}>
          <div className="bg-[var(--color-surface-container-lowest)] border border-border rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-white mb-3">Protokoll ablehnen</h3>
            <p className="text-sm text-[var(--color-on-surface-variant)] mb-3">Bitte geben Sie einen Grund für die Ablehnung an (Pflicht):</p>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              rows={3}
              className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Ablehnungsgrund..."
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowRejectModal(false); setRejectComment("") }}
                className="flex-1 px-4 py-2 rounded-lg text-sm text-[var(--color-on-surface-variant)] border border-border hover:bg-[#222] transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAblehnen}
                disabled={rejecting || !rejectComment.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {rejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Ablehnen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
