"use client"

import { useState, useEffect } from "react"
import {
  AlertTriangle,
  Bell,
  ChevronRight,
  Filter,
  Leaf,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"

interface FoerderNewsItem {
  id: string
  createdAt: string
  title: string
  programm: string
  aenderung: string
  prioritaet: string
  handlung: string | null
  gueltigBis: string | null
  aktiv: boolean
}

const PRIO_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; sortOrder: number }
> = {
  KRITISCH: {
    label: "Kritisch",
    color: "text-red-800",
    bg: "bg-red-50",
    border: "border-red-300",
    sortOrder: 0,
  },
  HOCH: {
    label: "Hoch",
    color: "text-orange-800",
    bg: "bg-orange-50",
    border: "border-orange-300",
    sortOrder: 1,
  },
  MITTEL: {
    label: "Mittel",
    color: "text-yellow-800",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    sortOrder: 2,
  },
  NIEDRIG: {
    label: "Niedrig",
    color: "text-green-800",
    bg: "bg-green-50",
    border: "border-green-200",
    sortOrder: 3,
  },
}

const FILTER_OPTIONS = ["ALLE", "KRITISCH", "HOCH", "MITTEL", "NIEDRIG"]

export default function FoerderNewsPage() {
  const [news, setNews] = useState<FoerderNewsItem[]>([])
  const [filter, setFilter] = useState("ALLE")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchNews() {
      setLoading(true)
      try {
        const params = filter !== "ALLE" ? `?prioritaet=${filter}` : ""
        const res = await fetch(`/api/foerderung/news${params}`)
        if (res.ok) {
          const data = await res.json()
          setNews(data)
        }
      } catch {
        console.error("Fehler beim Laden der Förder-News")
      } finally {
        setLoading(false)
      }
    }
    fetchNews()
  }, [filter])

  const kritischeNews = news.filter((n) => n.prioritaet === "KRITISCH")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/foerderung"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "Lora, serif" }}>
              Aktuelle Förder-Updates
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {news.length} aktuelle Meldung{news.length !== 1 ? "en" : ""}
            </p>
          </div>
        </div>
        <Bell className="w-5 h-5 text-gray-400" />
      </div>

      {/* Kritischer Banner */}
      {kritischeNews.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-red-800 text-lg">
                {kritischeNews.length} kritische{" "}
                {kritischeNews.length === 1 ? "Meldung" : "Meldungen"}
              </h2>
              {kritischeNews.map((item) => (
                <p key={item.id} className="text-red-700 text-sm mt-1">
                  <strong>{item.programm}:</strong> {item.title}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400" />
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === opt
                ? "bg-forest text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {opt === "ALLE" ? "Alle" : PRIO_CONFIG[opt]?.label || opt}
          </button>
        ))}
      </div>

      {/* News Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest" />
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Leaf className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Keine Förder-Updates vorhanden.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {news.map((item) => {
            const config = PRIO_CONFIG[item.prioritaet] || PRIO_CONFIG.MITTEL
            return (
              <div
                key={item.id}
                className={`${config.bg} border ${config.border} rounded-xl p-4 transition-shadow hover:shadow-md`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.color} ${config.bg} border ${config.border}`}
                      >
                        {config.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString("de-DE")}
                      </span>
                      {item.gueltigBis && (
                        <span className="text-xs text-gray-400">
                          bis{" "}
                          {new Date(item.gueltigBis).toLocaleDateString("de-DE")}
                        </span>
                      )}
                    </div>
                    <h3 className={`font-bold ${config.color}`}>{item.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Programm:</strong> {item.programm}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{item.aenderung}</p>
                    {item.handlung && (
                      <div className="mt-3 bg-white/60 rounded-lg p-3 border border-white/80">
                        <p className="text-sm font-medium text-gray-700">
                          <ChevronRight className="w-4 h-4 inline-block mr-1" />
                          Handlungsempfehlung:
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.handlung}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Link zur Förderberatung */}
      <div className="text-center pt-4">
        <Link
          href="/foerderung"
          className="inline-flex items-center gap-2 text-sm text-forest hover:underline font-medium"
        >
          <Leaf className="w-4 h-4" />
          Zum Förderberater
        </Link>
      </div>
    </div>
  )
}
