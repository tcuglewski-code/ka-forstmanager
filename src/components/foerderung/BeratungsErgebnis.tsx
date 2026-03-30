"use client"

import { useState } from "react"
import {
  Download,
  ExternalLink,
  CheckCircle,
  Lightbulb,
  TreePine,
  Sparkles,
  FileText,
  Loader2,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import { pdf, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

// ─────────────── Types ───────────────

interface Programm {
  id: number
  name: string
  bundesland: string
  foerdersatz: string
  antragsfrist: string
  url: string
  traeger?: string
  foerdergegenstand?: string
}

interface Kombination {
  prog_a_name: string
  prog_b_name: string
  bedingung: string
}

interface BeratungsErgebnisData {
  synthese: string
  programme: Programm[]
  kombinationen: Kombination[]
  ki_synthese: boolean
}

interface BeratungsErgebnisProps {
  ergebnis: BeratungsErgebnisData
  frage: string
  bundesland?: string
  flaeche?: string
  kalamitaet?: boolean
}

// ─────────────── PDF Styles ───────────────

const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: "#228B22",
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#228B22",
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  contextBox: {
    backgroundColor: "#f8f8f8",
    padding: 12,
    marginBottom: 15,
    borderRadius: 4,
  },
  contextLabel: {
    fontSize: 9,
    color: "#666",
    marginBottom: 2,
  },
  contextValue: {
    fontSize: 11,
    color: "#333",
  },
  syntheseText: {
    fontSize: 11,
    color: "#333",
    lineHeight: 1.6,
    textAlign: "justify",
  },
  programmCard: {
    backgroundColor: "#fafafa",
    padding: 12,
    marginBottom: 10,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#228B22",
  },
  programmName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  programmDetail: {
    fontSize: 10,
    color: "#666",
    marginBottom: 2,
  },
  programmFoerdersatz: {
    fontSize: 10,
    color: "#228B22",
    fontFamily: "Helvetica-Bold",
  },
  kombinationBox: {
    backgroundColor: "#fffbeb",
    padding: 10,
    marginBottom: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  kombinationText: {
    fontSize: 10,
    color: "#92400e",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#999",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
})

// ─────────────── PDF Document ───────────────

function BeratungsPDF({ ergebnis, frage, bundesland, flaeche, kalamitaet }: BeratungsErgebnisProps) {
  const datum = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.title}>KI-Förderberatung</Text>
          <Text style={pdfStyles.subtitle}>Erstellt am {datum} · ForstManager by Koch Aufforstung</Text>
        </View>

        {/* Anfrage-Kontext */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Ihre Anfrage</Text>
          <View style={pdfStyles.contextBox}>
            <Text style={pdfStyles.contextLabel}>Fragestellung:</Text>
            <Text style={pdfStyles.contextValue}>{frage}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 20 }}>
            {bundesland && (
              <View style={{ flex: 1 }}>
                <Text style={pdfStyles.contextLabel}>Bundesland:</Text>
                <Text style={pdfStyles.contextValue}>{bundesland}</Text>
              </View>
            )}
            {flaeche && (
              <View style={{ flex: 1 }}>
                <Text style={pdfStyles.contextLabel}>Fläche:</Text>
                <Text style={pdfStyles.contextValue}>{flaeche} ha</Text>
              </View>
            )}
            {kalamitaet && (
              <View style={{ flex: 1 }}>
                <Text style={pdfStyles.contextLabel}>Kalamität:</Text>
                <Text style={pdfStyles.contextValue}>Ja</Text>
              </View>
            )}
          </View>
        </View>

        {/* KI-Analyse */}
        {ergebnis.synthese && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>
              {ergebnis.ki_synthese ? "KI-Analyse (Claude)" : "Automatische Analyse"}
            </Text>
            <Text style={pdfStyles.syntheseText}>{ergebnis.synthese}</Text>
          </View>
        )}

        {/* Empfohlene Programme */}
        {ergebnis.programme && ergebnis.programme.length > 0 && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>
              Empfohlene Förderprogramme ({ergebnis.programme.length})
            </Text>
            {ergebnis.programme.slice(0, 8).map((p, i) => (
              <View key={i} style={pdfStyles.programmCard}>
                <Text style={pdfStyles.programmName}>{p.name}</Text>
                <Text style={pdfStyles.programmDetail}>
                  {p.bundesland || "Bundesweit"} · {p.traeger || "–"}
                </Text>
                {p.foerdersatz && (
                  <Text style={pdfStyles.programmFoerdersatz}>Fördersatz: {p.foerdersatz}</Text>
                )}
                {p.antragsfrist && (
                  <Text style={pdfStyles.programmDetail}>Antragsfrist: {p.antragsfrist}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Kombinationsmöglichkeiten */}
        {ergebnis.kombinationen && ergebnis.kombinationen.length > 0 && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Kombinationsmöglichkeiten</Text>
            {ergebnis.kombinationen.map((k, i) => (
              <View key={i} style={pdfStyles.kombinationBox}>
                <Text style={pdfStyles.kombinationText}>
                  {k.prog_a_name} + {k.prog_b_name}
                  {k.bedingung ? ` — ${k.bedingung}` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <Text style={pdfStyles.footer}>
          Diese Beratung ersetzt keine rechtliche oder fachliche Beratung. Angaben ohne Gewähr.
          {"\n"}ForstManager · Koch Aufforstung GmbH
        </Text>
      </Page>
    </Document>
  )
}

// ─────────────── Main Component ───────────────

export function BeratungsErgebnis({
  ergebnis,
  frage,
  bundesland,
  flaeche,
  kalamitaet,
}: BeratungsErgebnisProps) {
  const [pdfLoading, setPdfLoading] = useState(false)

  async function handlePDFExport() {
    setPdfLoading(true)
    try {
      const blob = await pdf(
        <BeratungsPDF
          ergebnis={ergebnis}
          frage={frage}
          bundesland={bundesland}
          flaeche={flaeche}
          kalamitaet={kalamitaet}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `Foerderberatung_${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("PDF Export Fehler:", err)
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="mt-5 space-y-5 border-t border-emerald-900/30 pt-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header mit PDF-Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Beratungsergebnis</h3>
            <p className="text-xs text-zinc-500">
              {ergebnis.ki_synthese ? "KI-gestützte Analyse" : "Automatische Analyse"} ·{" "}
              {ergebnis.programme?.length || 0} Programme gefunden
            </p>
          </div>
        </div>
        <button
          onClick={handlePDFExport}
          disabled={pdfLoading}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/40 text-emerald-400 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
        >
          {pdfLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Erstelle PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Als PDF speichern</span>
            </>
          )}
        </button>
      </div>

      {/* KI-Synthese mit Markdown */}
      {ergebnis.synthese && (
        <div className="bg-gradient-to-br from-[#0f1a0a] to-[#0f0f0f] rounded-xl p-5 border border-emerald-900/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
              {ergebnis.ki_synthese ? (
                <>
                  <Sparkles className="w-3 h-3" /> KI-Analyse (Claude)
                </>
              ) : (
                <>
                  <FileText className="w-3 h-3" /> Automatische Analyse
                </>
              )}
            </span>
          </div>
          <div className="prose prose-sm prose-invert prose-emerald max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-lg font-bold text-white mt-4 mb-2 first:mt-0">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base font-semibold text-emerald-200 mt-4 mb-2">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-semibold text-emerald-300 mt-3 mb-1.5">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="text-sm text-zinc-200 leading-relaxed mb-3 last:mb-0">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-1.5 mb-3 text-sm text-zinc-200">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-1.5 mb-3 text-sm text-zinc-200">{children}</ol>
                ),
                li: ({ children }) => <li className="text-zinc-200">{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-semibold text-emerald-200">{children}</strong>
                ),
                em: ({ children }) => <em className="text-zinc-300 italic">{children}</em>,
                code: ({ children }) => (
                  <code className="px-1.5 py-0.5 bg-emerald-900/30 text-emerald-300 rounded text-xs font-mono">
                    {children}
                  </code>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-emerald-600 pl-3 my-3 text-zinc-300 italic">
                    {children}
                  </blockquote>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {ergebnis.synthese}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Top Programme */}
      {Array.isArray(ergebnis.programme) && ergebnis.programme.length > 0 && (
        <div className="bg-[#0f0f0f] rounded-xl border border-[#1e1e1e] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1e1e1e] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TreePine className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-white">Empfohlene Förderprogramme</span>
            </div>
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
              {ergebnis.programme.length} Programme
            </span>
          </div>
          <div className="divide-y divide-[#1e1e1e]">
            {ergebnis.programme.slice(0, 6).map((p, idx) => (
              <div
                key={p.id || idx}
                className="px-4 py-3 hover:bg-[#161616] transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        #{idx + 1}
                      </span>
                      <h4 className="text-sm font-medium text-white truncate group-hover:text-emerald-100 transition-colors">
                        {p.name || "Unbekanntes Programm"}
                      </h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                      <span>{p.bundesland || "Bundesweit"}</span>
                      {p.foerdersatz && (
                        <span className="text-emerald-400 font-medium">{p.foerdersatz}</span>
                      )}
                      {p.antragsfrist && <span>Frist: {p.antragsfrist}</span>}
                    </div>
                  </div>
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-zinc-600 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all flex-shrink-0"
                      title="Zur offiziellen Seite"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
          {ergebnis.programme.length > 6 && (
            <div className="px-4 py-2 bg-[#0a0a0a] text-center">
              <span className="text-xs text-zinc-500">
                + {ergebnis.programme.length - 6} weitere Programme
              </span>
            </div>
          )}
        </div>
      )}

      {/* Kombinationsmöglichkeiten */}
      {Array.isArray(ergebnis.kombinationen) && ergebnis.kombinationen.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-400">Kombinationsmöglichkeiten</span>
          </div>
          <div className="space-y-2">
            {ergebnis.kombinationen.map((k, i) => (
              <div
                key={i}
                className="flex items-start gap-2 bg-amber-500/5 rounded-lg p-2.5 border border-amber-500/10"
              >
                <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="text-amber-200 font-medium">
                    {k.prog_a_name} + {k.prog_b_name}
                  </span>
                  {k.bedingung && (
                    <p className="text-xs text-amber-400/70 mt-0.5">{k.bedingung}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hinweis */}
      <div className="text-xs text-zinc-600 text-center pt-2">
        Diese Beratung ersetzt keine rechtliche oder fachliche Beratung. Angaben ohne Gewähr.
      </div>
    </div>
  )
}
