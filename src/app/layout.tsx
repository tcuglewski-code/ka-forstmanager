import type { Metadata } from "next"
import { Manrope, Inter, Barlow_Condensed } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import PostHogProvider from "@/components/providers/PostHogProvider"

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
})

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-barlow",
  display: "swap",
})

export const metadata: Metadata = {
  title: "ForstManager — Koch Aufforstung GmbH",
  description: "Digitales Betriebssystem für Forstunternehmen",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className={`${manrope.variable} ${inter.variable} ${barlowCondensed.variable}`}>
      <body
        className="antialiased"
        style={{
          fontFamily: "var(--font-body)",
          backgroundColor: "var(--color-background)",
          color: "var(--color-on-surface)",
        }}
      >
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
