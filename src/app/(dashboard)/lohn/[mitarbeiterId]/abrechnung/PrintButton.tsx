"use client"

// Sprint AF: Drucken- und PDF-Export-Buttons für die Lohnabrechnung

interface PrintButtonProps {
  /** Lohnabrechnung-ID für den PDF-Export (optional – wenn nicht übergeben, nur Drucken) */
  abrechnungId?: string
}

export function PrintButton({ abrechnungId }: PrintButtonProps) {
  const handlePdfExport = () => {
    if (!abrechnungId) return
    // PDF in neuem Tab öffnen (Download-Header löst Browser-Download aus)
    window.open(`/api/lohn/export-pdf/${abrechnungId}`, "_blank")
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => window.print()}
        className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors"
      >
        🖨️ Lohnabrechnung drucken
      </button>

      {abrechnungId && (
        <button
          onClick={handlePdfExport}
          className="px-4 py-2 bg-green-700 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
        >
          📄 Als PDF exportieren
        </button>
      )}
    </div>
  )
}
