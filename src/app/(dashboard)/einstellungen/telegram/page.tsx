"use client"

import { useEffect, useState, useCallback } from "react"
import { MessageCircle, RefreshCw, Copy, ExternalLink, Loader2, Send, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "KochAufforstungBot"

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
  const [sendingTest, setSendingTest] = useState(false)
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null)

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

  async function sendTestMessage(chatId?: string) {
    setSendingTest(true)
    try {
      const res = await fetch("/api/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chatId ? { chatId } : {}),
      })
      if (res.ok) {
        toast.success(chatId ? "Testnachricht gesendet!" : "Testnachricht an interne Gruppe gesendet!")
      } else {
        const data = await res.json()
        toast.error(data.error ?? "Fehler beim Senden")
      }
    } catch {
      toast.error("Fehler beim Senden der Testnachricht")
    } finally {
      setSendingTest(false)
    }
  }

  async function deactivateRegistrierung(id: string) {
    setDeactivatingId(id)
    try {
      const res = await fetch(`/api/telegram/registrierungen/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Registrierung deaktiviert")
        setRegistrierungen(prev =>
          prev.map(r => r.id === id ? { ...r, aktiv: false } : r)
        )
      } else {
        toast.error("Fehler beim Deaktivieren")
      }
    } catch {
      toast.error("Fehler beim Deaktivieren")
    } finally {
      setDeactivatingId(null)
    }
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
          <p className="text-[var(--color-on-surface-variant)] text-sm mt-1">
            Kunden erhalten automatische Updates zu ihren Aufträgen via Telegram
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-[var(--color-on-surface-variant)] text-sm hover:bg-[#222] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Aktualisieren
        </button>
      </div>

      {/* Interne Gruppe */}
      <div className="bg-[var(--color-surface-container)] border border-border rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" />
          Interne Gruppe
        </h3>
        <p className="text-sm text-[var(--color-on-surface-variant)] mb-4">
          Interne Telegram-Benachrichtigungen (neue Aufträge, Abschlüsse, etc.) werden an die konfigurierte Gruppen-Chat-ID gesendet.
        </p>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-sm text-[var(--color-on-surface-variant)]">TELEGRAM_CHAT_ID_KA:</span>
          <code className="bg-[var(--color-surface-container-low)] px-2 py-1 rounded text-zinc-300 text-sm">Über Umgebungsvariable konfiguriert</code>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => sendTestMessage()}
            disabled={sendingTest}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/40 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {sendingTest ? "Sende..." : "Testnachricht an Gruppe"}
          </button>
        </div>
        <div className="mt-4 p-3 bg-[var(--color-surface-container-low)] rounded-lg border border-border text-sm text-[var(--color-on-surface-variant)]">
          💡 <strong>Chat-ID herausfinden:</strong> Bot zur Gruppe hinzufügen, eine Nachricht senden, dann{" "}
          <code className="text-[var(--color-on-surface-variant)]">https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code>{" "}
          aufrufen und die <code className="text-[var(--color-on-surface-variant)]">chat.id</code> aus dem Response ablesen (negative Zahl für Gruppen).
        </div>
      </div>

      {/* Bot Info Card */}
      <div className="bg-[var(--color-surface-container)] border border-border rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-white mb-3">Bot-Konfiguration</h3>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-sm text-[var(--color-on-surface-variant)]">Bot-Username:</span>
          <code className="bg-[var(--color-surface-container-low)] px-2 py-1 rounded text-emerald-400 text-sm">@{BOT_USERNAME}</code>
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
        <div className="border-t border-border pt-4 mt-4">
          <h4 className="font-medium text-white mb-2">Deep-Link Generator</h4>
          <p className="text-sm text-[var(--color-on-surface-variant)] mb-3">
            Generieren Sie einen Link für Kunden. Beim Klick wird der Bot geöffnet und der Kunde automatisch für Updates registriert.
          </p>

          <div className="flex gap-2 mb-3">
            <select
              className="flex-1 max-w-md bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-white"
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
                className="flex-1 bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface-variant)] font-mono"
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

      {/* Waldbesitzer Registrierungen */}
      <div className="bg-[var(--color-surface-container)] border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-white">Waldbesitzer-Übersicht</h3>
          <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">Kunden, die Telegram-Benachrichtigungen aktiviert haben</p>
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
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-3 text-xs text-[var(--color-on-surface-variant)] uppercase tracking-wider">Waldbesitzer</th>
                <th className="text-left px-6 py-3 text-xs text-[var(--color-on-surface-variant)] uppercase tracking-wider">Chat-ID</th>
                <th className="text-left px-6 py-3 text-xs text-[var(--color-on-surface-variant)] uppercase tracking-wider">Auftrag</th>
                <th className="text-left px-6 py-3 text-xs text-[var(--color-on-surface-variant)] uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs text-[var(--color-on-surface-variant)] uppercase tracking-wider">Registriert am</th>
                <th className="text-left px-6 py-3 text-xs text-[var(--color-on-surface-variant)] uppercase tracking-wider">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {registrierungen.map((reg) => {
                const auftrag = auftraege.find((a) => a.id === reg.auftragId)
                return (
                  <tr key={reg.id} className="hover:bg-[#1c1c1c]">
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {reg.waldbesitzer}
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-[var(--color-surface-container-low)] px-2 py-1 rounded text-[var(--color-on-surface-variant)]">
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
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-[var(--color-surface-container-high)]/50 text-[var(--color-on-surface-variant)]"
                      }`}>
                        {reg.aktiv ? "Aktiv" : "Inaktiv"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--color-on-surface-variant)]">
                      {formatDate(reg.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => sendTestMessage(reg.chatId)}
                          disabled={sendingTest || !reg.aktiv}
                          title="Testnachricht senden"
                          className="p-1.5 rounded hover:bg-[#222] text-[var(--color-on-surface-variant)] hover:text-blue-400 disabled:opacity-30"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        {reg.aktiv && (
                          <button
                            onClick={() => deactivateRegistrierung(reg.id)}
                            disabled={deactivatingId === reg.id}
                            title="Deaktivieren"
                            className="p-1.5 rounded hover:bg-[#222] text-[var(--color-on-surface-variant)] hover:text-red-400 disabled:opacity-30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Anleitung */}
      <div className="bg-[var(--color-surface-container)] border border-border rounded-xl p-6 mt-6">
        <h3 className="font-semibold text-white mb-3">So funktioniert es</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--color-on-surface-variant)]">
          <li><strong className="text-white">Deep-Link generieren:</strong> Wählen Sie oben einen Auftrag aus und kopieren Sie den Link.</li>
          <li><strong className="text-white">Link an Kunden senden:</strong> Per E-Mail, SMS oder auf der Rechnung.</li>
          <li><strong className="text-white">Kunde klickt den Link:</strong> Der Telegram-Bot wird geöffnet und der Kunde automatisch registriert.</li>
          <li><strong className="text-white">Alternativ:</strong> Kunde kann auch direkt <code className="bg-[var(--color-surface-container-low)] px-1 rounded text-zinc-300">/anmelden AU-2025-0001</code> im Bot eingeben.</li>
          <li><strong className="text-white">Automatische Updates:</strong> Bei Statusänderungen erhält der Kunde eine Telegram-Nachricht.</li>
        </ol>

        <div className="mt-4 p-3 bg-[var(--color-surface-container-low)] rounded-lg border border-border text-sm text-[var(--color-on-surface-variant)]">
          💡 <strong>Tipp:</strong> Sie können den Link auch als QR-Code auf Rechnungen drucken. Verwenden Sie dafür einen QR-Code-Generator mit dem Deep-Link.
        </div>
      </div>
    </div>
  )
}
