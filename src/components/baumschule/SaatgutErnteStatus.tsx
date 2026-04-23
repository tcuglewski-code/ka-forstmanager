"use client"

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
  ernteanfragen: Ernteanfrage[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  offen: { label: "Offen", color: "bg-amber-100 text-amber-800" },
  in_bearbeitung: { label: "In Bearbeitung", color: "bg-blue-100 text-blue-800" },
  abgeschlossen: { label: "Abgeschlossen", color: "bg-emerald-100 text-emerald-800" },
  storniert: { label: "Storniert", color: "bg-zinc-600/30 text-[var(--color-on-surface-variant)]" },
}

export function SaatgutErnteStatus({ ernteanfragen }: Props) {
  if (ernteanfragen.length === 0) return null

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Saatguternte-Anfragen ({ernteanfragen.length})</h2>

      <div className="space-y-3">
        {ernteanfragen.map((ea) => {
          const config = STATUS_CONFIG[ea.status] || { label: ea.status, color: "bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]" }
          const progress = ea.zielmenge > 0 ? Math.min(100, (ea.gesammelteKg / ea.zielmenge) * 100) : 0

          return (
            <div key={ea.id} className="bg-[var(--color-surface-container-lowest)]/50 border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{ea.baumart}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${config.color}`}>{config.label}</span>
                  </div>
                  {ea.herkunft && <p className="text-sm text-[var(--color-on-surface-variant)] mt-0.5">Herkunft: {ea.herkunft}</p>}
                </div>
                {ea.deadline && (
                  <div className="text-right">
                    <p className="text-xs text-[var(--color-on-surface-variant)]">Deadline</p>
                    <p className="text-sm text-zinc-300">{formatDate(ea.deadline)}</p>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-[var(--color-on-surface-variant)]">
                    {ea.gesammelteKg} / {ea.zielmenge} kg
                  </span>
                  <span className="text-[var(--color-on-surface-variant)]">{progress.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-[var(--color-surface-container-high)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      progress >= 100 ? "bg-emerald-500" : progress >= 50 ? "bg-blue-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {ea.notizen && <p className="text-xs text-[var(--color-on-surface-variant)]">{ea.notizen}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
