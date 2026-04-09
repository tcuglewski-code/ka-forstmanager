"use client"

import { useEffect, useState, useCallback } from "react"
import { MessageCircle, RefreshCw, Copy, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "ForstManagerBot"

interface TelegramRegistrierung {
  id: string
  chatId: string
  waldbesitzer: string
  auftragId: string | null
  aktiv: boolean
  createdAt: string
}

interface Auftrag {
  id: string
  nummer: string | null
  titel: string
  waldbesitzer: string | null
}

export default function TelegramEinstellungenPage() {
  const [registrierungen, setRegistrierungen] = useState<TelegramRegistrierung[]>([])
  const [auftraege, setAuftraege] = useState<Auftrag[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAuftragId, setSelectedAuftragId] = useState("")
  const [copied, setCopied] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [regRes, auftRes] = await Promise.all([
        fetch("/api/telegram/registrierungen"),
        fetch("/api/auftraege?limit=100"),
      ])
      
      if (regRes.ok) {
        const data = await regRes.json()
        setRegistrierungen(data)
      }
      
      if (auftRes.ok) {
        const data = await auftRes.json()
        setAuftraege(data.auftraege ?? data)
      }
    } catch (err) {
      console.error("Fehler beim Laden:", err)
      toast.error("Fehler beim Laden der Daten")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function generateDeepLink(auftragId: string): string {
    return `https://t.me/${BOT_USERNAME}?start=${auftragId}`
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Link kopiert!")
    setTimeout(() => setCopied(false), 2000)
  }

  function formatDate(dateString: string): string {
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString))
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-emerald-400" /> Telegram Benachrichtigungen
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Kunden erhalten automatische Updates zu ihren Aufträgen via Telegram
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#333] text-zinc-400 text-sm hover:bg-[#222] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Aktualisieren
        </button>
      </div>

      {/* Bot Info Card */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-white mb-3">Bot-Konfiguration</h3>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-sm text-zinc-400">Bot-Username:</span>
          <code className="bg-[#111] px-2 py-1 rounded text-emerald-400 text-sm">@{BOT_USERNAME}</code>
          <a
            href={`https://t.me/${BOT_USERNAME}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300"
          >
            <ExternalLink className="w-4 h-4" />
            Öffnen
          </a>
        </div>

        {/* Deep-Link Generator */}
        <div className="border-t border-[#2a2a2a] pt-4 mt-4">
          <h4 className="font-medium text-white mb-2">Deep-Link Generator</h4>
          <p className="text-sm text-zinc-500 mb-3">
            Generieren Sie einen Link für Kunden. Beim Klick wird der Bot geöffnet und der Kunde automatisch für Updates registriert.
          </p>
          
          <div className="flex gap-2 mb-3">
            <select
              className="flex-1 max-w-md bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white"
              value={selectedAuftragId}
              onChange={(e) => setSelectedAuftragId(e.target.value)}
            >
              <option value="">Auftrag auswählen...</option>
              {auftraege.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nummer ?? a.id} — {a.waldbesitzer ?? a.titel}
                </option>
              ))}
            </select>
          </div>

          {selectedAuftragId && (
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={generateDeepLink(selectedAuftragId)}
                className="flex-1 bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-zinc-400 font-mono"
              />
              <button
                onClick={() => copyToClipboard(generateDeepLink(selectedAuftragId))}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"
              >
                <Copy className="w-4 h-4" />
                {copied ? "Kopiert!" : "Kopieren"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Registrierungen Liste */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2a2a2a]">
          <h3 className="font-semibold text-white">Registrierte Nutzer</h3>
          <p className="text-xs text-zinc-500 mt-1">Kunden, die Telegram-Benachrichtigungen aktiviert haben</p>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          </div>
        ) : registrierungen.length === 0 ? (
          <div className="px-6 py-12 text-center text-zinc-600">
            Noch keine Registrierungen vorhanden.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Waldbesitzer</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Chat-ID</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Auftrag</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Registriert am</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {registrierungen.map((reg) => {
                const auftrag = auftraege.find((a) => a.id === reg.auftragId)
                return (
                  <tr key={reg.id} className="hover:bg-[#1c1c1c]">
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {reg.waldbesitzer}
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-[#111] px-2 py-1 rounded text-zinc-400">
                        {reg.chatId}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      {auftrag ? (
                        <a
                          href={`/auftraege/${auftrag.id}`}
                          className="text-sm text-emerald-400 hover:text-emerald-300"
                        >
                          {auftrag.nummer ?? auftrag.id}
                        </a>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        reg.aktiv 
                          ? "bg-emerald-500/20 text-emerald-400" 
                          : "bg-zinc-700/50 text-zinc-400"
                      }`}>
                        {reg.aktiv ? "Aktiv" : "Inaktiv"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {formatDate(reg.createdAt)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Anleitung */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 mt-6">
        <h3 className="font-semibold text-white mb-3">So funktioniert es</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-400">
          <li><strong className="text-white">Deep-Link generieren:</strong> Wählen Sie oben einen Auftrag aus und kopieren Sie den Link.</li>
          <li><strong className="text-white">Link an Kunden senden:</strong> Per E-Mail, SMS oder auf der Rechnung.</li>
          <li><strong className="text-white">Kunde klickt den Link:</strong> Der Telegram-Bot wird geöffnet und der Kunde automatisch registriert.</li>
          <li><strong className="text-white">Automatische Updates:</strong> Bei Statusänderungen erhält der Kunde eine Telegram-Nachricht.</li>
        </ol>
        
        <div className="mt-4 p-3 bg-[#111] rounded-lg border border-[#333] text-sm text-zinc-500">
          💡 <strong>Tipp:</strong> Sie können den Link auch als QR-Code auf Rechnungen drucken. Verwenden Sie dafür einen QR-Code-Generator mit dem Deep-Link.
        </div>
      </div>
    </div>
  )
}
