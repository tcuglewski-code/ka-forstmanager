"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, Printer, FileDown, Loader2 } from "lucide-react"

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

  // Formular-State
  const [erntejahr, setErntejahr] = useState(new Date().getFullYear() + 1)
  const [ernteKw, setErnteKw] = useState(38)
  const [entschaedigungKg, setEntschaedigungKg] = useState(0.80)
  const [ortVertragspartei, setOrtVertragspartei] = useState("Espenau")
  const [ortWaldbesitzer, setOrtWaldbesitzer] = useState("")
  const [datum, setDatum] = useState(() => new Date().toLocaleDateString("de-DE"))

  const [flaechen, setFlaechen] = useState<Flaeche[]>([])
  const [loading, setLoading] = useState(urlIds.length > 0)
  const [generating, setGenerating] = useState(false)

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

  const forstamtName = flaechen[0]?.forstamt ?? "–"

  async function handleDocxDownload() {
    setGenerating(true)
    try {
      const res = await fetch("/api/saatguternte/vertrag/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flaechenIds: flaechen.map((f) => f.id),
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
        alert("Fehler: " + (err.error ?? "Unbekannter Fehler"))
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
      alert("Fehler beim Generieren: " + e.message)
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

      <div className="min-h-screen bg-[#0f0f0f] text-zinc-300 p-6">
        {/* Header */}
        <div className="no-print flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg border border-[#2a2a2a] hover:border-zinc-500 text-zinc-500 hover:text-zinc-300 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-white">Ernteüberlassungsvertrag</h1>
            <p className="text-sm text-zinc-500">{flaechen.length} Fläche(n) ausgewählt</p>
          </div>
          <div className="flex-1" />
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2a2a2a] hover:border-blue-500 text-zinc-300 hover:text-blue-400 transition-all text-sm"
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formular */}
          <div className="no-print lg:col-span-1 space-y-4 bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
            <h2 className="text-base font-semibold text-white mb-4">Vertragsparameter</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Erntejahr</label>
                <input
                  type="number"
                  value={erntejahr}
                  onChange={(e) => setErntejahr(Number(e.target.value))}
                  className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Ernte ab KW</label>
                <input
                  type="number"
                  min={1}
                  max={53}
                  value={ernteKw}
                  onChange={(e) => setErnteKw(Number(e.target.value))}
                  className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Entschädigung (€/kg)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={entschaedigungKg}
                  onChange={(e) => setEntschaedigungKg(Number(e.target.value))}
                  className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Ort Vertragspartei</label>
                <input
                  type="text"
                  value={ortVertragspartei}
                  onChange={(e) => setOrtVertragspartei(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Ort Waldbesitzer</label>
                <input
                  type="text"
                  value={ortWaldbesitzer}
                  onChange={(e) => setOrtWaldbesitzer(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Datum</label>
                <input
                  type="text"
                  value={datum}
                  onChange={(e) => setDatum(e.target.value)}
                  placeholder="z.B. 27.03.2026"
                  className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
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
                <div className="flex items-center justify-center h-64 text-zinc-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Lade Flächen…
                </div>
              ) : (
                <>
                  {/* Kopfzeile */}
                  <div className="text-center mb-8">
                    <p className="text-xs text-zinc-500 mb-1">Koch Aufforstung GmbH · An der Kirche 5 · 34314 Espenau</p>
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
                    <p><strong>Koch Aufforstung GmbH</strong></p>
                    <p>An der Kirche 5</p>
                    <p>34314 Espenau</p>
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
                        {flaechen.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="border border-zinc-400 px-2 py-2 text-center text-zinc-400 italic">
                              Keine Flächen ausgewählt
                            </td>
                          </tr>
                        ) : (
                          flaechen.map((f) => (
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
                      <p className="text-xs mt-1 text-zinc-500">
                        Koch Aufforstung GmbH (Vertragspartei)
                      </p>
                    </div>
                    <div>
                      <div className="border-b border-black mb-1 mt-8 h-8" />
                      <p className="text-xs">
                        {ortWaldbesitzer || "_______________"}, den {datum}
                      </p>
                      <p className="text-xs mt-1 text-zinc-500">
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
    <Suspense fallback={<div className="p-8 text-zinc-500">Lade Vertragsseite…</div>}>
      <VertragPageInner />
    </Suspense>
  )
}
