/**
 * Buchhaltung Rechnungen
 * Sprint GB-05: Steuerberater-Zugang
 * 
 * Read-Only Liste aller Rechnungen mit Filtermöglichkeiten
 */
"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"

interface Rechnung {
  id: string
  nummer: string
  betrag: number
  bruttoBetrag: number | null
  mwst: number
  status: string
  rechnungsDatum: string
  faelligAm: string | null
  lockedAt: string | null
  auftrag: {
    id: string
    titel: string
    nummer: string | null
    waldbesitzer: string | null
  } | null
  positionen: Array<{
    id: string
    beschreibung: string
    menge: number
    einheit: string
    preisProEinheit: number
    gesamt: number
  }>
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export default function BuchhaltungRechnungenPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  // Filter States
  const [status, setStatus] = useState(searchParams.get("status") || "")
  const [von, setVon] = useState(searchParams.get("von") || "")
  const [bis, setBis] = useState(searchParams.get("bis") || "")
  const currentPage = parseInt(searchParams.get("page") || "1")
  
  const fetchRechnungen = useCallback(async () => {
    setLoading(true)
    setError("")
    
    const params = new URLSearchParams()
    params.set("page", currentPage.toString())
    if (status) params.set("status", status)
    if (von) params.set("von", von)
    if (bis) params.set("bis", bis)
    
    try {
      const res = await fetch(`/api/buchhaltung/rechnungen?${params.toString()}`)
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Laden")
      }
      
      setRechnungen(data.data)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler")
    } finally {
      setLoading(false)
    }
  }, [currentPage, status, von, bis])
  
  useEffect(() => {
    fetchRechnungen()
  }, [fetchRechnungen])
  
  const handleFilter = () => {
    const params = new URLSearchParams()
    if (status) params.set("status", status)
    if (von) params.set("von", von)
    if (bis) params.set("bis", bis)
    router.push(`/buchhaltung/rechnungen?${params.toString()}`)
  }
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR"
    }).format(value)
  }
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("de-DE")
  }
  
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      offen: "bg-yellow-100 text-yellow-800",
      versendet: "bg-blue-100 text-blue-800",
      bezahlt: "bg-green-100 text-green-800",
      storniert: "bg-red-100 text-red-800",
      mahnung: "bg-orange-100 text-orange-800",
    }
    return styles[status] || "bg-gray-100 text-gray-800"
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rechnungen</h1>
          <p className="mt-1 text-sm text-gray-600">
            {pagination ? `${pagination.total} Rechnungen gefunden` : "Wird geladen..."}
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
      
      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Alle Status</option>
              <option value="offen">Offen</option>
              <option value="versendet">Versendet</option>
              <option value="bezahlt">Bezahlt</option>
              <option value="storniert">Storniert</option>
              <option value="mahnung">Mahnung</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Von</label>
            <input
              type="date"
              value={von}
              onChange={(e) => setVon(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bis</label>
            <input
              type="date"
              value={bis}
              onChange={(e) => setBis(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            />
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
      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="animate-spin h-8 w-8 mx-auto text-emerald-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="mt-2">Rechnungen werden geladen...</p>
          </div>
        ) : rechnungen.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Keine Rechnungen gefunden
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nummer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Auftrag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Betrag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GoBD
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border">
              {rechnungen.map((rechnung) => (
                <tr key={rechnung.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{rechnung.nummer}</span>
                  </td>
                  <td className="px-6 py-4">
                    {rechnung.auftrag ? (
                      <div>
                        <p className="text-sm text-gray-900">{rechnung.auftrag.titel}</p>
                        <p className="text-xs text-gray-500">{rechnung.auftrag.waldbesitzer}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(rechnung.rechnungsDatum)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(rechnung.bruttoBetrag || rechnung.betrag)}
                      </p>
                      <p className="text-xs text-gray-500">
                        inkl. {rechnung.mwst}% MwSt
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(rechnung.status)}`}>
                      {rechnung.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {rechnung.lockedAt ? (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Gesperrt
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
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
              onClick={() => router.push(`/buchhaltung/rechnungen?page=${pagination.page - 1}&status=${status}&von=${von}&bis=${bis}`)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Zurück
            </button>
            <button
              onClick={() => router.push(`/buchhaltung/rechnungen?page=${pagination.page + 1}&status=${status}&von=${von}&bis=${bis}`)}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Weiter
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
