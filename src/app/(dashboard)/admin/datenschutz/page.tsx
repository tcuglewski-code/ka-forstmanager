"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Shield,
  Plus,
  Eye,
  Lock,
  Unlock,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  User,
  Mail,
  Loader2,
  X,
  Calendar,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow } from "date-fns"
import { de } from "date-fns/locale"
import { useConfirm } from "@/hooks/useConfirm"

interface GdprRequest {
  id: string
  requesterName: string
  requesterEmail: string
  requesterType: string
  requestType: string
  requestReason?: string
  status: string
  gobdConflict: boolean
  restrictionApplied: boolean
  receivedAt: string
  dueAt?: string
  completedAt?: string
  decision?: string
  decisionReason?: string
  rechnungen?: Array<{
    id: string
    nummer: string
    betrag: number
    gdprRestricted: boolean
  }>
}

interface Stats {
  byStatus: Record<string, number>
  overdueCount: number
  total: number
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  EINGEGANGEN: { label: "Eingegangen", color: "bg-blue-100 text-blue-800 border-blue-500/30", icon: Mail },
  IN_PRUEFUNG: { label: "In Prüfung", color: "bg-amber-100 text-amber-800 border-amber-500/30", icon: Clock },
  UMGESETZT: { label: "Umgesetzt", color: "bg-emerald-100 text-emerald-800 border-emerald-500/30", icon: CheckCircle },
  ABGELEHNT: { label: "Abgelehnt", color: "bg-red-100 text-red-800 border-red-500/30", icon: XCircle },
  ARCHIVIERT: { label: "Archiviert", color: "bg-gray-100 text-gray-700 border-border", icon: FileText },
}

const REQUEST_TYPES: Record<string, string> = {
  LOESCHUNG: "Löschung (Art. 17)",
  AUSKUNFT: "Auskunft (Art. 15)",
  EINSCHRAENKUNG: "Einschränkung (Art. 18)",
  BERICHTIGUNG: "Berichtigung (Art. 16)",
  WIDERSPRUCH: "Widerspruch (Art. 21)",
}

export default function DatenschutzVerwaltungPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { confirm, ConfirmDialogElement } = useConfirm()
  const [requests, setRequests] = useState<GdprRequest[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<GdprRequest | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("")

  // Form States für neue Anfrage
  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formType, setFormType] = useState("LOESCHUNG")
  const [formReason, setFormReason] = useState("")

  const isAdmin = session?.user && (session.user as { role?: string }).role === "ka_admin"

  useEffect(() => {
    if (session && !isAdmin) {
      router.push("/dashboard")
    }
  }, [session, isAdmin, router])

  useEffect(() => {
    if (isAdmin) loadRequests()
  }, [isAdmin, statusFilter])

  const loadRequests = async () => {
    try {
      const url = statusFilter
        ? `/api/gdpr?status=${statusFilter}`
        : "/api/gdpr"
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests)
        setStats(data.stats)
      }
    } catch (err) {
      console.error("GDPR-Anfragen laden fehlgeschlagen:", err)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setFormName("")
    setFormEmail("")
    setFormType("LOESCHUNG")
    setFormReason("")
    setModalOpen(true)
  }

  const openDetailModal = async (request: GdprRequest) => {
    try {
      const res = await fetch(`/api/gdpr/${request.id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedRequest(data)
        setDetailModalOpen(true)
      }
    } catch (err) {
      console.error("Details laden fehlgeschlagen:", err)
    }
  }

  const handleCreate = async () => {
    if (!formName || !formEmail) {
      setMessage({ type: "error", text: "Name und E-Mail sind Pflichtfelder" })
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/gdpr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterName: formName,
          requesterEmail: formEmail,
          requestType: formType,
          requestReason: formReason,
        }),
      })

      if (res.ok) {
        setMessage({ type: "success", text: "DSGVO-Anfrage erfasst" })
        loadRequests()
        setModalOpen(false)
      } else {
        const err = await res.json()
        setMessage({ type: "error", text: err.error || "Fehler beim Erstellen" })
      }
    } catch {
      setMessage({ type: "error", text: "Netzwerkfehler" })
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (id: string, status: string, statusReason?: string) => {
    try {
      const res = await fetch(`/api/gdpr/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, statusReason }),
      })

      if (res.ok) {
        setMessage({ type: "success", text: `Status auf "${STATUS_CONFIG[status]?.label}" geändert` })
        loadRequests()
        if (selectedRequest?.id === id) {
          const updated = await res.json()
          setSelectedRequest(updated)
        }
      }
    } catch {
      setMessage({ type: "error", text: "Status-Änderung fehlgeschlagen" })
    }
  }

  const applyRestriction = async (gdprRequestId: string, rechnungIds: string[]) => {
    const ok = await confirm({ title: "Bestätigen", message: "Einschränkung auf ausgewählte Rechnungen anwenden? Diese Aktion kann nicht rückgängig gemacht werden." })
    if (!ok) return

    try {
      const res = await fetch("/api/gdpr/restrict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gdprRequestId,
          rechnungIds,
          reason: "GoBD-Konflikt: Löschung nicht möglich, Einschränkung angewandt",
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessage({ type: "success", text: data.message })
        loadRequests()
        // Detail-Modal aktualisieren
        if (selectedRequest?.id === gdprRequestId) {
          openDetailModal(selectedRequest)
        }
      } else {
        const err = await res.json()
        setMessage({ type: "error", text: err.error || "Fehler bei Einschränkung" })
      }
    } catch {
      setMessage({ type: "error", text: "Netzwerkfehler" })
    }
  }

  const isOverdue = (request: GdprRequest) => {
    if (!request.dueAt || request.completedAt) return false
    return new Date(request.dueAt) < new Date()
  }

  const getDaysRemaining = (request: GdprRequest) => {
    if (!request.dueAt || request.completedAt) return null
    const days = Math.ceil((new Date(request.dueAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  if (!isAdmin) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Datenschutz-Anfragen</h1>
            <p className="text-sm text-on-surface-variant">
              DSGVO Art. 12-23 Betroffenenanfragen verwalten
            </p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Neue Anfrage
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-surface-container-lowest border border-border rounded-xl p-4">
            <div className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>{stats.total}</div>
            <div className="text-sm text-on-surface-variant">Gesamt</div>
          </div>
          <div className="bg-surface-container-lowest border border-blue-500/30 rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-400">{stats.byStatus?.EINGEGANGEN || 0}</div>
            <div className="text-sm text-on-surface-variant">Eingegangen</div>
          </div>
          <div className="bg-surface-container-lowest border border-amber-500/30 rounded-xl p-4">
            <div className="text-2xl font-bold text-amber-400">{stats.byStatus?.IN_PRUEFUNG || 0}</div>
            <div className="text-sm text-on-surface-variant">In Prüfung</div>
          </div>
          <div className="bg-surface-container-lowest border border-emerald-500/30 rounded-xl p-4">
            <div className="text-2xl font-bold text-emerald-400">{stats.byStatus?.UMGESETZT || 0}</div>
            <div className="text-sm text-on-surface-variant">Umgesetzt</div>
          </div>
          <div className="bg-surface-container-lowest border border-red-500/30 rounded-xl p-4">
            <div className="text-2xl font-bold text-red-400">{stats.overdueCount}</div>
            <div className="text-sm text-on-surface-variant">Überfällig</div>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div
          className={cn(
            "px-4 py-3 rounded-lg text-sm flex items-center gap-2",
            message.type === "success"
              ? "bg-emerald-100 text-emerald-800 border border-emerald-500/30"
              : "bg-red-100 text-red-800 border border-red-500/30"
          )}
        >
          {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setStatusFilter("")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm",
            statusFilter === "" ? "bg-emerald-600 text-white" : "bg-surface-container-highest text-on-surface-variant hover:text-on-surface"
          )}
        >
          Alle
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm flex items-center gap-1",
              statusFilter === key ? "bg-emerald-600 text-white" : "bg-surface-container-highest text-on-surface-variant hover:text-on-surface"
            )}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div className="bg-surface-container-lowest border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-sm font-medium text-on-surface-variant">Antragsteller</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-on-surface-variant">Typ</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-on-surface-variant">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-on-surface-variant">Frist</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-on-surface-variant">Flags</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-on-surface-variant">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">
                  Keine Anfragen gefunden
                </td>
              </tr>
            ) : (
              requests.map((request) => {
                const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.EINGEGANGEN
                const StatusIcon = statusConfig.icon
                const daysLeft = getDaysRemaining(request)

                return (
                  <tr key={request.id} className="border-b border-border last:border-0 hover:bg-surface-container-high">
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-on-surface font-medium">{request.requesterName}</div>
                        <div className="text-sm text-on-surface-variant">{request.requesterEmail}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-on-surface">
                      {REQUEST_TYPES[request.requestType] || request.requestType}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-1 rounded text-xs border flex items-center gap-1 w-fit", statusConfig.color)}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {request.completedAt ? (
                        <span className="text-on-surface-variant text-sm">Erledigt</span>
                      ) : request.dueAt ? (
                        <span className={cn("text-sm", isOverdue(request) ? "text-red-400" : daysLeft && daysLeft <= 7 ? "text-amber-400" : "text-on-surface-variant")}>
                          {isOverdue(request) ? (
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Überfällig
                            </span>
                          ) : (
                            `${daysLeft} Tage`
                          )}
                        </span>
                      ) : (
                        <span className="text-on-surface-variant text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {request.gobdConflict && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs" title="GoBD-Konflikt">
                            GoBD
                          </span>
                        )}
                        {request.restrictionApplied && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs flex items-center gap-1" title="Einschränkung angewandt">
                            <Lock className="w-3 h-3" /> Art.18
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openDetailModal(request)}
                        className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded-lg"
                        title="Details anzeigen"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {modalOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setModalOpen(false)} />
          <div className="fixed inset-x-0 top-[10%] mx-auto max-w-lg z-50 px-4">
            <div className="bg-surface-container-lowest border border-border rounded-xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-on-surface">Neue DSGVO-Anfrage erfassen</h2>
                <button onClick={() => setModalOpen(false)} className="p-1 text-on-surface-variant hover:text-on-surface">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm text-on-surface-variant mb-1">Name des Betroffenen *</label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-low border border-border rounded-lg">
                    <User className="w-4 h-4 text-on-surface-variant" />
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="flex-1 bg-transparent text-on-surface outline-none"
                      placeholder="Max Mustermann"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-on-surface-variant mb-1">E-Mail *</label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-low border border-border rounded-lg">
                    <Mail className="w-4 h-4 text-on-surface-variant" />
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="flex-1 bg-transparent text-on-surface outline-none"
                      placeholder="max@beispiel.de"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-on-surface-variant mb-1">Anfragetyp</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-border rounded-lg text-on-surface outline-none"
                  >
                    {Object.entries(REQUEST_TYPES).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-on-surface-variant mb-1">Begründung / Details</label>
                  <textarea
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-border rounded-lg text-on-surface outline-none resize-none h-24"
                    placeholder="Optionale Details zur Anfrage..."
                  />
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-400 mt-0.5" />
                    <p className="text-sm text-blue-400">
                      Die Frist wird automatisch auf 30 Tage gesetzt (DSGVO Art. 12 Abs. 3).
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-surface-container-highest text-on-surface rounded-lg hover:bg-surface-container-highest"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Erfassen
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {ConfirmDialogElement}

      {/* Detail Modal */}
      {detailModalOpen && selectedRequest && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setDetailModalOpen(false)} />
          <div className="fixed inset-x-0 top-[5%] mx-auto max-w-2xl z-50 px-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-surface-container-lowest border border-border rounded-xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold text-on-surface">{selectedRequest.requesterName}</h2>
                  <p className="text-sm text-on-surface-variant">{REQUEST_TYPES[selectedRequest.requestType]}</p>
                </div>
                <button onClick={() => setDetailModalOpen(false)} className="p-1 text-on-surface-variant hover:text-on-surface">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Status Actions */}
                <div>
                  <label className="block text-sm text-on-surface-variant mb-2">Status ändern</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => updateStatus(selectedRequest.id, key)}
                        disabled={selectedRequest.status === key}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm border transition-colors",
                          selectedRequest.status === key
                            ? config.color
                            : "bg-surface-container-highest text-on-surface-variant border-outline-variant hover:text-on-surface"
                        )}
                      >
                        {config.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-on-surface-variant mb-1">E-Mail</label>
                    <p className="text-on-surface">{selectedRequest.requesterEmail}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-on-surface-variant mb-1">Eingegangen am</label>
                    <p className="text-on-surface">{format(new Date(selectedRequest.receivedAt), "dd.MM.yyyy HH:mm", { locale: de })}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-on-surface-variant mb-1">Frist</label>
                    <p className={cn("text-on-surface", isOverdue(selectedRequest) && "text-red-400")}>
                      {selectedRequest.dueAt
                        ? format(new Date(selectedRequest.dueAt), "dd.MM.yyyy", { locale: de })
                        : "-"}
                      {isOverdue(selectedRequest) && " (überfällig!)"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm text-on-surface-variant mb-1">Abgeschlossen</label>
                    <p className="text-on-surface">
                      {selectedRequest.completedAt
                        ? format(new Date(selectedRequest.completedAt), "dd.MM.yyyy HH:mm", { locale: de })
                        : "-"}
                    </p>
                  </div>
                </div>

                {/* Reason */}
                {selectedRequest.requestReason && (
                  <div>
                    <label className="block text-sm text-on-surface-variant mb-1">Begründung des Betroffenen</label>
                    <p className="text-on-surface p-3 bg-surface-container-low rounded-lg">{selectedRequest.requestReason}</p>
                  </div>
                )}

                {/* GoBD Conflict Section */}
                {selectedRequest.requestType === "LOESCHUNG" && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-amber-400 mb-1">GoBD-Hinweis</h4>
                        <p className="text-sm text-amber-200/80 mb-3">
                          Rechnungsdaten unterliegen der 10-jährigen Aufbewahrungspflicht (GoBD/AO §147).
                          Statt Löschung wird eine <strong>Einschränkung der Verarbeitung</strong> (DSGVO Art. 18) angewandt.
                        </p>

                        {selectedRequest.rechnungen && selectedRequest.rechnungen.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm text-amber-200">Betroffene Rechnungen:</p>
                            <div className="space-y-1">
                              {selectedRequest.rechnungen.map((r) => (
                                <div key={r.id} className="flex items-center justify-between p-2 bg-surface-container-low rounded">
                                  <span className="text-on-surface">{r.nummer}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-on-surface-variant">{r.betrag.toFixed(2)} €</span>
                                    {r.gdprRestricted ? (
                                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs flex items-center gap-1">
                                        <Lock className="w-3 h-3" /> Eingeschränkt
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs flex items-center gap-1">
                                        <Unlock className="w-3 h-3" /> Aktiv
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {selectedRequest.rechnungen.some(r => !r.gdprRestricted) && !selectedRequest.restrictionApplied && (
                              <button
                                onClick={() => applyRestriction(
                                  selectedRequest.id,
                                  selectedRequest.rechnungen!.filter(r => !r.gdprRestricted).map(r => r.id)
                                )}
                                className="mt-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 flex items-center gap-2"
                              >
                                <Lock className="w-4 h-4" />
                                Einschränkung anwenden (Art. 18)
                              </button>
                            )}
                          </div>
                        )}

                        {selectedRequest.restrictionApplied && (
                          <div className="mt-2 p-2 bg-blue-500/20 border border-blue-500/30 rounded flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-blue-400" />
                            <span className="text-blue-400 text-sm">Einschränkung wurde angewandt</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Decision */}
                {selectedRequest.decision && (
                  <div>
                    <label className="block text-sm text-on-surface-variant mb-1">Entscheidung</label>
                    <div className={cn(
                      "p-3 rounded-lg",
                      selectedRequest.decision === "STATTGEGEBEN" ? "bg-emerald-500/20 border border-emerald-500/30" :
                      selectedRequest.decision === "ABGELEHNT" ? "bg-red-500/20 border border-red-500/30" :
                      "bg-amber-500/20 border border-amber-500/30"
                    )}>
                      <p className="font-medium text-on-surface mb-1">{selectedRequest.decision}</p>
                      {selectedRequest.decisionReason && (
                        <p className="text-sm text-on-surface">{selectedRequest.decisionReason}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="px-4 py-2 bg-surface-container-highest text-on-surface rounded-lg hover:bg-surface-container-highest"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
