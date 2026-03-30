"use client"

import { useState } from "react"
import { useParams } from "next/navigation"

export default function DruckButton() {
  const params = useParams()
  const id = params?.id as string
  const [downloading, setDownloading] = useState(false)

  const handlePdfDownload = async () => {
    if (!id) return
    setDownloading(true)
    try {
      const response = await fetch(`/api/rechnungen/${id}/pdf`)
      if (!response.ok) throw new Error("PDF-Generierung fehlgeschlagen")
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Rechnung_${id}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("PDF Download Fehler:", error)
      alert("PDF konnte nicht erstellt werden. Bitte versuchen Sie es erneut.")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="mt-4 print:hidden flex gap-3">
      <button
        onClick={() => window.print()}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        🖨️ Browser-Druck
      </button>
      <button
        onClick={handlePdfDownload}
        disabled={downloading}
        className="px-4 py-2 bg-emerald-700 text-white rounded hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {downloading ? (
          <>
            <span className="animate-spin">⏳</span> PDF wird erstellt...
          </>
        ) : (
          <>📄 PDF mit QR-Code herunterladen</>
        )}
      </button>
    </div>
  )
}
