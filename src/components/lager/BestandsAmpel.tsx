"use client"

interface BestandsAmpelProps {
  bestand: number
  mindestbestand: number
  artikelName?: string
  showText?: boolean
}

/**
 * Ampel-Anzeige für Lagerbestand
 * - Grün: bestand > mindestbestand
 * - Gelb: bestand > 0 && bestand <= mindestbestand
 * - Rot: bestand <= 0
 */
export function BestandsAmpel({ bestand, mindestbestand, artikelName, showText = false }: BestandsAmpelProps) {
  let color = "bg-emerald-500"
  let status = "Ausreichend"
  let textColor = "text-emerald-400"
  
  if (bestand <= 0) {
    color = "bg-red-500"
    status = "Leer"
    textColor = "text-red-400"
  } else if (bestand <= mindestbestand) {
    color = "bg-amber-400"
    status = "Niedrig"
    textColor = "text-amber-400"
  }

  return (
    <div className="flex items-center gap-2">
      <span 
        className={`inline-block w-2.5 h-2.5 rounded-full ${color}`}
        title={`${artikelName ? artikelName + ": " : ""}${status} (${bestand}/${mindestbestand})`}
      />
      {showText && (
        <span className={`text-xs font-medium ${textColor}`}>
          {status}
        </span>
      )}
    </div>
  )
}

/**
 * Widget für kritische Bestände im Dashboard
 */
interface KritischeBestaendeWidgetProps {
  artikel: Array<{
    id: string
    name: string
    bestand: number
    mindestbestand: number
    einheit: string
    kategorie: string
  }>
}

export function KritischeBestaendeWidget({ artikel }: KritischeBestaendeWidgetProps) {
  const kritisch = artikel.filter(a => a.bestand <= a.mindestbestand)
  
  if (kritisch.length === 0) {
    return (
      <div className="bg-[#161616] border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <h3 className="text-sm font-medium text-white">Kritische Bestände</h3>
        </div>
        <p className="text-sm text-zinc-500">Alle Bestände im grünen Bereich ✓</p>
      </div>
    )
  }

  return (
    <div className="bg-[#161616] border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h3 className="text-sm font-medium text-white">Kritische Bestände</h3>
        </div>
        <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-800">
          {kritisch.length} Artikel
        </span>
      </div>
      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {kritisch.map(a => (
          <div 
            key={a.id} 
            className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#1e1e1e] hover:bg-[#252525] transition-colors"
          >
            <div className="flex items-center gap-2">
              <BestandsAmpel bestand={a.bestand} mindestbestand={a.mindestbestand} />
              <span className="text-sm text-white truncate max-w-[150px]">{a.name}</span>
              <span className="text-xs text-zinc-500 px-1.5 py-0.5 rounded bg-surface-container-highest">
                {a.kategorie}
              </span>
            </div>
            <div className="text-right">
              <span className={`text-sm font-medium ${a.bestand <= 0 ? "text-red-400" : "text-amber-400"}`}>
                {a.bestand}
              </span>
              <span className="text-xs text-zinc-500">/{a.mindestbestand} {a.einheit}</span>
            </div>
          </div>
        ))}
      </div>
      <a 
        href="/lager" 
        className="mt-3 block text-center text-xs text-emerald-400 hover:text-emerald-300 py-2"
      >
        Zum Lager →
      </a>
    </div>
  )
}

export default BestandsAmpel
