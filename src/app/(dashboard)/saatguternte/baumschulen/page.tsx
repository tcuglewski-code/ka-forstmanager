// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, TreeDeciduous, MapPin, Phone, Mail, ExternalLink, Key, X } from "lucide-react"
import Link from "next/link"

interface Baumschule {
  id: string
  name: string
  ort?: string
  bundesland?: string
  ansprechpartner?: string
  email?: string
  telefon?: string
  aktiv: boolean
  userId?: string
}

const BUNDESLAENDER = [
  "Baden-Württemberg", "Bayern", "Berlin", "Brandenburg", "Bremen",
  "Hamburg", "Hessen", "Mecklenburg-Vorpommern", "Niedersachsen",
  "Nordrhein-Westfalen", "Rheinland-Pfalz", "Saarland", "Sachsen",
  "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen",
]

export default function BaumschulenPage() {
  const [baumschulen, setBaumschulen] = useState<Baumschule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [generatingLink, setGeneratingLink] = useState<string | null>(null)
  const [linkResult, setLinkResult] = useState<{ id: string; link: string } | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    ort: "",
    bundesland: "",
    ansprechpartner: "",
    email: "",
    telefon: "",
    notizen: "",
  })
  const router = useRouter()

  useEffect(() => {
    fetch("/api/saatguternte/baumschulen")
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(d => { setBaumschulen(Array.isArray(d) ? d : d.baumschulen || []); setLoading(false) })
      .catch(err => { setError("Baumschulen konnten nicht geladen werden"); setLoading(false) })
  }, [])

  const generateLoginLink = async (id: string) => {
    setGeneratingLink(id)
    setLinkResult(null)
    try {
      const r = await fetch(`/api/baumschulen/${id}/login-link`, { method: "POST" })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const d = await r.json()
      if (d.loginUrl) setLinkResult({ id, link: d.loginUrl })
    } catch (e) {
      alert("Fehler beim Generieren des Login-Links")
    } finally {
      setGeneratingLink(null)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    setCreating(true)
    setCreateError(null)
    try {
      const r = await fetch("/api/saatguternte/baumschulen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          ort: formData.ort.trim() || undefined,
          bundesland: formData.bundesland || undefined,
          ansprechpartner: formData.ansprechpartner.trim() || undefined,
          email: formData.email.trim() || undefined,
          telefon: formData.telefon.trim() || undefined,
          notizen: formData.notizen.trim() || undefined,
        }),
      })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        throw new Error(d.error || `Fehler ${r.status}`)
      }
      const newBaumschule = await r.json()
      setBaumschulen(prev => [...prev, newBaumschule])
      setModalOpen(false)
      setFormData({ name: "", ort: "", bundesland: "", ansprechpartner: "", email: "", telefon: "", notizen: "" })
      router.push(`/saatguternte/baumschulen/${newBaumschule.id}`)
    } catch (err) {
      setCreateError((err as Error).message)
    } finally {
      setCreating(false)
    }
  }

  const filtered = baumschulen.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.ort || "").toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-gray-500">
      <TreeDeciduous className="w-5 h-5 animate-pulse" />
      <span>Lade Baumschulen...</span>
    </div>
  )

  if (error) return (
    <div className="p-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
        {error}
        <button onClick={() => window.location.reload()} className="ml-3 underline">Erneut versuchen</button>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TreeDeciduous className="w-6 h-6 text-green-600" />
            Baumschulen
          </h1>
          <p className="text-sm text-gray-500 mt-1">{baumschulen.length} registrierte Baumschulen</p>
        </div>
        <button
          onClick={() => { setModalOpen(true); setCreateError(null) }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-700"
        >
          <Plus className="w-4 h-4" /> Neue Baumschule
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Baumschule suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {linkResult && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-800 mb-2">Login-Link generiert (72h gültig):</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white border rounded px-2 py-1 text-gray-700 overflow-auto">{linkResult.link}</code>
            <button onClick={() => { navigator.clipboard.writeText(linkResult.link); }} className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
              Kopieren
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <TreeDeciduous className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Keine Baumschulen gefunden</p>
          <p className="text-sm mt-1">Füge die erste Baumschule hinzu</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(b => (
            <div key={b.id} className={`bg-white border rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition-shadow ${!b.aktiv ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TreeDeciduous className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{b.name}</span>
                    {!b.aktiv && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Inaktiv</span>}
                    {b.userId && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Portal-Zugang</span>}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    {b.ort && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{b.ort}{b.bundesland ? `, ${b.bundesland}` : ""}</span>}
                    {b.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{b.email}</span>}
                    {b.telefon && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{b.telefon}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => generateLoginLink(b.id)}
                  disabled={generatingLink === b.id}
                  className="text-xs border border-green-200 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-50 flex items-center gap-1 disabled:opacity-50"
                >
                  <Key className="w-3 h-3" />
                  {generatingLink === b.id ? "..." : "Login-Link"}
                </button>
                <Link href={`/saatguternte/baumschulen/${b.id}`} className="text-xs border px-3 py-1.5 rounded-lg hover:bg-gray-50 flex items-center gap-1 text-gray-600">
                  <ExternalLink className="w-3 h-3" /> Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Neue Baumschule */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Neue Baumschule anlegen</h2>
              <button onClick={() => setModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Baumschule Müller GmbH"
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Ort</label>
                  <input
                    type="text"
                    value={formData.ort}
                    onChange={e => setFormData({ ...formData, ort: e.target.value })}
                    placeholder="z.B. Halstenbek"
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Bundesland</label>
                  <select
                    value={formData.bundesland}
                    onChange={e => setFormData({ ...formData, bundesland: e.target.value })}
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Bitte wählen...</option>
                    {BUNDESLAENDER.map(bl => <option key={bl} value={bl}>{bl}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Ansprechpartner</label>
                <input
                  type="text"
                  value={formData.ansprechpartner}
                  onChange={e => setFormData({ ...formData, ansprechpartner: e.target.value })}
                  placeholder="Vor- und Nachname"
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">E-Mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.de"
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Telefon</label>
                  <input
                    type="tel"
                    value={formData.telefon}
                    onChange={e => setFormData({ ...formData, telefon: e.target.value })}
                    placeholder="+49 ..."
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Notizen</label>
                <textarea
                  value={formData.notizen}
                  onChange={e => setFormData({ ...formData, notizen: e.target.value })}
                  rows={2}
                  placeholder="Optionale Notizen..."
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={creating || !formData.name.trim()}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                >
                  {creating ? "Wird erstellt..." : "Baumschule anlegen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
