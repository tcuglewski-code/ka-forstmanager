"use client"

import { useState, useEffect } from "react"
import { 
  Building2, Save, Loader2, AlertCircle, CheckCircle,
  CreditCard, FileText, Info, ArrowLeft
} from "lucide-react"
import { useRouter } from "next/navigation"

interface RechnungsEinstellungen {
  company_iban: string
  company_bic: string
  company_vat_id: string
  company_tax_number: string
}

export default function RechnungsEinstellungenPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [settings, setSettings] = useState<RechnungsEinstellungen>({
    company_iban: "",
    company_bic: "",
    company_vat_id: "",
    company_tax_number: "",
  })

  // Einstellungen laden
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings/rechnung")
        if (res.ok) {
          const data = await res.json()
          setSettings({
            company_iban: data.company_iban || "",
            company_bic: data.company_bic || "",
            company_vat_id: data.company_vat_id || "",
            company_tax_number: data.company_tax_number || "",
          })
        }
      } catch {
        // Keine bestehenden Einstellungen - das ist OK
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  // Einstellungen speichern
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch("/api/settings/rechnung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (!res.ok) {
        throw new Error("Speichern fehlgeschlagen")
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/einstellungen")}
          className="p-2 rounded-lg bg-[#1e1e1e] border border-[#2a2a2a] text-zinc-400 hover:text-white hover:bg-[#252525] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="w-6 h-6 text-emerald-400" />
            Rechnungseinstellungen
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            ZUGFeRD / E-Rechnung Stammdaten
          </p>
        </div>
      </div>

      {/* Info-Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6 flex gap-3">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-300 text-sm font-medium">ZUGFeRD E-Rechnung</p>
          <p className="text-blue-200/70 text-sm mt-1">
            Diese Daten werden in alle ZUGFeRD-Rechnungen eingebettet. 
            Ab dem 01.01.2025 müssen Unternehmen in Deutschland E-Rechnungen 
            empfangen können. Der Versand ist ab 2027 verpflichtend.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Bankdaten */}
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            Bankverbindung
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">IBAN</label>
              <input
                type="text"
                value={settings.company_iban}
                onChange={(e) => setSettings({ ...settings, company_iban: e.target.value })}
                placeholder="DE00 0000 0000 0000 0000 00"
                className="w-full px-4 py-2.5 bg-[#1e1e1e] border border-[#333] rounded-lg text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">BIC</label>
              <input
                type="text"
                value={settings.company_bic}
                onChange={(e) => setSettings({ ...settings, company_bic: e.target.value })}
                placeholder="COBADEFFXXX"
                className="w-full px-4 py-2.5 bg-[#1e1e1e] border border-[#333] rounded-lg text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Steuerdaten */}
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            Steuerdaten
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">USt-IdNr.</label>
              <input
                type="text"
                value={settings.company_vat_id}
                onChange={(e) => setSettings({ ...settings, company_vat_id: e.target.value })}
                placeholder="DE123456789"
                className="w-full px-4 py-2.5 bg-[#1e1e1e] border border-[#333] rounded-lg text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-xs text-zinc-500 mt-1">Umsatzsteuer-Identifikationsnummer</p>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Steuernummer</label>
              <input
                type="text"
                value={settings.company_tax_number}
                onChange={(e) => setSettings({ ...settings, company_tax_number: e.target.value })}
                placeholder="22/123/45678"
                className="w-full px-4 py-2.5 bg-[#1e1e1e] border border-[#333] rounded-lg text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-xs text-zinc-500 mt-1">Finanzamt-Steuernummer</p>
            </div>
          </div>
        </div>

        {/* Error/Success */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-300 text-sm">Einstellungen gespeichert</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Speichern..." : "Einstellungen speichern"}
        </button>
      </form>
    </div>
  )
}
