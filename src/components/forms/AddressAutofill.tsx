"use client"

import { useState, useEffect, useRef } from "react"
import { MapPin, User, Loader2 } from "lucide-react"

// KC-4: PLZ → Ort Autofill + Second Brain Kontaktvorschläge

interface Kontakt {
  name: string
  ort?: string
  plz?: string
  email?: string
  telefon?: string
}

interface AddressAutofillProps {
  // PLZ Autofill
  plz: string
  ort: string
  onPlzChange: (plz: string) => void
  onOrtChange: (ort: string) => void
  // Kontakt Autofill (optional)
  showKontaktSuche?: boolean
  onKontaktSelect?: (kontakt: Kontakt) => void
  kontaktSuche?: string
  onKontaktSucheChange?: (value: string) => void
  // Styling
  className?: string
  disabled?: boolean
}

export function AddressAutofill({
  plz,
  ort,
  onPlzChange,
  onOrtChange,
  showKontaktSuche = false,
  onKontaktSelect,
  kontaktSuche = "",
  onKontaktSucheChange,
  className = "",
  disabled = false,
}: AddressAutofillProps) {
  const [plzLoading, setPlzLoading] = useState(false)
  const [kontaktLoading, setKontaktLoading] = useState(false)
  const [kontaktSuggestions, setKontaktSuggestions] = useState<Kontakt[]>([])
  const [showKontaktDropdown, setShowKontaktDropdown] = useState(false)
  const kontaktRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // PLZ → Ort Autofill (Zippopotam.us API)
  useEffect(() => {
    if (plz.length === 5 && /^\d{5}$/.test(plz)) {
      setPlzLoading(true)
      fetch(`https://api.zippopotam.us/de/${plz}`)
        .then((res) => {
          if (res.ok) return res.json()
          throw new Error("PLZ nicht gefunden")
        })
        .then((data) => {
          if (data.places && data.places.length > 0) {
            onOrtChange(data.places[0]["place name"])
          }
        })
        .catch((err) => {
          console.warn("PLZ Lookup fehlgeschlagen:", err)
        })
        .finally(() => setPlzLoading(false))
    }
  }, [plz, onOrtChange])

  // Kontakt-Suche (Second Brain API)
  useEffect(() => {
    if (!showKontaktSuche || !kontaktSuche || kontaktSuche.length < 2) {
      setKontaktSuggestions([])
      return
    }

    // Debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      setKontaktLoading(true)
      fetch(`/api/secondbrain/kontakte?q=${encodeURIComponent(kontaktSuche)}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setKontaktSuggestions(data)
            setShowKontaktDropdown(data.length > 0)
          }
        })
        .catch((err) => {
          console.error("Kontaktsuche fehlgeschlagen:", err)
          setKontaktSuggestions([])
        })
        .finally(() => setKontaktLoading(false))
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [kontaktSuche, showKontaktSuche])

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (kontaktRef.current && !kontaktRef.current.contains(e.target as Node)) {
        setShowKontaktDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleKontaktSelect = (kontakt: Kontakt) => {
    if (onKontaktSelect) {
      onKontaktSelect(kontakt)
    }
    if (kontakt.plz) onPlzChange(kontakt.plz)
    if (kontakt.ort) onOrtChange(kontakt.ort)
    setShowKontaktDropdown(false)
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Kontakt-Suche (optional) */}
      {showKontaktSuche && (
        <div ref={kontaktRef} className="relative">
          <label className="block text-xs text-zinc-400 mb-1">
            Forstamt/Kontakt suchen
          </label>
          <div className="relative">
            <input
              type="text"
              value={kontaktSuche}
              onChange={(e) => onKontaktSucheChange?.(e.target.value)}
              onFocus={() => kontaktSuggestions.length > 0 && setShowKontaktDropdown(true)}
              placeholder="Name eingeben..."
              disabled={disabled}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              {kontaktLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
          </div>

          {/* Kontakt Dropdown */}
          {showKontaktDropdown && kontaktSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl max-h-60 overflow-y-auto">
              {kontaktSuggestions.map((k, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleKontaktSelect(k)}
                  className="w-full px-3 py-2 text-left hover:bg-emerald-500/10 border-b border-[#2a2a2a] last:border-b-0 transition-colors"
                >
                  <div className="text-sm text-white font-medium">{k.name}</div>
                  <div className="text-xs text-zinc-500 flex gap-2">
                    {k.plz && <span>{k.plz}</span>}
                    {k.ort && <span>{k.ort}</span>}
                    {k.email && <span>• {k.email}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PLZ + Ort */}
      <div className="grid grid-cols-3 gap-3">
        <div className="relative">
          <label className="block text-xs text-zinc-400 mb-1">PLZ</label>
          <div className="relative">
            <input
              type="text"
              value={plz}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 5)
                onPlzChange(val)
              }}
              placeholder="12345"
              maxLength={5}
              disabled={disabled}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
            {plzLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
              </div>
            )}
          </div>
        </div>

        <div className="col-span-2 relative">
          <label className="block text-xs text-zinc-400 mb-1">Ort</label>
          <div className="relative">
            <input
              type="text"
              value={ort}
              onChange={(e) => onOrtChange(e.target.value)}
              placeholder="Ort"
              disabled={disabled}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddressAutofill
