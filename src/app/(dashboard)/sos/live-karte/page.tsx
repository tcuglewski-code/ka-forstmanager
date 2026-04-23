import { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import TeamLiveDashboard from "@/components/sos/TeamLiveDashboard"

export const metadata: Metadata = {
  title: "Team Live-Karte | ForstManager",
  description: "Echtzeit-Übersicht aller Mitarbeiter mit GPS-Status",
}

export default async function TeamLiveKartePage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  // Nur Admins und Gruppenführer
  const allowedRoles = ["ka_admin", "ka_gruppenführer", "admin"]
  const userRole = (session.user as any)?.role || ""
  
  if (!allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--color-on-surface)] mb-2">Zugriff verweigert</h1>
          <p className="text-[var(--color-on-surface-variant)]">
            Nur Administratoren und Gruppenführer können die Team-Karte einsehen.
          </p>
        </div>
      </div>
    )
  }

  return <TeamLiveDashboard />
}
