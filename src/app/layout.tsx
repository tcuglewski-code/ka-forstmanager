import type { Metadata } from "next"
import { Hanken_Grotesk, Inter, JetBrains_Mono } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"
import { Toaster } from "sonner"
import PostHogProvider from "@/components/providers/PostHogProvider"
import DemoBanner from "@/components/DemoBanner"
import { auth } from "@/lib/auth"

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-hanken",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains",
  display: "swap",
})

export const metadata: Metadata = {
  title: "ForstManager — Koch Aufforstung GmbH",
  description: "Digitales Betriebssystem für Forstunternehmen",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth().catch(() => null)
  return (
    <html lang="de" className={`${hankenGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body
        className="antialiased"
        style={{
          fontFamily: "var(--font-body)",
          backgroundColor: "var(--color-background)",
          color: "var(--color-on-surface)",
        }}
      >
        <Suspense fallback={null}>
          <DemoBanner userEmail={session?.user?.email ?? null} />
        </Suspense>
        <PostHogProvider>
          {children}
        </PostHogProvider>
        <Toaster
          position="top-right"
          theme="light"
          richColors
          toastOptions={{
            style: {
              background: "var(--color-surface-container-low)",
              border: "1px solid var(--color-outline-variant)",
              color: "var(--color-on-surface)",
              fontFamily: "var(--font-body)",
            },
          }}
        />
      </body>
    </html>
  )
}
