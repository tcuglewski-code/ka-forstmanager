"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

/**
 * Sticky Demo-Banner — wird angezeigt wenn:
 *  - URL-Parameter ?demo=true vorhanden ist, ODER
 *  - die übergebene userEmail auf @demo-forstmanager.de endet, ODER
 *  - eine vorherige Sitzung das Demo-Flag gesetzt hat (sessionStorage).
 *
 * Sobald einmal aktiviert, bleibt das Banner via sessionStorage über
 * Navigationen hinweg sichtbar.
 */
export default function DemoBanner({ userEmail }: { userEmail?: string | null }) {
  const searchParams = useSearchParams()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const fromQuery = searchParams?.get("demo") === "true"
    const fromEmail = !!userEmail && userEmail.endsWith("@demo-forstmanager.de")
    const fromStorage = sessionStorage.getItem("demoMode") === "1"

    const active = fromQuery || fromEmail || fromStorage
    if (active) {
      sessionStorage.setItem("demoMode", "1")
    }
    setShow(active)
  }, [searchParams, userEmail])

  if (!show) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 9999,
        backgroundColor: "#F59E0B",
        color: "#FFFFFF",
        padding: "10px 16px",
        textAlign: "center",
        fontWeight: 600,
        fontSize: "14px",
        lineHeight: 1.4,
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        fontFamily: "var(--font-body, system-ui, sans-serif)",
      }}
    >
      ⚠️ DEMO-MODUS — Alle gezeigten Daten sind Demonstrationsdaten. Dieses System ist kein produktives System.
    </div>
  )
}
