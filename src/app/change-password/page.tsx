"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (newPassword !== confirmPassword) {
      setError("Passwörter stimmen nicht überein")
      return
    }

    if (newPassword.length < 8) {
      setError("Neues Passwort muss mindestens 8 Zeichen haben")
      return
    }
    if (!/\d/.test(newPassword)) {
      setError("Neues Passwort muss mindestens eine Zahl enthalten")
      return
    }
    if (!/[^a-zA-Z0-9]/.test(newPassword)) {
      setError("Neues Passwort muss mindestens ein Sonderzeichen enthalten")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Fehler beim Ändern des Passworts")
        return
      }

      // Password changed — tokenVersion incremented, must re-login to get fresh JWT
      await signOut({ redirectTo: "/login" })
    } catch {
      setError("Netzwerkfehler. Bitte erneut versuchen.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#C5A55A] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-[#2C3A1C]">KA</span>
          </div>
          <h1 className="text-2xl font-bold text-[#2C3A1C]">Passwort ändern</h1>
          <p className="text-sm text-gray-500 mt-2">
            Bitte ändern Sie Ihr temporäres Passwort, bevor Sie fortfahren.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aktuelles Passwort
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A55A] focus:border-transparent outline-none"
              placeholder="Ihr aktuelles Passwort"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Neues Passwort
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A55A] focus:border-transparent outline-none"
              placeholder="Min. 8 Zeichen, 1 Zahl, 1 Sonderzeichen"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Neues Passwort bestätigen
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A55A] focus:border-transparent outline-none"
              placeholder="Neues Passwort wiederholen"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#2C3A1C] text-white rounded-lg font-semibold hover:bg-[#3a4d26] transition-colors disabled:opacity-50"
          >
            {loading ? "Wird geändert..." : "Passwort ändern"}
          </button>
        </form>
      </div>
    </div>
  )
}
