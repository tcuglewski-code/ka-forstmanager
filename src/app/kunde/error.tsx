'use client'
// AUDIT-FIX T-034: Error Boundary — Bereich hatte kein error.tsx, unbehandelte Fehler zeigten den Next.js-Crash-Screen
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h2 className="text-lg font-semibold text-gray-900">Etwas ist schiefgelaufen</h2>
      <p className="text-sm text-gray-600">Die Seite konnte nicht geladen werden.</p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-md text-sm border border-gray-300 text-gray-900 hover:bg-gray-100 transition-colors"
      >
        Erneut versuchen
      </button>
    </div>
  )
}
