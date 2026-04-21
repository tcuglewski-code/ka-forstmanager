"use client"

import Link from "next/link"
import { Users, Shield, BarChart3, Flag } from "lucide-react"
import { cn } from "@/lib/utils"

const adminSections = [
  {
    title: "Benutzerverwaltung",
    description: "Benutzer anlegen, bearbeiten und Rollen zuweisen",
    href: "/admin/benutzer",
    icon: Users,
  },
  {
    title: "Datenschutz",
    description: "DSGVO-Einstellungen und Datenschutz-Protokoll",
    href: "/admin/datenschutz",
    icon: Shield,
  },
  {
    title: "KPIs",
    description: "Kennzahlen und Betriebsstatistiken",
    href: "/admin/kpis",
    icon: BarChart3,
  },
  {
    title: "Feature Flags",
    description: "Features aktivieren und deaktivieren",
    href: "/admin/feature-flags",
    icon: Flag,
  },
]

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Administration</h1>
        <p className="text-muted-foreground mt-1">
          Systemverwaltung und Einstellungen
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {adminSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className={cn(
              "flex items-start gap-4 rounded-lg border p-5",
              "bg-card hover:bg-accent/50 transition-colors"
            )}
          >
            <div className="rounded-md bg-primary/10 p-2.5">
              <section.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{section.title}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {section.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
