/**
 * Buchhaltung Dashboard
 * Sprint GB-05: Steuerberater-Zugang
 * 
 * Übersichtsseite für Steuerberater mit Links zu Rechnungen und Stundeneinträgen
 */
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth, canAccessAccounting } from "@/lib/auth"

async function getStats() {
  const [rechnungenCount, rechnungenSumme, stundenCount, stundenSumme] = await Promise.all([
    prisma.rechnung.count({ where: { deletedAt: null } }),
    prisma.rechnung.aggregate({
      where: { deletedAt: null },
      _sum: { bruttoBetrag: true }
    }),
    prisma.stundeneintrag.count(),
    prisma.stundeneintrag.aggregate({
      _sum: { stunden: true }
    }),
  ])
  
  return {
    rechnungen: {
      count: rechnungenCount,
      summe: rechnungenSumme._sum.bruttoBetrag || 0,
    },
    stunden: {
      count: stundenCount,
      summe: stundenSumme._sum.stunden || 0,
    }
  }
}

export default async function BuchhaltungDashboard() {
  const session = await auth()
  
  // Redirect wenn nicht authentifiziert oder kein Buchhaltungszugriff
  if (!session?.user) {
    redirect("/buchhaltung/login")
  }
  
  if (!canAccessAccounting(session.user)) {
    redirect("/login?error=NoAccess")
  }
  
  const stats = await getStats()
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR"
    }).format(value)
  }
  
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Willkommen, {session?.user?.name}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Übersicht über Rechnungen und Stundeneinträge
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rechnungen Card */}
        <Link 
          href="/buchhaltung/rechnungen"
          className="bg-white rounded-xl shadow-sm border border-border p-6 hover:shadow-md hover:border-emerald-200 transition-all group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Rechnungen</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.rechnungen.count}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Gesamtwert: {formatCurrency(stats.rechnungen.summe)}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-emerald-600 group-hover:text-emerald-700">
            <span>Alle Rechnungen anzeigen</span>
            <svg className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
        
        {/* Stundeneinträge Card */}
        <Link 
          href="/buchhaltung/stundeneintraege"
          className="bg-white rounded-xl shadow-sm border border-border p-6 hover:shadow-md hover:border-emerald-200 transition-all group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Stundeneinträge</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.stunden.count.toLocaleString("de-DE")}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Gesamt: {stats.stunden.summe.toLocaleString("de-DE")} Stunden
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-emerald-600 group-hover:text-emerald-700">
            <span>Alle Stundeneinträge anzeigen</span>
            <svg className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>
      
      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-blue-900">Hinweise für Steuerberater</h3>
            <ul className="mt-2 text-sm text-blue-800 space-y-1">
              <li>• Alle Daten sind schreibgeschützt (Read-Only)</li>
              <li>• Rechnungen können nach Zeitraum und Status gefiltert werden</li>
              <li>• Stundeneinträge können nach Mitarbeiter und Auftrag gefiltert werden</li>
              <li>• Export-Funktionen werden in Kürze verfügbar sein</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Quick Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-border p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Schnellzugriff</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/buchhaltung/rechnungen?status=offen"
            className="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition-colors"
          >
            <p className="text-sm font-medium text-gray-900">Offene Rechnungen</p>
            <p className="text-xs text-gray-500 mt-1">Status: offen</p>
          </Link>
          <Link
            href="/buchhaltung/rechnungen?status=bezahlt"
            className="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition-colors"
          >
            <p className="text-sm font-medium text-gray-900">Bezahlte Rechnungen</p>
            <p className="text-xs text-gray-500 mt-1">Status: bezahlt</p>
          </Link>
          <Link
            href={`/buchhaltung/stundeneintraege?von=${new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]}`}
            className="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition-colors"
          >
            <p className="text-sm font-medium text-gray-900">Aktueller Monat</p>
            <p className="text-xs text-gray-500 mt-1">Stundeneinträge</p>
          </Link>
          <Link
            href="/buchhaltung/stundeneintraege?genehmigt=true"
            className="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition-colors"
          >
            <p className="text-sm font-medium text-gray-900">Genehmigte Stunden</p>
            <p className="text-xs text-gray-500 mt-1">Nur genehmigte</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
