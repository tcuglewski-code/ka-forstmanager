"use client"

import Link from "next/link"
import {
  Rocket,
  ClipboardList,
  Smartphone,
  Settings,
  Code2,
  HelpCircle,
  ArrowRight,
  Search,
} from "lucide-react"

interface DocCard {
  href: string
  icon: typeof Rocket
  emoji: string
  title: string
  description: string
  accent: string
}

const cards: DocCard[] = [
  {
    href: "/dokumentation/erste-schritte",
    icon: Rocket,
    emoji: "🚀",
    title: "Erste Schritte",
    description: "Login, Dashboard-Übersicht und die erste Einrichtung Ihres Kontos.",
    accent: "#2C3A1C",
  },
  {
    href: "/dokumentation/auftraege",
    icon: ClipboardList,
    emoji: "📋",
    title: "Auftragsmanagement",
    description: "Aufträge anlegen, Flächen erfassen und Gruppen zuweisen.",
    accent: "#C5A55A",
  },
  {
    href: "/dokumentation/app",
    icon: Smartphone,
    emoji: "📱",
    title: "Mobile App",
    description: "App-Nutzung im Feld, Offline-Modus und Tagesprotokoll.",
    accent: "#2C3A1C",
  },
  {
    href: "/dokumentation/admin",
    icon: Settings,
    emoji: "⚙️",
    title: "Administration",
    description: "Mitarbeiter, Saisons, Lager und Systemeinstellungen verwalten.",
    accent: "#C5A55A",
  },
  {
    href: "/dokumentation/api",
    icon: Code2,
    emoji: "🔌",
    title: "API-Referenz",
    description: "REST API für Entwickler und Integrationen mit Drittsystemen.",
    accent: "#2C3A1C",
  },
  {
    href: "/dokumentation/erste-schritte#faq",
    icon: HelpCircle,
    emoji: "❓",
    title: "FAQ",
    description: "Häufige Fragen und schnelle Problemlösungen für den Alltag.",
    accent: "#C5A55A",
  },
]

export default function DokumentationHubPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl md:text-4xl font-bold mb-3"
          style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-display)" }}
        >
          ForstManager Dokumentation
        </h1>
        <p
          className="text-base md:text-lg leading-relaxed"
          style={{ color: "var(--color-on-surface-variant)", fontFamily: "var(--font-body)" }}
        >
          Alles, was Sie zur Nutzung von ForstManager wissen müssen — von ersten Schritten
          bis zur API-Integration.
        </p>
      </div>

      {/* Search (visual only) */}
      <div className="mb-8">
        <div
          className="relative rounded-xl"
          style={{
            backgroundColor: "var(--color-surface-container)",
            border: "1px solid var(--color-outline-variant)",
          }}
        >
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: "var(--color-on-surface-variant)" }}
          />
          <input
            type="text"
            placeholder="Suchen in der Dokumentation… (bald verfügbar)"
            disabled
            className="w-full pl-12 pr-4 py-3.5 bg-transparent rounded-xl text-sm outline-none cursor-not-allowed"
            style={{
              color: "var(--color-on-surface)",
              fontFamily: "var(--font-body)",
            }}
          />
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group block p-6 rounded-2xl transition-all hover:shadow-lg"
              style={{
                backgroundColor: "var(--color-surface-container)",
                border: "1px solid var(--color-outline-variant)",
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
                  style={{
                    backgroundColor: `${card.accent}15`,
                  }}
                >
                  <span aria-hidden="true">{card.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className="w-4 h-4" style={{ color: card.accent }} />
                    <h3
                      className="text-lg font-semibold"
                      style={{
                        color: "var(--color-on-surface)",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      {card.title}
                    </h3>
                  </div>
                  <p
                    className="text-sm leading-relaxed mb-3"
                    style={{
                      color: "var(--color-on-surface-variant)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {card.description}
                  </p>
                  <div
                    className="inline-flex items-center gap-1.5 text-sm font-medium group-hover:gap-2.5 transition-all"
                    style={{ color: card.accent }}
                  >
                    Mehr erfahren
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Footer note */}
      <div
        className="mt-10 p-5 rounded-2xl"
        style={{
          backgroundColor: "rgba(44,58,28,0.05)",
          border: "1px solid rgba(44,58,28,0.15)",
        }}
      >
        <p
          className="text-sm"
          style={{
            color: "var(--color-on-surface-variant)",
            fontFamily: "var(--font-body)",
          }}
        >
          <strong style={{ color: "var(--color-on-surface)" }}>Tipp:</strong> Die Dokumentation
          wird laufend erweitert. Wenn Sie ein Thema vermissen, schreiben Sie uns an{" "}
          <a
            href="mailto:support@koch-aufforstung.de"
            className="underline"
            style={{ color: "#2C3A1C" }}
          >
            support@koch-aufforstung.de
          </a>
          .
        </p>
      </div>
    </div>
  )
}
