"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Video, Image as ImageIcon, FolderOpen, ChevronRight,
  X, ChevronLeft, ChevronRight as ChevronRightIcon,
  Trash2, Link2, Loader2, AlertCircle, Plus, Check,
  Camera, Calendar, Tag
} from "lucide-react"
import { toast } from "sonner"

// ─── Typen ───────────────────────────────────────────────────────────────────

interface NextcloudFile {
  name: string
  path: string
  type: "file" | "directory"
  size: number
  lastModified: string
  contentType: string
}

interface MediaZuordnung {
  id: string
  flaecheId: string | null
  nextcloudPath: string
  dateiname: string
  typ: string
  datum: string | null
  mission: string | null
  vorschauUrl: string | null
  createdAt: string
}

type SortKey = "datum" | "mission" | "dateiname"

// ─── Hilfs-Funktionen ────────────────────────────────────────────────────────

function proxyUrl(path: string): string {
  return `/api/saatguternte/medien/proxy?path=${encodeURIComponent(path)}`
}

function isImage(name: string): boolean {
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(name)
}

function isVideo(name: string): boolean {
  return /\.(mp4|mov|avi|mkv|webm)$/i.test(name)
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatDate(d: string | null): string {
  if (!d) return ""
  return new Date(d).toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric"
  })
}

// Pfad in Breadcrumb-Segmente aufteilen
function parseBreadcrumb(path: string): { label: string; path: string }[] {
  const parts = path.split("/").filter(Boolean)
  const segments: { label: string; path: string }[] = []
  let current = ""
  for (const part of parts) {
    current += `/${part}`
    segments.push({ label: part, path: current })
  }
  return segments
}

// ─── Lightbox ────────────────────────────────────────────────────────────────

function Lightbox({
  medien,
  startIndex,
  onClose,
}: {
  medien: MediaZuordnung[]
  startIndex: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(startIndex)
  const current = medien[idx]

  const prev = useCallback(() => setIdx((i) => (i > 0 ? i - 1 : medien.length - 1)), [medien.length])
  const next = useCallback(() => setIdx((i) => (i < medien.length - 1 ? i + 1 : 0)), [medien.length])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [prev, next, onClose])

  if (!current) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center"
      onClick={onClose}
    >
      {/* Schließen */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/60 hover:text-white bg-black/40 rounded-full p-2 transition-colors z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation Links */}
      {medien.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); prev() }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white bg-black/40 rounded-full p-3 transition-colors z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Medieninhalt */}
      <div
        className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isImage(current.dateiname) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={proxyUrl(current.nextcloudPath)}
            alt={current.dateiname}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
          />
        ) : (
          <video
            src={proxyUrl(current.nextcloudPath)}
            controls
            autoPlay
            className="max-w-[90vw] max-h-[85vh] rounded-lg"
          />
        )}
      </div>

      {/* Navigation Rechts */}
      {medien.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); next() }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white bg-black/40 rounded-full p-3 transition-colors z-10"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>
      )}

      {/* Caption */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center space-y-1"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-white/80 text-sm font-medium">{current.dateiname}</p>
        <div className="flex items-center justify-center gap-3 text-xs text-white/50">
          {current.datum && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(current.datum)}
            </span>
          )}
          {current.mission && (
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {current.mission}
            </span>
          )}
          <span className="text-white/30">{idx + 1} / {medien.length}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Haupt-Komponente ────────────────────────────────────────────────────────

interface MediaViewerProps {
  flaecheId: string
}

export function MediaViewer({ flaecheId }: MediaViewerProps) {
  // ─── Zugeordnete Medien ───
  const [medien, setMedien] = useState<MediaZuordnung[]>([])
  const [loadingMedien, setLoadingMedien] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>("datum")
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  // ─── Browser-Panel ───
  const [browserPath, setBrowserPath] = useState("/Koch-Aufforstung/")
  const [browserFolders, setBrowserFolders] = useState<string[]>([])
  const [browserFiles, setBrowserFiles] = useState<NextcloudFile[]>([])
  const [loadingBrowser, setBrowserLoading] = useState(false)
  const [browserError, setBrowserError] = useState<string | null>(null)
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())
  const [assigning, setAssigning] = useState(false)

  // ─── Zugeordnete Medien laden ───
  async function fetchMedien() {
    setLoadingMedien(true)
    try {
      const res = await fetch(`/api/saatguternte/medien?flaecheId=${flaecheId}`)
      const data = await res.json()
      setMedien(data.medien ?? [])
    } catch {
      toast.error("Medien konnten nicht geladen werden")
    } finally {
      setLoadingMedien(false)
    }
  }

  useEffect(() => {
    fetchMedien()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flaecheId])

  // ─── Browser: Ordner laden ───
  async function browseTo(path: string) {
    setBrowserPath(path)
    setBrowserLoading(true)
    setBrowserError(null)
    setSelectedPaths(new Set())
    try {
      const res = await fetch(
        `/api/saatguternte/medien/browse?path=${encodeURIComponent(path)}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Fehler")
      setBrowserFolders(data.folders ?? [])
      setBrowserFiles(data.files ?? [])
    } catch (e) {
      setBrowserError(e instanceof Error ? e.message : "Unbekannter Fehler")
      setBrowserFolders([])
      setBrowserFiles([])
    } finally {
      setBrowserLoading(false)
    }
  }

  // Initial Browser laden
  useEffect(() => {
    browseTo(browserPath)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Datei-Selektion ───
  function toggleSelect(path: string) {
    setSelectedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  // ─── Ausgewählte zuordnen ───
  async function handleZuordnen() {
    if (selectedPaths.size === 0) return
    setAssigning(true)
    try {
      const promises = Array.from(selectedPaths).map((path) => {
        const file = browserFiles.find((f) => f.path === path)
        if (!file) return Promise.resolve()
        const typ = isVideo(file.name) ? "video" : "bild"
        return fetch("/api/saatguternte/medien/zuordnung", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            flaecheId,
            nextcloudPath: path,
            dateiname: file.name,
            typ,
          }),
        })
      })
      await Promise.all(promises)
      toast.success(`${selectedPaths.size} Datei(en) zugeordnet`)
      setSelectedPaths(new Set())
      await fetchMedien()
    } catch {
      toast.error("Zuordnung fehlgeschlagen")
    } finally {
      setAssigning(false)
    }
  }

  // ─── Zuordnung entfernen ───
  async function handleRemove(id: string) {
    if (!confirm("Zuordnung entfernen?")) return
    try {
      await fetch(`/api/saatguternte/medien/zuordnung/${id}`, { method: "DELETE" })
      toast.success("Zuordnung entfernt")
      setMedien((prev) => prev.filter((m) => m.id !== id))
    } catch {
      toast.error("Entfernen fehlgeschlagen")
    }
  }

  // ─── Sortierung ───
  const sortedMedien = [...medien].sort((a, b) => {
    if (sortKey === "datum") {
      return (b.datum ?? b.createdAt).localeCompare(a.datum ?? a.createdAt)
    }
    if (sortKey === "mission") {
      return (a.mission ?? "").localeCompare(b.mission ?? "")
    }
    return a.dateiname.localeCompare(b.dateiname)
  })

  const breadcrumb = parseBreadcrumb(browserPath)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Camera className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-semibold text-white">Medien &amp; Drohnenaufnahmen</h2>
        {medien.length > 0 && (
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
            {medien.length}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ─── Browser-Panel (links) ──────────────────────────────── */}
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
          {/* Panel-Header */}
          <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <FolderOpen className="w-4 h-4 text-emerald-400" />
              Nextcloud durchsuchen
            </div>
            {selectedPaths.size > 0 && (
              <button
                onClick={handleZuordnen}
                disabled={assigning}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-all"
              >
                {assigning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                {selectedPaths.size} zuordnen
              </button>
            )}
          </div>

          {/* Breadcrumb */}
          <div className="px-4 py-2 border-b border-[#2a2a2a] flex items-center gap-1 flex-wrap text-xs text-zinc-500 overflow-x-auto">
            <button
              onClick={() => browseTo("/")}
              className="hover:text-zinc-300 transition-colors whitespace-nowrap"
            >
              /
            </button>
            {breadcrumb.map((seg, i) => (
              <span key={seg.path} className="flex items-center gap-1">
                <ChevronRight className="w-3 h-3 flex-shrink-0" />
                <button
                  onClick={() => browseTo(seg.path + "/")}
                  className={`hover:text-zinc-300 transition-colors whitespace-nowrap ${
                    i === breadcrumb.length - 1 ? "text-zinc-200" : ""
                  }`}
                >
                  {seg.label}
                </button>
              </span>
            ))}
          </div>

          {/* Inhalt */}
          <div className="divide-y divide-[#1e1e1e] max-h-[500px] overflow-y-auto">
            {loadingBrowser ? (
              <div className="flex items-center justify-center py-12 text-zinc-600">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Lade Verzeichnis...
              </div>
            ) : browserError ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                <p className="text-sm text-red-400">{browserError}</p>
                <button
                  onClick={() => browseTo(browserPath)}
                  className="mt-3 text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Erneut versuchen
                </button>
              </div>
            ) : (
              <>
                {/* Ordner */}
                {browserFolders.map((folderPath) => {
                  const folderName = folderPath.split("/").filter(Boolean).pop() ?? folderPath
                  return (
                    <button
                      key={folderPath}
                      onClick={() => browseTo(folderPath + "/")}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#1c1c1c] transition-colors text-left"
                    >
                      <FolderOpen className="w-4 h-4 text-yellow-500/70 flex-shrink-0" />
                      <span className="text-sm text-zinc-300 truncate">{folderName}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-600 ml-auto flex-shrink-0" />
                    </button>
                  )
                })}

                {/* Dateien */}
                {browserFiles.map((file) => {
                  const selected = selectedPaths.has(file.path)
                  return (
                    <div
                      key={file.path}
                      className={`flex items-center gap-3 px-4 py-2.5 hover:bg-[#1c1c1c] transition-colors cursor-pointer ${
                        selected ? "bg-emerald-950/30" : ""
                      }`}
                      onClick={() => toggleSelect(file.path)}
                    >
                      {/* Checkbox */}
                      <div
                        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                          selected
                            ? "bg-emerald-600 border-emerald-600"
                            : "border-zinc-600"
                        }`}
                      >
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </div>

                      {/* Vorschau oder Icon */}
                      {isImage(file.name) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={proxyUrl(file.path)}
                          alt={file.name}
                          className="w-10 h-10 object-cover rounded flex-shrink-0 bg-zinc-800"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 flex-shrink-0 bg-zinc-800 rounded flex items-center justify-center">
                          <Video className="w-5 h-5 text-blue-400" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-300 truncate">{file.name}</p>
                        <p className="text-xs text-zinc-600">
                          {isImage(file.name) ? "Bild" : "Video"} · {formatBytes(file.size)}
                        </p>
                      </div>
                    </div>
                  )
                })}

                {browserFolders.length === 0 && browserFiles.length === 0 && (
                  <div className="py-10 text-center text-sm text-zinc-600">
                    Keine Medien in diesem Ordner
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer: Zuordnen-Button */}
          {selectedPaths.size > 0 && (
            <div className="px-4 py-3 border-t border-[#2a2a2a] bg-[#111]">
              <button
                onClick={handleZuordnen}
                disabled={assigning}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all"
              >
                {assigning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
                Ausgewählte dieser Fläche zuordnen ({selectedPaths.size})
              </button>
            </div>
          )}
        </div>

        {/* ─── Zugeordnete Medien (rechts) ──────────────────────── */}
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
          {/* Panel-Header */}
          <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              Zugeordnete Medien
              {medien.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-zinc-700 text-zinc-400 rounded text-xs">
                  {medien.length}
                </span>
              )}
            </div>

            {/* Sortierung */}
            <div className="flex items-center gap-1 text-xs">
              {(["datum", "mission", "dateiname"] as SortKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setSortKey(key)}
                  className={`px-2 py-1 rounded transition-colors capitalize ${
                    sortKey === key
                      ? "bg-emerald-600/30 text-emerald-400"
                      : "text-zinc-600 hover:text-zinc-400"
                  }`}
                >
                  {key === "dateiname" ? "Name" : key === "datum" ? "Datum" : "Mission"}
                </button>
              ))}
            </div>
          </div>

          {/* Medien-Grid */}
          <div className="max-h-[500px] overflow-y-auto p-4">
            {loadingMedien ? (
              <div className="flex items-center justify-center py-12 text-zinc-600">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Lade Medien...
              </div>
            ) : sortedMedien.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ImageIcon className="w-10 h-10 text-zinc-700 mb-3" />
                <p className="text-sm text-zinc-500">Noch keine Medien zugeordnet</p>
                <p className="text-xs text-zinc-600 mt-1">
                  Wähle links Dateien aus und klicke &quot;Zuordnen&quot;
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {sortedMedien.map((m, idx) => (
                  <div
                    key={m.id}
                    className="relative group rounded-lg overflow-hidden bg-zinc-900 border border-[#2a2a2a] hover:border-emerald-500/50 transition-all"
                  >
                    {/* Medieninhalt */}
                    <div
                      className="aspect-square cursor-pointer"
                      onClick={() => setLightboxIdx(idx)}
                    >
                      {isImage(m.dateiname) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={proxyUrl(m.nextcloudPath)}
                          alt={m.dateiname}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = ""
                            e.currentTarget.parentElement!.classList.add(
                              "flex", "items-center", "justify-center"
                            )
                          }}
                        />
                      ) : (
                        <video
                          src={proxyUrl(m.nextcloudPath)}
                          className="w-full h-full object-cover"
                          preload="metadata"
                        />
                      )}

                      {/* Video-Overlay */}
                      {isVideo(m.dateiname) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                            <Video className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Info-Overlay */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-white text-xs truncate">{m.dateiname}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {m.datum && (
                          <span className="text-white/50 text-xs">
                            {formatDate(m.datum)}
                          </span>
                        )}
                        {m.mission && (
                          <span className="text-emerald-400 text-xs truncate">
                            {m.mission}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Löschen-Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemove(m.id)
                      }}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox
          medien={sortedMedien}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </div>
  )
}
