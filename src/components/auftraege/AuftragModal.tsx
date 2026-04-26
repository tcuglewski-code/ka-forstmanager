"use client"

import { useState, useEffect, useRef } from "react"
import { X, MapPin, Plus, Trash2, FileText, AlertCircle, Upload, Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AddressAutofill } from "@/components/forms/AddressAutofill"

interface Saison {
  id: string
  name: string
}
interface Gruppe {
  id: string
  name: string
  gruppenfuehrerId?: string | null
  gruppenfuehrer?: { id: string; vorname: string; nachname: string } | null
}

// Sprint Q031: Template Interface
interface AuftragTemplate {
  id: string
  name: string
  beschreibung?: string
  typ: string
  defaultTitel?: string
  defaultBeschreibung?: string
  defaultFlaeche?: number
  defaultBaumarten?: string
  defaultZeitraum?: string
  defaultWizardDaten?: Record<string, unknown>
  icon?: string
}

// Flächen-Typ für Multi-Flächen (FM-05)
interface Flaeche {
  id: string
  flaeche_ha: string
  standort: string
  forstamt: string
  revier: string
  lat: string
  lng: string
}

interface Auftrag {
  id?: string
  titel?: string
  typ?: string
  status?: string
  beschreibung?: string
  flaeche_ha?: number | null
  standort?: string
  bundesland?: string
  waldbesitzer?: string | null
  waldbesitzerEmail?: string | null
  waldbesitzerTelefon?: string | null
  lat?: number | null
  lng?: number | null
  saisonId?: string | null
  gruppeId?: string | null
  startDatum?: string | null
  endDatum?: string | null
  wizardDaten?: {
    treffpunkt?: string
    flaeche_forstamt?: string
    flaeche_revier?: string
    flaechen?: Flaeche[]
    // Typspezifische Felder (FM-06)
    bezugsquelle?: string
    lieferant?: string
    baumarten?: string
    pflanzverband?: string
    zauntyp?: string
    zaunlaenge?: string
    schutztyp?: string[]
    schutzart?: string
    anzahlHuellen?: string
    robinienstab?: string
    aufwuchsart?: string[]
    arbeitsmethode?: string
    turnus?: string
    bestandstyp?: string
    pflegeart?: string
  } | null
}

const TYPEN = [
  { value: "pflanzung", label: "Pflanzung" },
  { value: "zaunbau", label: "Zaunbau" },
  { value: "kulturschutz", label: "Kulturschutz" },
  { value: "kulturpflege", label: "Kulturpflege" },
  { value: "flaechenvorbereitung", label: "Flächenvorbereitung" },
  { value: "saatguternte", label: "Saatguternte" },
  { value: "pflanzenbeschaffung", label: "Pflanzenbeschaffung" },
]

// FM-08: Status-Liste erweitert um "geplant" und "aktiv"
const STATUS_LIST = [
  { value: "anfrage", label: "Anfrage" },
  { value: "geplant", label: "Geplant" },
  { value: "aktiv", label: "Aktiv" },
  { value: "geprueft", label: "Geprüft" },
  { value: "angebot", label: "Angebot" },
  { value: "bestaetigt", label: "Bestätigt" },
  { value: "in_ausfuehrung", label: "In Ausführung" },
  { value: "abgeschlossen", label: "Abgeschlossen" },
]

// FM-06: Optionen für typspezifische Felder
const PFLANZVERBAND_OPTIONS = [
  { value: "", label: "— wählen —" },
  { value: "reihe", label: "Reihenverband" },
  { value: "dreieck", label: "Dreiecksverband" },
  { value: "quadrat", label: "Quadratverband" },
  { value: "unregelmaessig", label: "Unregelmäßig" },
]

const ZAUNTYP_OPTIONS = [
  { value: "", label: "— wählen —" },
  { value: "wildzaun", label: "Wildzaun" },
  { value: "knotengeflecht", label: "Knotengeflecht" },
  { value: "elektrozaun", label: "Elektrozaun" },
  { value: "einzelschutz", label: "Einzelschutz" },
]

const SCHUTZART_OPTIONS = [
  { value: "", label: "— wählen —" },
  { value: "wuchshuellen", label: "Wuchshüllen" },
  { value: "drahthosen", label: "Drahthosen" },
  { value: "verbissschutz", label: "Verbissschutz" },
  { value: "fegeschutz", label: "Fegeschutz" },
]

const AUFWUCHSART_OPTIONS = [
  { value: "gras", label: "Gras" },
  { value: "brombeere", label: "Brombeere" },
  { value: "adlerfarn", label: "Adlerfarn" },
  { value: "naturverjuengung", label: "Naturverjüngung" },
  { value: "schlagabraum", label: "Schlagabraum" },
]

const ARBEITSMETHODE_OPTIONS = [
  { value: "freischneider", label: "Freischneider" },
  { value: "mulcher", label: "Mulcher" },
  { value: "handarbeit", label: "Handarbeit" },
]

const BUNDESLAENDER = [
  "Baden-Württemberg", "Bayern", "Berlin", "Brandenburg", "Bremen",
  "Hamburg", "Hessen", "Mecklenburg-Vorpommern", "Niedersachsen",
  "Nordrhein-Westfalen", "Rheinland-Pfalz", "Saarland", "Sachsen",
  "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen",
]

// Hilfsfunktion für eindeutige IDs
const generateId = () => Math.random().toString(36).substring(2, 9)

// Leere Fläche erstellen
const createEmptyFlaeche = (): Flaeche => ({
  id: generateId(),
  flaeche_ha: "",
  standort: "",
  forstamt: "",
  revier: "",
  lat: "",
  lng: "",
})

export function AuftragModal({
  auftrag,
  onClose,
  onSave,
}: {
  auftrag?: Auftrag | null
  onClose: () => void
  onSave: () => void
}) {
  const [saisons, setSaisons] = useState<Saison[]>([])
  const [gruppen, setGruppen] = useState<Gruppe[]>([])
  const [templates, setTemplates] = useState<AuftragTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  // KC-1: Validierungs-State
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  
  // KH-1: KI Dokument-Auswertung State
  const [kiConsent, setKiConsent] = useState<boolean | null>(null)
  const [kiAnalyzing, setKiAnalyzing] = useState(false)
  const [kiEnabled, setKiEnabled] = useState(true) // Feature-Flag
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // F-7: Waldbesitzer Autofill State
  const [waldbesitzerSuggestions, setWaldbesitzerSuggestions] = useState<Array<{waldbesitzer: string | null; waldbesitzerEmail: string | null; waldbesitzerTelefon: string | null}>>([])
  const [showWbSuggestions, setShowWbSuggestions] = useState(false)
  const [wbAutofilled, setWbAutofilled] = useState(false)

  // FM-05: Multi-Flächen State
  const [flaechen, setFlaechen] = useState<Flaeche[]>(() => {
    const wizardFlaechen = auftrag?.wizardDaten?.flaechen
    if (wizardFlaechen && wizardFlaechen.length > 0) {
      return wizardFlaechen
    }
    // Initialisiere mit einer Fläche, befüllt mit existierenden Daten
    return [{
      id: generateId(),
      flaeche_ha: auftrag?.flaeche_ha?.toString() ?? "",
      standort: auftrag?.standort ?? "",
      forstamt: auftrag?.wizardDaten?.flaeche_forstamt ?? "",
      revier: auftrag?.wizardDaten?.flaeche_revier ?? "",
      lat: auftrag?.lat?.toString() ?? "",
      lng: auftrag?.lng?.toString() ?? "",
    }]
  })

  const [form, setForm] = useState({
    titel: auftrag?.titel ?? "",
    typ: auftrag?.typ ?? "pflanzung",
    status: auftrag?.status ?? "anfrage",
    beschreibung: auftrag?.beschreibung ?? "",
    flaeche_ha: auftrag?.flaeche_ha?.toString() ?? "",
    standort: auftrag?.standort ?? "",
    bundesland: auftrag?.bundesland ?? "",
    waldbesitzer: auftrag?.waldbesitzer ?? "",
    waldbesitzerEmail: auftrag?.waldbesitzerEmail ?? "",
    waldbesitzerTelefon: auftrag?.waldbesitzerTelefon ?? "",
    waldbesitzerPlz: "",
    waldbesitzerOrt: "",
    lat: auftrag?.lat?.toString() ?? "",
    lng: auftrag?.lng?.toString() ?? "",
    saisonId: auftrag?.saisonId ?? "",
    gruppeId: auftrag?.gruppeId ?? "",
    startDatum: auftrag?.startDatum?.substring(0, 10) ?? "",
    endDatum: auftrag?.endDatum?.substring(0, 10) ?? "",
    // FM-03: Treffpunkt
    treffpunkt: auftrag?.wizardDaten?.treffpunkt ?? "",
    // FM-01: Forstamt/Revier (Haupt, falls Single-Fläche)
    forstamt: auftrag?.wizardDaten?.flaeche_forstamt ?? "",
    revier: auftrag?.wizardDaten?.flaeche_revier ?? "",
    // FM-06: Typspezifische Felder
    bezugsquelle: auftrag?.wizardDaten?.bezugsquelle ?? "",
    lieferant: auftrag?.wizardDaten?.lieferant ?? "",
    baumarten: auftrag?.wizardDaten?.baumarten ?? "",
    pflanzverband: auftrag?.wizardDaten?.pflanzverband ?? "",
    zauntyp: auftrag?.wizardDaten?.zauntyp ?? "",
    zaunlaenge: auftrag?.wizardDaten?.zaunlaenge ?? "",
    schutztyp: auftrag?.wizardDaten?.schutztyp ?? [],
    schutzart: auftrag?.wizardDaten?.schutzart ?? "",
    anzahlHuellen: auftrag?.wizardDaten?.anzahlHuellen ?? "",
    robinienstab: auftrag?.wizardDaten?.robinienstab ?? "",
    aufwuchsart: auftrag?.wizardDaten?.aufwuchsart ?? [],
    arbeitsmethode: auftrag?.wizardDaten?.arbeitsmethode ?? "",
    turnus: auftrag?.wizardDaten?.turnus ?? "",
    bestandstyp: auftrag?.wizardDaten?.bestandstyp ?? "",
    pflegeart: auftrag?.wizardDaten?.pflegeart ?? "",
  })

  useEffect(() => {
    fetch("/api/saisons").then(r => r.json()).then(setSaisons)
    fetch("/api/gruppen").then(r => r.json()).then(data => {
      // API returns paginated { items: [...] } or direct array
      setGruppen(Array.isArray(data) ? data : (data.items ?? []))
    })
    // Sprint Q031: Templates laden
    fetch("/api/auftraege/templates").then(r => r.json()).then(setTemplates)
    // KH-1: KI Consent-Status laden
    fetch("/api/consent/status?type=KI_VERARBEITUNG")
      .then(r => r.json())
      .then(data => setKiConsent(data.granted === true))
      .catch(() => setKiConsent(false))
  }, [])
  
  // F-7: Waldbesitzer Autofill — Suche bei Eingabe
  useEffect(() => {
    if (!form.waldbesitzer || form.waldbesitzer.length < 2 || auftrag?.id) {
      setWaldbesitzerSuggestions([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/waldbesitzer-suggest?name=${encodeURIComponent(form.waldbesitzer)}`)
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setWaldbesitzerSuggestions(data)
          setShowWbSuggestions(true)
        } else {
          setWaldbesitzerSuggestions([])
          setShowWbSuggestions(false)
        }
      } catch { /* ignore */ }
    }, 400)
    return () => clearTimeout(timer)
  }, [form.waldbesitzer, auftrag?.id])

  // F-4: Gruppenführer-Name für ausgewählte Gruppe
  const selectedGruppe = gruppen.find(g => g.id === form.gruppeId)
  const gruppenfuehrerName = selectedGruppe?.gruppenfuehrer
    ? `${selectedGruppe.gruppenfuehrer.vorname} ${selectedGruppe.gruppenfuehrer.nachname}`
    : null

  // KH-1: KI Dokument-Analyse Handler
  const handleKiFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Reset Input
    if (fileInputRef.current) fileInputRef.current.value = ""
    
    setKiAnalyzing(true)
    
    try {
      const formData = new FormData()
      formData.append("file", file)
      
      const res = await fetch("/api/ki/dokument-analyse", {
        method: "POST",
        body: formData,
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        if (data.code === "CONSENT_REQUIRED") {
          toast.error("KI-Einwilligung erforderlich. Bitte aktivieren Sie KI-Features in den Einstellungen.")
          setKiConsent(false)
        } else {
          toast.error(data.error || "KI-Analyse fehlgeschlagen")
        }
        return
      }
      
      // Extrahierte Daten in Form übernehmen
      const extracted = data.data
      
      setForm(prev => ({
        ...prev,
        titel: extracted.titel || prev.titel,
        typ: extracted.typ || prev.typ,
        waldbesitzer: extracted.waldbesitzer || prev.waldbesitzer,
        waldbesitzerEmail: extracted.waldbesitzerEmail || prev.waldbesitzerEmail,
        waldbesitzerTelefon: extracted.waldbesitzerTelefon || prev.waldbesitzerTelefon,
        bundesland: extracted.bundesland || prev.bundesland,
        baumarten: extracted.baumarten || prev.baumarten,
        pflanzverband: extracted.pflanzverband || prev.pflanzverband,
        zauntyp: extracted.zauntyp || prev.zauntyp,
        schutzart: extracted.schutzart || prev.schutzart,
        treffpunkt: extracted.treffpunkt || prev.treffpunkt,
      }))
      
      // Flächen übernehmen wenn vorhanden
      if (extracted.flaechen && extracted.flaechen.length > 0) {
        setFlaechen(extracted.flaechen.map((f: { flaeche_ha?: string; standort?: string; forstamt?: string; revier?: string; lat?: string; lng?: string }) => ({
          id: generateId(),
          flaeche_ha: f.flaeche_ha || "",
          standort: f.standort || "",
          forstamt: f.forstamt || "",
          revier: f.revier || "",
          lat: f.lat || "",
          lng: f.lng || "",
        })))
      }
      
      const confidencePercent = Math.round((extracted.confidence || 0) * 100)
      toast.success(`KI-Analyse abgeschlossen (${confidencePercent}% Konfidenz) — Bitte überprüfen Sie die Daten`)
      
    } catch (error) {
      console.error("KI-Analyse Fehler:", error)
      toast.error("KI-Analyse fehlgeschlagen")
    } finally {
      setKiAnalyzing(false)
    }
  }

  // Sprint Q031: Template anwenden
  const applyTemplate = (template: AuftragTemplate) => {
    const wizardDaten = template.defaultWizardDaten ?? {}
    setForm(prev => ({
      ...prev,
      titel: template.defaultTitel ?? prev.titel,
      typ: template.typ,
      beschreibung: template.defaultBeschreibung ?? prev.beschreibung,
      flaeche_ha: template.defaultFlaeche?.toString() ?? prev.flaeche_ha,
      baumarten: template.defaultBaumarten ?? prev.baumarten,
      // WizardDaten-Felder übernehmen falls vorhanden
      pflanzverband: (wizardDaten.pflanzverband as string) ?? prev.pflanzverband,
      bezugsquelle: (wizardDaten.bezugsquelle as string) ?? prev.bezugsquelle,
      zauntyp: (wizardDaten.zauntyp as string) ?? prev.zauntyp,
      schutztyp: (wizardDaten.schutztyp as string[]) ?? prev.schutztyp,
      schutzart: (wizardDaten.schutzart as string) ?? prev.schutzart,
      robinienstab: (wizardDaten.robinienstab as string) ?? prev.robinienstab,
      aufwuchsart: (wizardDaten.aufwuchsart as string[]) ?? prev.aufwuchsart,
      arbeitsmethode: (wizardDaten.arbeitsmethode as string) ?? prev.arbeitsmethode,
      turnus: (wizardDaten.turnus as string) ?? prev.turnus,
      bestandstyp: (wizardDaten.bestandstyp as string) ?? prev.bestandstyp,
    }))
    // Fläche aktualisieren wenn Template eine default-Fläche hat
    if (template.defaultFlaeche) {
      setFlaechen(prev => [{
        ...prev[0],
        flaeche_ha: template.defaultFlaeche?.toString() ?? ""
      }, ...prev.slice(1)])
    }
  }

  // FM-02: GPS-Koordinaten ermitteln
  const getGPSLocation = async () => {
    if (!navigator.geolocation) {
      toast.warning("Geolocation wird von diesem Browser nicht unterstützt")
      return
    }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm(f => ({
          ...f,
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
        }))
        setGeoLoading(false)
      },
      (error) => {
        console.error("GPS Fehler:", error)
        toast.warning("Standort konnte nicht ermittelt werden")
        setGeoLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // FM-02: GPS für spezifische Fläche ermitteln
  const getGPSForFlaeche = (flaecheId: string) => {
    if (!navigator.geolocation) {
      toast.warning("Geolocation wird von diesem Browser nicht unterstützt")
      return
    }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFlaechen(prev => prev.map(f =>
          f.id === flaecheId
            ? { ...f, lat: position.coords.latitude.toFixed(6), lng: position.coords.longitude.toFixed(6) }
            : f
        ))
        setGeoLoading(false)
      },
      (error) => {
        console.error("GPS Fehler:", error)
        toast.warning("Standort konnte nicht ermittelt werden")
        setGeoLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // FM-05: Fläche hinzufügen
  const addFlaeche = () => {
    setFlaechen(prev => [...prev, createEmptyFlaeche()])
  }

  // FM-05: Fläche entfernen
  const removeFlaeche = (id: string) => {
    if (flaechen.length <= 1) return // Mindestens eine Fläche
    setFlaechen(prev => prev.filter(f => f.id !== id))
  }

  // FM-05: Fläche aktualisieren
  const updateFlaeche = (id: string, field: keyof Flaeche, value: string) => {
    setFlaechen(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // FM-05: Gesamtfläche berechnen
    const gesamtFlaeche = flaechen.reduce((sum, f) => {
      const ha = parseFloat(f.flaeche_ha)
      return sum + (isNaN(ha) ? 0 : ha)
    }, 0)

    // wizardDaten zusammenbauen
    const wizardDaten = {
      // FM-03: Treffpunkt
      treffpunkt: form.treffpunkt || null,
      // FM-01: Forstamt/Revier (Haupt - für Single-Fläche Kompatibilität)
      flaeche_forstamt: flaechen[0]?.forstamt || form.forstamt || null,
      flaeche_revier: flaechen[0]?.revier || form.revier || null,
      // FM-05: Multi-Flächen
      flaechen: flaechen.length > 1 || (flaechen[0]?.flaeche_ha || flaechen[0]?.standort) 
        ? flaechen.map(f => ({
            id: f.id,
            flaeche_ha: f.flaeche_ha,
            standort: f.standort,
            forstamt: f.forstamt,
            revier: f.revier,
            lat: f.lat,
            lng: f.lng,
          }))
        : null,
      // FM-06: Typspezifische Felder
      ...(form.typ === "pflanzung" && {
        bezugsquelle: form.bezugsquelle || null,
        lieferant: form.lieferant || null,
        baumarten: form.baumarten || null,
        pflanzverband: form.pflanzverband || null,
      }),
      ...(form.typ === "zaunbau" && {
        zauntyp: form.zauntyp || null,
        zaunlaenge: form.zaunlaenge || null,
      }),
      ...(form.typ === "kulturschutz" && {
        schutztyp: form.schutztyp.length > 0 ? form.schutztyp : null,
        schutzart: form.schutzart || null,
        anzahlHuellen: form.anzahlHuellen || null,
        robinienstab: form.robinienstab || null,
      }),
      ...(form.typ === "flaechenvorbereitung" && {
        aufwuchsart: form.aufwuchsart.length > 0 ? form.aufwuchsart : null,
        arbeitsmethode: form.arbeitsmethode || null,
        turnus: form.turnus || null,
      }),
      ...(form.typ === "kulturpflege" && {
        bestandstyp: form.bestandstyp || null,
        pflegeart: form.pflegeart || null,
      }),
    }

    const payload = {
      titel: form.titel,
      typ: form.typ,
      status: form.status,
      beschreibung: form.beschreibung,
      // FM-05: Gesamtfläche oder Single-Fläche
      flaeche_ha: flaechen.length > 1 ? gesamtFlaeche : (form.flaeche_ha || flaechen[0]?.flaeche_ha || null),
      standort: flaechen[0]?.standort || form.standort || null,
      bundesland: form.bundesland || null,
      waldbesitzer: form.waldbesitzer || null,
      waldbesitzerEmail: form.waldbesitzerEmail || null,
      waldbesitzerTelefon: form.waldbesitzerTelefon || null,
      // FM-02: GPS-Koordinaten (Haupt - erste Fläche oder manuell)
      lat: flaechen[0]?.lat || form.lat || null,
      lng: flaechen[0]?.lng || form.lng || null,
      saisonId: form.saisonId || null,
      gruppeId: form.gruppeId || null,
      startDatum: form.startDatum || null,
      endDatum: form.endDatum || null,
      wizardDaten,
    }

    const url = auftrag?.id ? `/api/auftraege/${auftrag.id}` : "/api/auftraege"
    const method = auftrag?.id ? "PATCH" : "POST"
    
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const data = await res.json()
      
      if (!res.ok) {
        // KC-1: API-Validierungsfehler anzeigen
        if (data.details && Array.isArray(data.details)) {
          const newErrors: Record<string, string> = {}
          data.details.forEach((err: { field: string; message: string }) => {
            newErrors[err.field] = err.message
          })
          setErrors(newErrors)
        }
        setApiError(data.message || data.error || "Speichern fehlgeschlagen")
        toast.error(data.message || data.error || "Speichern fehlgeschlagen")
        setLoading(false)
        return
      }
      
      // KC-2: Erfolg — toast und Callback
      toast.success(auftrag?.id ? "Auftrag aktualisiert" : "Auftrag erstellt")
      setLoading(false)
      setErrors({})
      setApiError(null)
      onSave()
    } catch (error) {
      console.error("Fehler beim Speichern:", error)
      toast.error("Netzwerkfehler beim Speichern")
      setLoading(false)
    }
  }
  
  // KC-1: Validierungsfunktion
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!form.titel.trim()) {
      newErrors.titel = "Titel ist erforderlich"
    }
    if (!form.typ) {
      newErrors.typ = "Typ ist erforderlich"
    }
    if (!form.waldbesitzer?.trim()) {
      newErrors.waldbesitzer = "Waldbesitzer ist erforderlich"
    }
    
    // Prüfe ob mindestens eine Fläche mit ha > 0
    const hasValidFlaeche = flaechen.some(f => f.flaeche_ha && parseFloat(f.flaeche_ha) > 0) || 
      (form.flaeche_ha && parseFloat(form.flaeche_ha) > 0)
    if (!hasValidFlaeche) {
      newErrors.flaeche_ha = "Mindestens eine Fläche mit Hektar-Angabe ist erforderlich"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Prüfe ob Formular gültig ist für Button-Disable
  const isFormValid = form.titel.trim() && 
    form.typ && 
    form.waldbesitzer?.trim() &&
    (flaechen.some(f => f.flaeche_ha && parseFloat(f.flaeche_ha) > 0) || 
     (form.flaeche_ha && parseFloat(form.flaeche_ha) > 0))

  const field = (label: string, key: keyof typeof form, type = "text", placeholder = "") => (
    <div>
      <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-emerald-500"
      />
    </div>
  )

  const select = (label: string, key: keyof typeof form, options: { value: string; label: string }[], allowEmpty = false) => (
    <div>
      <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">{label}</label>
      <select
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-emerald-500"
      >
        {allowEmpty && <option value="">— keine —</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface-container)] border border-border rounded-xl w-full max-w-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold text-[var(--color-on-surface)]">
            {auftrag?.id ? "Auftrag bearbeiten" : "Neuer Auftrag"}
          </h2>
          <button onClick={onClose} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 p-6 space-y-4">
            {/* Sprint Q031: Template-Auswahl (nur bei neuem Auftrag) */}
            {!auftrag?.id && templates.length > 0 && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">Aus Vorlage erstellen</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {templates.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyTemplate(t)}
                      className="flex flex-col items-start p-3 bg-[var(--color-surface-container-low)] border border-border rounded-lg hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-left group"
                    >
                      <span className="text-sm font-medium text-[var(--color-on-surface)] group-hover:text-emerald-400 transition-colors">
                        {t.name}
                      </span>
                      {t.beschreibung && (
                        <span className="text-xs text-[var(--color-on-surface-variant)] mt-1 line-clamp-2">
                          {t.beschreibung}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* KH-1: KI Dokument-Auswertung Upload */}
            {!auftrag?.id && kiEnabled && (
              <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-medium text-violet-400">KI-Autofill aus Dokument</span>
                  </div>
                  {kiConsent === false && (
                    <span className="text-xs text-[var(--color-on-surface-variant)]">Einwilligung erforderlich</span>
                  )}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleKiFileUpload}
                  className="hidden"
                  disabled={!kiConsent || kiAnalyzing}
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!kiConsent || kiAnalyzing}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed transition-all ${
                    kiConsent && !kiAnalyzing
                      ? "border-violet-500/30 hover:border-violet-500/60 hover:bg-violet-500/5 text-violet-400 cursor-pointer"
                      : "border-border text-[var(--color-on-surface-variant)] cursor-not-allowed"
                  }`}
                  title={!kiConsent ? "KI-Einwilligung in den Einstellungen erforderlich" : undefined}
                >
                  {kiAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">KI analysiert Dokument...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">📎 Datei hochladen für Autofill</span>
                    </>
                  )}
                </button>
                
                <p className="text-xs text-[var(--color-on-surface-variant)] mt-2">
                  Unterstützt: JPEG, PNG, GIF, WebP • Max. 10MB • Die KI extrahiert Auftragsdaten automatisch
                </p>
              </div>
            )}

            {field("Titel *", "titel", "text", "z.B. Frühjahrsaufforstung Revier Nord")}
            <div className="grid grid-cols-2 gap-4">
              {select("Typ *", "typ", TYPEN)}
              {select("Status", "status", STATUS_LIST)}
            </div>
            <div>
              <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Beschreibung</label>
              <textarea
                value={form.beschreibung}
                onChange={e => setForm(f => ({ ...f, beschreibung: e.target.value }))}
                rows={3}
                className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-emerald-500 resize-none"
                placeholder="Beschreibung der Maßnahme..."
              />
            </div>

            {/* FM-05: Multi-Flächen Section */}
            <div className="border border-border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-[var(--color-on-surface)]">Flächen</h3>
                <button
                  type="button"
                  onClick={addFlaeche}
                  className="flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400"
                >
                  <Plus className="w-3 h-3" />
                  Weitere Fläche
                </button>
              </div>
              
              {flaechen.map((flaeche, idx) => (
                <div key={flaeche.id} className="bg-[var(--color-surface-container-lowest)] rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--color-on-surface-variant)]">Fläche {idx + 1}</span>
                    {flaechen.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFlaeche(flaeche.id)}
                        className="text-[var(--color-on-surface-variant)] hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Fläche (ha)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={flaeche.flaeche_ha}
                        onChange={e => updateFlaeche(flaeche.id, "flaeche_ha", e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Standort</label>
                      <input
                        type="text"
                        value={flaeche.standort}
                        onChange={e => updateFlaeche(flaeche.id, "standort", e.target.value)}
                        placeholder="z.B. Abt. 5"
                        className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  {/* FM-01: Forstamt/Revier pro Fläche */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Forstamt</label>
                      <input
                        type="text"
                        value={flaeche.forstamt}
                        onChange={e => updateFlaeche(flaeche.id, "forstamt", e.target.value)}
                        placeholder="z.B. Forstamt Arnsberg"
                        className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Revier</label>
                      <input
                        type="text"
                        value={flaeche.revier}
                        onChange={e => updateFlaeche(flaeche.id, "revier", e.target.value)}
                        placeholder="z.B. Revier Nord"
                        className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  {/* FM-02: GPS pro Fläche */}
                  <div className="flex items-end gap-2">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Breitengrad (Lat)</label>
                        <input
                          type="text"
                          value={flaeche.lat}
                          onChange={e => updateFlaeche(flaeche.id, "lat", e.target.value)}
                          placeholder="51.4556"
                          className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Längengrad (Lng)</label>
                        <input
                          type="text"
                          value={flaeche.lng}
                          onChange={e => updateFlaeche(flaeche.id, "lng", e.target.value)}
                          placeholder="7.0116"
                          className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => getGPSForFlaeche(flaeche.id)}
                      disabled={geoLoading}
                      className="px-3 py-2 rounded-lg bg-emerald-600/20 border border-emerald-600/30 text-emerald-500 text-xs hover:bg-emerald-600/30 transition-colors disabled:opacity-50"
                    >
                      <MapPin className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {flaechen.length > 1 && (
                <div className="text-xs text-[var(--color-on-surface-variant)] text-right">
                  Gesamtfläche: {flaechen.reduce((sum, f) => sum + (parseFloat(f.flaeche_ha) || 0), 0).toFixed(2)} ha
                </div>
              )}
            </div>

            {/* FM-03: Treffpunkt */}
            {field("Treffpunkt mit Förster", "treffpunkt", "text", "z.B. Parkplatz Forsthaus Revier Nord")}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Bundesland</label>
                <select
                  value={form.bundesland}
                  onChange={e => setForm(f => ({ ...f, bundesland: e.target.value }))}
                  className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-emerald-500"
                >
                  <option value="">— wählen —</option>
                  {BUNDESLAENDER.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              {/* F-7: Waldbesitzer mit Autofill-Suggestions */}
              <div className="relative">
                <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Waldbesitzer</label>
                <input
                  type="text"
                  value={form.waldbesitzer}
                  onChange={e => { setForm(f => ({ ...f, waldbesitzer: e.target.value })); setWbAutofilled(false) }}
                  onFocus={() => waldbesitzerSuggestions.length > 0 && setShowWbSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowWbSuggestions(false), 200)}
                  placeholder="Name"
                  className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-emerald-500"
                />
                {showWbSuggestions && waldbesitzerSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-[var(--color-surface-container)] border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {waldbesitzerSuggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm text-[var(--color-on-surface)] hover:bg-emerald-500/10 transition-colors"
                        onMouseDown={e => {
                          e.preventDefault()
                          setForm(f => ({
                            ...f,
                            waldbesitzer: s.waldbesitzer || f.waldbesitzer,
                            waldbesitzerEmail: s.waldbesitzerEmail || f.waldbesitzerEmail,
                            waldbesitzerTelefon: s.waldbesitzerTelefon || f.waldbesitzerTelefon,
                          }))
                          setShowWbSuggestions(false)
                          setWbAutofilled(true)
                        }}
                      >
                        <span className="font-medium">{s.waldbesitzer}</span>
                        {s.waldbesitzerEmail && <span className="text-xs text-[var(--color-on-surface-variant)] ml-2">{s.waldbesitzerEmail}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {wbAutofilled && (
                  <p className="text-xs text-emerald-500 mt-1">Kontaktdaten aus Kundenstamm übernommen</p>
                )}
              </div>
            </div>
            {/* KC-4: PLZ Autofill + Forstamt-Kontaktsuche */}
            <AddressAutofill
              plz={form.waldbesitzerPlz}
              ort={form.waldbesitzerOrt}
              onPlzChange={(plz) => setForm(f => ({ ...f, waldbesitzerPlz: plz }))}
              onOrtChange={(ort) => {
                setForm(f => ({ ...f, waldbesitzerOrt: ort }))
                // Ort auch in standort übernehmen falls noch leer
                if (!flaechen[0]?.standort) {
                  setFlaechen(prev => prev.map((fl, i) => i === 0 ? { ...fl, standort: ort } : fl))
                }
              }}
              showKontaktSuche={true}
              kontaktSuche={form.waldbesitzer}
              onKontaktSucheChange={(v) => setForm(f => ({ ...f, waldbesitzer: v }))}
              onKontaktSelect={(kontakt) => setForm(f => ({
                ...f,
                waldbesitzer: kontakt.name,
                waldbesitzerOrt: kontakt.ort ?? f.waldbesitzerOrt,
                waldbesitzerPlz: kontakt.plz ?? f.waldbesitzerPlz,
              }))}
            />
            {/* FM-04: Waldbesitzer Kontakt */}
            <div className="grid grid-cols-2 gap-4">
              {field("E-Mail Waldbesitzer", "waldbesitzerEmail", "email", "waldbesitzer@example.de")}
              {field("Telefon Waldbesitzer", "waldbesitzerTelefon", "tel", "+49 123 456789")}
            </div>

            {/* FM-02: GPS-Koordinaten (Haupt - falls nur 1 Fläche ohne GPS) */}
            {flaechen.length === 1 && !flaechen[0].lat && !flaechen[0].lng && (
              <div className="border border-border rounded-lg p-4">
                <label className="block text-xs text-[var(--color-on-surface-variant)] mb-2">GPS-Standort (alternativ)</label>
                <div className="flex items-end gap-2">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={form.lat}
                      onChange={e => setForm(f => ({ ...f, lat: e.target.value }))}
                      placeholder="Breitengrad (51.4556)"
                      className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="text"
                      value={form.lng}
                      onChange={e => setForm(f => ({ ...f, lng: e.target.value }))}
                      placeholder="Längengrad (7.0116)"
                      className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={getGPSLocation}
                    disabled={geoLoading}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600/20 border border-emerald-600/30 text-emerald-500 text-xs hover:bg-emerald-600/30 transition-colors disabled:opacity-50"
                  >
                    <MapPin className="w-4 h-4" />
                    {geoLoading ? "..." : "Standort ermitteln"}
                  </button>
                </div>
              </div>
            )}

            {/* FM-06: Typspezifische Zusatzfelder */}
            {form.typ === "pflanzung" && (
              <div className="border border-emerald-600/30 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-medium text-emerald-500">Pflanzung Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-[var(--color-on-surface-variant)] mb-2">Bezugsquelle</label>
                    <div className="flex gap-4">
                      {["koch", "kunde", "baumschule"].map(opt => (
                        <label key={opt} className="flex items-center gap-2 text-sm text-[var(--color-on-surface)] cursor-pointer">
                          <input
                            type="radio"
                            name="bezugsquelle"
                            value={opt}
                            checked={form.bezugsquelle === opt}
                            onChange={e => setForm(f => ({ ...f, bezugsquelle: e.target.value }))}
                            className="accent-emerald-500"
                          />
                          {opt === "koch" ? "Koch Aufforstung" : opt === "kunde" ? "Kunde" : "Baumschule direkt"}
                        </label>
                      ))}
                    </div>
                  </div>
                  {field("Lieferant", "lieferant", "text", "Name der Baumschule")}
                  <div>
                    <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Baumarten</label>
                    <textarea
                      value={form.baumarten}
                      onChange={e => setForm(f => ({ ...f, baumarten: e.target.value }))}
                      rows={2}
                      placeholder="z.B. 500 Eiche, 300 Buche, 200 Lärche"
                      className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Pflanzverband</label>
                    <select
                      value={form.pflanzverband}
                      onChange={e => setForm(f => ({ ...f, pflanzverband: e.target.value }))}
                      className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-emerald-500"
                    >
                      {PFLANZVERBAND_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {form.typ === "zaunbau" && (
              <div className="border border-emerald-600/30 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-medium text-emerald-500">Zaunbau Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Zauntyp</label>
                    <select
                      value={form.zauntyp}
                      onChange={e => setForm(f => ({ ...f, zauntyp: e.target.value }))}
                      className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-emerald-500"
                    >
                      {ZAUNTYP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  {field("Zaunlänge (m)", "zaunlaenge", "number", "0")}
                </div>
              </div>
            )}

            {form.typ === "kulturschutz" && (
              <div className="border border-emerald-600/30 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-medium text-emerald-500">Kulturschutz Details</h3>
                <div>
                  <label className="block text-xs text-[var(--color-on-surface-variant)] mb-2">Schutztyp</label>
                  <div className="flex flex-wrap gap-3">
                    {["wuchshuellen", "drahthosen", "verbissschutz", "fegeschutz"].map(opt => (
                      <label key={opt} className="flex items-center gap-2 text-sm text-[var(--color-on-surface)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.schutztyp.includes(opt)}
                          onChange={e => {
                            if (e.target.checked) {
                              setForm(f => ({ ...f, schutztyp: [...f.schutztyp, opt] }))
                            } else {
                              setForm(f => ({ ...f, schutztyp: f.schutztyp.filter(t => t !== opt) }))
                            }
                          }}
                          className="accent-emerald-500"
                        />
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Schutzart</label>
                    <select
                      value={form.schutzart}
                      onChange={e => setForm(f => ({ ...f, schutzart: e.target.value }))}
                      className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-emerald-500"
                    >
                      {SCHUTZART_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  {field("Anzahl Hüllen/Schutze", "anzahlHuellen", "number", "0")}
                </div>
                {field("Robinienstab", "robinienstab", "text", "z.B. 1.20m")}
              </div>
            )}

            {form.typ === "flaechenvorbereitung" && (
              <div className="border border-emerald-600/30 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-medium text-emerald-500">Flächenvorbereitung Details</h3>
                <div>
                  <label className="block text-xs text-[var(--color-on-surface-variant)] mb-2">Aufwuchsart</label>
                  <div className="flex flex-wrap gap-3">
                    {AUFWUCHSART_OPTIONS.map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 text-sm text-[var(--color-on-surface)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.aufwuchsart.includes(opt.value)}
                          onChange={e => {
                            if (e.target.checked) {
                              setForm(f => ({ ...f, aufwuchsart: [...f.aufwuchsart, opt.value] }))
                            } else {
                              setForm(f => ({ ...f, aufwuchsart: f.aufwuchsart.filter(t => t !== opt.value) }))
                            }
                          }}
                          className="accent-emerald-500"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-on-surface-variant)] mb-2">Arbeitsmethode</label>
                  <div className="flex gap-4">
                    {ARBEITSMETHODE_OPTIONS.map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 text-sm text-[var(--color-on-surface)] cursor-pointer">
                        <input
                          type="radio"
                          name="arbeitsmethode"
                          value={opt.value}
                          checked={form.arbeitsmethode === opt.value}
                          onChange={e => setForm(f => ({ ...f, arbeitsmethode: e.target.value }))}
                          className="accent-emerald-500"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
                {field("Turnus", "turnus", "text", "z.B. 2x jährlich")}
              </div>
            )}

            {form.typ === "kulturpflege" && (
              <div className="border border-emerald-600/30 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-medium text-emerald-500">Kulturpflege Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  {field("Bestandstyp", "bestandstyp", "text", "z.B. Laubholz-Mischbestand")}
                  {field("Pflegeart", "pflegeart", "text", "z.B. Läuterung, Freistellen")}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Saison</label>
                <select
                  value={form.saisonId}
                  onChange={e => setForm(f => ({ ...f, saisonId: e.target.value }))}
                  className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-emerald-500"
                >
                  <option value="">— keine —</option>
                  {saisons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Gruppe</label>
                <select
                  value={form.gruppeId}
                  onChange={e => setForm(f => ({ ...f, gruppeId: e.target.value }))}
                  className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-emerald-500"
                >
                  <option value="">— keine —</option>
                  {gruppen.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                {/* F-4: Gruppenführer-Anzeige */}
                {gruppenfuehrerName && (
                  <p className="text-xs text-emerald-500 mt-1">GF: {gruppenfuehrerName}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {field("Startdatum", "startDatum", "date")}
              {field("Enddatum", "endDatum", "date")}
            </div>
          </div>

          {/* KC-1: Fehleranzeige */}
          {apiError && (
            <div className="mx-6 mb-0 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-400">{apiError}</div>
            </div>
          )}
          
          {/* KC-1: Fehlende Pflichtfelder Hinweis */}
          {!isFormValid && !loading && (
            <div className="mx-6 mb-0 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="text-xs text-amber-400 space-y-1">
                {!form.titel.trim() && <div>• Titel fehlt</div>}
                {!form.waldbesitzer?.trim() && <div>• Waldbesitzer fehlt</div>}
                {!(flaechen.some(f => f.flaeche_ha && parseFloat(f.flaeche_ha) > 0) || 
                   (form.flaeche_ha && parseFloat(form.flaeche_ha) > 0)) && (
                  <div>• Mindestens eine Fläche mit Hektar-Angabe fehlt</div>
                )}
              </div>
            </div>
          )}

          <div className="shrink-0 flex gap-3 p-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] hover:border-zinc-500 transition-all"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
