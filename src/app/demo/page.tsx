import { notFound } from "next/navigation"
import Link from "next/link"
import { VimeoEmbed } from "@/components/VimeoEmbed"

const DEMO_KEY = "KochPitch2026"

export const metadata = {
  title: "Feldhub Reforest — Exklusiver Pitch-Zugang",
  description: "Vertraulicher Konzeptentwurf für Koch Aufforstung GmbH",
  robots: { index: false, follow: false },
}

const WALDGRUEN = "#2C3A1C"
const GOLD = "#C5A55A"
const CREAM = "#F4EFE6"

type Video = {
  number: string
  title: string
  description: string
  duration: string
  vimeoId: string
}

const videos: Video[] = [
  {
    number: "0",
    title: "Persönlicher Einstieg",
    description:
      "Privat entwickelt, außerhalb der Arbeitszeit, keine Koch-Daten. Bitte um schriftliche Einwilligung — und eine mögliche Partnerschaft.",
    duration: "~90 Sek",
    vimeoId: "PLACEHOLDER",
  },
  {
    number: "1",
    title: "Das Problem — Papierchaos & verlorene Stunden",
    description:
      "WhatsApp-Chaos, Excel-Tabellen, Aufträge die niemand im Überblick hat. Wie viel Zeit und Geld das kostet — und wie Feldhub das löst.",
    duration: "~4 min",
    vimeoId: "PLACEHOLDER",
  },
  {
    number: "1.5",
    title: "Eure Website — Von 0 auf digitale Akquise",
    description:
      "Koch Aufforstung hat heute keine Website. Waldbesitzer googeln täglich nach Aufforstung und Förderberatung. So sieht der Akquise-Kanal aus: Wizard → Lead → direkt im Dashboard.",
    duration: "~4 min",
    vimeoId: "PLACEHOLDER",
  },
  {
    number: "2",
    title: "Management-Dashboard — Eine Geschichte, End-to-End",
    description:
      "Anfrage kommt rein. Auftrag wird angelegt. Gruppe zugewiesen. Material gewählt. Rechnung erstellt. Alles in einem System — keine E-Mail, kein Zettel.",
    duration: "~8 min",
    vimeoId: "PLACEHOLDER",
  },
  {
    number: "3",
    title: "Die App — Offline im Wald, Sync wenn Netz da ist",
    description:
      "Flugmodus an: App läuft weiter. Tagesprotokoll, GPS, Fotos, Stunden — alles offline. Netz wieder da: Sync in Sekunden. 3 Buttons, mehr braucht ein Außendienstler nicht.",
    duration: "~8 min",
    vimeoId: "PLACEHOLDER",
  },
  {
    number: "4",
    title: "Lager, Lieferscheine, Baumschulen",
    description:
      "KI liest Lieferscheine automatisch ein. Lagerbestand immer aktuell. Baumschulen laden Angebote direkt hoch — keine Telefonate, kein Tippfehler.",
    duration: "~6 min",
    vimeoId: "PLACEHOLDER",
  },
  {
    number: "5",
    title: "Analytics & Förderberatung",
    description:
      "Was hat Saison 2025 wirklich gekostet? Welche Förderung passt zu dieser Fläche? Antwort in 2 Sekunden — kein Rechercheaufwand mehr.",
    duration: "~6 min",
    vimeoId: "PLACEHOLDER",
  },
  {
    number: "6",
    title: "Business Case — Was spart euch das konkret?",
    description:
      "Verwaltungszeit × Stundensatz × 35 Mitarbeiter. Verlorene Förderquoten. Papieraufwand. Konkrete Rechnung: Was kostet das System — und was bringt es.",
    duration: "~5 min",
    vimeoId: "PLACEHOLDER",
  },
  {
    number: "7",
    title: "Das Angebot — 25.000 € Launchpartner-Pilot",
    description:
      "6 Monate, 35 Mitarbeiter, euer eigener Tenant. Keine IP-Übertragung, keine Marketplace-Gebühren im Pilot. Ihr seid Co-Designer — keine Lösung von der Stange.",
    duration: "~5 min",
    vimeoId: "PLACEHOLDER",
  },
]

export default async function DemoAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>
}) {
  const params = await searchParams
  if (params.key !== DEMO_KEY) {
    notFound()
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${WALDGRUEN} 0%, #1a2410 100%)`,
        color: CREAM,
        fontFamily: "var(--font-body, system-ui, sans-serif)",
        padding: "48px 16px 80px",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        {/* HEADER */}
        <header
          style={{
            textAlign: "center",
            paddingBottom: 32,
            borderBottom: `1px solid rgba(197, 165, 90, 0.25)`,
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: GOLD,
              marginBottom: 16,
            }}
          >
            Koch Aufforstung GmbH
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display, var(--font-manrope, serif))",
              fontSize: "clamp(28px, 5vw, 44px)",
              fontWeight: 700,
              lineHeight: 1.15,
              margin: 0,
              color: "#FFFFFF",
            }}
          >
            Feldhub Reforest — Exklusiver Pitch-Zugang
          </h1>
          <p
            style={{
              marginTop: 14,
              fontSize: 16,
              opacity: 0.85,
              fontStyle: "italic",
            }}
          >
            Vertraulicher Konzeptentwurf | Nur für autorisierte Personen
          </p>
        </header>

        {/* DISCLAIMER */}
        <div
          style={{
            marginTop: 32,
            padding: "18px 22px",
            backgroundColor: "rgba(245, 158, 11, 0.12)",
            border: "1px solid #F59E0B",
            borderRadius: 10,
            fontSize: 14,
            lineHeight: 1.6,
            color: "#FBD38D",
          }}
        >
          <strong style={{ color: "#FFFFFF" }}>⚠️ Vertraulich:</strong>{" "}
          Alle gezeigten Daten sind <strong>Demonstrationsdaten</strong>. Dieses
          Dokument ist <strong>vertraulich</strong> und ausschließlich zur
          internen Prüfung bestimmt. <strong>Nicht zur Weitergabe.</strong>
        </div>

        {/* 2-TRACK-HINWEIS */}
        <div
          style={{
            marginTop: 16,
            padding: "16px 22px",
            backgroundColor: "rgba(44, 58, 28, 0.55)",
            border: "1px solid rgba(197, 165, 90, 0.4)",
            borderRadius: 10,
            fontSize: 14,
            lineHeight: 1.6,
            color: CREAM,
          }}
        >
          <strong style={{ color: GOLD }}>💡 Tipp:</strong> Starte mit{" "}
          <strong style={{ color: "#FFFFFF" }}>Video 0 + 1 + 6 + 7</strong> für
          einen 15-Minuten-Überblick. Die weiteren Videos zeigen jedes Modul im
          Detail.
        </div>

        {/* VIDEO-SEKTION */}
        <section style={{ marginTop: 56 }}>
          <h2
            style={{
              fontFamily: "var(--font-display, var(--font-manrope, serif))",
              fontSize: 26,
              fontWeight: 700,
              color: "#FFFFFF",
              margin: 0,
            }}
          >
            Video-Übersicht
          </h2>
          <p
            style={{
              fontSize: 14,
              opacity: 0.7,
              marginTop: 6,
              marginBottom: 28,
            }}
          >
            Neun kompakte Videos führen Sie durch Konzept, Funktionsumfang,
            Business Case und Angebot.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 24,
            }}
          >
            {videos.map((video) => (
              <article
                key={video.number}
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(197, 165, 90, 0.25)",
                  borderRadius: 12,
                  padding: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 10,
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontFamily:
                          "var(--font-display, var(--font-manrope, serif))",
                        fontSize: 28,
                        fontWeight: 700,
                        color: GOLD,
                        lineHeight: 1,
                      }}
                    >
                      {video.number}
                    </span>
                    <h3
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        color: "#FFFFFF",
                        margin: 0,
                        lineHeight: 1.25,
                      }}
                    >
                      {video.title}
                    </h3>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: GOLD,
                      whiteSpace: "nowrap",
                      opacity: 0.85,
                    }}
                  >
                    {video.duration}
                  </span>
                </div>

                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.55,
                    opacity: 0.85,
                    margin: 0,
                  }}
                >
                  {video.description}
                </p>

                <VimeoEmbed
                  videoId={video.vimeoId}
                  title={`Video ${video.number}: ${video.title}`}
                />
              </article>
            ))}
          </div>
        </section>

        {/* DATENSCHUTZ-FACT-BOX */}
        <div
          style={{
            marginTop: 56,
            padding: "16px 22px",
            backgroundColor: "rgba(44, 58, 28, 0.45)",
            border: "1px solid rgba(197, 165, 90, 0.3)",
            borderRadius: 10,
            fontSize: 14,
            lineHeight: 1.6,
            color: CREAM,
          }}
        >
          <strong style={{ color: GOLD }}>🔒 Datenschutz & Hosting:</strong>{" "}
          EU-Server (Vercel + Neon), DSGVO-konform, Ihre Daten gehören Ihnen —
          keine Weitergabe an Dritte.
        </div>

        {/* DEMO-ZUGANG */}
        <section
          style={{
            marginTop: 24,
            padding: "32px 32px",
            backgroundColor: "rgba(255,255,255,0.04)",
            border: `1px solid ${GOLD}`,
            borderRadius: 12,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display, var(--font-manrope, serif))",
              fontSize: 24,
              fontWeight: 700,
              color: "#FFFFFF",
              margin: 0,
            }}
          >
            System live ausprobieren
          </h2>
          <p style={{ marginTop: 8, fontSize: 15, opacity: 0.85 }}>
            Testen Sie das System selbst mit Demo-Zugangsdaten.
          </p>

          <div
            style={{
              marginTop: 20,
              padding: "16px 20px",
              backgroundColor: "rgba(0,0,0,0.25)",
              border: "1px solid rgba(197, 165, 90, 0.35)",
              borderRadius: 8,
              fontSize: 14,
              lineHeight: 1.8,
              fontFamily: "var(--font-mono, ui-monospace, monospace)",
            }}
          >
            <div>
              <span style={{ opacity: 0.6 }}>Benutzer:</span>{" "}
              <strong style={{ color: "#FFFFFF" }}>
                supervisor@forstmanager.de
              </strong>
            </div>
            <div>
              <span style={{ opacity: 0.6 }}>Passwort:</span>{" "}
              <strong style={{ color: "#FFFFFF" }}>Test1234!</strong>
            </div>
          </div>

          <div
            style={{
              marginTop: 24,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <a
              href="https://ka-forstmanager.vercel.app/login?demo=true"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "14px 28px",
                backgroundColor: GOLD,
                color: WALDGRUEN,
                fontWeight: 700,
                borderRadius: 8,
                textDecoration: "none",
                fontSize: 15,
                letterSpacing: "0.02em",
              }}
            >
              ForstManager öffnen →
            </a>
            <Link
              href="/?demo=true"
              style={{
                display: "inline-block",
                padding: "14px 28px",
                backgroundColor: "transparent",
                color: CREAM,
                fontWeight: 600,
                borderRadius: 8,
                textDecoration: "none",
                fontSize: 15,
                border: "1px solid rgba(244, 239, 230, 0.4)",
              }}
            >
              Startseite ansehen
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ marginTop: 56 }}>
          <h2
            style={{
              fontFamily: "var(--font-display, var(--font-manrope, serif))",
              fontSize: 24,
              fontWeight: 700,
              color: "#FFFFFF",
              margin: 0,
            }}
          >
            Häufige Fragen
          </h2>

          <div
            style={{
              marginTop: 20,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {[
              {
                q: "Warum kein fertiges Produkt kaufen?",
                a: "Kein Standardsystem deckt Aufforstung + Offline-App + Förderberatung ab. Feldhub wurde aus der Praxis heraus gebaut.",
              },
              {
                q: "Was passiert mit unseren Daten?",
                a: "Ihre Daten liegen auf EU-Servern, sind verschlüsselt und gehören Ihnen. Export jederzeit möglich.",
              },
              {
                q: "Wie lange bis zur Nutzung?",
                a: "Onboarding in der ersten Woche. App für Außendienstler erklärt sich in 3 Minuten.",
              },
            ].map((item) => (
              <div
                key={item.q}
                style={{
                  padding: "16px 20px",
                  backgroundColor: "rgba(0,0,0,0.2)",
                  border: "1px solid rgba(197, 165, 90, 0.2)",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: GOLD,
                    marginBottom: 6,
                  }}
                >
                  {item.q}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    lineHeight: 1.6,
                    opacity: 0.85,
                  }}
                >
                  {item.a}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* KONTAKT */}
        <section style={{ marginTop: 56 }}>
          <h2
            style={{
              fontFamily: "var(--font-display, var(--font-manrope, serif))",
              fontSize: 24,
              fontWeight: 700,
              color: "#FFFFFF",
              margin: 0,
            }}
          >
            Nächste Schritte
          </h2>
          <p style={{ marginTop: 8, fontSize: 15, opacity: 0.85 }}>
            Für Rückfragen oder um den Pilot zu besprechen:
          </p>

          <div
            style={{
              marginTop: 20,
              padding: "20px 24px",
              backgroundColor: "rgba(0,0,0,0.2)",
              border: "1px solid rgba(197, 165, 90, 0.25)",
              borderRadius: 10,
              fontSize: 15,
              lineHeight: 1.9,
            }}
          >
            <div>
              <span style={{ color: GOLD, fontWeight: 600 }}>Name:</span>{" "}
              <span style={{ opacity: 0.7 }}>Tomasz Cuglewski</span>
            </div>
            <div>
              <span style={{ color: GOLD, fontWeight: 600 }}>Telefon:</span>{" "}
              <span style={{ opacity: 0.7 }}>—</span>
            </div>
            <div>
              <span style={{ color: GOLD, fontWeight: 600 }}>E-Mail:</span>{" "}
              <span style={{ opacity: 0.7 }}>—</span>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer
          style={{
            marginTop: 64,
            paddingTop: 24,
            borderTop: "1px solid rgba(197, 165, 90, 0.2)",
            fontSize: 12,
            opacity: 0.6,
            textAlign: "center",
            letterSpacing: "0.04em",
          }}
        >
          Vertraulich | Erstellt von Tomasz Cuglewski | Nicht zur Veröffentlichung
        </footer>
      </div>
    </main>
  )
}
