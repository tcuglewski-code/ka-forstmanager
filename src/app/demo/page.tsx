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
      "Warum ich das entwickelt habe, rechtlicher Rahmen, Bitte um Genehmigung.",
    duration: "2–3 min",
    vimeoId: "PLACEHOLDER",
  },
  {
    number: "1",
    title: "Problem & Nutzen",
    description:
      "Papierchaos, WhatsApp, Excel — wie Feldhub das löst.",
    duration: "5–8 min",
    vimeoId: "PLACEHOLDER",
  },
  {
    number: "2",
    title: "Management-Dashboard",
    description:
      "Aufträge, Flächen, Gruppen, Material, Dokumente — alles in einem System.",
    duration: "8–12 min",
    vimeoId: "PLACEHOLDER",
  },
  {
    number: "3",
    title: "Mobile App / Offline First",
    description:
      "Die App für Außendienstmitarbeiter — Aufträge, Fotos, Stunden, offline verfügbar.",
    duration: "8–10 min",
    vimeoId: "PLACEHOLDER",
  },
  {
    number: "4",
    title: "Lager, Lieferscheine, Baumschulen",
    description:
      "Bestandsverwaltung, KI-Lieferscheinerkennung, Lieferantenportal.",
    duration: "8–10 min",
    vimeoId: "PLACEHOLDER",
  },
  {
    number: "5",
    title: "Analytics & KI",
    description:
      "Kennzahlen, Saisonauswertung, Förderberatung, SecondBrain.",
    duration: "8–12 min",
    vimeoId: "PLACEHOLDER",
  },
  {
    number: "6",
    title: "Das Angebot",
    description:
      "Launchpartner-Pilot — 6 Monate, 25.000 €, Koch als erster Praxispartner.",
    duration: "5 min",
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
            Sieben kompakte Videos führen Sie durch Konzept, Funktionsumfang und
            Angebot.
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

        {/* DEMO-ZUGANG */}
        <section
          style={{
            marginTop: 64,
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
