// AUDIT-FIX T-034: globales not-found.tsx — Projekt hatte keins (Next.js-Default-404)
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h2 className="text-lg font-semibold text-gray-900">Seite nicht gefunden</h2>
      <p className="text-sm text-gray-600">Die angeforderte Seite existiert nicht.</p>
      <Link
        href="/"
        className="px-4 py-2 rounded-md text-sm border border-gray-300 text-gray-900 hover:bg-gray-100 transition-colors"
      >
        Zur Startseite
      </Link>
    </div>
  )
}
