// Lohnabrechnung als Druckansicht/PDF
// Aufruf: /lohn/[mitarbeiterId]/abrechnung?saisonId=xxx (saisonId optional)

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { PrintButton } from "./PrintButton"

export default async function LohnabrechnungPage({
  params,
  searchParams,
}: {
  params: Promise<{ mitarbeiterId: string }>
  searchParams: Promise<{ saisonId?: string }>
}) {
  const { mitarbeiterId } = await params
  const { saisonId } = await searchParams

  // ── Mitarbeiter laden ─────────────────────────────────────────────
  const mitarbeiter = await prisma.mitarbeiter.findUnique({
    where: { id: mitarbeiterId },
  })
  if (!mitarbeiter) return notFound()

  // ── Neueste Lohnabrechnung (optional nach Saison gefiltert) ───────
  const lohnabrechnung = await prisma.lohnabrechnung.findFirst({
    where: {
      mitarbeiterId,
      ...(saisonId ? { saisonId } : {}),
    },
    include: {
      saison: {
        select: { id: true, name: true, startDatum: true, endDatum: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // ── Zeitraum bestimmen ────────────────────────────────────────────
  let zeitraumVon: Date | null = lohnabrechnung?.zeitraumVon ?? null
  let zeitraumBis: Date | null = lohnabrechnung?.zeitraumBis ?? null
  let saisonName: string | null = lohnabrechnung?.saison?.name ?? null

  // Falls keine Abrechnung, aber saisonId übergeben → Saison-Zeitraum verwenden
  if (!lohnabrechnung && saisonId) {
    const saison = await prisma.saison.findUnique({ where: { id: saisonId } })
    if (saison) {
      zeitraumVon = saison.startDatum ?? null
      zeitraumBis = saison.endDatum ?? null
      saisonName = saison.name
    }
  }

  // ── Stundeneinträge laden ─────────────────────────────────────────
  const stundeneintraege = await prisma.stundeneintrag.findMany({
    where: {
      mitarbeiterId,
      ...(zeitraumVon && zeitraumBis
        ? { datum: { gte: zeitraumVon, lte: zeitraumBis } }
        : {}),
    },
    include: {
      auftrag: {
        select: { id: true, nummer: true, titel: true },
      },
    },
    orderBy: { datum: "asc" },
  })

  // ── Vorschüsse laden ──────────────────────────────────────────────
  const vorschuesse = await prisma.vorschuss.findMany({
    where: {
      mitarbeiterId,
      ...(zeitraumVon && zeitraumBis
        ? { datum: { gte: zeitraumVon, lte: zeitraumBis } }
        : {}),
    },
    orderBy: { datum: "asc" },
  })

  // ── Berechnungen ──────────────────────────────────────────────────
  // Reguläre Stunden: alle außer "maschine"
  const regularStunden = stundeneintraege
    .filter((e) => e.typ !== "maschine")
    .reduce((s, e) => s + e.stunden, 0)

  // Maschinenstunden: typ="maschine" ODER maschinenzuschlag > 0
  const maschinenEintraege = stundeneintraege.filter(
    (e) => e.typ === "maschine" || (e.maschinenzuschlag != null && e.maschinenzuschlag > 0)
  )
  const maschinenStunden = maschinenEintraege.reduce((s, e) => s + e.stunden, 0)

  // Stundenlohn: aus Lohnabrechnung ableiten oder Mitarbeiter-Profil
  const stundenlohn =
    lohnabrechnung && lohnabrechnung.stunden > 0
      ? lohnabrechnung.bruttoLohn / lohnabrechnung.stunden
      : (mitarbeiter.stundenlohn ?? 0)

  // Maschinenzuschlag-Satz: Durchschnitt der erfassten Zuschläge
  const maschinenzuschlagSatz =
    maschinenEintraege.length > 0
      ? maschinenEintraege.reduce((s, e) => s + (e.maschinenzuschlag ?? 0), 0) /
        maschinenEintraege.length
      : 0

  // Endwerte: aus Lohnabrechnung wenn vorhanden, sonst berechnet
  const grundlohn = lohnabrechnung
    ? lohnabrechnung.bruttoLohn
    : regularStunden * stundenlohn

  const maschinenBonus = lohnabrechnung
    ? lohnabrechnung.maschinenBonus
    : maschinenStunden * maschinenzuschlagSatz

  const gesamtVorschuesse = lohnabrechnung
    ? lohnabrechnung.vorschuesse
    : vorschuesse.reduce((s, v) => s + v.betrag, 0)

  const auszahlung = lohnabrechnung
    ? lohnabrechnung.auszahlung
    : grundlohn + maschinenBonus - gesamtVorschuesse

  // ── Hilfsfunktionen ───────────────────────────────────────────────
  const fmt = (n: number) =>
    n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const fmtDatum = (d: Date | string) =>
    new Date(d).toLocaleDateString("de-DE")

  // Typ-Label
  const typLabel = (typ: string) => {
    const map: Record<string, string> = {
      arbeit: "Arbeit",
      maschine: "Maschine",
      urlaub: "Urlaub",
      krank: "Krank",
      sonstiges: "Sonstiges",
    }
    return map[typ] ?? typ
  }

  return (
    <div className="p-8 max-w-4xl mx-auto print:p-4">
      {/* ── Aktions-Buttons (beim Drucken ausgeblendet) ─────────────── */}
      <div className="print:hidden mb-6 flex gap-3 flex-wrap">
        {/* Sprint AF: PDF-Export-Button (abrechnungId wird übergeben wenn Abrechnung vorhanden) */}
        <PrintButton abrechnungId={lohnabrechnung?.id} />
        <a
          href={`/lohn`}
          className="px-4 py-2 border border-zinc-600 text-zinc-400 rounded-lg hover:border-zinc-400 hover:text-white transition-colors"
        >
          ← Zurück zum Lohn
        </a>
      </div>

      {/* ── Briefkopf ───────────────────────────────────────────────── */}
      <div className="border-b-2 border-black pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-black">LOHNABRECHNUNG</h1>
          </div>
          <div className="text-right text-sm">
            <p className="font-bold">Koch Aufforstung GmbH</p>
            <p className="text-gray-600">
              Datum: {new Date().toLocaleDateString("de-DE")}
            </p>
          </div>
        </div>
      </div>

      {/* ── Mitarbeiter-Info ─────────────────────────────────────────── */}
      <section className="mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Mitarbeiter</p>
            <p className="font-semibold">
              {mitarbeiter.vorname} {mitarbeiter.nachname}
            </p>
          </div>
          {(mitarbeiter.notizen?.includes("Ausweis") ||
            mitarbeiter.adresse) && (
            <div>
              <p className="text-gray-500">Personalausweis / ID</p>
              <p className="font-medium text-gray-700">—</p>
            </div>
          )}
          <div>
            <p className="text-gray-500">Saison</p>
            <p className="font-medium">{saisonName ?? "—"}</p>
          </div>
          <div>
            <p className="text-gray-500">Zeitraum</p>
            <p className="font-medium">
              {zeitraumVon && zeitraumBis
                ? `${fmtDatum(zeitraumVon)} – ${fmtDatum(zeitraumBis)}`
                : "—"}
            </p>
          </div>
        </div>
      </section>

      {/* ── Stunden-Übersicht ────────────────────────────────────────── */}
      <section className="mb-6">
        <h2 className="text-base font-bold mb-3 border-b border-gray-300 pb-1">
          Stunden-Übersicht
        </h2>

        {stundeneintraege.length === 0 ? (
          <p className="text-gray-400 text-sm italic">
            Keine Stundeneinträge im gewählten Zeitraum
          </p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Datum</th>
                <th className="border border-gray-300 p-2 text-right">Std</th>
                <th className="border border-gray-300 p-2 text-left">Typ</th>
                <th className="border border-gray-300 p-2 text-left">Auftrag</th>
                {maschinenzuschlagSatz > 0 && (
                  <th className="border border-gray-300 p-2 text-right">
                    Zuschlag
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {stundeneintraege.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-2">
                    {fmtDatum(e.datum)}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {e.stunden.toFixed(1)}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {typLabel(e.typ)}
                  </td>
                  <td className="border border-gray-300 p-2 text-gray-600">
                    {e.auftrag?.nummer ?? e.auftrag?.titel ?? "—"}
                  </td>
                  {maschinenzuschlagSatz > 0 && (
                    <td className="border border-gray-300 p-2 text-right">
                      {e.maschinenzuschlag != null && e.maschinenzuschlag > 0
                        ? `${fmt(e.maschinenzuschlag)} €/Std`
                        : "—"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Zusammenfassung Stunden */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm max-w-sm">
          <p className="text-gray-600">Gesamt reguläre Stunden:</p>
          <p className="font-medium text-right">
            {regularStunden.toFixed(1)} Std
          </p>
          {maschinenStunden > 0 && (
            <>
              <p className="text-gray-600">Gesamt Maschinenstunden:</p>
              <p className="font-medium text-right">
                {maschinenStunden.toFixed(1)} Std
              </p>
            </>
          )}
          <p className="text-gray-600">Stundenlohn:</p>
          <p className="font-medium text-right">{fmt(stundenlohn)} €</p>
          {maschinenzuschlagSatz > 0 && (
            <>
              <p className="text-gray-600">Maschinenzuschlag:</p>
              <p className="font-medium text-right">
                {fmt(maschinenzuschlagSatz)} €/Std
              </p>
            </>
          )}
        </div>
      </section>

      {/* ── Berechnung ──────────────────────────────────────────────── */}
      <section className="mb-6">
        <h2 className="text-base font-bold mb-3 border-b border-gray-300 pb-1">
          Berechnung
        </h2>
        <div className="text-sm space-y-1.5 max-w-md">
          <div className="flex justify-between">
            <span className="text-gray-600">
              Grundlohn:{" "}
              <span className="text-gray-400">
                {regularStunden.toFixed(1)} Std × {fmt(stundenlohn)} €
              </span>
            </span>
            <span className="font-medium">{fmt(grundlohn)} €</span>
          </div>
          {maschinenBonus > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">
                Maschinenzuschlag:{" "}
                <span className="text-gray-400">
                  {maschinenStunden.toFixed(1)} Std × {fmt(maschinenzuschlagSatz)} €
                </span>
              </span>
              <span className="font-medium">+ {fmt(maschinenBonus)} €</span>
            </div>
          )}
          {gesamtVorschuesse > 0 && (
            <div className="flex justify-between text-red-700">
              <span>Vorschüsse:</span>
              <span className="font-medium">− {fmt(gesamtVorschuesse)} €</span>
            </div>
          )}
        </div>

        {/* Trennlinie + Auszahlung */}
        <div className="border-t-2 border-black mt-3 pt-3 flex justify-between max-w-md">
          <span className="font-bold text-lg">AUSZAHLUNG:</span>
          <span className="font-bold text-lg">{fmt(auszahlung)} €</span>
        </div>
      </section>

      {/* ── Vorschüsse Detail ────────────────────────────────────────── */}
      {vorschuesse.length > 0 && (
        <section className="mb-6">
          <h2 className="text-base font-bold mb-3 border-b border-gray-300 pb-1">
            Vorschüsse
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Datum</th>
                <th className="border border-gray-300 p-2 text-right">Betrag</th>
                <th className="border border-gray-300 p-2 text-left">Notiz / Grund</th>
              </tr>
            </thead>
            <tbody>
              {vorschuesse.map((v) => (
                <tr key={v.id}>
                  <td className="border border-gray-300 p-2">
                    {fmtDatum(v.datum)}
                  </td>
                  <td className="border border-gray-300 p-2 text-right font-medium">
                    {fmt(v.betrag)} €
                  </td>
                  <td className="border border-gray-300 p-2 text-gray-600">
                    {v.grund ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-2 font-semibold">
                  Gesamt
                </td>
                <td className="border border-gray-300 p-2 text-right font-bold">
                  {fmt(vorschuesse.reduce((s, v) => s + v.betrag, 0))} €
                </td>
                <td className="border border-gray-300 p-2" />
              </tr>
            </tfoot>
          </table>
        </section>
      )}

      {/* ── Unterschriften ──────────────────────────────────────────── */}
      <section className="mt-10">
        <div className="grid grid-cols-2 gap-12">
          <div>
            <div className="border-b border-black mt-10"></div>
            <p className="text-sm text-gray-500 mt-1">
              Unterschrift Arbeitgeber, Datum
            </p>
          </div>
          <div>
            <div className="border-b border-black mt-10"></div>
            <p className="text-sm text-gray-500 mt-1">
              Unterschrift Arbeitnehmer, Datum
            </p>
          </div>
        </div>
      </section>

      {/* ── Print-CSS ───────────────────────────────────────────────── */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            margin: 2cm;
          }
        }
      `}</style>
    </div>
  )
}
