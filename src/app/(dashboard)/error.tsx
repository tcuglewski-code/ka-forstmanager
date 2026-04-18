'use client'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h2 className="text-lg font-semibold" style={{ color: 'var(--color-on-surface)' }}>Etwas ist schiefgelaufen</h2>
      <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Die Seite konnte nicht geladen werden.</p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-md text-sm transition-colors"
        style={{
          border: '1px solid var(--color-outline-variant)',
          color: 'var(--color-on-surface)',
          backgroundColor: 'transparent'
        }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-surface-container)')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        Erneut versuchen
      </button>
    </div>
  )
}
