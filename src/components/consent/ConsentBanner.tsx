"use client"

import { useState, useEffect } from "react"
import { Shield, Check, X, Info } from "lucide-react"

// KG-1: DSGVO Consent Banner für KI-Features

interface ConsentStatus {
  KI_VERARBEITUNG: boolean
  FOTO_AUSWERTUNG: boolean
  MARKETING: boolean
}

interface ConsentBannerProps {
  onConsentChange?: (status: ConsentStatus) => void
  showOnlyOnce?: boolean
}

const CONSENT_TYPES = {
  KI_VERARBEITUNG: {
    label: "KI-Verarbeitung",
    description: "Nutzung von KI zur Unterstützung bei der Auftragsverarbeitung und Datenanalyse",
    required: false,
  },
  FOTO_AUSWERTUNG: {
    label: "Foto- & Dokumentenauswertung",
    description: "Automatische Analyse von Fotos und Dokumenten zur Datenextraktion",
    required: false,
  },
  MARKETING: {
    label: "Marketing-Kommunikation",
    description: "Informationen über neue Features und Angebote",
    required: false,
  },
} as const

export function ConsentBanner({ onConsentChange, showOnlyOnce = true }: ConsentBannerProps) {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [consents, setConsents] = useState<ConsentStatus>({
    KI_VERARBEITUNG: false,
    FOTO_AUSWERTUNG: false,
    MARKETING: false,
  })
  const [expanded, setExpanded] = useState(false)

  // Lade aktuellen Consent-Status
  useEffect(() => {
    fetch("/api/consent/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.consents) {
          const status: ConsentStatus = {
            KI_VERARBEITUNG: !!data.consents.KI_VERARBEITUNG,
            FOTO_AUSWERTUNG: !!data.consents.FOTO_AUSWERTUNG,
            MARKETING: !!data.consents.MARKETING,
          }
          setConsents(status)
          
          // Banner nur anzeigen wenn noch keine Einwilligung
          const hasAnyConsent = Object.values(status).some(v => v)
          if (!hasAnyConsent || !showOnlyOnce) {
            setVisible(true)
          }
        } else {
          setVisible(true)
        }
      })
      .catch(() => setVisible(true))
      .finally(() => setLoading(false))
  }, [showOnlyOnce])

  const handleConsent = async (type: keyof ConsentStatus, granted: boolean) => {
    const newConsents = { ...consents, [type]: granted }
    setConsents(newConsents)
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consents }),
      })
      
      onConsentChange?.(consents)
      setVisible(false)
    } catch (error) {
      console.error("Consent-Speicherung fehlgeschlagen:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleAcceptAll = async () => {
    const allAccepted: ConsentStatus = {
      KI_VERARBEITUNG: true,
      FOTO_AUSWERTUNG: true,
      MARKETING: true,
    }
    setConsents(allAccepted)
    
    setSaving(true)
    try {
      await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consents: allAccepted }),
      })
      
      onConsentChange?.(allAccepted)
      setVisible(false)
    } catch (error) {
      console.error("Consent-Speicherung fehlgeschlagen:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleRejectAll = async () => {
    const allRejected: ConsentStatus = {
      KI_VERARBEITUNG: false,
      FOTO_AUSWERTUNG: false,
      MARKETING: false,
    }
    setConsents(allRejected)
    
    setSaving(true)
    try {
      await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consents: allRejected }),
      })
      
      onConsentChange?.(allRejected)
      setVisible(false)
    } catch (error) {
      console.error("Consent-Speicherung fehlgeschlagen:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !visible) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[9999] p-4">
      <div className="bg-[var(--color-surface-container)] border border-border rounded-xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Datenschutz-Einstellungen</h2>
            <p className="text-sm text-[var(--color-on-surface-variant)]">KI-Features benötigen Ihre Einwilligung</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-[var(--color-on-surface-variant)]">
            ForstManager nutzt KI-Technologie zur Unterstützung bei der Auftragsbearbeitung. 
            Bitte wählen Sie, welche Funktionen Sie aktivieren möchten.
          </p>

          {/* Consent Options */}
          <div className="space-y-3">
            {Object.entries(CONSENT_TYPES).map(([key, config]) => (
              <div
                key={key}
                className={`p-3 rounded-lg border transition-colors ${
                  consents[key as keyof ConsentStatus]
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-border bg-[var(--color-surface-container-low)]"
                }`}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consents[key as keyof ConsentStatus]}
                    onChange={(e) => handleConsent(key as keyof ConsentStatus, e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-zinc-600 bg-[var(--color-surface-container-low)] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{config.label}</div>
                    <div className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">{config.description}</div>
                  </div>
                </label>
              </div>
            ))}
          </div>

          {/* Expand/Collapse Details */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface-variant)] transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            {expanded ? "Details ausblenden" : "Mehr Informationen"}
          </button>

          {expanded && (
            <div className="text-xs text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container-low)] rounded-lg p-3 space-y-2">
              <p>
                <strong>KI-Verarbeitung:</strong> Ihre Auftragsdaten werden zur Analyse und 
                Optimierung an unsere KI-Systeme übermittelt. Die Verarbeitung erfolgt DSGVO-konform.
              </p>
              <p>
                <strong>Foto-Auswertung:</strong> Hochgeladene Fotos und Dokumente werden 
                automatisch analysiert, um Informationen wie Flächen, GPS-Koordinaten und 
                Baumarten zu extrahieren.
              </p>
              <p>
                <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a DSGVO (Einwilligung). 
                Sie können Ihre Einwilligung jederzeit in den Einstellungen widerrufen.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 p-5 border-t border-border">
          <button
            type="button"
            onClick={handleRejectAll}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-[var(--color-on-surface-variant)] hover:text-white hover:border-zinc-500 transition-all disabled:opacity-50"
          >
            Alle ablehnen
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg border border-emerald-500/50 text-sm text-emerald-400 hover:bg-emerald-500/10 transition-all disabled:opacity-50"
          >
            Auswahl speichern
          </button>
          <button
            type="button"
            onClick={handleAcceptAll}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all disabled:opacity-50"
          >
            {saving ? "Speichern..." : "Alle akzeptieren"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConsentBanner
