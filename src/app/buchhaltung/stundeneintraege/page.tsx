/**
 * Buchhaltung Stundeneinträge
 * Sprint GB-05: Steuerberater-Zugang
 * 
 * Read-Only Liste aller Stundeneinträge mit Filtermöglichkeiten
 */
"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"

interface Stundeneintrag {
  id: string
  datum: string
  stunden: number
  typ: string
  notiz: string | null
  genehmigt: boolean
  stundenlohn: number | null
  maschinenzuschlag: number | null
  mitarbeiter: {
    id: string
    vorname: string
    nachname: string
  }
  auftrag: {
    id: string
    titel: string
    nummer: string | null
  } | null
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

interface Stats {
  gesamtStunden: number
  anzahlEintraege: number
}

export default function BuchhaltungStundeneintraegePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [eintraege, setEintraege] = useState<Stundeneintrag[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  // Filter States
  const [von, setVon] = useState(searchParams.get("von") || "")
  const [bis, setBis] = useState(searchParams.get("bis") || "")
  const [genehmigt, setGenehmigt] = useState(searchParams.get("genehmigt") || "")
  const currentPage = parseInt(searchParams.get("page") || "1")
  
  const fetchEintraege = useCallback(async () => {
    setLoading(true)
    setError("")
    
    const params = new URLSearchParams()
    params.set("page", currentPage.toString())
    if (von) params.set("von", von)
    if (bis) params.set("bis", bis)
    if (genehmigt) params.set("genehmigt", genehmigt)
    
    try {
      const res = await fetch(`/api/buchhaltung/stundeneintraege?${params.toString()}`)
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Laden")
      }
      
      setEintraege(data.data)
      setPagination(data.pagination)
      setStats(data.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler")
    } finally {
      setLoading(false)
    }
  }, [currentPage, von, bis, genehmigt])
  
  useEffect(() => {
    fetchEintraege()
  }, [fetchEintraege])
  
  const handleFilter = () => {
    const params = new URLSearchParams()
    if (von) params.set("von", von)
    if (bis) params.set("bis", bis)
    if (genehmigt) params.set("genehmigt", genehmigt)
    router.push(`/buchhaltung/stundeneintraege?${params.toString()}`)
  }
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("de-DE")
  }
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR"
    }).format(value)
  }
  
  const getTypBadge = (typ: string) => {
    const styles: Record<string, string> = {
      arbeit: "bg-green-100 text-green-800",
      fahrt: "bg-blue-100 text-blue-800",
      pause: "bg-gray-100 text-gray-800",
      krankheit: "bg-red-100 text-red-800",
      urlaub: "bg-purple-100 text-purple-800",
    }
    return styles[typ] || "bg-gray-100 text-gray-800"
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stundeneinträge</h1>
          <p className="mt-1 text-sm text-gray-600">
            {pagination ? `${pagination.total} Einträge gefunden` : "Wird geladen..."}
            {stats && ` • ${stats.gesamtStunden.toLocaleString("de-DE")} Stunden gesamt`}
          </p>
        </div>
        <Link
          href="/buchhaltung"
          className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Zurück zur Übersicht
        </Link>
      </div>
      
      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Einträge</p>
            <p className="text-2xl font-bold text-gray-900">{stats.anzahlEintraege.toLocaleString("de-DE")}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Gesamtstunden</p>
            <p className="text-2xl font-bold text-gray-900">{stats.gesamtStunden.toLocaleString("de-DE")} h</p>
          </div>
        </div>
      )}
      
      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Von</label>
            <input
              type="date"
              value={von}
              onChange={(e) => setVon(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bis</label>
            <input
              type="date"
              value={bis}
              onChange={(e) => setBis(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Genehmigt</label>
            <select
              value={genehmigt}
              onChange={(e) => setGenehmigt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Alle</option>
              <option value="true">Nur genehmigte</option>
              <option value="false">Nur nicht genehmigte</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleFilter}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Filter anwenden
            </button>
          </div>
        </div>
      </div>
      
      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="animate-spin h-8 w-8 mx-auto text-emerald-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="mt-2">Stundeneinträge werden geladen...</p>
          </div>
        ) : eintraege.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Keine Stundeneinträge gefunden
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mitarbeiter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Auftrag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stunden
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Typ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stundenlohn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {eintraege.map((eintrag) => (
                <tr key={eintrag.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(eintrag.datum)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">
                      {eintrag.mitarbeiter.vorname} {eintrag.mitarbeiter.nachname}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {eintrag.auftrag ? (
                      <div>
                        <p className="text-sm text-gray-900">{eintrag.auftrag.titel}</p>
                        <p className="text-xs text-gray-500">{eintrag.auftrag.nummer}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {eintrag.stunden.toLocaleString("de-DE")} h
                    </span>
                    {eintrag.maschinenzuschlag && eintrag.maschinenzuschlag > 0 && (
                      <p className="text-xs text-gray-500">
                        +{formatCurrency(eintrag.maschinenzuschlag)} Maschinenzuschlag
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypBadge(eintrag.typ)}`}>
                      {eintrag.typ}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {eintrag.stundenlohn ? formatCurrency(eintrag.stundenlohn) : "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {eintrag.genehmigt ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Genehmigt
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Ausstehend
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Seite {pagination.page} von {pagination.pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/buchhaltung/stundeneintraege?page=${pagination.page - 1}&von=${von}&bis=${bis}&genehmigt=${genehmigt}`)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Zurück
            </button>
            <button
              onClick={() => router.push(`/buchhaltung/stundeneintraege?page=${pagination.page + 1}&von=${von}&bis=${bis}&genehmigt=${genehmigt}`)}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Weiter
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
