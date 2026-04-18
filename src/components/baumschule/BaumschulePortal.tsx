"use client"

import { useState } from "react"
import { SortimentEditor } from "./SortimentEditor"
import { BestellungenListe } from "./BestellungenListe"
import { SaatgutErnteStatus } from "./SaatgutErnteStatus"

interface Baumschule {
  id: string
  name: string
  ort: string | null
  bundesland: string | null
  ansprechpartner: string | null
  email: string | null
}

interface Preisliste {
  id: string
  baumschuleId: string
  baumart: string
  preis: number
  einheit: string
  saison: string | null
  aktiv: boolean
  notizen: string | null
  menge: number | null
  verfuegbar: boolean
  createdAt: string
  updatedAt: string
}

interface Ernteanfrage {
  id: string
  baumschuleId: string
  baumart: string
  herkunft: string | null
  zielmenge: number
  gesammelteKg: number
  deadline: string | null
  status: string
  notizen: string | null
  createdAt: string
}

interface Props {
  baumschule: Baumschule
  sortiment: Preisliste[]
  ernteanfragen: Ernteanfrage[]
}

type Tab = "sortiment" | "pflanzanfragen" | "saatguternte"

export function BaumschulePortal({ baumschule, sortiment, ernteanfragen }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("sortiment")

  const tabs: Array<{ key: Tab; label: string; count?: number; hidden?: boolean }> = [
    { key: "sortiment", label: "Mein Sortiment", count: sortiment.length },
    { key: "pflanzanfragen", label: "Pflanzanfragen" },
    { key: "saatguternte", label: "Saatguternte", count: ernteanfragen.length, hidden: ernteanfragen.length === 0 },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌲</span>
            <div>
              <h1 className="text-xl font-bold">{baumschule.name}</h1>
              <p className="text-sm text-zinc-400">
                {[baumschule.ort, baumschule.bundesland].filter(Boolean).join(", ") || "Baumschul-Portal"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-1">
            {tabs
              .filter((t) => !t.hidden)
              .map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-emerald-500 text-emerald-400"
                      : "border-transparent text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {tab.label}
                  {tab.count != null && tab.count > 0 && (
                    <span
                      className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                        activeTab === tab.key ? "bg-emerald-100 text-emerald-800" : "bg-zinc-700 text-zinc-400"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === "sortiment" && <SortimentEditor baumschuleId={baumschule.id} initialSortiment={sortiment} />}
        {activeTab === "pflanzanfragen" && (
          <BestellungenListe baumschuleId={baumschule.id} />
        )}
        {activeTab === "saatguternte" && <SaatgutErnteStatus ernteanfragen={ernteanfragen} />}
      </main>
    </div>
  )
}
