import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/layout/AppShell"
import { SessionProvider } from "@/components/providers/SessionProvider"
import { ReadonlyModeProvider } from "@/components/providers/ReadonlyModeProvider"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")

  // Rollenbasierte Zugriffskontrolle: Baumschule/Kunde zum Portal umleiten
  const userRole = (session.user as { role?: string }).role
  if (userRole === "baumschule") redirect("/baumschule/portal")
  if (userRole === "kunde") redirect("/kunde/dashboard")

  return (
    <SessionProvider>
      <ReadonlyModeProvider>
        <AppShell>{children}</AppShell>
      </ReadonlyModeProvider>
    </SessionProvider>
  )
}
