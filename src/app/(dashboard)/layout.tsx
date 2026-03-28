import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/layout/AppShell"
import { SessionProvider } from "@/components/providers/SessionProvider"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <SessionProvider>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  )
}
