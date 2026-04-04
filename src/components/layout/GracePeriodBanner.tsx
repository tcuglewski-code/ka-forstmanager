"use client"

/**
 * GracePeriodBanner — Banner für Tenants mit ausgelaufenem Vertrag
 * Sprint OG: IMPL-CHURN-07
 * 
 * Zeigt "Vertrag ausgelaufen, X Tage Lesezugriff" an.
 * Wird nur bei status=grace_period oder archived angezeigt.
 */

import { useReadonlyMode } from "@/components/providers/ReadonlyModeProvider"
import { AlertTriangle, Clock, Download, Phone } from "lucide-react"

export function GracePeriodBanner() {
  const { isReadonly, tenantStatus, daysRemaining, loading } = useReadonlyMode()

  // Nicht anzeigen während Loading oder wenn kein Readonly-Modus
  if (loading || !isReadonly) {
    return null
  }

  // Archived: Daten wurden archiviert, kein Zugriff mehr auf GPS etc.
  if (tenantStatus === "archived") {
    return (
      <div
        className="flex items-center justify-between gap-4 px-6 py-3 text-sm"
        style={{
          backgroundColor: "var(--color-error-container)",
          color: "var(--color-on-error-container)",
        }}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <strong>Zugriff eingeschränkt.</strong> Ihr Vertrag ist abgelaufen und wurde archiviert. 
            GPS-Daten wurden gelöscht. Nur steuerrelevante Dokumente sind noch verfügbar.
          </div>
        </div>
        <a
          href="mailto:info@feldhub.de"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium flex-shrink-0 tonal-transition"
          style={{
            backgroundColor: "var(--color-error)",
            color: "var(--color-on-error)",
          }}
        >
          <Phone className="w-4 h-4" />
          Support kontaktieren
        </a>
      </div>
    )
  }

  // Grace Period: Noch X Tage Lesezugriff + Datenexport
  if (tenantStatus === "grace_period") {
    // Warnstufen: <7 Tage = kritisch, <15 = Warnung, sonst Info
    const isCritical = daysRemaining !== null && daysRemaining < 7
    const isWarning = daysRemaining !== null && daysRemaining < 15

    return (
      <div
        className="flex items-center justify-between gap-4 px-6 py-3 text-sm"
        style={{
          backgroundColor: isCritical
            ? "var(--color-error-container)"
            : isWarning
            ? "var(--color-tertiary-container)"
            : "var(--color-secondary-container)",
          color: isCritical
            ? "var(--color-on-error-container)"
            : isWarning
            ? "var(--color-on-tertiary-container)"
            : "var(--color-on-secondary-container)",
        }}
      >
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 flex-shrink-0" />
          <div>
            <strong>Vertrag ausgelaufen.</strong>{" "}
            {daysRemaining !== null ? (
              <>
                Noch <strong>{daysRemaining} {daysRemaining === 1 ? "Tag" : "Tage"}</strong> Lesezugriff.
              </>
            ) : (
              <>Grace-Period aktiv.</>
            )}{" "}
            Schreibzugriff ist gesperrt. Bitte exportieren Sie Ihre Daten oder reaktivieren Sie Ihren Vertrag.
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href="/api/tenant/export"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium tonal-transition"
            style={{
              backgroundColor: isCritical
                ? "var(--color-error)"
                : "var(--color-primary)",
              color: isCritical
                ? "var(--color-on-error)"
                : "var(--color-on-primary)",
            }}
          >
            <Download className="w-4 h-4" />
            Daten exportieren
          </a>
          <a
            href="mailto:info@feldhub.de?subject=Vertrag%20reaktivieren"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium tonal-transition"
            style={{
              backgroundColor: "transparent",
              border: `1px solid currentColor`,
            }}
          >
            <Phone className="w-4 h-4" />
            Reaktivieren
          </a>
        </div>
      </div>
    )
  }

  return null
}
