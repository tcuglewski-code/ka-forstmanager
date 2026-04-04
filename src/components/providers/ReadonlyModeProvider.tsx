"use client"

/**
 * ReadonlyModeProvider — Globaler Context für Grace-Period Readonly-Modus
 * Sprint OG: IMPL-CHURN-07
 * 
 * Stellt isReadonly + Tenant-Status für alle Child-Components bereit.
 * Bei grace_period/archived werden schreibende Aktionen blockiert.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"

type TenantStatus = "active" | "cancelled" | "grace_period" | "archived" | "deleted"

interface ReadonlyModeContextType {
  isReadonly: boolean
  tenantStatus: TenantStatus | null
  daysRemaining: number | null
  graceEndDate: Date | null
  loading: boolean
  /**
   * Check ob eine Aktion erlaubt ist. Bei Readonly = false + Toast-Meldung.
   * Usage: if (!checkWriteAllowed()) return
   */
  checkWriteAllowed: () => boolean
}

const ReadonlyModeContext = createContext<ReadonlyModeContextType>({
  isReadonly: false,
  tenantStatus: null,
  daysRemaining: null,
  graceEndDate: null,
  loading: true,
  checkWriteAllowed: () => true,
})

export const useReadonlyMode = () => useContext(ReadonlyModeContext)

interface ReadonlyModeProviderProps {
  children: ReactNode
}

export function ReadonlyModeProvider({ children }: ReadonlyModeProviderProps) {
  const [isReadonly, setIsReadonly] = useState(false)
  const [tenantStatus, setTenantStatus] = useState<TenantStatus | null>(null)
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)
  const [graceEndDate, setGraceEndDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTenantStatus() {
      try {
        const res = await fetch("/api/tenant/status")
        if (!res.ok) {
          // Bei Fehler (z.B. nicht eingeloggt) → normaler Modus
          setLoading(false)
          return
        }
        const data = await res.json()
        setTenantStatus(data.status)
        setIsReadonly(data.isReadonly)
        setDaysRemaining(data.daysRemaining)
        setGraceEndDate(data.graceEndDate ? new Date(data.graceEndDate) : null)
      } catch (err) {
        console.error("Failed to fetch tenant status:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTenantStatus()
    // Refresh alle 5 Minuten (falls Status sich ändert)
    const interval = setInterval(fetchTenantStatus, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const checkWriteAllowed = (): boolean => {
    if (isReadonly) {
      // Toast-Benachrichtigung (könnte auch ein State sein für ein Modal)
      alert("Schreibzugriff nicht möglich. Ihr Vertrag ist ausgelaufen. Bitte kontaktieren Sie den Support zur Reaktivierung.")
      return false
    }
    return true
  }

  return (
    <ReadonlyModeContext.Provider
      value={{
        isReadonly,
        tenantStatus,
        daysRemaining,
        graceEndDate,
        loading,
        checkWriteAllowed,
      }}
    >
      {children}
    </ReadonlyModeContext.Provider>
  )
}
