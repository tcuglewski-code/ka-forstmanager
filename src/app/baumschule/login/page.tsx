"use client"

// Sprint AJ: Baumschule Login via Magic-Link
// Aufgerufen über: /baumschule/login?token=xxx

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Suspense } from "react"

function BaumschuleLoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const [status, setStatus] = useState<"pruefen" | "erfolg" | "fehler">("pruefen")
  const [fehlerText, setFehlerText] = useState("")
  const [baumschuleName, setBaumschuleName] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("fehler")
      setFehlerText("Kein Login-Token gefunden. Bitte fordern Sie einen neuen Link an.")
      return
    }

    async function tokenValidieren() {
      try {
        const res = await fetch("/api/baumschulen/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })

        const daten = await res.json()

        if (!res.ok) {
          setStatus("fehler")
          setFehlerText(daten.error ?? "Login fehlgeschlagen")
          return
        }

        setBaumschuleName(daten.baumschule.name)
        setStatus("erfolg")

        // Weiterleitung zum Baumschul-Portal nach 2 Sekunden
        setTimeout(() => {
          router.push(`/baumschule/portal?id=${daten.baumschule.id}`)
        }, 2000)
      } catch {
        setStatus("fehler")
        setFehlerText("Netzwerkfehler. Bitte versuchen Sie es erneut.")
      }
    }

    tokenValidieren()
  }, [token, router])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-md w-full text-center space-y-6">
        {/* Logo/Header */}
        <div>
          <div className="text-4xl mb-2">🌲</div>
          <h1 className="text-xl font-bold text-white">Koch Aufforstung GmbH</h1>
          <p className="text-zinc-400 text-sm mt-1">Baumschul-Portal</p>
        </div>

        {/* Zustand: Prüfen */}
        {status === "pruefen" && (
          <div className="space-y-3">
            <div className="text-zinc-300 animate-pulse text-lg">⏳</div>
            <p className="text-zinc-300">Login-Link wird geprüft...</p>
          </div>
        )}

        {/* Zustand: Erfolg */}
        {status === "erfolg" && (
          <div className="space-y-3">
            <div className="text-4xl">✅</div>
            <p className="text-green-400 font-medium">Login erfolgreich!</p>
            <p className="text-zinc-300 text-sm">
              Willkommen, <strong className="text-white">{baumschuleName}</strong>!
            </p>
            <p className="text-zinc-500 text-xs">Sie werden weitergeleitet...</p>
          </div>
        )}

        {/* Zustand: Fehler */}
        {status === "fehler" && (
          <div className="space-y-4">
            <div className="text-4xl">❌</div>
            <p className="text-red-400 font-medium">Login fehlgeschlagen</p>
            <p className="text-zinc-400 text-sm">{fehlerText}</p>
            <p className="text-zinc-500 text-xs">
              Bitte wenden Sie sich an Koch Aufforstung GmbH, um einen neuen Login-Link zu erhalten.
            </p>
            <a
              href="mailto:cuglewski@koch-aufforstung.de"
              className="inline-block px-4 py-2 border border-zinc-600 text-zinc-300 rounded-lg hover:border-zinc-400 hover:text-white transition-colors text-sm"
            >
              📧 Neuen Login anfordern
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BaumschuleLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Wird geladen...</div>
      </div>
    }>
      <BaumschuleLoginForm />
    </Suspense>
  )
}
