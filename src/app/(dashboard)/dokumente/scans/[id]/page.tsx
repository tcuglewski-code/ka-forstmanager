"use client"

/**
 * DOK-028-031: Review-Detail — Split-View.
 * Links: Original-Dokument (PDF/Bild/XML), rechts: extrahierte Daten mit
 * Konfidenz-Ampel je Feld, Positionen mit Artikel-Korrektur, Audit-Trail.
 * Aktionen: Bestätigen (→ Lagerbuchung) / Ablehnen (Grund Pflicht).
 */
import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Check, X, Loader2, ExternalLink, Lock } from "lucide-react"
import { toast } from "sonner"
import { KonfidenzAmpel } from "@/components/dokumente/KonfidenzAmpel"

interface Position {
  id: string
  artikelBezeichnung: string
  lieferantArtikelNr: string | null
  mengeErwartet: number
  mengeErhalten: number | null
  einheit: string
  einzelpreis: number
  gesamtpreis: number
  mwstSatz: number
  konfidenz: number
  matchStatus: string
  lagerArtikelId: string | null
}

interface AuditEintrag {
  id: string
  aktion: string
  userId: string | null
  systemAktion: boolean
  details: unknown
  erstelltAm: string
}

interface Scan {
  id: string
  typ: string
  status: string
  originalDateiUrl: string
  originalDateiName: string
  gesamtKonfidenz: number | null
  routingGrund: string | null
  extrahierteDaten: {
    rechnungsNr?: string | null
    datum?: string | null
    lieferantName?: string | null
    lieferantUstId?: string | null
    gesamtBetrag?: number | null
    nettoBetrag?: number | null
    waehrung?: string
    mwstHinweise?: string[]
    feldKonfidenzen?: Record<string, number>
  } | null
  erstelltAm: string
  positionen: Position[]
  auditLog: AuditEintrag[]
}

interface Artikel {
  id: string
  name: string
  einheit: string
}

const MATCH_BADGE: Record<string, string> = {
  EXAKT: "bg-emerald-100 text-emerald-800",
  FUZZY: "bg-amber-100 text-amber-800",
  MANUELL: "bg-blue-100 text-blue-800",
  UNBEKANNT: "bg-red-100 text-red-800",
}

export default function ScanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [scan, setScan] = useState<Scan | null>(null)
  const [artikel, setArtikel] = useState<Artikel[]>([])
  const [loading, setLoading] = useState(true)
  const [aktion, setAktion] = useState<"" | "bestaetigen" | "ablehnen">("")
  const [ablehnGrund, setAblehnGrund] = useState("")
  const [zeigeAblehnen, setZeigeAblehnen] = useState(false)
  // Korrekturen: positionId → { lagerArtikelId, mengeErhalten }
  const [korrekturen, setKorrekturen] = useState<
    Record<string, { lagerArtikelId?: string | null; mengeErhalten?: number }>
  >({})

  const lade = useCallback(async () => {
    setLoading(true)
    try {
      const [scanRes, artRes] = await Promise.all([
        fetch(`/api/dokumente/scans/${id}`),
        fetch("/api/lager?limit=200"),
      ])
      if (!scanRes.ok) throw new Error(`HTTP ${scanRes.status}`)
      setScan(await scanRes.json())
      if (artRes.ok) setArtikel(await artRes.json())
    } catch {
      toast.error("Dokument konnte nicht geladen werden")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    lade()
  }, [lade])

  async function bestaetigen() {
    setAktion("bestaetigen")
    try {
      const body = {
        korrekturen: Object.entries(korrekturen).map(([positionId, k]) => ({
          positionId,
          ...k,
        })),
      }
      const res = await fetch(`/api/dokumente/scans/${id}/bestaetigen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      toast.success(`Gebucht — ${data.bewegungen} Lagerbewegung(en) erstellt`)
      lade()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bestätigung fehlgeschlagen")
    } finally {
      setAktion("")
    }
  }

  async function ablehnen() {
    if (ablehnGrund.trim().length < 3) {
      toast.error("Bitte Ablehnungsgrund angeben (min. 3 Zeichen)")
      return
    }
    setAktion("ablehnen")
    try {
      const res = await fetch(`/api/dokumente/scans/${id}/ablehnen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grund: ablehnGrund.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      toast.success("Dokument abgelehnt")
      setZeigeAblehnen(false)
      lade()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ablehnung fehlgeschlagen")
    } finally {
      setAktion("")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-on-surface-variant)]" />
      </div>
    )
  }
  if (!scan) {
    return <div className="p-6 text-sm text-red-600">Dokument nicht gefunden.</div>
  }

  const d = scan.extrahierteDaten ?? {}
  const fk = d.feldKonfidenzen ?? {}
  const reviewbar = scan.status === "REVIEW_ERFORDERLICH"
  const gebucht = scan.status === "GEBUCHT"
  const istPdf = scan.originalDateiName.toLowerCase().endsWith(".pdf")
  const istBild = /\.(jpe?g|png)$/i.test(scan.originalDateiName)
  const istHttp = scan.originalDateiUrl.startsWith("http")

  const felder: { label: string; wert: string; konfidenz?: number }[] = [
    { label: "Rechnungs-Nr.", wert: d.rechnungsNr ?? "—", konfidenz: fk.rechnungsNr },
    { label: "Datum", wert: d.datum ?? "—", konfidenz: fk.datum },
    { label: "Lieferant", wert: d.lieferantName ?? "—", konfidenz: fk.lieferantName },
    { label: "USt-ID", wert: d.lieferantUstId ?? "—" },
    {
      label: "Netto",
      wert: d.nettoBetrag != null ? `${d.nettoBetrag.toFixed(2)} ${d.waehrung ?? "EUR"}` : "—",
    },
    {
      label: "Brutto",
      wert: d.gesamtBetrag != null ? `${d.gesamtBetrag.toFixed(2)} ${d.waehrung ?? "EUR"}` : "—",
      konfidenz: fk.gesamtBetrag,
    },
  ]

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dokumente/scans" className="p-2 rounded-lg border hover:bg-accent/50">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--color-on-surface)" }}>
              {scan.originalDateiName}
            </h1>
            <p className="text-xs text-[var(--color-on-surface-variant)]">
              {scan.typ} · {scan.status} · Gesamt-Konfidenz:{" "}
              <KonfidenzAmpel wert={scan.gesamtKonfidenz} />
            </p>
          </div>
        </div>
        {reviewbar && (
          <div className="flex gap-2">
            <button
              onClick={() => setZeigeAblehnen(true)}
              disabled={aktion !== ""}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-red-700 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
            >
              <X className="w-4 h-4" /> Ablehnen
            </button>
            <button
              onClick={bestaetigen}
              disabled={aktion !== ""}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {aktion === "bestaetigen" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Bestätigen & buchen
            </button>
          </div>
        )}
        {gebucht && (
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-sm font-medium">
            <Lock className="w-4 h-4" /> Gebucht — unveränderlich
          </span>
        )}
      </div>

      {scan.routingGrund && (
        <div className="border border-amber-200 bg-amber-50 text-amber-900 rounded-lg p-3 text-sm">
          <strong>Routing:</strong> {scan.routingGrund}
        </div>
      )}
      {(d.mwstHinweise?.length ?? 0) > 0 && (
        <div className="border border-red-200 bg-red-50 text-red-900 rounded-lg p-3 text-sm">
          <strong>USt-Hinweise:</strong> {d.mwstHinweise!.join("; ")}
        </div>
      )}

      {/* Split-View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Links: Original */}
        <div className="border rounded-lg overflow-hidden bg-card">
          <div className="px-4 py-2 border-b text-xs font-medium text-[var(--color-on-surface-variant)] flex items-center justify-between">
            Original
            {istHttp && (
              <a
                href={scan.originalDateiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-emerald-700 hover:underline"
              >
                Öffnen <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="h-[600px] bg-slate-50">
            {istHttp && istPdf ? (
              <iframe src={scan.originalDateiUrl} className="w-full h-full" title="Original-PDF" />
            ) : istHttp && istBild ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={scan.originalDateiUrl}
                alt={scan.originalDateiName}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-[var(--color-on-surface-variant)] p-6 text-center">
                Keine Vorschau verfügbar
                {istHttp ? " — Original über den Öffnen-Link ansehen" : " (lokale Datei)"}
              </div>
            )}
          </div>
        </div>

        {/* Rechts: Extrahierte Daten */}
        <div className="space-y-4">
          <div className="border rounded-lg bg-card p-4">
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-on-surface)" }}>
              Extrahierte Felder
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {felder.map((f) => (
                <div key={f.label}>
                  <div className="text-xs text-[var(--color-on-surface-variant)] flex items-center gap-2">
                    {f.label}
                    {f.konfidenz !== undefined && <KonfidenzAmpel wert={f.konfidenz} />}
                  </div>
                  <div className="text-sm font-medium" style={{ color: "var(--color-on-surface)" }}>
                    {f.wert}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-lg bg-card p-4">
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-on-surface)" }}>
              Positionen ({scan.positionen.length})
            </h2>
            <div className="space-y-3">
              {scan.positionen.map((p) => {
                const k = korrekturen[p.id]
                const artikelId = k?.lagerArtikelId !== undefined ? k.lagerArtikelId : p.lagerArtikelId
                return (
                  <div key={p.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium" style={{ color: "var(--color-on-surface)" }}>
                        {p.artikelBezeichnung}
                      </span>
                      <div className="flex items-center gap-2">
                        <KonfidenzAmpel wert={p.konfidenz} />
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${MATCH_BADGE[p.matchStatus] ?? ""}`}
                        >
                          {p.matchStatus}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-[var(--color-on-surface-variant)]">
                      {p.mengeErwartet} {p.einheit} × {p.einzelpreis.toFixed(2)} € ={" "}
                      {p.gesamtpreis.toFixed(2)} € · MwSt {p.mwstSatz}%
                      {p.lieferantArtikelNr ? ` · Art-Nr ${p.lieferantArtikelNr}` : ""}
                    </div>
                    {reviewbar && (
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={artikelId ?? ""}
                          onChange={(e) =>
                            setKorrekturen((prev) => ({
                              ...prev,
                              [p.id]: { ...prev[p.id], lagerArtikelId: e.target.value || null },
                            }))
                          }
                          className="flex-1 min-w-[200px] border rounded-lg px-2 py-1.5 text-xs bg-transparent"
                        >
                          <option value="">— Lager-Artikel zuordnen —</option>
                          {artikel.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({a.einheit})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder={`Menge (${p.mengeErwartet})`}
                          value={k?.mengeErhalten ?? ""}
                          onChange={(e) =>
                            setKorrekturen((prev) => ({
                              ...prev,
                              [p.id]: {
                                ...prev[p.id],
                                mengeErhalten: e.target.value ? Number(e.target.value) : undefined,
                              },
                            }))
                          }
                          className="w-32 border rounded-lg px-2 py-1.5 text-xs bg-transparent"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
              {scan.positionen.length === 0 && (
                <p className="text-xs text-[var(--color-on-surface-variant)]">Keine Positionen extrahiert.</p>
              )}
            </div>
          </div>

          <div className="border rounded-lg bg-card p-4">
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-on-surface)" }}>
              Audit-Trail
            </h2>
            <div className="space-y-2">
              {scan.auditLog.map((a) => (
                <div key={a.id} className="flex items-start gap-3 text-xs">
                  <span className="text-[var(--color-on-surface-variant)] whitespace-nowrap">
                    {new Date(a.erstelltAm).toLocaleString("de-DE")}
                  </span>
                  <span className="font-medium">{a.aktion}</span>
                  <span className="text-[var(--color-on-surface-variant)]">
                    {a.systemAktion ? "System" : a.userId ?? ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ablehnen-Modal */}
      {zeigeAblehnen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card border rounded-lg p-5 w-full max-w-md space-y-3">
            <h3 className="font-semibold" style={{ color: "var(--color-on-surface)" }}>
              Dokument ablehnen
            </h3>
            <textarea
              value={ablehnGrund}
              onChange={(e) => setAblehnGrund(e.target.value)}
              placeholder="Grund der Ablehnung (Pflicht)"
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-transparent"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setZeigeAblehnen(false)}
                className="px-4 py-2 rounded-lg border text-sm"
              >
                Abbrechen
              </button>
              <button
                onClick={ablehnen}
                disabled={aktion !== ""}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {aktion === "ablehnen" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ablehnen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
