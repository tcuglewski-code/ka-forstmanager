"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  Rocket,
  ClipboardList,
  Smartphone,
  Settings,
  Code2,
  HelpCircle,
  ChevronRight,
} from "lucide-react"

interface DocItem {
  href: string
  label: string
  icon: typeof BookOpen
}

interface DocGroup {
  title: string
  items: DocItem[]
}

const docGroups: DocGroup[] = [
  {
    title: "Einstieg",
    items: [
      { href: "/dokumentation", label: "Übersicht", icon: BookOpen },
      { href: "/dokumentation/erste-schritte", label: "Erste Schritte", icon: Rocket },
    ],
  },
  {
    title: "Funktionen",
    items: [
      { href: "/dokumentation/auftraege", label: "Auftragsmanagement", icon: ClipboardList },
      { href: "/dokumentation/app", label: "Mobile App", icon: Smartphone },
    ],
  },
  {
    title: "Administration",
    items: [
      { href: "/dokumentation/admin", label: "Administration", icon: Settings },
    ],
  },
  {
    title: "Entwickler",
    items: [
      { href: "/dokumentation/api", label: "API-Referenz", icon: Code2 },
    ],
  },
]

function breadcrumbFor(pathname: string): { label: string; href?: string }[] {
  const crumbs: { label: string; href?: string }[] = [
    { label: "Dokumentation", href: "/dokumentation" },
  ]
  const match = docGroups
    .flatMap((g) => g.items)
    .find((i) => i.href === pathname && i.href !== "/dokumentation")
  if (match) crumbs.push({ label: match.label })
  return crumbs
}

export default function DokumentationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const crumbs = breadcrumbFor(pathname)

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="lg:w-60 flex-shrink-0">
        <div className="lg:sticky lg:top-4 space-y-6">
          <div>
            <div className="flex items-center gap-2 px-3 mb-3">
              <BookOpen className="w-5 h-5" style={{ color: "#C5A55A" }} />
              <h2
                className="text-base font-bold"
                style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-display)" }}
              >
                Dokumentation
              </h2>
            </div>
            <nav className="space-y-4">
              {docGroups.map((group) => (
                <div key={group.title}>
                  <p
                    className="text-[11px] uppercase tracking-wider px-3 mb-1.5 font-semibold"
                    style={{ color: "var(--color-on-surface-variant)" }}
                  >
                    {group.title}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all"
                          style={{
                            backgroundColor: isActive ? "rgba(44,58,28,0.1)" : "transparent",
                            color: isActive ? "#2C3A1C" : "var(--color-on-surface)",
                            fontWeight: isActive ? 600 : 400,
                            borderLeft: isActive ? "3px solid #C5A55A" : "3px solid transparent",
                          }}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span style={{ fontFamily: "var(--font-body)" }}>{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div
              className="mt-6 mx-3 p-3 rounded-xl"
              style={{
                backgroundColor: "rgba(197,165,90,0.08)",
                border: "1px solid rgba(197,165,90,0.25)",
              }}
            >
              <div className="flex items-start gap-2">
                <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#C5A55A" }} />
                <div>
                  <p
                    className="text-xs font-semibold mb-1"
                    style={{ color: "var(--color-on-surface)" }}
                  >
                    Brauchen Sie Hilfe?
                  </p>
                  <p
                    className="text-[11px] leading-snug"
                    style={{ color: "var(--color-on-surface-variant)" }}
                  >
                    Schreiben Sie uns an{" "}
                    <a
                      href="mailto:support@koch-aufforstung.de"
                      className="underline"
                      style={{ color: "#2C3A1C" }}
                    >
                      support@koch-aufforstung.de
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-1.5 mb-6 text-sm"
          style={{ color: "var(--color-on-surface-variant)" }}
        >
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
              {c.href ? (
                <Link
                  href={c.href}
                  className="hover:underline"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  {c.label}
                </Link>
              ) : (
                <span style={{ color: "var(--color-on-surface)", fontWeight: 500 }}>{c.label}</span>
              )}
            </span>
          ))}
        </nav>

        <div className="max-w-4xl">{children}</div>
      </main>
    </div>
  )
}
