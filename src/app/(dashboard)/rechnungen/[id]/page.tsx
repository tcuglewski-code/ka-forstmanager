"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  Receipt, ArrowLeft, Loader2, CheckCircle, Clock, 
  FileText, ExternalLink, Printer, XCircle, AlertCircle 
} from "lucide-react"
import ZipayoButton from "@/components/payments/ZipayoButton"

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
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  offen: { label: "Offen", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Clock },
  freigegeben: { label: "Freigegeben", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: AlertCircle },
  bezahlt: { label: "Bezahlt", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle },
  storniert: { label: "Storniert", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
}

export default function RechnungDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [rechnung, setRechnung] = useState<Rechnung | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    // Rechnung als bezahlt markieren
    await fetch(`/api/rechnungen/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "bezahlt" }),
    })
    // Neu laden
    await fetchRechnung()
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
        <h2 className="text-xl font-bold text-white mb-2">Rechnung nicht gefunden</h2>
        <p className="text-zinc-400 mb-6">{error || "Die angeforderte Rechnung existiert nicht."}</p>
        <button
          onClick={() => router.push("/rechnungen")}
          className="px-4 py-2 bg-[#222] border border-[#333] text-white rounded-lg hover:bg-[#2a2a2a]"
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

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/rechnungen")}
          className="p-2 rounded-lg bg-[#1e1e1e] border border-[#2a2a2a] text-zinc-400 hover:text-white hover:bg-[#252525] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Receipt className="w-6 h-6 text-emerald-400" />
            Rechnung {rechnung.nummer}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Erstellt am {new Date(rechnung.rechnungsDatum).toLocaleDateString("de-DE")}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Status Card */}
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusInfo.color.split(" ")[0]}`}>
                  <StatusIcon className={`w-5 h-5 ${statusInfo.color.split(" ")[1]}`} />
                </div>
                <div>
                  <p className="text-zinc-500 text-sm">Status</p>
                  <p className={`font-semibold ${statusInfo.color.split(" ")[1]}`}>{statusInfo.label}</p>
                </div>
              </div>
              {rechnung.faelligAm && (
                <div className="text-right">
                  <p className="text-zinc-500 text-sm">Fällig am</p>
                  <p className="text-white font-medium">
                    {new Date(rechnung.faelligAm).toLocaleDateString("de-DE")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Betrag Card */}
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
            <h3 className="text-sm text-zinc-500 uppercase tracking-wider mb-4">Beträge</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Netto</span>
                <span className="text-white">{rechnung.betrag.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">MwSt. {rechnung.mwst || 19}%</span>
                <span className="text-white">{mwstBetrag.toFixed(2)} €</span>
              </div>
              <div className="border-t border-[#2a2a2a] pt-3 flex justify-between">
                <span className="text-white font-semibold">Gesamt (Brutto)</span>
                <span className="text-2xl font-bold text-emerald-400">{bruttoBetrag.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Auftrag Card */}
          {rechnung.auftrag && (
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
              <h3 className="text-sm text-zinc-500 uppercase tracking-wider mb-4">Verknüpfter Auftrag</h3>
              <div className="space-y-2">
                <a
                  href={`/auftraege/${rechnung.auftrag.id}`}
                  className="text-white font-medium hover:text-emerald-400 flex items-center gap-2"
                >
                  {rechnung.auftrag.titel}
                  <ExternalLink className="w-4 h-4" />
                </a>
                {rechnung.auftrag.waldbesitzer && (
                  <p className="text-zinc-400 text-sm">Kunde: {rechnung.auftrag.waldbesitzer}</p>
                )}
                {rechnung.auftrag.waldbesitzerEmail && (
                  <p className="text-zinc-500 text-sm">{rechnung.auftrag.waldbesitzerEmail}</p>
                )}
              </div>
            </div>
          )}

          {/* Notizen */}
          {rechnung.notizen && (
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
              <h3 className="text-sm text-zinc-500 uppercase tracking-wider mb-4">Notizen</h3>
              <p className="text-zinc-300 text-sm whitespace-pre-wrap">{rechnung.notizen}</p>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="space-y-4">
          {/* Zipayo Payment */}
          {istOffen && (
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#161616] border border-[#6366f1]/30 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-2">Online bezahlen</h3>
              <p className="text-zinc-400 text-sm mb-4">
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

          {/* Bezahlt Badge */}
          {rechnung.status === "bezahlt" && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-emerald-400 font-semibold text-lg">Bezahlt</h3>
              <p className="text-zinc-400 text-sm mt-1">Diese Rechnung wurde beglichen.</p>
            </div>
          )}

          {/* Actions */}
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4 space-y-3">
            <a
              href={`/rechnungen/${rechnung.id}/drucken`}
              target="_blank"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#222] border border-[#333] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors"
            >
              <Printer className="w-4 h-4" />
              Rechnung drucken / PDF
            </a>
            
            {rechnung.pdfUrl && (
              <a
                href={rechnung.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#222] border border-[#333] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors"
              >
                <FileText className="w-4 h-4" />
                PDF herunterladen
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
