"use client"

/**
 * DOK-017-021: Review-UI — Dokumenten-KI Posteingang.
 * Liste aller DokumentenScans mit Status-Filter, Konfidenz-Ampel und Upload.
 */
import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { FileText, Upload, Loader2, RefreshCw, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { KonfidenzAmpel } from "@/components/dokumente/KonfidenzAmpel"

interface ScanItem {
  id: string
  typ: string
  status: string
  originalDateiName: string
  gesamtKonfidenz: number | null
  routingGrund: string | null
  erstelltAm: string
  _count?: { positionen: number }
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  AUSSTEHEND: { label: "Ausstehend", cls: "bg-slate-100 text-slate-700" },
  IN_VERARBEITUNG: { label: "In Verarbeitung", cls: "bg-blue-100 text-blue-800" },
  REVIEW_ERFORDERLICH: { label: "Review nötig", cls: "bg-amber-100 text-amber-800" },
  GEBUCHT: { label: "Gebucht", cls: "bg-emerald-100 text-emerald-800" },
  ABGELEHNT: { label: "Abgelehnt", cls: "bg-red-100 text-red-800" },
  FEHLER: { label: "Fehler", cls: "bg-red-100 text-red-800" },
}

const TYP_LABEL: Record<string, string> = {
  XRECHNUNG: "XRechnung",
  ZUGFERD: "ZUGFeRD",
  PDF_RECHNUNG: "PDF-Rechnung",
  LIEFERSCHEIN: "Lieferschein",
  GUTSCHRIFT: "Gutschrift",
}

const FILTER = ["ALLE", "REVIEW_ERFORDERLICH", "AUSSTEHEND", "GEBUCHT", "ABGELEHNT", "FEHLER"]

export default function DokumenteScansPage() {
  const [items, setItems] = useState<ScanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState("REVIEW_ERFORDERLICH")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const fileRef = useRef<HTMLInputElement>(null)

  const lade = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ page: String(page), limit: "25" })
      if (filter !== "ALLE") qs.set("status", filter)
      const res = await fetch(`/api/dokumente/scans?${qs}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setItems(data.items ?? [])
      setTotalPages(data.totalPages ?? 1)
    } catch {
      toast.error("Dokumente konnten nicht geladen werden")
    } finally {
      setLoading(false)
    }
  }, [filter, page])

  useEffect(() => {
    lade()
  }, [lade])

  async function upload(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/dokumente/scans", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      if (data.duplikatVon) {
        toast.warning("Hinweis: identische Datei wurde bereits hochgeladen")
      } else {
        toast.success("Hochgeladen — Verarbeitung gestartet")
      }
      setFilter("ALLE")
      setPage(1)
      lade()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload fehlgeschlagen")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>
            Dokumenten-KI
          </h1>
          <p className="text-sm text-[var(--color-on-surface-variant)]">
            Rechnungen, Lieferscheine & Gutschriften — automatische Extraktion mit Review
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={lade}
            className="p-2 rounded-lg border hover:bg-accent/50 transition-colors"
            title="Aktualisieren"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.xml,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Dokument hochladen
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTER.map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f)
              setPage(1)
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === f
                ? "bg-emerald-600 text-white border-emerald-600"
                : "text-[var(--color-on-surface-variant)] hover:bg-accent/50"
            }`}
          >
            {f === "ALLE" ? "Alle" : STATUS_BADGE[f]?.label ?? f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--color-on-surface-variant)]" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 border rounded-lg">
          <FileText className="w-10 h-10 mx-auto mb-3 text-[var(--color-on-surface-variant)]" />
          <p className="text-sm text-[var(--color-on-surface-variant)]">
            Keine Dokumente {filter !== "ALLE" ? "mit diesem Status" : "vorhanden"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((s) => {
            const badge = STATUS_BADGE[s.status] ?? { label: s.status, cls: "bg-slate-100 text-slate-700" }
            return (
              <Link
                key={s.id}
                href={`/dokumente/scans/${s.id}`}
                className="flex flex-wrap items-center gap-3 bg-card hover:bg-accent/50 transition-colors border p-4 rounded-lg"
              >
                <FileText className="w-5 h-5 shrink-0 text-[var(--color-on-surface-variant)]" />
                <div className="flex-1 min-w-[200px]">
                  <div className="font-medium text-sm truncate" style={{ color: "var(--color-on-surface)" }}>
                    {s.originalDateiName}
                  </div>
                  <div className="text-xs text-[var(--color-on-surface-variant)]">
                    {TYP_LABEL[s.typ] ?? s.typ} · {s._count?.positionen ?? 0} Positionen ·{" "}
                    {new Date(s.erstelltAm).toLocaleString("de-DE")}
                  </div>
                </div>
                <KonfidenzAmpel wert={s.gesamtKonfidenz} />
                <span className={`px-2 py-1 rounded text-xs font-medium ${badge.cls}`}>{badge.label}</span>
                {s.status === "FEHLER" && s.routingGrund && (
                  <span className="flex items-center gap-1 text-xs text-red-600 max-w-xs truncate">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    {s.routingGrund}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded border text-xs disabled:opacity-40"
          >
            Zurück
          </button>
          <span className="px-3 py-1.5 text-xs text-[var(--color-on-surface-variant)]">
            Seite {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded border text-xs disabled:opacity-40"
          >
            Weiter
          </button>
        </div>
      )}
    </div>
  )
}
