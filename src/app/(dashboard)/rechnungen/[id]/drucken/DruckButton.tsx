"use client"

export default function DruckButton() {
  return (
    <div className="mt-4 print:hidden">
      <button
        onClick={() => window.print()}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        🖨️ Drucken / Als PDF speichern
      </button>
    </div>
  )
}
