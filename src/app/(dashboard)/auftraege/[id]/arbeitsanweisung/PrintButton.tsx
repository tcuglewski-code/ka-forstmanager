"use client"

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors"
    >
      🖨️ Drucken / PDF speichern
    </button>
  )
}
