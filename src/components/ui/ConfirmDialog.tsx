"use client"
import { AlertTriangle } from "lucide-react"

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
  confirmLabel?: string
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger = true, confirmLabel }: ConfirmDialogProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex items-start gap-4">
          {danger && <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>}
          <div>
            <h3 className="font-semibold text-white mb-1">{title}</h3>
            <p className="text-sm text-zinc-400">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2 border border-[#2a2a2a] rounded-lg text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors">
            Abbrechen
          </button>
          <button onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              danger ? "bg-red-600 hover:bg-red-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}>
            {confirmLabel ?? (danger ? "Löschen" : "Bestätigen")}
          </button>
        </div>
      </div>
    </div>
  )
}
