"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, X, Download, Trash2, FileText, Lock, AlertTriangle } from "lucide-react"

interface Dokument {
  id: string
  name: string
  kategorie: string | null
  typ: string
  jahr: number | null
  ablaufDatum: string | null
  vertraulich: boolean
  beschreibung: string | null
  mimeType: string | null
  groesse: number | null
  nextcloudPath: string | null
  url: string | null
  downloadUrl: string | null
  createdAt: string
  hochgeladenVon: string | null
}

interface Props {
  mitarbeiterId: string
  mitarbeiterName: string
}

const KATEGORIEN: { value: string; label: string }[] = [
  { value: "vertrag", label: "Vertrag" },
  { value: "lohnsteuer", label: "Lohnsteuer" },
  { value: "qualifikation", label: "Qualifikation" },
  { value: "a1", label: "A1-Bescheinigung" },
  { value: "sicherheitsunterweisung", label: "Sicherheitsunterweisung" },
  { value: "versicherung", label: "Versicherung" },
  { value: "fuehrerschein", label: "Führerschein" },
  { value: "sonstiges", label: "Sonstiges" },
]

const KAT_BADGE: Record<string, string> = {
  vertrag: "bg-blue-100 text-blue-800 border-blue-500/30",
  lohnsteuer: "bg-purple-100 text-purple-800 border-purple-500/30",
  qualifikation: "bg-emerald-100 text-emerald-800 border-emerald-500/30",
  a1: "bg-amber-100 text-amber-800 border-amber-500/30",
  sicherheitsunterweisung: "bg-red-100 text-red-800 border-red-500/30",
  versicherung: "bg-cyan-100 text-cyan-800 border-cyan-500/30",
  fuehrerschein: "bg-indigo-100 text-indigo-800 border-indigo-500/30",
  sonstiges: "bg-gray-200 text-gray-700 border-gray-300",
}

function katLabel(k: string | null) {
  if (!k) return "Sonstiges"
  return KATEGORIEN.find((x) => x.value === k)?.label ?? k
}

function formatSize(bytes: number | null): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function DokumenteSection({ mitarbeiterId, mitarbeiterName }: Props) {
  const [docs, setDocs] = useState<Dokument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [kategorie, setKategorie] = useState<string>("sonstiges")
  const [jahr, setJahr] = useState<number>(new Date().getFullYear())
  const [beschreibung, setBeschreibung] = useState<string>("")
  const [ablaufDatum, setAblaufDatum] = useState<string>("")
  const [vertraulich, setVertraulich] = useState<boolean>(false)

  const ncFolderName = mitarbeiterName.replace(/[^a-zA-Z0-9_-]/g, "_")
  const ncFolderPath = `/Koch-Aufforstung/Mitarbeiter/${ncFolderName}`

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/mitarbeiter/${mitarbeiterId}/dokumente`)
      if (!res.ok) {
        setError(`Laden fehlgeschlagen (${res.status})`)
        setDocs([])
        return
      }
      const data = (await res.json()) as Dokument[]
      setDocs(Array.isArray(data) ? data : [])
    } catch {
      setError("Netzwerkfehler beim Laden")
      setDocs([])
    } finally {
      setLoading(false)
    }
  }, [mitarbeiterId])

  useEffect(() => {
    void load()
  }, [load])

  function resetForm() {
    setFile(null)
    setKategorie("sonstiges")
    setJahr(new Date().getFullYear())
    setBeschreibung("")
    setAblaufDatum("")
    setVertraulich(false)
    setUploadError(null)
  }

  async function submitUpload() {
    if (!file) {
      setUploadError("Bitte eine Datei auswählen")
      return
    }
    setUploading(true)
    setUploadError(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("kategorie", kategorie)
      fd.append("jahr", String(jahr))
      fd.append("beschreibung", beschreibung)
      fd.append("vertraulich", String(vertraulich))
      if (ablaufDatum) fd.append("ablaufDatum", ablaufDatum)

      const res = await fetch(`/api/mitarbeiter/${mitarbeiterId}/dokumente/upload`, {
        method: "POST",
        body: fd,
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setUploadError(j?.error || `Upload fehlgeschlagen (${res.status})`)
        return
      }
      setShowModal(false)
      resetForm()
      await load()
    } catch {
      setUploadError("Netzwerkfehler beim Upload")
    } finally {
      setUploading(false)
    }
  }

  async function deleteDoc(id: string, name: string) {
    if (!confirm(`Dokument "${name}" wirklich löschen?`)) return
    try {
      const res = await fetch(`/api/dokumente/${id}`, { method: "DELETE" })
      if (res.ok) {
        setDocs((prev) => prev.filter((d) => d.id !== id))
      } else {
        alert(`Löschen fehlgeschlagen (${res.status})`)
      }
    } catch {
      alert("Netzwerkfehler beim Löschen")
    }
  }

  // Gruppieren nach Kategorie
  const grouped = docs.reduce<Record<string, Dokument[]>>((acc, d) => {
    const k = d.kategorie ?? "sonstiges"
    if (!acc[k]) acc[k] = []
    acc[k].push(d)
    return acc
  }, {})

  const orderedKeys = KATEGORIEN.map((k) => k.value).filter((k) => grouped[k]?.length)
  Object.keys(grouped).forEach((k) => {
    if (!orderedKeys.includes(k)) orderedKeys.push(k)
  })

  const today = new Date()
  const in30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

  return (
    <div className="bg-[var(--color-surface-container)] border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-[var(--color-on-surface)]">Dokumente</h2>
          <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5 font-mono">
            Nextcloud: {ncFolderPath}
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-3 h-3" />
          Hochladen
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--color-on-surface-variant)]">Lade Dokumente...</p>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : docs.length === 0 ? (
        <p className="text-zinc-600 text-sm">Keine Dokumente vorhanden</p>
      ) : (
        <div className="space-y-5">
          {orderedKeys.map((k) => (
            <div key={k}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)] mb-2">
                {katLabel(k)} ({grouped[k].length})
              </h3>
              <div className="space-y-1.5">
                {grouped[k].map((d) => {
                  const ablauf = d.ablaufDatum ? new Date(d.ablaufDatum) : null
                  const abgelaufen = ablauf && ablauf < today
                  const kritisch = ablauf && !abgelaufen && ablauf < in30
                  return (
                    <div
                      key={d.id}
                      className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-[var(--color-surface-container-low)] border border-border"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <FileText className="w-4 h-4 mt-0.5 text-[var(--color-on-surface-variant)] flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm text-[var(--color-on-surface)] truncate">{d.name}</p>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] border ${
                                KAT_BADGE[d.kategorie ?? "sonstiges"] ?? KAT_BADGE.sonstiges
                              }`}
                            >
                              {katLabel(d.kategorie)}
                            </span>
                            {d.vertraulich && (
                              <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
                                <Lock className="w-3 h-3" /> vertraulich
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--color-on-surface-variant)] flex-wrap">
                            {d.jahr && <span>Jahr {d.jahr}</span>}
                            <span>{new Date(d.createdAt).toLocaleDateString("de-DE")}</span>
                            {d.groesse && <span>{formatSize(d.groesse)}</span>}
                            {ablauf && (
                              <span
                                className={`flex items-center gap-1 ${
                                  abgelaufen ? "text-red-400" : kritisch ? "text-amber-400" : ""
                                }`}
                              >
                                {(abgelaufen || kritisch) && <AlertTriangle className="w-3 h-3" />}
                                Ablauf: {ablauf.toLocaleDateString("de-DE")}
                              </span>
                            )}
                            {d.beschreibung && <span className="italic">· {d.beschreibung}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {(d.downloadUrl || d.url) && (
                          <a
                            href={d.downloadUrl ?? d.url ?? "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded hover:bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] hover:text-emerald-400 transition-colors"
                            title="Herunterladen"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => deleteDoc(d.id, d.name)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-[var(--color-on-surface-variant)] hover:text-red-400 transition-colors"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload-Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface-container-lowest)] border border-border rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[var(--color-on-surface)]">Dokument hochladen</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[var(--color-on-surface-variant)] hover:text-white"
                disabled={uploading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">
                  Datei *
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-[var(--color-surface-container-high)] file:text-[var(--color-on-surface)]"
                />
                {file && (
                  <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">
                    {file.name} ({formatSize(file.size)})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">
                  Kategorie *
                </label>
                <select
                  value={kategorie}
                  onChange={(e) => setKategorie(e.target.value)}
                  className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)]"
                >
                  {KATEGORIEN.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">
                    Jahr
                  </label>
                  <input
                    type="number"
                    value={jahr}
                    onChange={(e) => setJahr(parseInt(e.target.value) || new Date().getFullYear())}
                    min={2000}
                    max={2100}
                    className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">
                    Ablaufdatum
                  </label>
                  <input
                    type="date"
                    value={ablaufDatum}
                    onChange={(e) => setAblaufDatum(e.target.value)}
                    className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">
                  Beschreibung (optional)
                </label>
                <input
                  value={beschreibung}
                  onChange={(e) => setBeschreibung(e.target.value)}
                  placeholder="z.B. Originalvertrag, Verlängerung etc."
                  className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)]"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vertraulich}
                  onChange={(e) => setVertraulich(e.target.checked)}
                  className="accent-emerald-500"
                />
                <span className="text-sm text-[var(--color-on-surface)]">
                  Vertraulich (nur Admin sichtbar)
                </span>
              </label>

              {uploadError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
                  {uploadError}
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowModal(false)}
                disabled={uploading}
                className="flex-1 px-3 py-2 rounded-lg border border-border text-[var(--color-on-surface-variant)] text-sm hover:bg-[#222] disabled:opacity-50"
              >
                Abbrechen
              </button>
              <button
                onClick={submitUpload}
                disabled={uploading || !file}
                className="flex-1 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium disabled:opacity-50"
              >
                {uploading ? "Lade hoch..." : "Hochladen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
