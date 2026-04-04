import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SessionProvider } from "@/components/providers/SessionProvider"
import Link from "next/link"
import { signOut } from "@/lib/auth"

export default async function KundeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }
  
  // Nur Kunden dürfen auf /kunde/* zugreifen
  const userRole = (session.user as { role?: string }).role
  if (userRole !== "kunde") {
    redirect("/dashboard")
  }

  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile-freundlicher Header */}
        <header className="bg-[#2C3A1C] text-white sticky top-0 z-50">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌲</span>
              <span className="font-semibold text-sm">Koch Aufforstung</span>
            </div>
            <form action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}>
              <button 
                type="submit"
                className="text-sm text-white/80 hover:text-white transition-colors"
              >
                Abmelden
              </button>
            </form>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-lg mx-auto px-4 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t bg-white mt-auto">
          <div className="max-w-lg mx-auto px-4 py-4 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Koch Aufforstung GmbH</p>
            <p className="mt-1">
              <Link href="https://koch-aufforstung.de" className="text-[#2C3A1C] hover:underline">
                koch-aufforstung.de
              </Link>
            </p>
            <p className="mt-2 flex justify-center gap-3">
              <a 
                href="https://peru-otter-113714.hostingersite.com/datenschutz/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#2C3A1C] underline transition-colors"
              >
                Datenschutz
              </a>
              <a 
                href="https://peru-otter-113714.hostingersite.com/impressum/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#2C3A1C] underline transition-colors"
              >
                Impressum
              </a>
            </p>
          </div>
        </footer>
      </div>
    </SessionProvider>
  )
}
