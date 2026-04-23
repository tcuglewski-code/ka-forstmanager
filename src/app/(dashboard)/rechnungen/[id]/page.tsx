"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Receipt, ArrowLeft, Loader2, CheckCircle, Clock,
  FileText, ExternalLink, Printer, XCircle, AlertCircle,
  Download, BadgeCheck, Lock, History, ChevronDown
} from "lucide-react"
import ZipayoButton from "@/components/payments/ZipayoButton"
import AuditLogSection from "@/components/rechnung/AuditLogSection"
import VersionsSection from "@/components/rechnung/VersionsSection"
import ProtokolleSection from "@/components/rechnung/ProtokolleSection"

interface Rechnung {
  id: string
  nummer: string
  betrag: number
  mwst: number
  status: string
  rechnungsDatum: string
  faelligAm?: string | null
  pdfUrl?: string | null
  notizen?: string | null
  auftrag?: {
    id: string
    titel: string
    waldbesitzer?: string
    waldbesitzerEmail?: string
  } | null
  // Sprint GB-01: GoBD Lock-Status
  isLocked?: boolean
  lockInfo?: {
    lockedAt: string
    lockedBy: string
    lockReason: string
  } | null
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  offen: { label: "Offen", color: "bg-blue-100 text-blue-800 border-blue-500/30", icon: Clock },
  freigegeben: { label: "Freigegeben", color: "bg-amber-100 text-amber-800 border-amber-500/30", icon: AlertCircle },
  bezahlt: { label: "Bezahlt", color: "bg-emerald-100 text-emerald-800 border-emerald-500/30", icon: CheckCircle },
  storniert: { label: "Storniert", color: "bg-red-100 text-red-800 border-red-500/30", icon: XCircle },
}

export default function RechnungDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [rechnung, setRechnung] = useState<Rechnung | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusChanging, setStatusChanging] = useState(false)
  const [statusConfirm, setStatusConfirm] = useState<string | null>(null)

  const fetchRechnung = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/rechnungen/${id}`)
      if (!res.ok) throw new Error("Rechnung nicht gefunden")
      const data = await res.json()
      setRechnung(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchRechnung()
  }, [fetchRechnung])

  const handlePaymentSuccess = async () => {
    await fetch(`/api/rechnungen/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "bezahlt" }),
    })
    await fetchRechnung()
  }

  // FM-22: Status-Workflow — erlaubte Übergänge
  const validTransitions: Record<string, { status: string; label: string; icon: React.ElementType; color: string }[]> = {
    entwurf: [
      { status: "offen", label: "Freischalten", icon: Clock, color: "bg-blue-600 hover:bg-blue-500 text-white" },
      { status: "storniert", label: "Stornieren", icon: XCircle, color: "bg-red-600 hover:bg-red-500 text-white" },
    ],
    offen: [
      { status: "bezahlt", label: "Als bezahlt markieren", icon: CheckCircle, color: "bg-emerald-600 hover:bg-emerald-500 text-white" },
      { status: "freigegeben", label: "Freigeben", icon: BadgeCheck, color: "bg-amber-600 hover:bg-amber-500 text-white" },
      { status: "storniert", label: "Stornieren", icon: XCircle, color: "bg-red-600 hover:bg-red-500 text-white" },
    ],
    freigegeben: [
      { status: "bezahlt", label: "Als bezahlt markieren", icon: CheckCircle, color: "bg-emerald-600 hover:bg-emerald-500 text-white" },
      { status: "storniert", label: "Stornieren", icon: XCircle, color: "bg-red-600 hover:bg-red-500 text-white" },
    ],
    ueberfaellig: [
      { status: "bezahlt", label: "Als bezahlt markieren", icon: CheckCircle, color: "bg-emerald-600 hover:bg-emerald-500 text-white" },
      { status: "storniert", label: "Stornieren", icon: XCircle, color: "bg-red-600 hover:bg-red-500 text-white" },
    ],
  }

  const handleStatusChange = async (newStatus: string) => {
    setStatusChanging(true)
    try {
      const res = await fetch(`/api/rechnungen/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Statusänderung fehlgeschlagen")
      }
      await fetchRechnung()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fehler bei Statusänderung")
    } finally {
      setStatusChanging(false)
      setStatusConfirm(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  if (error || !rechnung) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-on-surface)' }}>Rechnung nicht gefunden</h2>
        <p className="mb-6" style={{ color: 'var(--color-on-surface-variant)' }}>{error || "Die angeforderte Rechnung existiert nicht."}</p>
        <button
          onClick={() => router.push("/rechnungen")}
          className="px-4 py-2 rounded-lg transition-colors"
          style={{
            backgroundColor: 'var(--color-surface-container)',
            border: '1px solid var(--color-outline-variant)',
            color: 'var(--color-on-surface)'
          }}
        >
          Zurück zu Rechnungen
        </button>
      </div>
    )
  }

  const statusInfo = statusConfig[rechnung.status] || statusConfig.offen
  const StatusIcon = statusInfo.icon
  const bruttoBetrag = rechnung.betrag * (1 + (rechnung.mwst || 19) / 100)
  const mwstBetrag = rechnung.betrag * ((rechnung.mwst || 19) / 100)
  const istOffen = rechnung.status === "offen" || rechnung.status === "freigegeben"
  // Sprint GB-01: GoBD Lock-Check
  const isLocked = rechnung.isLocked || false

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/rechnungen")}
          className="p-2 rounded-lg bg-[var(--color-surface-container-highest)] border border-border text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] hover:bg-[#252525] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: "var(--color-on-surface)" }}>
            <Receipt className="w-6 h-6 text-emerald-400" />
            Rechnung {rechnung.nummer}
          </h1>
          <p className="text-[var(--color-on-surface-variant)] text-sm mt-1">
            Erstellt am {new Date(rechnung.rechnungsDatum).toLocaleDateString("de-DE")}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Status Card */}
          <div className="bg-[var(--color-surface-container)] border border-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusInfo.color.split(" ")[0]}`}>
                  <StatusIcon className={`w-5 h-5 ${statusInfo.color.split(" ")[1]}`} />
                </div>
                <div>
                  <p className="text-[var(--color-on-surface-variant)] text-sm">Status</p>
                  <p className={`font-semibold ${statusInfo.color.split(" ")[1]}`}>{statusInfo.label}</p>
                </div>
              </div>
              {rechnung.faelligAm && (
                <div className="text-right">
                  <p className="text-[var(--color-on-surface-variant)] text-sm">Fällig am</p>
                  <p className="text-[var(--color-on-surface)] font-medium">
                    {new Date(rechnung.faelligAm).toLocaleDateString("de-DE")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sprint GB-01: GoBD Lock-Hinweis */}
          {isLocked && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <h4 className="text-amber-400 font-semibold">GoBD-gesperrt</h4>
                  <p className="text-[var(--color-on-surface-variant)] text-sm mt-1">
                    Diese Rechnung ist {rechnung.lockInfo?.lockReason || "nach den GoBD-Richtlinien"} gesperrt 
                    und kann nicht mehr bearbeitet werden. Die Sperrung erfolgte am{" "}
                    {rechnung.lockInfo?.lockedAt 
                      ? new Date(rechnung.lockInfo.lockedAt).toLocaleDateString("de-DE") 
                      : new Date(rechnung.rechnungsDatum).toLocaleDateString("de-DE")
                    }.
                  </p>
                  <p className="text-amber-400/80 text-sm mt-2 inline-flex items-center gap-1">
                    <History className="w-3 h-3" /> Siehe Änderungsprotokoll unten
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Betrag Card */}
          <div className="bg-[var(--color-surface-container)] border border-border rounded-xl p-6">
            <h3 className="text-sm text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-4">Beträge</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-on-surface-variant)]">Netto</span>
                <span className="text-[var(--color-on-surface)]">{rechnung.betrag.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-on-surface-variant)]">MwSt. {rechnung.mwst || 19}%</span>
                <span className="text-[var(--color-on-surface)]">{mwstBetrag.toFixed(2)} €</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="text-[var(--color-on-surface)] font-semibold">Gesamt (Brutto)</span>
                <span className="text-2xl font-bold text-emerald-400">{bruttoBetrag.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Auftrag Card */}
          {rechnung.auftrag && (
            <div className="bg-[var(--color-surface-container)] border border-border rounded-xl p-6">
              <h3 className="text-sm text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-4">Verknüpfter Auftrag</h3>
              <div className="space-y-2">
                <a
                  href={`/auftraege/${rechnung.auftrag.id}`}
                  className="text-[var(--color-on-surface)] font-medium hover:text-emerald-400 flex items-center gap-2"
                >
                  {rechnung.auftrag.titel}
                  <ExternalLink className="w-4 h-4" />
                </a>
                {rechnung.auftrag.waldbesitzer && (
                  <p className="text-[var(--color-on-surface-variant)] text-sm">Kunde: {rechnung.auftrag.waldbesitzer}</p>
                )}
                {rechnung.auftrag.waldbesitzerEmail && (
                  <p className="text-[var(--color-on-surface-variant)] text-sm">{rechnung.auftrag.waldbesitzerEmail}</p>
                )}
              </div>
            </div>
          )}

          {/* Notizen */}
          {rechnung.notizen && (
            <div className="bg-[var(--color-surface-container)] border border-border rounded-xl p-6">
              <h3 className="text-sm text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-4">Notizen</h3>
              <p className="text-[var(--color-on-surface)] text-sm whitespace-pre-wrap">{rechnung.notizen}</p>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="space-y-4">
          {/* Zipayo Payment - Sprint GB-01: nur bei nicht-gesperrten Rechnungen */}
          {istOffen && !isLocked && (
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#161616] border border-[#6366f1]/30 rounded-xl p-6">
              <h3 className="text-[var(--color-on-surface)] font-semibold mb-2">Online bezahlen</h3>
              <p className="text-[var(--color-on-surface-variant)] text-sm mb-4">
                Bezahlen Sie diese Rechnung schnell und sicher per QR-Code oder Link.
              </p>
              <ZipayoButton
                amount={bruttoBetrag}
                description={`Rechnung ${rechnung.nummer}`}
                invoiceId={rechnung.id}
                onPaymentSuccess={handlePaymentSuccess}
                variant="full"
              />
            </div>
          )}
          
          {/* FM-22: Status-Änderung für Admins (auch bei GoBD-gesperrten Rechnungen erlaubt) */}
          {(validTransitions[rechnung.status] ?? []).length > 0 && (
            <div className="bg-[var(--color-surface-container)] border border-border rounded-xl p-4">
              <h3 className="text-[var(--color-on-surface)] font-semibold text-sm mb-3 flex items-center gap-2">
                <ChevronDown className="w-4 h-4" />
                Status ändern
              </h3>
              {isLocked && (
                <p className="text-amber-400 text-xs mb-3 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> GoBD-gesperrt — Statusänderung trotzdem möglich
                </p>
              )}
              <div className="space-y-2">
                {(validTransitions[rechnung.status] ?? []).map(t => {
                  const TIcon = t.icon
                  return statusConfirm === t.status ? (
                    <div key={t.status} className="border border-amber-500/30 rounded-lg p-3 bg-amber-500/5">
                      <p className="text-[var(--color-on-surface)] text-sm mb-2">
                        Status wirklich auf <strong>&quot;{t.label}&quot;</strong> setzen?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusChange(t.status)}
                          disabled={statusChanging}
                          className="flex-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
                        >
                          {statusChanging ? "…" : "Bestätigen"}
                        </button>
                        <button
                          onClick={() => setStatusConfirm(null)}
                          className="flex-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)] border border-border hover:bg-[#333]"
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      key={t.status}
                      onClick={() => setStatusConfirm(t.status)}
                      disabled={statusChanging}
                      className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${t.color}`}
                    >
                      <TIcon className="w-4 h-4" />
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Bezahlt Badge */}
          {rechnung.status === "bezahlt" && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-emerald-400 font-semibold text-lg">Bezahlt</h3>
              <p className="text-[var(--color-on-surface-variant)] text-sm mt-1">Diese Rechnung wurde beglichen.</p>
            </div>
          )}

          {/* Actions */}
          <div className="bg-[var(--color-surface-container)] border border-border rounded-xl p-4 space-y-3">
            {/* ZUGFeRD E-Rechnung Download */}
            <div className="relative">
              <a
                href={`/api/rechnungen/${rechnung.id}/xrechnung`}
                download
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-500 hover:to-emerald-600 transition-all font-medium"
              >
                <Download className="w-4 h-4" />
                ZUGFeRD PDF herunterladen
              </a>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs rounded-full">
                  <BadgeCheck className="w-3 h-3" />
                  ZUGFeRD 2.3
                </span>
                <span className="text-[var(--color-on-surface-variant)] text-xs">E-Rechnung (ab 2025)</span>
              </div>
            </div>
            
            <div className="border-t border-border pt-3">
              <a
                href={`/rechnungen/${rechnung.id}/drucken`}
                target="_blank"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#222] border border-border text-[var(--color-on-surface)] rounded-lg hover:bg-surface-container-highest transition-colors"
              >
                <Printer className="w-4 h-4" />
                Druckansicht
              </a>
            </div>
            
            {rechnung.pdfUrl && (
              <a
                href={rechnung.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#222] border border-border text-[var(--color-on-surface)] rounded-lg hover:bg-surface-container-highest transition-colors"
              >
                <FileText className="w-4 h-4" />
                Altes PDF
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Sprint P2-1: Zugehörige Protokolle */}
      <div className="mt-8">
        <ProtokolleSection rechnungId={rechnung.id} auftragId={rechnung.auftrag?.id} />
      </div>

      {/* Sprint GB-03: Versions-Section - GoBD-Compliance */}
      <div className="mt-8">
        <VersionsSection rechnungId={rechnung.id} />
      </div>

      {/* Sprint GB-02: Audit-Log Section - GoBD-Compliance */}
      <div className="mt-6">
        <AuditLogSection rechnungId={rechnung.id} />
      </div>
    </div>
  )
}
