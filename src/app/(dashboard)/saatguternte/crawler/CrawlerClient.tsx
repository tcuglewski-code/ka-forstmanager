"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Play, Eye, EyeOff, RefreshCw, Key, CheckCircle, XCircle, Clock, Loader2, Info, Terminal } from "lucide-react"

interface Quelle {
  id: string
  name: string
  kuerzel: string
  bundeslaender: string[]
  crawlStatus: string
  letzterCrawl: string | null
  loginRequired: boolean
  hasCredentials: boolean
  _count: { flaechen: number }
}

interface HessenStatus {
  crawlStatus: string
  letzterCrawl: string | null
  crawlLog: string | null
  flaechenAnzahl: number
  script: string
}

interface Props {
  initialQuellen: Quelle[]
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  idle: { label: "Bereit", icon: Clock, className: "bg-zinc-500/20 text-zinc-400" },
  running: { label: "Läuft...", icon: Loader2, className: "bg-blue-500/20 text-blue-400" },
  success: { label: "Erfolgreich", icon: CheckCircle, className: "bg-emerald-500/20 text-emerald-400" },
  error: { label: "Fehler", icon: XCircle, className: "bg-red-500/20 text-red-400" },
}

export function CrawlerClient({ initialQuellen }: Props) {
  const [quellen, setQuellen] = useState<Quelle[]>(initialQuellen)
  const [credForms, setCredForms] = useState<Record<string, { user: string; pass: string; open: boolean }>>({})
  const [savingCred, setSavingCred] = useState<string | null>(null)
  const [crawling, setCrawling] = useState<string | null>(null)
  const [hessenStatus, setHessenStatus] = useState<HessenStatus | null>(null)
  const [hessenLoading, setHessenLoading] = useState(false)
  const [showHessenLog, setShowHessenLog] = useState(false)

  function toggleCredForm(id: string) {
    setCredForms((prev) => ({
      ...prev,
      [id]: prev[id]
        ? { ...prev[id], open: !prev[id].open }
        : { user: "", pass: "", open: true },
    }))
  }

  async function startCrawl(quelleId: string) {
    setCrawling(quelleId)
    setQuellen((prev) =>
      prev.map((q) => (q.id === quelleId ? { ...q, crawlStatus: "running" } : q))
    )
    try {
      const res = await fetch("/api/saatguternte/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quelleId }),
      })
      if (!res.ok) throw new Error("Crawl-Anfrage fehlgeschlagen")
      toast.success("Crawl gestartet — wird im Hintergrund ausgeführt")

      // Nach 3 Sek Status aktualisieren
      setTimeout(async () => {
        const updated = await fetch("/api/saatguternte/quellen").then((r) => r.json())
        setQuellen(updated)
        setCrawling(null)
      }, 3500)
    } catch {
      toast.error("Crawl konnte nicht gestartet werden")
      setQuellen((prev) =>
        prev.map((q) => (q.id === quelleId ? { ...q, crawlStatus: "error" } : q))
      )
      setCrawling(null)
    }
  }

  async function saveCredentials(quelleId: string) {
    const form = credForms[quelleId]
    if (!form?.user || !form?.pass) {
      toast.error("Benutzername und Passwort erforderlich")
      return
    }
    setSavingCred(quelleId)
    try {
      const res = await fetch("/api/saatguternte/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quelleId, username: form.user, password: form.pass }),
      })
      if (!res.ok) throw new Error("Speichern fehlgeschlagen")
      toast.success("Credentials verschlüsselt gespeichert")
      setCredForms((prev) => ({ ...prev, [quelleId]: { ...prev[quelleId], open: false } }))
      setQuellen((prev) =>
        prev.map((q) => (q.id === quelleId ? { ...q, hasCredentials: true } : q))
      )
    } catch {
      toast.error("Fehler beim Speichern der Credentials")
    } finally {
      setSavingCred(null)
    }
  }

  async function loadHessenStatus() {
    setHessenLoading(true)
    try {
      const res = await fetch("/api/saatguternte/crawl/hessen")
      if (res.ok) {
        const data = await res.json()
        setHessenStatus(data)
      }
    } catch {
      toast.error("Hessen-Status konnte nicht geladen werden")
    } finally {
      setHessenLoading(false)
    }
  }

  async function startHessenCrawl() {
    setHessenLoading(true)
    try {
      const res = await fetch("/api/saatguternte/crawl/hessen", { method: "POST" })
      const data = await res.json()
      if (data.ok) {
        toast.info("Crawler-Anweisung gespeichert — bitte lokal ausführen")
        setHessenStatus((prev) => prev ? { ...prev, crawlStatus: "manual_required", crawlLog: data.anweisung } : null)
        await loadHessenStatus()
      } else {
        toast.error(data.error ?? "Fehler beim Starten")
      }
    } catch {
      toast.error("Anfrage fehlgeschlagen")
    } finally {
      setHessenLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Hessen-Crawler Panel */}
      <div className="bg-[#161616] border border-amber-500/30 rounded-xl overflow-hidden">
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-white font-semibold">NW-FVA Hessen EZR</h3>
                <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs font-medium">HE</span>
                {hessenStatus && (
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    hessenStatus.crawlStatus === "success" ? "bg-emerald-500/20 text-emerald-400" :
                    hessenStatus.crawlStatus === "manual_required" ? "bg-amber-500/20 text-amber-400" :
                    hessenStatus.crawlStatus === "error" ? "bg-red-500/20 text-red-400" :
                    "bg-zinc-500/20 text-zinc-400"
                  }`}>
                    {hessenStatus.crawlStatus === "manual_required" ? "⚠️ Manuell erforderlich" :
                     hessenStatus.crawlStatus === "success" ? "✅ Erfolgreich" :
                     hessenStatus.crawlStatus === "error" ? "❌ Fehler" : "⏱ Bereit"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span>Hessen</span>
                <span>·</span>
                {hessenStatus ? (
                  <span>{hessenStatus.flaechenAnzahl.toLocaleString("de-DE")} Flächen in DB</span>
                ) : (
                  <span className="italic">Status nicht geladen</span>
                )}
                {hessenStatus?.letzterCrawl && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" />
                      Letzter Crawl:{" "}
                      {new Date(hessenStatus.letzterCrawl).toLocaleDateString("de-DE", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </>
                )}
                {hessenStatus?.script && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1 font-mono text-zinc-600">
                      <Terminal className="w-3 h-3" />
                      {hessenStatus.script}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={loadHessenStatus}
                disabled={hessenLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#333] text-zinc-400 rounded-lg text-xs transition-all"
                title="Status laden"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${hessenLoading ? "animate-spin" : ""}`} />
                Status
              </button>
              <button
                onClick={startHessenCrawl}
                disabled={hessenLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-all"
              >
                {hessenLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                Crawler starten
              </button>
            </div>
          </div>

          {hessenStatus?.crawlLog && (
            <div className="mt-3">
              <button
                onClick={() => setShowHessenLog((v) => !v)}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1"
              >
                <Terminal className="w-3 h-3" />
                {showHessenLog ? "Log ausblenden" : "Log anzeigen"}
              </button>
              {showHessenLog && (
                <pre className="mt-2 p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-xs text-zinc-400 font-mono overflow-x-auto whitespace-pre-wrap">
                  {hessenStatus.crawlLog}
                </pre>
              )}
            </div>
          )}

          {/* Hinweis wenn manual_required */}
          {hessenStatus?.crawlStatus === "manual_required" && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Lokal ausführen:</p>
                <code className="block mt-1 text-amber-400 font-mono">python3 scripts/crawler-hessen.py</code>
                <p className="mt-1 text-amber-400/70">Vercel Serverless unterstützt keine lang laufenden Python-Prozesse (~5–10 Min).</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info-Banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-300">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium">Generischer Crawl-Modus</p>
          <p className="text-blue-400/70 text-xs mt-1">
            Die echte Crawl-Logik für weitere Bundesländer wird in späteren Sprints implementiert.
            Mit gespeicherten Credentials wird der Crawler automatisch aktiviert.
          </p>
        </div>
      </div>

      {quellen.map((quelle) => {
        const statusConf = STATUS_CONFIG[quelle.crawlStatus] ?? STATUS_CONFIG.idle
        const StatusIcon = statusConf.icon
        const isRunning = quelle.crawlStatus === "running" || crawling === quelle.id
        const form = credForms[quelle.id]
        const [showPass, setShowPass] = useState(false)

        return (
          <div key={quelle.id} className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-white font-semibold">{quelle.name}</h3>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs font-medium">
                      {quelle.kuerzel}
                    </span>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConf.className}`}>
                      <StatusIcon className={`w-3 h-3 ${isRunning ? "animate-spin" : ""}`} />
                      {statusConf.label}
                    </span>
                    {quelle.hasCredentials && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded text-xs">
                        Credentials hinterlegt
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span>{quelle.bundeslaender.join(", ")}</span>
                    <span>·</span>
                    <span>{quelle._count.flaechen.toLocaleString("de-DE")} Flächen</span>
                    {quelle.letzterCrawl && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" />
                          Letzter Crawl:{" "}
                          {new Date(quelle.letzterCrawl).toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {quelle.loginRequired && (
                    <button
                      onClick={() => toggleCredForm(quelle.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#333] text-zinc-400 rounded-lg text-xs transition-all"
                    >
                      <Key className="w-3.5 h-3.5" />
                      Credentials
                    </button>
                  )}
                  <button
                    onClick={() => startCrawl(quelle.id)}
                    disabled={isRunning}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-all"
                  >
                    {isRunning ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    {isRunning ? "Läuft..." : "Crawl starten"}
                  </button>
                </div>
              </div>
            </div>

            {/* Credential-Formular */}
            {form?.open && (
              <div className="border-t border-[#2a2a2a] p-5 bg-[#0f0f0f]">
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                  Zugangsdaten (AES-256-GCM verschlüsselt)
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-zinc-600 mb-1">Benutzername</label>
                    <input
                      type="text"
                      value={form.user}
                      onChange={(e) =>
                        setCredForms((prev) => ({
                          ...prev,
                          [quelle.id]: { ...prev[quelle.id], user: e.target.value },
                        }))
                      }
                      placeholder="z.B. forstamt@example.de"
                      className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-600 mb-1">Passwort</label>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        value={form.pass}
                        onChange={(e) =>
                          setCredForms((prev) => ({
                            ...prev,
                            [quelle.id]: { ...prev[quelle.id], pass: e.target.value },
                          }))
                        }
                        placeholder="Passwort"
                        className="w-full px-3 py-2 pr-10 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => saveCredentials(quelle.id)}
                    disabled={savingCred === quelle.id}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-all"
                  >
                    {savingCred === quelle.id ? "Speichern..." : "Verschlüsselt speichern"}
                  </button>
                  <button
                    onClick={() => toggleCredForm(quelle.id)}
                    className="px-3 py-1.5 text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
                  >
                    Abbrechen
                  </button>
                  <p className="text-xs text-zinc-700 ml-auto">
                    Klartext wird nie gespeichert
                  </p>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {quellen.length === 0 && (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-12 text-center">
          <p className="text-zinc-600">Keine Registerquellen vorhanden</p>
          <p className="text-zinc-700 text-xs mt-1">Erstelle zuerst eine Quelle über die API</p>
        </div>
      )}
    </div>
  )
}
