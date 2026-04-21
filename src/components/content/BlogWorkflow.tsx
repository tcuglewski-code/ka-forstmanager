"use client"

// KV-1: Blog/Bewertungs-Workflow UI für Auftragsdetail
// Einwilligung → Content → Freigabe → Veröffentlichung

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  FileText, Send, Sparkles, Check, ExternalLink, 
  Loader2, AlertCircle, Edit3, Mail, Globe
} from "lucide-react"

interface KundenContent {
  auftragId: string
  einwilligungStatus: string
  einwilligungDatum: string | null
  contentVorschlag: string | null
  contentFinal: string | null
  tomekFreigabe: boolean
  tomekFreigabeDatum: string | null
  kundeFreigabe: boolean
  kundeFreigabeDatum: string | null
  veroeffentlicht: boolean
  wpPostId: string | null
  wpPostUrl: string | null
  veroeffentlichtAm: string | null
}

interface Props {
  auftragId: string
  auftragStatus: string
  waldbesitzerEmail: string | null
}

// Workflow-Schritte
const STEPS = [
  { key: "einwilligung", label: "Einwilligung", icon: Mail },
  { key: "content", label: "Content", icon: FileText },
  { key: "freigabe", label: "Freigabe", icon: Check },
  { key: "veroeffentlicht", label: "Veröffentlicht", icon: Globe },
]

export function BlogWorkflow({ auftragId, auftragStatus, waldbesitzerEmail }: Props) {
  const router = useRouter()
  const [content, setContent] = useState<KundenContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editedContent, setEditedContent] = useState("")

  // Nur für abgeschlossene Aufträge anzeigen
  if (auftragStatus !== "abgeschlossen") {
    return (
      <div className="bg-[#161616] border border-border rounded-xl p-6 text-center">
        <FileText className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
        <p className="text-zinc-400">Bewertungs-Workflow verfügbar nach Auftragsabschluss</p>
        <p className="text-zinc-600 text-sm mt-1">Status muss "abgeschlossen" sein</p>
      </div>
    )
  }

  // Content laden
  useEffect(() => {
    const loadContent = async () => {
      try {
        const res = await fetch(`/api/content?auftragId=${auftragId}`)
        const data = await res.json()
        setContent(data.content)
      } catch (err) {
        setError("Content konnte nicht geladen werden")
      } finally {
        setLoading(false)
      }
    }
    loadContent()
  }, [auftragId])

  // Aktuellen Schritt berechnen
  const getCurrentStep = () => {
    if (!content) return 0
    if (content.veroeffentlicht) return 4
    if (content.tomekFreigabe) return 3
    if (content.contentVorschlag) return 2
    if (content.einwilligungStatus === "ERTEILT") return 1
    return 0
  }

  const currentStep = getCurrentStep()

  // Aktion ausführen
  const executeAction = async (aktion: string, extraData?: Record<string, unknown>) => {
    setActionLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auftragId, aktion, ...extraData })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Aktion fehlgeschlagen")
      }

      setSuccess(data.message || "Erfolgreich")
      
      // Content neu laden
      const contentRes = await fetch(`/api/content?auftragId=${auftragId}`)
      const contentData = await contentRes.json()
      setContent(contentData.content)
      
      if (aktion === "content_generieren" && data.content) {
        setEditedContent(data.content)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-[#161616] border border-border rounded-xl p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-[#161616] border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Bewertung & Content
        </h3>
      </div>

      {/* Workflow-Stepper */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const StepIcon = step.icon
            const isCompleted = idx < currentStep
            const isCurrent = idx === currentStep
            
            return (
              <div key={step.key} className="flex items-center">
                <div className={`flex flex-col items-center ${idx > 0 ? "flex-1" : ""}`}>
                  {idx > 0 && (
                    <div className={`h-0.5 w-full mb-2 ${isCompleted ? "bg-gold" : "bg-surface-container-highest"}`} />
                  )}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted 
                      ? "bg-gold text-[#0f0f0f]" 
                      : isCurrent 
                        ? "bg-gold/20 border-2 border-gold text-gold"
                        : "bg-surface-container-highest text-zinc-500"
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                  </div>
                  <span className={`text-xs mt-1 ${isCurrent ? "text-white" : "text-zinc-500"}`}>
                    {step.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Fehler/Erfolg */}
      {error && (
        <div className="mx-4 mt-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-300">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="mx-4 mt-4 flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-300">
          <Check className="w-4 h-4" />
          {success}
        </div>
      )}

      {/* Content-Bereich */}
      <div className="p-4 space-y-4">
        
        {/* Schritt 1: Einwilligung */}
        {currentStep === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-zinc-400">
              Waldbesitzer um Einwilligung für Referenz-Bericht bitten.
            </p>
            
            {!waldbesitzerEmail ? (
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-300">
                <AlertCircle className="w-4 h-4" />
                Keine E-Mail-Adresse vorhanden
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => executeAction("einwilligung_anfragen")}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-gold text-[#0f0f0f] rounded-lg text-sm font-medium hover:bg-[#d4b86b] transition-colors disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  E-Mail senden
                </button>
                <button
                  onClick={() => executeAction("einwilligung_setzen", { status: "ERTEILT" })}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest text-zinc-300 rounded-lg text-sm hover:bg-[#3a3a3a] transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Mündlich erteilt
                </button>
              </div>
            )}
            
            {content?.einwilligungStatus === "ANGEFRAGT" && (
              <p className="text-xs text-zinc-500">
                ⏳ Einwilligungsanfrage versendet — warte auf Antwort
              </p>
            )}
          </div>
        )}

        {/* Schritt 2: Content generieren */}
        {currentStep === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-zinc-400">
              ✅ Einwilligung erteilt am {content?.einwilligungDatum 
                ? new Date(content.einwilligungDatum).toLocaleDateString("de-DE") 
                : "–"}
            </p>
            <button
              onClick={() => executeAction("content_generieren")}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gold text-[#0f0f0f] rounded-lg text-sm font-medium hover:bg-[#d4b86b] transition-colors disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Content mit KI generieren
            </button>
          </div>
        )}

        {/* Schritt 3: Freigabe */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">Content-Vorschau prüfen und freigeben:</p>
            
            {editMode ? (
              <div className="space-y-3">
                <textarea
                  value={editedContent || content?.contentVorschlag || ""}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-64 bg-[#0f0f0f] border border-border rounded-lg p-3 text-sm text-zinc-300 font-mono resize-none"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setEditMode(false)
                      executeAction("freigeben", { contentFinal: editedContent })
                    }}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-gold text-[#0f0f0f] rounded-lg text-sm font-medium hover:bg-[#d4b86b] transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Speichern & Freigeben
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-[#0f0f0f] border border-border rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="prose prose-sm prose-invert">
                    {content?.contentVorschlag?.split("\n").map((line, i) => (
                      <p key={i} className="text-sm text-zinc-300">{line}</p>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => executeAction("freigeben")}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-gold text-[#0f0f0f] rounded-lg text-sm font-medium hover:bg-[#d4b86b] transition-colors"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Freigeben
                  </button>
                  <button
                    onClick={() => {
                      setEditedContent(content?.contentVorschlag || "")
                      setEditMode(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest text-zinc-300 rounded-lg text-sm hover:bg-[#3a3a3a] transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => executeAction("content_generieren")}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest text-zinc-300 rounded-lg text-sm hover:bg-[#3a3a3a] transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    Neu generieren
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Schritt 4: Veröffentlichen */}
        {currentStep === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-zinc-400">
              ✅ Freigegeben am {content?.tomekFreigabeDatum 
                ? new Date(content.tomekFreigabeDatum).toLocaleDateString("de-DE") 
                : "–"}
            </p>
            <button
              onClick={() => executeAction("veroeffentlichen")}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gold text-[#0f0f0f] rounded-lg text-sm font-medium hover:bg-[#d4b86b] transition-colors disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              In WordPress veröffentlichen (Draft)
            </button>
          </div>
        )}

        {/* Abgeschlossen */}
        {currentStep === 4 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <Check className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm text-green-300">Als Draft in WordPress erstellt</p>
                <p className="text-xs text-green-400/70">
                  {content?.veroeffentlichtAm 
                    ? new Date(content.veroeffentlichtAm).toLocaleString("de-DE")
                    : "–"}
                </p>
              </div>
            </div>
            {content?.wpPostUrl && (
              <a
                href={content.wpPostUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest text-zinc-300 rounded-lg text-sm hover:bg-[#3a3a3a] transition-colors w-fit"
              >
                <ExternalLink className="w-4 h-4" />
                In WordPress öffnen
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
