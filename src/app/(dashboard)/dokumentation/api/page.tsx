import { Code2, Zap, ShieldCheck, Webhook } from "lucide-react"

type Method = "GET" | "POST" | "PATCH" | "DELETE"

const methodStyles: Record<Method, { bg: string; color: string }> = {
  GET: { bg: "#16a34a", color: "#ffffff" },
  POST: { bg: "#16a34a", color: "#ffffff" },
  PATCH: { bg: "#2563eb", color: "#ffffff" },
  DELETE: { bg: "#dc2626", color: "#ffffff" },
}

function MethodBadge({ method }: { method: Method }) {
  const style = methodStyles[method]
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-bold tracking-wide"
      style={{ backgroundColor: style.bg, color: style.color, minWidth: 56, justifyContent: "center" }}
    >
      {method}
    </span>
  )
}

function CodeBlock({ children, lang }: { children: string; lang?: string }) {
  return (
    <div className="my-4 rounded-lg overflow-hidden" style={{ border: "1px solid #2a2a2a" }}>
      {lang && (
        <div
          className="px-4 py-1.5 text-xs font-mono"
          style={{ backgroundColor: "#0f0f0f", color: "#9ca3af", borderBottom: "1px solid #2a2a2a" }}
        >
          {lang}
        </div>
      )}
      <pre
        className="px-4 py-3 overflow-x-auto text-xs leading-relaxed font-mono"
        style={{ backgroundColor: "#1a1a1a", color: "#e5e7eb" }}
      >
        <code>{children}</code>
      </pre>
    </div>
  )
}

interface Param {
  name: string
  type: string
  required: boolean
  description: string
}

function ParamTable({ params }: { params: Param[] }) {
  if (params.length === 0) return null
  return (
    <div className="my-4 rounded-lg overflow-hidden" style={{ border: "1px solid var(--color-outline-variant)" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: "var(--color-surface-container-low)" }}>
            <th className="text-left px-4 py-2 font-semibold" style={{ color: "var(--color-on-surface)" }}>Parameter</th>
            <th className="text-left px-4 py-2 font-semibold" style={{ color: "var(--color-on-surface)" }}>Typ</th>
            <th className="text-left px-4 py-2 font-semibold" style={{ color: "var(--color-on-surface)" }}>Beschreibung</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} style={{ borderTop: "1px solid var(--color-outline-variant)" }}>
              <td className="px-4 py-2.5 font-mono text-xs">
                <span style={{ color: "var(--color-on-surface)" }}>{p.name}</span>
                {p.required && <span className="ml-1.5 text-red-500 text-xs">*</span>}
              </td>
              <td className="px-4 py-2.5 font-mono text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
                {p.type}
              </td>
              <td className="px-4 py-2.5" style={{ color: "var(--color-on-surface-variant)" }}>
                {p.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface Endpoint {
  method: Method
  path: string
  title: string
  description: string
  params?: Param[]
  response: string
}

const endpoints: Endpoint[] = [
  {
    method: "GET",
    path: "/api/auftraege",
    title: "Aufträge auflisten",
    description: "Gibt eine paginierte Liste aller Aufträge zurück, gefiltert nach den Rechten des authentifizierten Benutzers.",
    params: [
      { name: "status", type: "string", required: false, description: "Filter: offen, aktiv, abgeschlossen" },
      { name: "limit", type: "number", required: false, description: "Anzahl pro Seite (Standard: 50, max. 200)" },
      { name: "page", type: "number", required: false, description: "Seitenzahl (beginnt bei 1)" },
    ],
    response: `{
  "data": [
    {
      "id": "auf_8h2k...",
      "nummer": "A-2026-0042",
      "status": "aktiv",
      "kunde": "Forstamt Hessen",
      "flaecheHa": 4.2,
      "gruppe": "Team Süd",
      "erstelltAm": "2026-05-14T08:11:22Z"
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 217 }
}`,
  },
  {
    method: "GET",
    path: "/api/auftraege/{id}",
    title: "Einzelnen Auftrag abrufen",
    description: "Liefert die vollständigen Details eines Auftrags inkl. Flächen, zugewiesener Gruppe und Material.",
    params: [
      { name: "id", type: "string", required: true, description: "Eindeutige Auftrags-ID" },
    ],
    response: `{
  "id": "auf_8h2k...",
  "nummer": "A-2026-0042",
  "status": "aktiv",
  "kunde": { "id": "kun_12", "name": "Forstamt Hessen" },
  "flaechen": [
    { "id": "fl_a", "plz": "34117", "groesseHa": 2.1 }
  ],
  "gruppe": { "id": "gr_77", "name": "Team Süd" },
  "erstelltAm": "2026-05-14T08:11:22Z"
}`,
  },
  {
    method: "POST",
    path: "/api/auftraege",
    title: "Auftrag erstellen",
    description: "Legt einen neuen Auftrag an. Die zurückgegebene ID kann sofort für nachgelagerte Operationen verwendet werden.",
    params: [
      { name: "kundeId", type: "string", required: true, description: "ID des Kunden" },
      { name: "flaechen", type: "array", required: true, description: "Liste der Flächen mit PLZ und Größe" },
      { name: "gruppeId", type: "string", required: false, description: "Optional: direkt eine Gruppe zuweisen" },
    ],
    response: `{
  "id": "auf_neu123",
  "nummer": "A-2026-0218",
  "status": "offen",
  "erstelltAm": "2026-06-10T09:14:01Z"
}`,
  },
  {
    method: "PATCH",
    path: "/api/auftraege/{id}",
    title: "Auftrag aktualisieren",
    description: "Aktualisiert einzelne Felder eines bestehenden Auftrags. Nur die gesendeten Felder werden überschrieben.",
    params: [
      { name: "id", type: "string", required: true, description: "Auftrags-ID" },
      { name: "status", type: "string", required: false, description: "Neuer Status" },
      { name: "gruppeId", type: "string", required: false, description: "Andere Gruppe zuweisen" },
    ],
    response: `{
  "id": "auf_8h2k...",
  "status": "abgeschlossen",
  "aktualisiertAm": "2026-06-10T09:18:44Z"
}`,
  },
  {
    method: "GET",
    path: "/api/mitarbeiter",
    title: "Mitarbeiterliste",
    description: "Gibt alle aktiven Mitarbeiter mit Stammdaten, Qualifikationen und aktueller Gruppenzugehörigkeit zurück.",
    params: [
      { name: "rolle", type: "string", required: false, description: "Filter nach Rolle (mitarbeiter, gruppenführer, admin)" },
    ],
    response: `{
  "data": [
    {
      "id": "mit_12",
      "name": "Maria Schmidt",
      "rolle": "gruppenführer",
      "qualifikationen": ["Motorsäge", "Erste Hilfe"],
      "gruppeId": "gr_77"
    }
  ]
}`,
  },
  {
    method: "GET",
    path: "/api/lager",
    title: "Lagerbestand",
    description: "Aktueller Bestand aller Artikel im Lager, optional gefiltert nach Kategorie oder Standort.",
    params: [
      { name: "kategorie", type: "string", required: false, description: "z. B. setzlinge, material, schutz" },
      { name: "standortId", type: "string", required: false, description: "Filter nach Lagerstandort" },
    ],
    response: `{
  "data": [
    {
      "artikelId": "art_eiche",
      "name": "Stieleiche, 2-jährig",
      "bestand": 1240,
      "einheit": "Stück",
      "standort": "Hauptlager"
    }
  ]
}`,
  },
  {
    method: "GET",
    path: "/api/saisons",
    title: "Saisons abrufen",
    description: "Liste aller angelegten Saisons mit Start-/Endzeitpunkt und Status (aktiv, abgeschlossen, geplant).",
    response: `{
  "data": [
    {
      "id": "sai_2026_fruehjahr",
      "name": "Frühjahr 2026",
      "von": "2026-03-01",
      "bis": "2026-05-31",
      "status": "aktiv"
    }
  ]
}`,
  },
]

export default function ApiReferencePage() {
  return (
    <article style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-body)" }}>
      <header className="mb-8">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3"
          style={{ backgroundColor: "rgba(44,58,28,0.1)", color: "#2C3A1C" }}
        >
          <Code2 className="w-3.5 h-3.5" />
          Entwickler
        </div>
        <h1
          className="text-3xl md:text-4xl font-bold mb-3"
          style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-display)" }}
        >
          API-Referenz
        </h1>
        <p className="text-base md:text-lg leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
          Die ForstManager REST API ermöglicht die Integration mit Drittsystemen, Auswertungs-Tools
          und individuellen Anwendungen.
        </p>
      </header>

      {/* Übersicht */}
      <section className="mb-10">
        <h2
          className="text-2xl font-bold mb-4 pb-2"
          style={{
            color: "var(--color-on-surface)",
            fontFamily: "var(--font-display)",
            borderBottom: "1px solid var(--color-outline-variant)",
          }}
        >
          Übersicht
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {[
            { label: "Base URL", value: "https://ka-forstmanager.vercel.app/api", mono: true },
            { label: "Authentifizierung", value: "Bearer Token im Header" },
            { label: "Rate Limiting", value: "100 Requests / Minute" },
            { label: "Format", value: "JSON (UTF-8)" },
          ].map((item) => (
            <div
              key={item.label}
              className="p-4 rounded-lg"
              style={{
                backgroundColor: "var(--color-surface-container)",
                border: "1px solid var(--color-outline-variant)",
              }}
            >
              <p
                className="text-[11px] uppercase tracking-wider mb-1 font-semibold"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                {item.label}
              </p>
              <p
                className={item.mono ? "font-mono text-sm" : "text-sm font-medium"}
                style={{ color: "var(--color-on-surface)" }}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Authentifizierung */}
      <section className="mb-10">
        <h2
          className="text-2xl font-bold mb-4 pb-2"
          style={{
            color: "var(--color-on-surface)",
            fontFamily: "var(--font-display)",
            borderBottom: "1px solid var(--color-outline-variant)",
          }}
        >
          Authentifizierung
        </h2>
        <p className="leading-relaxed mb-3">
          Alle API-Anfragen müssen über HTTPS erfolgen und ein gültiges Bearer-Token im{" "}
          <code
            className="px-1.5 py-0.5 rounded font-mono text-xs"
            style={{ backgroundColor: "var(--color-surface-container)" }}
          >
            Authorization
          </code>
          -Header mitführen. API-Tokens werden in den Einstellungen unter <strong>Integrationen → API-Tokens</strong>{" "}
          erzeugt.
        </p>

        <div
          className="my-4 p-4 rounded-xl flex items-start gap-3"
          style={{
            backgroundColor: "rgba(220,38,38,0.06)",
            border: "1px solid rgba(220,38,38,0.2)",
          }}
        >
          <ShieldCheck className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#dc2626" }} />
          <div>
            <p className="text-sm font-semibold mb-0.5">Token sicher behandeln</p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
              Bewahren Sie API-Tokens niemals im Frontend-Code oder in öffentlichen Repositories auf.
              Setzen Sie sie in serverseitigen Umgebungen als geschützte Umgebungsvariablen.
            </p>
          </div>
        </div>

        <CodeBlock lang="bash">{`curl -H "Authorization: Bearer YOUR_TOKEN" \\
  https://ka-forstmanager.vercel.app/api/auftraege`}</CodeBlock>
      </section>

      {/* Endpunkte */}
      <section className="mb-10">
        <h2
          className="text-2xl font-bold mb-4 pb-2"
          style={{
            color: "var(--color-on-surface)",
            fontFamily: "var(--font-display)",
            borderBottom: "1px solid var(--color-outline-variant)",
          }}
        >
          Endpunkte
        </h2>
        <div className="space-y-8">
          {endpoints.map((ep) => (
            <div
              key={`${ep.method}-${ep.path}`}
              className="rounded-xl overflow-hidden"
              style={{
                border: "1px solid var(--color-outline-variant)",
                backgroundColor: "var(--color-surface-container)",
              }}
            >
              <div
                className="px-5 py-3 flex items-center gap-3 flex-wrap"
                style={{
                  backgroundColor: "var(--color-surface-container-low)",
                  borderBottom: "1px solid var(--color-outline-variant)",
                }}
              >
                <MethodBadge method={ep.method} />
                <code
                  className="font-mono text-sm font-medium"
                  style={{ color: "var(--color-on-surface)" }}
                >
                  {ep.path}
                </code>
              </div>
              <div className="p-5">
                <h3
                  className="text-lg font-semibold mb-1.5"
                  style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-display)" }}
                >
                  {ep.title}
                </h3>
                <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--color-on-surface-variant)" }}>
                  {ep.description}
                </p>

                {ep.params && ep.params.length > 0 && (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wider mt-4 mb-1.5" style={{ color: "var(--color-on-surface-variant)" }}>
                      Parameter
                    </p>
                    <ParamTable params={ep.params} />
                  </>
                )}

                <p className="text-xs font-semibold uppercase tracking-wider mt-4 mb-1.5" style={{ color: "var(--color-on-surface-variant)" }}>
                  Beispiel-Response
                </p>
                <CodeBlock lang="json">{ep.response}</CodeBlock>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Rate Limits */}
      <section className="mb-10">
        <h2
          className="text-2xl font-bold mb-4 pb-2"
          style={{
            color: "var(--color-on-surface)",
            fontFamily: "var(--font-display)",
            borderBottom: "1px solid var(--color-outline-variant)",
          }}
        >
          Rate Limits & Fehlerbehandlung
        </h2>
        <p className="leading-relaxed mb-3">
          Jedes Token darf bis zu <strong>100 Requests pro Minute</strong> ausführen. Wird die
          Grenze überschritten, antwortet die API mit Status <code className="px-1.5 py-0.5 rounded font-mono text-xs" style={{ backgroundColor: "var(--color-surface-container)" }}>429 Too Many Requests</code>{" "}
          und einem <code className="px-1.5 py-0.5 rounded font-mono text-xs" style={{ backgroundColor: "var(--color-surface-container)" }}>Retry-After</code>-Header.
        </p>
        <p className="leading-relaxed mb-3">Standardisierte Fehler folgen diesem Schema:</p>
        <CodeBlock lang="json">{`{
  "error": {
    "code": "rate_limited",
    "message": "Zu viele Anfragen. Bitte später erneut versuchen.",
    "retryAfter": 42
  }
}`}</CodeBlock>
      </section>

      {/* Webhooks Stub */}
      <section className="mb-6">
        <h2
          className="text-2xl font-bold mb-4 pb-2"
          style={{
            color: "var(--color-on-surface)",
            fontFamily: "var(--font-display)",
            borderBottom: "1px solid var(--color-outline-variant)",
          }}
        >
          Webhooks
        </h2>
        <p className="leading-relaxed mb-4">
          Webhooks ermöglichen es Ihrer Anwendung, in Echtzeit auf Ereignisse in ForstManager
          zu reagieren — etwa wenn ein Auftrag abgeschlossen oder eine Abnahme erteilt wird. Statt
          die API periodisch abzufragen, sendet ForstManager einen HTTP-POST an Ihre konfigurierte
          URL.
        </p>
        <div
          className="my-4 p-5 rounded-xl flex items-start gap-3"
          style={{
            backgroundColor: "rgba(197,165,90,0.08)",
            border: "1px solid rgba(197,165,90,0.25)",
          }}
        >
          <Webhook className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#C5A55A" }} />
          <div>
            <p className="text-sm font-semibold mb-1">Webhook-Konfiguration: kommt in Version 2.0</p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
              Die Webhook-Verwaltung mit Signatur-Verifikation, Retry-Logik und Event-Filterung
              wird in einer kommenden Version verfügbar sein. Bei dringendem Bedarf kontaktieren
              Sie bitte den Support.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: "var(--color-surface-container)" }}>
          <Zap className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#C5A55A" }} />
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
            <strong style={{ color: "var(--color-on-surface)" }}>Vorgeplante Events:</strong>{" "}
            <code className="font-mono text-xs">auftrag.erstellt</code>,{" "}
            <code className="font-mono text-xs">auftrag.abgeschlossen</code>,{" "}
            <code className="font-mono text-xs">abnahme.erteilt</code>,{" "}
            <code className="font-mono text-xs">mitarbeiter.eingeladen</code>
          </p>
        </div>
      </section>
    </article>
  )
}
