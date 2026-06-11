import { notFound } from "next/navigation"
import Link from "next/link"
import { VimeoEmbed } from "@/components/VimeoEmbed"

const DEMO_KEY = "KochPitch2026"

export const metadata = {
  title: "Feldhub Reforest — Exklusiver Pitch-Zugang",
  description: "Vertraulicher Konzeptentwurf für Koch Aufforstung GmbH",
  robots: { index: false, follow: false },
}

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

const faqs = [
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
]

const designSystemCss = `
@import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600;700&display=swap');

.fh-demo {
  --background: #F7F6F0;
  --surface: #EBEAE4;
  --surface-low: #F2F1EB;
  --on-surface: #1b1c19;
  --on-surface-variant: #434841;
  --primary: #1A2E1A;
  --primary-deep: #0d1a0d;
  --on-primary: #ffffff;
  --secondary: #C5A55A;
  --accent: #8CAA1F;
  --outline: #747871;
  --border: rgba(26, 46, 26, 0.08);
  --border-dark: rgba(247, 246, 240, 0.12);
  --shadow-card: 0 1px 2px rgba(26, 46, 26, 0.04), 0 4px 12px rgba(26, 46, 26, 0.05);
  --shadow-hover: 0 8px 24px rgba(26, 46, 26, 0.10);

  min-height: 100vh;
  background: var(--background);
  color: var(--on-surface);
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.fh-demo ::selection {
  background-color: rgba(197, 165, 90, 0.3);
}

.fh-container {
  max-width: 1080px;
  margin-inline: auto;
  padding: 0 20px;
}
@media (min-width: 1024px) {
  .fh-container { padding: 0 48px; }
}

.fh-grid-bg {
  background-image:
    linear-gradient(rgba(26, 46, 26, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(26, 46, 26, 0.035) 1px, transparent 1px);
  background-size: 32px 32px;
}

.fh-overline {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--secondary);
}

.fh-display-lg {
  font-family: 'Hanken Grotesk', system-ui, sans-serif;
  font-weight: 700;
  font-size: clamp(34px, 5.5vw, 58px);
  line-height: 1.04;
  letter-spacing: -0.03em;
  color: var(--on-surface);
  margin: 0;
}

.fh-display-md {
  font-family: 'Hanken Grotesk', system-ui, sans-serif;
  font-weight: 700;
  font-size: clamp(26px, 3.6vw, 38px);
  line-height: 1.08;
  letter-spacing: -0.02em;
  color: var(--on-surface);
  margin: 0;
}

.fh-display-sm {
  font-family: 'Hanken Grotesk', system-ui, sans-serif;
  font-weight: 600;
  font-size: clamp(17px, 2vw, 19px);
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: var(--on-surface);
  margin: 0;
}

.fh-lead {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: clamp(16px, 1.6vw, 19px);
  line-height: 1.65;
  color: var(--on-surface-variant);
}

.fh-bento {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  box-shadow: var(--shadow-card);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}
.fh-bento:hover {
  transform: translateY(-2px) scale(1.005);
  box-shadow: var(--shadow-hover);
  border-color: rgba(26, 46, 26, 0.16);
}

.fh-bento-dark {
  background: var(--primary);
  color: var(--background);
  border: 1px solid rgba(247, 246, 240, 0.08);
  border-radius: 20px;
}

.fh-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  border-radius: 8px;
  padding: 5px 10px;
}

.fh-badge-num {
  color: var(--primary);
  background: rgba(26, 46, 26, 0.06);
  border: 1px solid var(--border);
  min-width: 38px;
}

.fh-badge-duration {
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
  background: rgba(140, 170, 31, 0.12);
  border: 1px solid rgba(140, 170, 31, 0.25);
  border-radius: 6px;
  padding: 4px 8px;
  white-space: nowrap;
}

.fh-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--primary);
  color: #ffffff;
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 500;
  font-size: 15px;
  padding: 14px 28px;
  border-radius: 10px;
  text-decoration: none;
  transition: box-shadow 0.25s ease, transform 0.25s ease;
}
.fh-btn-primary:hover {
  box-shadow: 0 0 0 4px rgba(26, 46, 26, 0.15);
  transform: translateY(-1px);
}

.fh-btn-light {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--background);
  color: var(--primary);
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 600;
  font-size: 15px;
  padding: 14px 28px;
  border-radius: 10px;
  text-decoration: none;
  transition: box-shadow 0.25s ease, transform 0.25s ease;
}
.fh-btn-light:hover {
  box-shadow: 0 0 0 4px rgba(247, 246, 240, 0.18);
  transform: translateY(-1px);
}

.fh-btn-ghost-dark {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  color: rgba(247, 246, 240, 0.85);
  border: 1px solid rgba(247, 246, 240, 0.25);
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 500;
  font-size: 15px;
  padding: 13px 28px;
  border-radius: 10px;
  text-decoration: none;
  transition: border-color 0.25s ease, color 0.25s ease;
}
.fh-btn-ghost-dark:hover {
  border-color: rgba(247, 246, 240, 0.55);
  color: #ffffff;
}

.fh-mono {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}

@keyframes fh-moss-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.3); }
}
.fh-moss-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: var(--accent);
  animation: fh-moss-pulse 2.2s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .fh-moss-dot { animation: none; }
}

.fh-video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}
`

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
    <main className="fh-demo">
      <style dangerouslySetInnerHTML={{ __html: designSystemCss }} />

      {/* HERO */}
      <header
        className="fh-grid-bg"
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "72px 0 56px",
        }}
      >
        <div className="fh-container" style={{ textAlign: "center" }}>
          <div className="fh-overline" style={{ marginBottom: 18 }}>
            Feldhub Reforest · Vertraulich
          </div>
          <h1 className="fh-display-lg">
            Demo-Zugang: Koch Aufforstung
          </h1>
          <p
            className="fh-lead"
            style={{ marginTop: 18, maxWidth: 640, marginInline: "auto" }}
          >
            Exklusiver Einblick in Feldhub Reforest — das digitale
            Betriebssystem für Ihre Aufforstungsaktivitäten.
          </p>

          {/* DEMO-BANNER */}
          <div
            style={{
              marginTop: 36,
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 20px",
              background: "rgba(197, 165, 90, 0.12)",
              border: "1px solid rgba(197, 165, 90, 0.45)",
              borderRadius: 12,
              fontSize: 13,
              lineHeight: 1.5,
              color: "var(--on-surface)",
              textAlign: "left",
            }}
          >
            <span
              className="fh-mono"
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#8a6d2a",
                background: "rgba(197, 165, 90, 0.22)",
                border: "1px solid rgba(197, 165, 90, 0.5)",
                borderRadius: 6,
                padding: "4px 8px",
                whiteSpace: "nowrap",
              }}
            >
              Demo-Modus
            </span>
            <span>
              Alle gezeigten Daten sind <strong>Demonstrationsdaten</strong>.
              Vertraulich — nicht zur Weitergabe.
            </span>
          </div>
        </div>
      </header>

      <div className="fh-container" style={{ paddingBottom: 80 }}>
        {/* TIPP */}
        <div
          className="fh-bento"
          style={{
            marginTop: 32,
            padding: "18px 24px",
            fontSize: 14,
            lineHeight: 1.6,
            color: "var(--on-surface-variant)",
            display: "flex",
            gap: 12,
            alignItems: "baseline",
          }}
        >
          <span
            className="fh-mono"
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--secondary)",
              whiteSpace: "nowrap",
            }}
          >
            Tipp
          </span>
          <span>
            Starten Sie mit{" "}
            <strong style={{ color: "var(--on-surface)" }}>
              Video 0 + 1 + 6 + 7
            </strong>{" "}
            für einen 15-Minuten-Überblick. Die weiteren Videos zeigen jedes
            Modul im Detail.
          </span>
        </div>

        {/* VIDEO-SEKTION */}
        <section style={{ marginTop: 72 }}>
          <div className="fh-overline">Modul-Walkthrough</div>
          <h2 className="fh-display-md" style={{ marginTop: 10 }}>
            Video-Übersicht
          </h2>
          <p
            className="fh-lead"
            style={{ fontSize: 16, marginTop: 10, marginBottom: 32 }}
          >
            Neun kompakte Videos führen Sie durch Konzept, Funktionsumfang,
            Business Case und Angebot.
          </p>

          <div className="fh-video-grid">
            {videos.map((video) => (
              <article
                key={video.number}
                className="fh-bento"
                style={{
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      minWidth: 0,
                    }}
                  >
                    <span className="fh-badge fh-badge-num">
                      {video.number}
                    </span>
                    <h3 className="fh-display-sm">{video.title}</h3>
                  </div>
                  <span className="fh-badge fh-badge-duration">
                    {video.duration}
                  </span>
                </div>

                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "var(--on-surface-variant)",
                    margin: 0,
                    flexGrow: 1,
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

        {/* DATENSCHUTZ */}
        <div
          className="fh-bento"
          style={{
            marginTop: 56,
            padding: "18px 24px",
            fontSize: 14,
            lineHeight: 1.6,
            color: "var(--on-surface-variant)",
            display: "flex",
            gap: 12,
            alignItems: "baseline",
          }}
        >
          <span
            className="fh-mono"
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--accent)",
              whiteSpace: "nowrap",
            }}
          >
            DSGVO
          </span>
          <span>
            <strong style={{ color: "var(--on-surface)" }}>
              Datenschutz & Hosting:
            </strong>{" "}
            EU-Server (Vercel + Neon), DSGVO-konform, Ihre Daten gehören Ihnen
            — keine Weitergabe an Dritte.
          </span>
        </div>

        {/* DEMO-LOGIN (DARK POD) */}
        <section
          className="fh-bento-dark"
          style={{ marginTop: 24, padding: "clamp(28px, 5vw, 48px)" }}
        >
          <div
            className="fh-overline"
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <span className="fh-moss-dot" />
            Live-System
          </div>
          <h2
            className="fh-display-md"
            style={{ color: "#ffffff", marginTop: 12 }}
          >
            Live-Demo testen
          </h2>
          <p
            style={{
              marginTop: 10,
              fontSize: 16,
              lineHeight: 1.65,
              color: "rgba(247, 246, 240, 0.75)",
              maxWidth: 560,
            }}
          >
            Testen Sie das System selbst — mit echten Workflows und
            Demonstrationsdaten.
          </p>

          <div
            className="fh-mono"
            style={{
              marginTop: 28,
              padding: "18px 22px",
              background: "rgba(13, 26, 13, 0.6)",
              border: "1px solid rgba(247, 246, 240, 0.12)",
              borderRadius: 12,
              fontSize: 13,
              lineHeight: 2,
              color: "rgba(247, 246, 240, 0.6)",
              overflowX: "auto",
            }}
          >
            <div>
              <span style={{ color: "var(--secondary)" }}>URL</span>{" "}
              <span style={{ color: "#ffffff" }}>
                ka-forstmanager.vercel.app
              </span>
            </div>
            <div>
              <span style={{ color: "var(--secondary)" }}>Benutzer</span>{" "}
              <span style={{ color: "#ffffff" }}>
                supervisor@forstmanager.de
              </span>
            </div>
            <div>
              <span style={{ color: "var(--secondary)" }}>Passwort</span>{" "}
              <span style={{ color: "#ffffff" }}>Test1234!</span>
            </div>
          </div>

          <div
            style={{
              marginTop: 28,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <a
              href="https://ka-forstmanager.vercel.app/login?demo=true"
              target="_blank"
              rel="noopener noreferrer"
              className="fh-btn-light"
            >
              ForstManager öffnen <span aria-hidden="true">→</span>
            </a>
            <Link href="/?demo=true" className="fh-btn-ghost-dark">
              Startseite ansehen
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ marginTop: 72 }}>
          <div className="fh-overline">FAQ</div>
          <h2 className="fh-display-md" style={{ marginTop: 10 }}>
            Häufige Fragen
          </h2>

          <div
            style={{
              marginTop: 28,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {faqs.map((item) => (
              <div
                key={item.q}
                className="fh-bento"
                style={{ padding: "20px 24px" }}
              >
                <div className="fh-display-sm" style={{ marginBottom: 8 }}>
                  {item.q}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    lineHeight: 1.65,
                    color: "var(--on-surface-variant)",
                  }}
                >
                  {item.a}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* KONTAKT / CTA */}
        <section style={{ marginTop: 72, textAlign: "center" }}>
          <div className="fh-overline">Nächste Schritte</div>
          <h2 className="fh-display-md" style={{ marginTop: 10 }}>
            Interesse an einer Partnerschaft?
          </h2>
          <p
            className="fh-lead"
            style={{
              fontSize: 16,
              marginTop: 12,
              maxWidth: 520,
              marginInline: "auto",
            }}
          >
            Für Rückfragen oder um den Launchpartner-Pilot zu besprechen —
            direkt bei Tomasz Cuglewski melden.
          </p>
          <div
            style={{
              marginTop: 28,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <a href="mailto:tomek@feldhub.de" className="fh-btn-primary">
              tomek@feldhub.de <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>

        {/* FOOTER */}
        <footer
          style={{
            marginTop: 88,
            paddingTop: 28,
            borderTop: "1px solid var(--border)",
            textAlign: "center",
          }}
        >
          <div
            className="fh-mono"
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--outline)",
            }}
          >
            Feldhub Reforest · Vertraulich · Nur für interne Verwendung
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              lineHeight: 1.6,
              color: "var(--outline)",
            }}
          >
            Alle gezeigten Daten sind Demonstrationsdaten. Erstellt von Tomasz
            Cuglewski. Nicht zur Veröffentlichung bestimmt.
          </div>
        </footer>
      </div>
    </main>
  )
}
