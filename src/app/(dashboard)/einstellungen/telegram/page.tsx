"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Copy, ExternalLink, RefreshCw, Send, MessageCircle } from "lucide-react"

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
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
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
    } finally {
      setLoading(false)
    }
  }

  function generateDeepLink(auftragId: string): string {
    return `https://t.me/${BOT_USERNAME}?start=${auftragId}`
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Telegram Benachrichtigungen</h1>
          <p className="text-muted-foreground">
            Kunden können sich für Auftrags-Updates via Telegram anmelden
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Aktualisieren
        </Button>
      </div>

      {/* Bot-Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Bot-Konfiguration
          </CardTitle>
          <CardDescription>
            Telegram-Bot für Kundenbenachrichtigungen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium w-32">Bot-Username:</span>
            <code className="bg-muted px-2 py-1 rounded">@{BOT_USERNAME}</code>
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <a
                href={`https://t.me/${BOT_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Öffnen
              </a>
            </Button>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Deep-Link Generator</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Generieren Sie einen Link, den Sie Kunden senden können.
              Beim Klick wird der Telegram-Bot geöffnet und der Kunde automatisch für Updates registriert.
            </p>
            
            <div className="flex gap-2">
              <select
                className="flex h-9 w-full max-w-md rounded-md border border-input bg-background px-3 py-1 text-sm"
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
              <div className="mt-3 flex items-center gap-2">
                <Input
                  readOnly
                  value={generateDeepLink(selectedAuftragId)}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generateDeepLink(selectedAuftragId), "deeplink")}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copied === "deeplink" ? "Kopiert!" : "Kopieren"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Registrierungen */}
      <Card>
        <CardHeader>
          <CardTitle>Registrierte Nutzer</CardTitle>
          <CardDescription>
            Kunden, die sich für Telegram-Benachrichtigungen angemeldet haben
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Laden...
            </div>
          ) : registrierungen.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Noch keine Registrierungen vorhanden.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waldbesitzer</TableHead>
                  <TableHead>Chat-ID</TableHead>
                  <TableHead>Auftrag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registriert am</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrierungen.map((reg) => {
                  const auftrag = auftraege.find((a) => a.id === reg.auftragId)
                  return (
                    <TableRow key={reg.id}>
                      <TableCell className="font-medium">
                        {reg.waldbesitzer}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {reg.chatId}
                        </code>
                      </TableCell>
                      <TableCell>
                        {auftrag ? (
                          <a
                            href={`/auftraege/${auftrag.id}`}
                            className="text-primary hover:underline"
                          >
                            {auftrag.nummer ?? auftrag.id}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={reg.aktiv ? "default" : "secondary"}>
                          {reg.aktiv ? "Aktiv" : "Inaktiv"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(reg.createdAt)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Anleitung */}
      <Card>
        <CardHeader>
          <CardTitle>So funktioniert es</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong>Deep-Link generieren:</strong> Wählen Sie oben einen Auftrag aus und kopieren Sie den Link.
            </li>
            <li>
              <strong>Link an Kunden senden:</strong> Per E-Mail, SMS oder auf der Rechnung.
            </li>
            <li>
              <strong>Kunde klickt den Link:</strong> Der Telegram-Bot wird geöffnet und der Kunde automatisch registriert.
            </li>
            <li>
              <strong>Automatische Updates:</strong> Bei Statusänderungen erhält der Kunde eine Telegram-Nachricht.
            </li>
          </ol>
          
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <strong>Tipp:</strong> Sie können den Link auch als QR-Code auf Rechnungen drucken.
            Verwenden Sie dafür einen QR-Code-Generator mit dem Deep-Link.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
