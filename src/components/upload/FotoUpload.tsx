"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, Camera, X, Loader2, Check, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"

interface UploadedFile {
  filename: string
  path: string
  url: string
  nextcloudPath: string
}

interface FotoUploadProps {
  folder?: string  // Nextcloud-Ordner, z.B. /Koch-Aufforstung/Projekte/Auftrag-123
  onUpload?: (file: UploadedFile) => void
  onUploads?: (files: UploadedFile[]) => void
  multiple?: boolean
  accept?: string
  maxSizeMB?: number
  disabled?: boolean
  buttonText?: string
  className?: string
}

export function FotoUpload({
  folder = "/Koch-Aufforstung/Uploads",
  onUpload,
  onUploads,
  multiple = false,
  accept = "image/*",
  maxSizeMB = 10,
  disabled = false,
  buttonText = "Foto hochladen",
  className = "",
}: FotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<number>(0)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Größen-Check
    const maxBytes = maxSizeMB * 1024 * 1024
    for (const file of Array.from(files)) {
      if (file.size > maxBytes) {
        toast.error(`${file.name} ist zu groß (max. ${maxSizeMB}MB)`)
        return
      }
    }

    setUploading(true)
    setProgress(0)

    const uploaded: UploadedFile[] = []
    const total = files.length

    for (let i = 0; i < total; i++) {
      const file = files[i]
      
      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", folder)

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!res.ok) {
          const error = await res.json().catch(() => ({ error: "Upload fehlgeschlagen" }))
          throw new Error(error.error || "Upload fehlgeschlagen")
        }

        const data = await res.json()
        uploaded.push(data)
        setProgress(Math.round(((i + 1) / total) * 100))
        onUpload?.(data)
      } catch (err) {
        console.error("Upload Fehler:", err)
        toast.error(`Fehler beim Hochladen von ${file.name}`)
      }
    }

    if (uploaded.length > 0) {
      setUploadedFiles(prev => [...prev, ...uploaded])
      onUploads?.(uploaded)
      toast.success(`${uploaded.length} Datei${uploaded.length > 1 ? "en" : ""} hochgeladen`)
    }

    setUploading(false)
    setProgress(0)
    
    // Input zurücksetzen für erneuten Upload
    if (inputRef.current) inputRef.current.value = ""
  }, [folder, maxSizeMB, onUpload, onUploads])

  const removeFile = useCallback((idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx))
  }, [])

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Upload-Button */}
      <div className="relative">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <button
          type="button"
          disabled={disabled || uploading}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed transition-all ${
            disabled
              ? "border-border text-zinc-600 cursor-not-allowed"
              : uploading
                ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                : "border-border text-zinc-400 hover:border-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/5"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Hochladen... {progress}%</span>
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              <span className="text-sm">{buttonText}</span>
            </>
          )}
        </button>
      </div>

      {/* Hochgeladene Dateien */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500">Hochgeladen:</p>
          <div className="space-y-1">
            {uploadedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-2 bg-[#0f0f0f] border border-border rounded-lg"
              >
                <ImageIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-xs text-white truncate flex-1">{file.filename}</span>
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Kompakte Variante für inline-Verwendung
export function FotoUploadButton({
  folder = "/Koch-Aufforstung/Uploads",
  onUpload,
  disabled = false,
}: {
  folder?: string
  onUpload?: (file: UploadedFile) => void
  disabled?: boolean
}) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", folder)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error("Upload fehlgeschlagen")

      const data = await res.json()
      onUpload?.(data)
      toast.success("Foto hochgeladen")
    } catch (err) {
      console.error("Upload Fehler:", err)
      toast.error("Fehler beim Hochladen")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <label className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
      disabled ? "opacity-50 cursor-not-allowed" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
    }`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        className="sr-only"
      />
      {uploading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Upload className="w-3.5 h-3.5" />
      )}
      <span className="text-xs">
        {uploading ? "..." : "Foto"}
      </span>
    </label>
  )
}
