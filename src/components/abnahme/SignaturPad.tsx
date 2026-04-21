"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Eraser, Check, Undo2 } from "lucide-react"
import { toast } from "sonner"

interface SignaturPadProps {
  initialSignatur?: string | null
  onSignaturChange?: (base64: string | null) => void
  onSave?: (base64: string) => Promise<void>
  disabled?: boolean
}

export function SignaturPad({
  initialSignatur,
  onSignaturChange,
  onSave,
  disabled = false,
}: SignaturPadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState<ImageData[]>([])

  // Canvas initialisieren
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // High-DPI Support
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Hintergrund
    ctx.fillStyle = "#0f0f0f"
    ctx.fillRect(0, 0, rect.width, rect.height)

    // Initiale Signatur laden
    if (initialSignatur) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height)
        setHasSignature(true)
      }
      img.src = initialSignatur
    }

    // Initiales History-Frame
    setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)])
  }, [initialSignatur])

  const getCoordinates = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    },
    []
  )

  const startDrawing = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (disabled) return
      const canvas = canvasRef.current
      const ctx = canvas?.getContext("2d")
      if (!canvas || !ctx) return

      setIsDrawing(true)
      const { x, y } = getCoordinates(e)

      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineWidth = 2.5
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.strokeStyle = "#10b981" // emerald-500

      // Capture point for smooth single-point drawing
      canvas.setPointerCapture(e.pointerId)
    },
    [disabled, getCoordinates]
  )

  const draw = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing || disabled) return
      const ctx = canvasRef.current?.getContext("2d")
      if (!ctx) return

      const { x, y } = getCoordinates(e)
      ctx.lineTo(x, y)
      ctx.stroke()
      setHasSignature(true)
    },
    [isDrawing, disabled, getCoordinates]
  )

  const stopDrawing = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return
      setIsDrawing(false)

      const canvas = canvasRef.current
      const ctx = canvas?.getContext("2d")
      if (!canvas || !ctx) return

      ctx.closePath()
      canvas.releasePointerCapture(e.pointerId)

      // Save to history
      setHistory((prev) => [
        ...prev.slice(-9), // Keep last 10 states
        ctx.getImageData(0, 0, canvas.width, canvas.height),
      ])

      // Notify parent
      if (hasSignature) {
        const base64 = canvas.toDataURL("image/png")
        onSignaturChange?.(base64)
      }
    },
    [isDrawing, hasSignature, onSignaturChange]
  )

  const clear = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = "#0f0f0f"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.scale(dpr, dpr)

    setHasSignature(false)
    setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)])
    onSignaturChange?.(null)
  }, [onSignaturChange])

  const undo = useCallback(() => {
    if (history.length <= 1) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const newHistory = history.slice(0, -1)
    const previousState = newHistory[newHistory.length - 1]

    ctx.putImageData(previousState, 0, 0)
    setHistory(newHistory)

    // Check if signature exists (non-empty canvas)
    const isEmpty = !ctx.getImageData(0, 0, canvas.width, canvas.height).data.some(
      (channel, i) => i % 4 !== 3 && channel !== 15 // #0f = 15
    )
    setHasSignature(!isEmpty)
  }, [history])

  const handleSave = useCallback(async () => {
    if (!onSave || !hasSignature) return
    const canvas = canvasRef.current
    if (!canvas) return

    setSaving(true)
    try {
      const base64 = canvas.toDataURL("image/png")
      await onSave(base64)
      toast.success("Signatur gespeichert")
    } catch (err) {
      console.error("Signatur speichern fehlgeschlagen:", err)
      toast.error("Fehler beim Speichern")
    } finally {
      setSaving(false)
    }
  }, [onSave, hasSignature])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs text-zinc-400">Unterschrift Förster/Kunde</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={disabled || history.length <= 1}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Rückgängig"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={clear}
            disabled={disabled || !hasSignature}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Löschen"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        className={`relative border rounded-lg overflow-hidden ${
          disabled
            ? "border-border opacity-60"
            : "border-border hover:border-emerald-500/50"
        } transition-colors`}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-32 touch-none cursor-crosshair"
          style={{ backgroundColor: "#0f0f0f" }}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          onPointerCancel={stopDrawing}
        />

        {!hasSignature && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-zinc-600 text-sm">Hier unterschreiben...</span>
          </div>
        )}
      </div>

      {onSave && hasSignature && (
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || disabled}
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          {saving ? "Speichern..." : "Signatur speichern"}
        </button>
      )}
    </div>
  )
}
