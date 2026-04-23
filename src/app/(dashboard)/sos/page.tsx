import { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import SOSKoordinatorDashboard from "@/components/sos/SOSKoordinatorDashboard"

export const metadata: Metadata = {
  title: "SOS-Koordination | ForstManager",
  description: "Echtzeit-Überwachung von SOS-Alarmen der Außendienstmitarbeiter",
}

export default async function SOSPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  // Only admins and Gruppenführer can access SOS coordination
  const allowedRoles = ["ka_admin", "ka_gruppenführer"]
  const userRole = (session.user as any)?.role || ""
  
  if (!allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--color-on-surface)] mb-2">Zugriff verweigert</h1>
          <p className="text-[var(--color-on-surface-variant)]">
            Nur Administratoren und Gruppenführer können auf die SOS-Koordination zugreifen.
          </p>
        </div>
      </div>
    )
  }

  return <SOSKoordinatorDashboard />
}
