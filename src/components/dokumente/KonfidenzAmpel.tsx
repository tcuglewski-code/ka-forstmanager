"use client"

/** DOK-028: Konfidenz-Ampel — grün ≥0.85, gelb 0.60–0.85, rot <0.60 */
export function KonfidenzAmpel({ wert }: { wert: number | null | undefined }) {
  if (wert === null || wert === undefined) {
    return <span className="text-xs text-[var(--color-on-surface-variant)]">—</span>
  }
  const farbe = wert >= 0.85 ? "bg-emerald-500" : wert >= 0.6 ? "bg-amber-500" : "bg-red-500"
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span className={`w-2.5 h-2.5 rounded-full ${farbe}`} />
      {(wert * 100).toFixed(0)}%
    </span>
  )
}
