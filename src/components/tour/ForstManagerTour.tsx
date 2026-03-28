"use client"

import { useEffect, useCallback } from "react"
import { driver, DriveStep } from "driver.js"
import "driver.js/dist/driver.css"

const TOUR_STORAGE_KEY = "fm_tour_done"

// Tour-Schritte für alle Hauptbereiche
const tourSteps: DriveStep[] = [
  {
    element: '[data-tour="dashboard"]',
    popover: {
      title: "🌲 Willkommen im ForstManager",
      description: "Hier sehen Sie alle wichtigen Kennzahlen auf einen Blick: offene Aufträge, Umsatz, Mitarbeiter-Status und aktuelle Aktivitäten.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="auftraege"]',
    popover: {
      title: "📋 Aufträge",
      description: "Verwalten Sie alle Forstprojekte von der Anfrage bis zum Abschluss. Status-Workflow, Kundendaten und Projektdetails an einem Ort.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="new-auftrag"]',
    popover: {
      title: "➕ Neuer Auftrag",
      description: "Erstellen Sie neue Aufträge direkt aus Wizard-Anfragen oder manuell. Alle Kundendaten werden automatisch übernommen.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="protokolle"]',
    popover: {
      title: "📝 Tagesprotokolle",
      description: "Gruppenführer dokumentieren hier täglich den Arbeitsfortschritt: gepflanzte Bäume, Arbeitszeiten, Witterung und Besonderheiten.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="abnahmen"]',
    popover: {
      title: "✅ Abnahmen",
      description: "Abnahmeprotokolle mit Förster-Signatur und Mängelmanagement. Nach erfolgreicher Abnahme wird die Rechnung freigegeben.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="lager"]',
    popover: {
      title: "📦 Lager",
      description: "Materialverwaltung mit Echtzeit-Bestandsabgleich. Sehen Sie welche Materialien für Aufträge reserviert oder verbraucht wurden.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="mitarbeiter"]',
    popover: {
      title: "👥 Mitarbeiter",
      description: "Alle Mitarbeiter mit Rollen, Qualifikationen, Kontaktdaten und Lohninformationen. Gruppen-Zuordnung für Saisons.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="rechnungen"]',
    popover: {
      title: "💰 Rechnungen",
      description: "Rechnungen erstellen, freigeben und per E-Mail versenden. Automatische Berechnung aus Protokollen und Materialverbrauch.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="reports"]',
    popover: {
      title: "📊 Wirtschaftlichkeit",
      description: "Deckungsbeitragsrechnung pro Auftrag: Einnahmen minus Lohnkosten minus Materialkosten. Sehen Sie welche Projekte profitabel sind.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="einstellungen"]',
    popover: {
      title: "⚙️ Einstellungen",
      description: "Globale Kalkulations-Parameter, Stundensätze, Maschinenkosten und Systemkonfiguration. Nur für Administratoren.",
      side: "right",
      align: "start",
    },
  },
]

interface ForstManagerTourProps {
  autoStart?: boolean
}

export function ForstManagerTour({ autoStart = true }: ForstManagerTourProps) {
  const startTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayOpacity: 0.75,
      stagePadding: 10,
      allowClose: true,
      popoverClass: "fm-tour-popover",
      nextBtnText: "Weiter →",
      prevBtnText: "← Zurück",
      doneBtnText: "Fertig",
      onDestroyStarted: () => {
        if (typeof window !== "undefined") {
          localStorage.setItem(TOUR_STORAGE_KEY, "true")
        }
        driverObj.destroy()
      },
      steps: tourSteps,
    })

    driverObj.drive()
  }, [])

  useEffect(() => {
    if (!autoStart) return
    if (typeof window === "undefined") return

    // Prüfe ob Tour schon abgeschlossen
    const tourDone = localStorage.getItem(TOUR_STORAGE_KEY)
    if (tourDone) return

    // Verzögerung damit DOM-Elemente geladen sind
    const timer = setTimeout(() => {
      startTour()
    }, 1000)

    return () => clearTimeout(timer)
  }, [autoStart, startTour])

  return null
}

// Export für manuelles Starten der Tour
export function resetAndStartTour() {
  if (typeof window === "undefined") return

  localStorage.removeItem(TOUR_STORAGE_KEY)

  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayOpacity: 0.75,
    stagePadding: 10,
    allowClose: true,
    popoverClass: "fm-tour-popover",
    nextBtnText: "Weiter →",
    prevBtnText: "← Zurück",
    doneBtnText: "Fertig",
    onDestroyStarted: () => {
      localStorage.setItem(TOUR_STORAGE_KEY, "true")
      driverObj.destroy()
    },
    steps: tourSteps,
  })

  driverObj.drive()
}

// Hook für Tour-Status
export function useTourStatus() {
  const isTourDone = () => {
    if (typeof window === "undefined") return true
    return localStorage.getItem(TOUR_STORAGE_KEY) === "true"
  }

  const resetTour = () => {
    if (typeof window === "undefined") return
    localStorage.removeItem(TOUR_STORAGE_KEY)
  }

  return { isTourDone, resetTour, startTour: resetAndStartTour }
}
