"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, Printer, FileDown, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Flaeche {
  id: string
  registerNr: string
  baumart: string
  bundesland: string
  flaecheHa: number | null
  forstamt: string | null
  revier: string | null
  sonderherkunft: boolean
}

function VertragPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)

  const urlIds = searchParams.get("flaechenIds")?.split(",").filter(Boolean) ?? []

  // Vertragspartei-Vorauswahl
  const VP_VORLAGEN = [
    { label: "Koch Aufforstung GmbH (Standard)", name: "Koch Aufforstung GmbH", strasse: "Breitwieser Weg 98", plz: "64319", ort: "Pfungstadt" },
    { label: "Darmstädter Forstbaumschulen GmbH", name: "Darmstädter Forstbaumschulen GmbH", strasse: "Brandschneise 2", plz: "64295", ort: "Darmstadt" },
    { label: "Andere (manuell eingeben)", name: "", strasse: "", plz: "", ort: "" },
  ]

  // Formular-State
  const [erntejahr, setErntejahr] = useState(new Date().getFullYear() + 1)
  const [ernteKw, setErnteKw] = useState(38)
  const [entschaedigungKg, setEntschaedigungKg] = useState(0.80)
  const [vpVorlageIdx, setVpVorlageIdx] = useState(0)
  const [vpName, setVpName] = useState("Koch Aufforstung GmbH")
  const [vpStrasse, setVpStrasse] = useState("Breitwieser Weg 98")
  const [vpPlz, setVpPlz] = useState("64319")
  const [vpOrt, setVpOrt] = useState("Pfungstadt")
  const [ortVertragspartei, setOrtVertragspartei] = useState("Pfungstadt")
  const [ortWaldbesitzer, setOrtWaldbesitzer] = useState("")
  const [datum, setDatum] = useState(() => new Date().toLocaleDateString("de-DE"))

  const [flaechen, setFlaechen] = useState<Flaeche[]>([])
  const [loading, setLoading] = useState(urlIds.length > 0)
  const [generating, setGenerating] = useState(false)
  const [aktivesForstamt, setAktivesForstamt] = useState<string>("")

  useEffect(() => {
    if (urlIds.length === 0) {
      setLoading(false)
      return
    }
    fetch(`/api/saatguternte/flaechen-by-ids?ids=${urlIds.join(",")}`)
      .then((r) => r.json())
      .then((data: Flaeche[]) => {
        setFlaechen(data)
        if (data[0]?.forstamt) {
          setOrtWaldbesitzer(data[0].forstamt)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [urlIds.join(",")])

  // Flächen nach Forstamt gruppieren
  const flaechenByForstamt = flaechen.reduce((acc, f) => {
    const key = f.forstamt ?? "Unbekannt"
    if (!acc[key]) acc[key] = []
    acc[key].push(f)
    return acc
  }, {} as Record<string, Flaeche[]>)

  const forstaemter = Object.keys(flaechenByForstamt).sort()

  // Beim Laden: erstes Forstamt als aktiv setzen
  useEffect(() => {
    if (forstaemter.length > 0 && !aktivesForstamt) {
      setAktivesForstamt(forstaemter[0])
    }
  }, [forstaemter.length])

  const aktiveFlächen = flaechenByForstamt[aktivesForstamt] ?? []
  const forstamtName = aktivesForstamt || flaechen[0]?.forstamt || "–"

  async function handleDocxDownload() {
    setGenerating(true)
    try {
      const res = await fetch("/api/saatguternte/vertrag/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flaechenIds: aktiveFlächen.map((f) => f.id),
          erntejahr,
          ernteKw,
          entschaedigungKg,
          ortVertragspartei,
          ortWaldbesitzer,
          datum,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error("Fehler: " + (err.error ?? "Unbekannter Fehler"))
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Ernteüberlassungsvertrag_${forstamtName}_${erntejahr}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      toast.error("Fehler beim Generieren: " + e.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      {/* Print-Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #vertrag-print-area, #vertrag-print-area * { visibility: visible !important; }
          #vertrag-print-area {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100% !important;
            padding: 20mm 25mm !important;
            background: white !important;
            color: black !important;
            font-family: "Times New Roman", serif !important;
            font-size: 11pt !important;
          }
          .no-print { display: none !important; }
          table { border-collapse: collapse !important; width: 100% !important; }
          th, td { border: 1px solid #333 !important; padding: 4px 8px !important; }
        }
      `}</style>

      <div className="min-h-screen bg-[var(--color-surface-container-low)] text-zinc-300 p-6">
        {/* Header */}
        <div className="no-print flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg border border-border hover:border-zinc-500 text-[var(--color-on-surface-variant)] hover:text-zinc-300 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Ernteüberlassungsvertrag</h1>
            <p className="text-sm text-[var(--color-on-surface-variant)]">{flaechen.length} Fläche(n) ausgewählt</p>
          </div>
          <div className="flex-1" />
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:border-blue-500 text-zinc-300 hover:text-blue-400 transition-all text-sm"
          >
            <Printer className="w-4 h-4" />
            Drucken / PDF
          </button>
          <button
            onClick={handleDocxDownload}
            disabled={generating || flaechen.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all text-sm font-medium"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            DOCX herunterladen
          </button>
        </div>

        {/* Info-Banner: mehrere Forstämter */}
        {forstaemter.length > 1 && (
          <div className="no-print mb-4 p-3 bg-blue-900/30 border border-blue-600/30 rounded-lg text-sm text-blue-300">
            ℹ️ Du hast Flächen aus {forstaemter.length} verschiedenen Forstämtern ausgewählt.
            Bitte generiere für jedes Forstamt einen separaten Vertrag (Tab wechseln → herunterladen).
          </div>
        )}

        {/* Tab-Leiste: 1 Forstamt = 1 Vertrag */}
        {forstaemter.length > 1 && (
          <div className="no-print flex gap-2 mb-4 flex-wrap">
            {forstaemter.map((fa) => (
              <button
                key={fa}
                onClick={() => { setAktivesForstamt(fa); setOrtWaldbesitzer(fa) }}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  aktivesForstamt === fa
                    ? "bg-emerald-600 border-emerald-500 text-white"
                    : "bg-[var(--color-surface-container-highest)] border-border text-[var(--color-on-surface-variant)] hover:border-zinc-500"
                }`}
              >
                {fa}
                <span className="ml-2 text-xs opacity-70">({flaechenByForstamt[fa].length} Fl.)</span>
              </button>
            ))}
            <span className="text-xs text-zinc-600 self-center ml-2">
              = {forstaemter.length} separate Verträge
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formular */}
          <div className="no-print lg:col-span-1 space-y-4 bg-[var(--color-surface-container)] border border-border rounded-xl p-5">
            <h2 className="text-base font-semibold text-white mb-4">Vertragsparameter</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Erntejahr</label>
                <input
                  type="number"
                  value={erntejahr}
                  onChange={(e) => setErntejahr(Number(e.target.value))}
                  className="w-full bg-[var(--color-surface-container-highest)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Ernte ab KW</label>
                <input
                  type="number"
                  min={1}
                  max={53}
                  value={ernteKw}
                  onChange={(e) => setErnteKw(Number(e.target.value))}
                  className="w-full bg-[var(--color-surface-container-highest)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Entschädigung (€/kg)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={entschaedigungKg}
                  onChange={(e) => setEntschaedigungKg(Number(e.target.value))}
                  className="w-full bg-[var(--color-surface-container-highest)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Vertragspartei</label>
                <select
                  value={vpVorlageIdx}
                  onChange={(e) => {
                    const idx = Number(e.target.value)
                    setVpVorlageIdx(idx)
                    const v = VP_VORLAGEN[idx]
                    setVpName(v.name); setVpStrasse(v.strasse); setVpPlz(v.plz); setVpOrt(v.ort)
                    setOrtVertragspartei(v.ort)
                  }}
                  className="w-full bg-[var(--color-surface-container-highest)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-emerald-500 mb-2"
                >
                  {VP_VORLAGEN.map((v, i) => <option key={i} value={i}>{v.label}</option>)}
                </select>
                {/* Manuelle Eingabe wenn "Andere" */}
                {vpVorlageIdx === VP_VORLAGEN.length - 1 && (
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <input placeholder="Firmenname" value={vpName} onChange={e => setVpName(e.target.value)} className="col-span-2 bg-[var(--color-surface-container-highest)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-emerald-500" />
                    <input placeholder="Straße" value={vpStrasse} onChange={e => setVpStrasse(e.target.value)} className="bg-[var(--color-surface-container-highest)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-emerald-500" />
                    <div className="flex gap-2">
                      <input placeholder="PLZ" value={vpPlz} onChange={e => setVpPlz(e.target.value)} className="w-24 bg-[var(--color-surface-container-highest)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-emerald-500" />
                      <input placeholder="Ort" value={vpOrt} onChange={e => { setVpOrt(e.target.value); setOrtVertragspartei(e.target.value) }} className="flex-1 bg-[var(--color-surface-container-highest)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-emerald-500" />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Ort Vertragspartei (Unterschrift)</label>
                <input
                  type="text"
                  value={ortVertragspartei}
                  onChange={(e) => setOrtVertragspartei(e.target.value)}
                  className="w-full bg-[var(--color-surface-container-highest)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Ort Waldbesitzer</label>
                <input
                  type="text"
                  value={ortWaldbesitzer}
                  onChange={(e) => setOrtWaldbesitzer(e.target.value)}
                  className="w-full bg-[var(--color-surface-container-highest)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Datum</label>
                <input
                  type="text"
                  value={datum}
                  onChange={(e) => setDatum(e.target.value)}
                  placeholder="z.B. 27.03.2026"
                  className="w-full bg-[var(--color-surface-container-highest)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Vertragsvorschau */}
          <div className="lg:col-span-2">
            <div
              id="vertrag-print-area"
              ref={printRef}
              className="bg-white text-black rounded-xl p-10 font-serif text-sm leading-relaxed shadow-xl"
              style={{ fontFamily: "'Times New Roman', serif", fontSize: "11pt", lineHeight: 1.6 }}
            >
              {loading ? (
                <div className="flex items-center justify-center h-64 text-[var(--color-on-surface-variant)]">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Lade Flächen…
                </div>
              ) : (
                <>
                  {/* Kopfzeile */}
                  <div className="text-center mb-8">
                    <p className="text-xs text-[var(--color-on-surface-variant)] mb-1">{vpName} · {vpStrasse} · {vpPlz} {vpOrt}</p>
                    <h1 className="text-2xl font-bold mt-4 mb-2" style={{ fontFamily: "Arial, sans-serif" }}>
                      Ernteüberlassungsvertrag
                    </h1>
                  </div>

                  {/* Parteien */}
                  <p className="mb-1">Zwischen</p>
                  <div className="ml-6 mb-4">
                    <p>HessenForst, vertreten durch das Forstamt <strong>{forstamtName}</strong></p>
                    <p className="italic">- im Folgenden „Waldbesitzer" genannt -</p>
                  </div>

                  <p className="mb-1">und</p>
                  <div className="ml-6 mb-4">
                    <p><strong>{vpName}</strong></p>
                    <p>{vpStrasse}</p>
                    <p>{vpPlz} {vpOrt}</p>
                    <p className="italic">- im Folgenden „Vertragspartei" genannt -</p>
                  </div>

                  <p className="mb-6">wird nachstehender Vertrag geschlossen:</p>

                  {/* § 1 */}
                  <p className="font-bold mb-2">§ 1</p>
                  <p className="mb-4">
                    Die Vertragspartei beabsichtigt, im Erntejahr <strong>{erntejahr}</strong> folgende,
                    nach dem Forstvermehrungsgutgesetz (FoVG) zugelassene Waldbestände zu beernten:
                  </p>

                  {/* Flächen-Tabelle */}
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-xs border-collapse mb-4" style={{ borderCollapse: "collapse" }}>
                      <thead>
                        <tr className="bg-zinc-100">
                          <th className="border border-zinc-400 px-2 py-1 text-left">Register-Nr.</th>
                          <th className="border border-zinc-400 px-2 py-1 text-left">Baumart</th>
                          <th className="border border-zinc-400 px-2 py-1 text-left">Forstamt / Revier</th>
                          <th className="border border-zinc-400 px-2 py-1 text-right">Fläche (ha)</th>
                          <th className="border border-zinc-400 px-2 py-1 text-center">Bemerkungen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aktiveFlächen.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="border border-zinc-400 px-2 py-2 text-center text-[var(--color-on-surface-variant)] italic">
                              Keine Flächen ausgewählt
                            </td>
                          </tr>
                        ) : (
                          aktiveFlächen.map((f) => (
                            <tr key={f.id}>
                              <td className="border border-zinc-400 px-2 py-1">{f.registerNr}</td>
                              <td className="border border-zinc-400 px-2 py-1">{f.baumart}</td>
                              <td className="border border-zinc-400 px-2 py-1">{f.revier ?? f.forstamt ?? "—"}</td>
                              <td className="border border-zinc-400 px-2 py-1 text-right">
                                {f.flaecheHa ? f.flaecheHa.toFixed(2) : "—"}
                              </td>
                              <td className="border border-zinc-400 px-2 py-1 text-center">
                                {f.sonderherkunft ? "SHK" : ""}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <p className="mb-4">
                    Der Waldbesitzer überlässt der Vertragspartei die o.a. Erntebestände zur fachgemäßen
                    Beerntung nach dem Forstvermehrungsgutgesetz (FoVG). Die Vertragspartei ist berechtigt,
                    geeignetes Erntegerät einzusetzen.
                  </p>

                  {/* § 2 */}
                  <p className="font-bold mb-2">§ 2</p>
                  <p className="mb-4">
                    Der Waldbesitzer verpflichtet sich, die Beerntung der aufgeführten Flächen durch die
                    Vertragspartei zu dulden und sie dabei nach Kräften zu unterstützen. Er wird die
                    Vertragspartei über etwaige Hindernisse oder Gefahrenstellen rechtzeitig informieren.
                  </p>

                  {/* § 3 */}
                  <p className="font-bold mb-2">§ 3</p>
                  <p className="mb-4">
                    Die Ernte beginnt voraussichtlich ab der <strong>{ernteKw}. KW</strong>.
                    Der genaue Erntezeitpunkt wird zwischen den Vertragsparteien abgestimmt und richtet
                    sich nach dem Reifegrad der Früchte sowie den Witterungsbedingungen.
                  </p>

                  {/* § 4 */}
                  <p className="font-bold mb-2">§ 4</p>
                  <p className="mb-4">
                    Die Vertragspartei verpflichtet sich, die Beerntung nach den Vorschriften des FoVG
                    durchzuführen und alle erforderlichen Nachweise zu führen. Hoheitlich ist das
                    Forstamt <strong>{forstamtName}</strong> zuständig für die Bescheinigung der
                    Herkunft des Erntegutes nach § 5 FoVG.
                  </p>

                  {/* § 5 */}
                  <p className="font-bold mb-2">§ 5</p>
                  <p className="mb-4">
                    Das gewonnene Erntegut bleibt im Eigentum der Vertragspartei. Die Vertragspartei
                    trägt alle mit der Ernte verbundenen Kosten. Sie haftet für alle Schäden, die durch
                    unsachgemäße Beerntung entstehen.
                  </p>

                  {/* § 6 */}
                  <p className="font-bold mb-2">§ 6</p>
                  <p className="mb-4">
                    Die Vertragspartei zahlt dem Waldbesitzer{" "}
                    <strong>{entschaedigungKg.toFixed(2)} €/kg</strong> Früchte
                    (insofern SHK zzgl. 10 %). Die Abrechnung erfolgt nach Wägung des Erntegutes.
                    Die Zahlung ist innerhalb von 30 Tagen nach Rechnungsstellung fällig.
                  </p>

                  {/* § 7 */}
                  <p className="font-bold mb-2">§ 7</p>
                  <p className="mb-4">
                    Dieser Vertrag gilt für das Erntejahr <strong>{erntejahr}</strong>.
                    Änderungen und Ergänzungen bedürfen der Schriftform. Für Streitigkeiten aus diesem
                    Vertrag ist das Gericht am Sitz des Waldbesitzers zuständig.
                  </p>

                  {/* Unterschriften */}
                  <div className="mt-12 grid grid-cols-2 gap-12">
                    <div>
                      <div className="border-b border-black mb-1 mt-8 h-8" />
                      <p className="text-xs">
                        {ortVertragspartei}, den {datum}
                      </p>
                      <p className="text-xs mt-1 text-[var(--color-on-surface-variant)]">
                        {vpName} (Vertragspartei)
                      </p>
                    </div>
                    <div>
                      <div className="border-b border-black mb-1 mt-8 h-8" />
                      <p className="text-xs">
                        {ortWaldbesitzer || "_______________"}, den {datum}
                      </p>
                      <p className="text-xs mt-1 text-[var(--color-on-surface-variant)]">
                        Forstamt {forstamtName} (Waldbesitzer)
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function VertragPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[var(--color-on-surface-variant)]">Lade Vertragsseite…</div>}>
      <VertragPageInner />
    </Suspense>
  )
}
