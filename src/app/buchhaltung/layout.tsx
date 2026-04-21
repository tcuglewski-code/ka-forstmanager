/**
 * Buchhaltung Layout
 * Sprint GB-05: Steuerberater-Zugang
 * 
 * Separates Layout für den Steuerberater-Bereich
 * Minimale Navigation, Read-Only Hinweis
 */
import { auth, canAccessAccounting } from "@/lib/auth"
import Link from "next/link"

export default async function BuchhaltungLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  // If not authenticated or no accounting access, just render children
  // (login page will be rendered, or redirect will happen in the page itself)
  if (!session?.user || !canAccessAccounting(session.user)) {
    return <>{children}</>
  }
  
  const isAccountant = session.user.role === "accountant"
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/buchhaltung" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900">ForstManager</span>
                <span className="text-sm text-gray-500">Buchhaltung</span>
              </Link>
            </div>
            
            <nav className="flex items-center gap-6">
              <Link 
                href="/buchhaltung/rechnungen" 
                className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
              >
                Rechnungen
              </Link>
              <Link 
                href="/buchhaltung/stundeneintraege" 
                className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
              >
                Stundeneinträge
              </Link>
              
              <div className="flex items-center gap-3 pl-6 border-l border-border">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                  <p className="text-xs text-gray-500">
                    {isAccountant ? "Steuerberater" : session.user.role}
                  </p>
                </div>
                <form action="/api/auth/signout" method="POST">
                  <button 
                    type="submit"
                    className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                  >
                    Abmelden
                  </button>
                </form>
              </div>
            </nav>
          </div>
        </div>
      </header>
      
      {/* Read-Only Banner für Accountants */}
      {isAccountant && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                <strong>Lesezugriff:</strong> Als Steuerberater haben Sie nur Lesezugriff auf Rechnungen und Stundeneinträge.
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Koch Aufforstung GmbH</p>
            <div className="flex gap-4">
              <Link href="/datenschutz" className="hover:text-emerald-600">Datenschutz</Link>
              <Link href="/impressum" className="hover:text-emerald-600">Impressum</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
