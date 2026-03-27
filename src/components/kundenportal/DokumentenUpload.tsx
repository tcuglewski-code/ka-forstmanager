"use client"

// Sprint AL: Drag-and-Drop Dokumenten-Upload für das Kundenportal

import { useState, useRef, useCallback, useEffect } from "react"
import { Upload, X, File, FileText, Image, Trash2, Download } from "lucide-react"

interface DateiInfo {
  id?: string
  name: string
  pfad: string
  groesse: number
  geaendertAm: string
  contentType: string
  typ?: string
}

interface DokumentenUploadProps {
  kundeId: string
  auftragId?: string
  /** Maximale Dateigröße in MB (Standard: 20) */
  maxMb?: number
}

function formatGroesse(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function DateiIcon({ contentType }: { contentType: string }) {
  if (contentType.startsWith("image/")) return <Image className="w-4 h-4 text-blue-400" />
  if (contentType === "application/pdf") return <FileText className="w-4 h-4 text-red-400" />
  return <File className="w-4 h-4 text-zinc-400" />
}

export function DokumentenUpload({ kundeId, auftragId, maxMb = 20 }: DokumentenUploadProps) {
  const [dateien, setDateien] = useState<DateiInfo[]>([])
  const [ladenDateien, setLadenDateien] = useState(true)
  const [dropAktiv, setDropAktiv] = useState(false)
  const [uploads, setUploads] = useState<Map<string, { fortschritt: number; status: "hochladen" | "fertig" | "fehler"; fehler?: string }>>(new Map())
  const dateiInputRef = useRef<HTMLInputElement>(null)

  // Dokumente laden
  async function dokumenteLaden() {
    try {
      const params = new URLSearchParams({ kundeId })
      if (auftragId) params.set("auftragId", auftragId)
      const res = await fetch(`/api/kundenportal/dokumente?${params}`)
      if (!res.ok) throw new Error("Fehler beim Laden")
      const daten = await res.json()
      setDateien(daten.dateien ?? [])
    } catch (err) {
      console.error("Fehler beim Laden der Dokumente:", err)
    } finally {
      setLadenDateien(false)
    }
  }

  useEffect(() => { dokumenteLaden() }, [kundeId, auftragId])

  // Datei hochladen
  async function dateiHochladen(datei: File) {
    const key = `${datei.name}-${Date.now()}`
    setUploads((prev) => new Map(prev).set(key, { fortschritt: 0, status: "hochladen" }))

    const formData = new FormData()
    formData.append("datei", datei)
    formData.append("kundeId", kundeId)
    if (auftragId) formData.append("auftragId", auftragId)

    try {
      // Fortschritt simulieren (fetch unterstützt kein Upload-Progress nativ)
      const interval = setInterval(() => {
        setUploads((prev) => {
          const map = new Map(prev)
          const eintrag = map.get(key)
          if (eintrag && eintrag.fortschritt < 85) {
            map.set(key, { ...eintrag, fortschritt: eintrag.fortschritt + 15 })
          }
          return map
        })
      }, 200)

      const res = await fetch("/api/kundenportal/dokumente/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(interval)

      if (!res.ok) {
        const fehlerDaten = await res.json()
        throw new Error(fehlerDaten.error ?? "Upload fehlgeschlagen")
      }

      setUploads((prev) => new Map(prev).set(key, { fortschritt: 100, status: "fertig" }))

      // Liste aktualisieren
      await dokumenteLaden()

      // Upload-Status nach 3 Sekunden entfernen
      setTimeout(() => {
        setUploads((prev) => {
          const map = new Map(prev)
          map.delete(key)
          return map
        })
      }, 3000)
    } catch (err) {
      setUploads((prev) =>
        new Map(prev).set(key, {
          fortschritt: 0,
          status: "fehler",
          fehler: err instanceof Error ? err.message : "Unbekannter Fehler",
        })
      )
    }
  }

  // Mehrere Dateien hochladen
  async function dateienHochladen(files: FileList | File[]) {
    const maxBytes = maxMb * 1024 * 1024
    for (const datei of Array.from(files)) {
      if (datei.size > maxBytes) {
        alert(`"${datei.name}" ist zu groß (max. ${maxMb} MB)`)
        continue
      }
      await dateiHochladen(datei)
    }
  }

  // Drag-and-Drop Handler
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDropAktiv(true)
  }, [])

  const onDragLeave = useCallback(() => {
    setDropAktiv(false)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDropAktiv(false)
    if (e.dataTransfer.files.length > 0) {
      dateienHochladen(e.dataTransfer.files)
    }
  }, [kundeId, auftragId])

  // Datei löschen
  async function dateiLoeschen(datei: DateiInfo) {
    if (!confirm(`"${datei.name}" wirklich löschen?`)) return
    try {
      const params = new URLSearchParams({ pfad: datei.pfad })
      if (datei.id) params.set("id", datei.id)
      const res = await fetch(`/api/kundenportal/dokumente?${params}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Löschen fehlgeschlagen")
      setDateien((prev) => prev.filter((d) => d.pfad !== datei.pfad))
    } catch (err) {
      alert("Fehler beim Löschen: " + (err instanceof Error ? err.message : "Unbekannt"))
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop-Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => dateiInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${dropAktiv
            ? "border-green-500 bg-green-900/20"
            : "border-zinc-600 hover:border-zinc-400 bg-zinc-800/30 hover:bg-zinc-800/50"
          }
        `}
      >
        <Upload className={`w-8 h-8 mx-auto mb-3 ${dropAktiv ? "text-green-400" : "text-zinc-500"}`} />
        <p className="text-zinc-300 font-medium">
          {dropAktiv ? "Dateien loslassen zum Hochladen" : "Dateien hierher ziehen oder klicken"}
        </p>
        <p className="text-zinc-500 text-xs mt-1">
          PDF, Bilder, Word, Excel · max. {maxMb} MB pro Datei
        </p>
        <input
          ref={dateiInputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt"
          onChange={(e) => e.target.files && dateienHochladen(e.target.files)}
        />
      </div>

      {/* Upload-Fortschritt */}
      {uploads.size > 0 && (
        <div className="space-y-2">
          {Array.from(uploads.entries()).map(([key, upload]) => (
            <div key={key} className="bg-zinc-800 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-zinc-300 truncate max-w-[200px]">
                  {key.split("-").slice(0, -1).join("-")}
                </span>
                <span className={
                  upload.status === "fertig" ? "text-green-400" :
                  upload.status === "fehler" ? "text-red-400" :
                  "text-zinc-400"
                }>
                  {upload.status === "fertig" ? "✓ Fertig" :
                   upload.status === "fehler" ? "✗ Fehler" :
                   `${upload.fortschritt}%`}
                </span>
              </div>
              {upload.status === "hochladen" && (
                <div className="w-full bg-zinc-700 rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${upload.fortschritt}%` }}
                  />
                </div>
              )}
              {upload.status === "fehler" && upload.fehler && (
                <p className="text-red-400 text-xs mt-1">{upload.fehler}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dateiliste */}
      <div>
        <h3 className="text-sm font-medium text-zinc-400 mb-2">
          Hochgeladene Dokumente ({dateien.length})
        </h3>

        {ladenDateien ? (
          <div className="text-zinc-500 text-sm text-center py-4">Lade Dokumente...</div>
        ) : dateien.length === 0 ? (
          <div className="text-zinc-600 text-sm text-center py-6 border border-dashed border-zinc-700 rounded-lg">
            Noch keine Dokumente hochgeladen
          </div>
        ) : (
          <div className="space-y-1">
            {dateien.map((datei) => (
              <div
                key={datei.pfad}
                className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors group"
              >
                <DateiIcon contentType={datei.contentType} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{datei.name}</p>
                  <p className="text-xs text-zinc-500">
                    {formatGroesse(datei.groesse)}
                    {datei.geaendertAm && ` · ${new Date(datei.geaendertAm).toLocaleDateString("de-DE")}`}
                    {datei.typ && datei.typ !== "sonstiges" && ` · ${datei.typ}`}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={`/api/kundenportal/dokumente/download?pfad=${encodeURIComponent(datei.pfad)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-zinc-400 hover:text-white rounded"
                    title="Herunterladen"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => dateiLoeschen(datei)}
                    className="p-1.5 text-zinc-400 hover:text-red-400 rounded"
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
