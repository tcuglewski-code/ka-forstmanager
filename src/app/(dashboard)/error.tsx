'use client'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h2 className="text-lg font-semibold text-white">Etwas ist schiefgelaufen</h2>
      <p className="text-zinc-400 text-sm">Die Seite konnte nicht geladen werden.</p>
      <button onClick={reset} className="px-4 py-2 rounded-md border border-zinc-600 text-sm text-white hover:bg-zinc-800 transition-colors">Erneut versuchen</button>
    </div>
  )
}
