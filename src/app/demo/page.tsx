import { notFound } from "next/navigation"
import Link from "next/link"

const DEMO_KEY = "KochPitch2026"

export const metadata = {
  title: "Koch Aufforstung — Exklusiver Demo-Zugang",
  description: "Vertraulicher Konzeptentwurf für Koch Aufforstung GmbH",
  robots: { index: false, follow: false },
}

export default async function DemoAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>
}) {
  const params = await searchParams
  if (params.key !== DEMO_KEY) {
    notFound()
  }

  const WALDGRUEN = "#2C3A1C"
  const GOLD = "#C5A55A"

  return (
    <main
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${WALDGRUEN} 0%, #1a2410 100%)`,
        color: "#F4EFE6",
        fontFamily: "var(--font-body, system-ui, sans-serif)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 16px",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          width: "100%",
          backgroundColor: "rgba(255,255,255,0.04)",
          border: `1px solid ${GOLD}`,
          borderRadius: 12,
          padding: "48px 40px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: GOLD,
            marginBottom: 12,
          }}
        >
          Koch Aufforstung GmbH
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display, var(--font-manrope, serif))",
            fontSize: 36,
            fontWeight: 700,
            lineHeight: 1.15,
            margin: 0,
            color: "#FFFFFF",
          }}
        >
          Koch Aufforstung — Exklusiver Demo-Zugang
        </h1>
        <p
          style={{
            marginTop: 12,
            fontSize: 16,
            opacity: 0.85,
            fontStyle: "italic",
          }}
        >
          Vertraulicher Konzeptentwurf — nicht zur Weitergabe bestimmt
        </p>

        <div
          style={{
            marginTop: 32,
            padding: "16px 20px",
            backgroundColor: "rgba(245, 158, 11, 0.12)",
            border: "1px solid #F59E0B",
            borderRadius: 8,
            fontSize: 14,
            lineHeight: 1.55,
            color: "#FBD38D",
          }}
        >
          <strong style={{ color: "#FFFFFF" }}>⚠️ Disclaimer:</strong>{" "}
          Dies ist eine <strong>Demo-Umgebung</strong> mit ausschließlich fiktiven Daten.
          Alle Namen, Adressen, Lohnangaben und Aufträge sind frei erfunden. Das System
          ist <strong>nicht produktiv</strong> und dient ausschließlich der Präsentation
          des Funktionsumfangs für die Geschäftsführung der Koch Aufforstung GmbH.
        </div>

        <div style={{ marginTop: 32 }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: GOLD,
              marginBottom: 12,
            }}
          >
            Demo-Zugang
          </h2>
          <div
            style={{
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
              <strong style={{ color: "#FFFFFF" }}>supervisor@forstmanager.de</strong>
            </div>
            <div>
              <span style={{ opacity: 0.6 }}>Passwort:</span>{" "}
              <strong style={{ color: "#FFFFFF" }}>Test1234!</strong>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link
            href="/login?demo=true"
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
          </Link>
          <Link
            href="/?demo=true"
            style={{
              display: "inline-block",
              padding: "14px 28px",
              backgroundColor: "transparent",
              color: "#F4EFE6",
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

        <div
          style={{
            marginTop: 40,
            paddingTop: 24,
            borderTop: "1px solid rgba(197, 165, 90, 0.2)",
            fontSize: 12,
            opacity: 0.6,
            textAlign: "center",
          }}
        >
          © {new Date().getFullYear()} AppFabrik · Demo bereitgestellt für Koch Aufforstung GmbH
        </div>
      </div>
    </main>
  )
}
