import type { Metadata } from "next"
import "./globals.css"

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
    <html lang="de">
      <body className="bg-[#0f0f0f] text-white antialiased">{children}</body>
    </html>
  )
}
