// Arbeitsanweisung für Gruppenführer – Druck-/PDF-Seite
// Wird über /auftraege/[id]/arbeitsanweisung aufgerufen und per window.print() als PDF gespeichert

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { PrintButton } from "./PrintButton"

export default async function ArbeitsanweisungPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const auftrag = await prisma.auftrag.findUnique({
    where: { id },
    include: {
      saison: { select: { name: true } },
      gruppe: {
        include: {
          mitglieder: {
            include: {
              mitarbeiter: {
                select: {
                  id: true,
                  vorname: true,
                  nachname: true,
                  rolle: true,
                  telefon: true,
                },
              },
            },
          },
        },
      },
      maschineneinsaetze: {
        include: {
          fahrzeug: {
            select: {
              bezeichnung: true,
              kennzeichen: true,
              typ: true,
            },
          },
        },
      },
    },
  })

  if (!auftrag) return notFound()

  // Mitglieder der zugewiesenen Gruppe flach mappen
  const alleMitglieder =
    auftrag.gruppe?.mitglieder?.map((m) => ({
      ...m.mitarbeiter,
      rolle: m.rolle,
    })) ?? []

  const gf = alleMitglieder.filter(
    (m) =>
      m.rolle?.toLowerCase().includes("gf") ||
      m.rolle?.toLowerCase().includes("gruppenführer") ||
      m.rolle?.toLowerCase().includes("gruppenfuehrer")
  )
  const mitarbeiter = alleMitglieder.filter(
    (m) =>
      !m.rolle?.toLowerCase().includes("gf") &&
      !m.rolle?.toLowerCase().includes("gruppenführer") &&
      !m.rolle?.toLowerCase().includes("gruppenfuehrer")
  )

  return (
    // Sprint FP (A6): Expliziter weißer Hintergrund + dunkler Text für besseren Kontrast
    <div className="p-8 max-w-4xl mx-auto print:p-4 bg-white text-gray-900 rounded-lg shadow-lg">
      {/* ── Aktions-Buttons (werden beim Drucken ausgeblendet) ─────── */}
      <div className="print:hidden mb-6 flex gap-3 flex-wrap">
        <PrintButton />
        <a
          href={`/auftraege/${id}`}
          className="px-4 py-2 border border-zinc-600 text-zinc-400 rounded-lg hover:border-zinc-400 hover:text-white transition-colors"
        >
          ← Zurück zum Auftrag
        </a>
      </div>

      {/* ── Briefkopf ───────────────────────────────────────────────── */}
      <div className="border-b-2 border-black pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-black">ARBEITSANWEISUNG</h1>
            <p className="text-sm text-gray-600">{auftrag.nummer ?? auftrag.id}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-bold">Koch Aufforstung GmbH</p>
            <p className="text-gray-600">
              Datum: {new Date().toLocaleDateString("de-DE")}
            </p>
          </div>
        </div>
      </div>

      {/* ── Auftrag-Details ─────────────────────────────────────────── */}
      <section className="mb-6">
        <h2 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1">
          Auftrag
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Bezeichnung</p>
            <p className="font-medium">{auftrag.titel}</p>
          </div>
          <div>
            <p className="text-gray-500">Saison</p>
            <p className="font-medium">{auftrag.saison?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-gray-500">Ort / Revier</p>
            <p className="font-medium">{auftrag.standort ?? "—"}</p>
          </div>
          <div>
            <p className="text-gray-500">Fläche</p>
            <p className="font-medium">
              {auftrag.flaeche_ha ? `${auftrag.flaeche_ha} ha` : "—"}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Waldbesitzer</p>
            <p className="font-medium">{auftrag.waldbesitzer ?? "—"}</p>
          </div>
          <div>
            <p className="text-gray-500">Bundesland</p>
            <p className="font-medium">{auftrag.bundesland ?? "—"}</p>
          </div>
          <div>
            <p className="text-gray-500">Leistungsart</p>
            <p className="font-medium capitalize">{auftrag.typ ?? "—"}</p>
          </div>
          <div>
            <p className="text-gray-500">Status</p>
            <p className="font-medium capitalize">{auftrag.status ?? "—"}</p>
          </div>
          {auftrag.startDatum && (
            <div>
              <p className="text-gray-500">Startdatum</p>
              <p className="font-medium">
                {new Date(auftrag.startDatum).toLocaleDateString("de-DE")}
              </p>
            </div>
          )}
          {auftrag.endDatum && (
            <div>
              <p className="text-gray-500">Enddatum</p>
              <p className="font-medium">
                {new Date(auftrag.endDatum).toLocaleDateString("de-DE")}
              </p>
            </div>
          )}
          {auftrag.baumarten && (
            <div className="col-span-2">
              <p className="text-gray-500">Baumarten</p>
              <p className="font-medium">{auftrag.baumarten}</p>
            </div>
          )}
        </div>

        {auftrag.beschreibung && (
          <div className="mt-3">
            <p className="text-gray-500 text-sm">Beschreibung / Besonderheiten</p>
            <p className="text-sm mt-1 p-2 bg-gray-50 rounded border">
              {auftrag.beschreibung}
            </p>
          </div>
        )}

        {auftrag.notizen && (
          <div className="mt-3">
            <p className="text-gray-500 text-sm">Interne Notizen</p>
            <p className="text-sm mt-1 p-2 bg-gray-50 rounded border">
              {auftrag.notizen}
            </p>
          </div>
        )}

        {auftrag.lat && auftrag.lng && (
          <div className="mt-3 text-sm">
            <p className="text-gray-500">GPS-Koordinaten / Anfahrt</p>
            <p className="font-mono mt-1">
              {auftrag.lat}, {auftrag.lng}
            </p>
            <p className="text-blue-600 break-all">
              https://maps.google.com/?q={auftrag.lat},{auftrag.lng}
            </p>
            {auftrag.plusCode && (
              <p className="text-gray-600 mt-0.5">Plus Code: {auftrag.plusCode}</p>
            )}
          </div>
        )}
      </section>

      {/* ── Team ────────────────────────────────────────────────────── */}
      <section className="mb-6">
        <h2 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1">
          Team
          {auftrag.gruppe && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({auftrag.gruppe.name})
            </span>
          )}
        </h2>

        {gf.length > 0 && (
          <div className="mb-3">
            <p className="text-sm font-semibold text-gray-600 mb-2">
              Gruppenführer
            </p>
            <div className="grid grid-cols-2 gap-2">
              {gf.map((m) => (
                <div key={m.id} className="text-sm border rounded p-2">
                  <p className="font-medium">
                    ⭐ {m.vorname} {m.nachname}
                  </p>
                  {m.telefon && (
                    <p className="text-gray-500">{m.telefon}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {mitarbeiter.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2">
              Mitarbeiter ({mitarbeiter.length})
            </p>
            <div className="grid grid-cols-3 gap-2">
              {mitarbeiter.map((m) => (
                <div key={m.id} className="text-sm border rounded p-2">
                  <p className="font-medium">
                    {m.vorname} {m.nachname}
                  </p>
                  {m.telefon && (
                    <p className="text-gray-500 text-xs">{m.telefon}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {alleMitglieder.length === 0 && (
          <p className="text-gray-400 text-sm italic">
            Noch keine Gruppe zugewiesen
          </p>
        )}
      </section>

      {/* ── Maschineneinsätze ───────────────────────────────────────── */}
      {auftrag.maschineneinsaetze && auftrag.maschineneinsaetze.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1">
            Maschineneinsätze
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Fahrzeug</th>
                <th className="border p-2 text-left">Typ</th>
                <th className="border p-2 text-left">Kennzeichen</th>
                <th className="border p-2 text-left">Von</th>
                <th className="border p-2 text-left">Bis</th>
              </tr>
            </thead>
            <tbody>
              {auftrag.maschineneinsaetze.map((m) => (
                <tr key={m.id}>
                  <td className="border p-2">
                    {m.fahrzeug?.bezeichnung ?? "—"}
                  </td>
                  <td className="border p-2">{m.fahrzeug?.typ ?? "—"}</td>
                  <td className="border p-2">
                    {m.fahrzeug?.kennzeichen ?? "—"}
                  </td>
                  <td className="border p-2">
                    {m.vonDatum
                      ? new Date(m.vonDatum).toLocaleString("de-DE", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "—"}
                  </td>
                  <td className="border p-2">
                    {m.bisDatum
                      ? new Date(m.bisDatum).toLocaleString("de-DE", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "offen"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ── Tagesprotokoll-Vorlage ──────────────────────────────────── */}
      <section className="mb-6">
        <h2 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1">
          Tagesprotokoll (vor Ort ausfüllen)
        </h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Mitarbeiter</th>
              <th className="border p-2 text-left">Tätigkeit</th>
              <th className="border p-2 text-left">Von</th>
              <th className="border p-2 text-left">Bis</th>
              <th className="border p-2 text-left">Stunden</th>
              <th className="border p-2 text-left">Unterschrift</th>
            </tr>
          </thead>
          <tbody>
            {/* Vorausgefüllte Zeilen für bekannte Mitarbeiter */}
            {alleMitglieder.map((m, i) => (
              <tr key={m?.id ?? i} style={{ height: "36px" }}>
                <td className="border p-2">
                  {m ? `${m.vorname} ${m.nachname}` : ""}
                </td>
                <td className="border p-2"></td>
                <td className="border p-2"></td>
                <td className="border p-2"></td>
                <td className="border p-2"></td>
                <td className="border p-2"></td>
              </tr>
            ))}
            {/* Leere Zeilen auffüllen (Minimum 8 Zeilen gesamt) */}
            {[...Array(Math.max(0, 8 - alleMitglieder.length))].map((_, i) => (
              <tr key={`leer-${i}`} style={{ height: "36px" }}>
                {[...Array(6)].map((_, j) => (
                  <td key={j} className="border p-2"></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── Unterschriften ──────────────────────────────────────────── */}
      <section className="mt-8">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="border-b border-black mt-8"></div>
            <p className="text-sm text-gray-600 mt-1">
              Gruppenführer, Datum + Unterschrift
            </p>
          </div>
          <div>
            <div className="border-b border-black mt-8"></div>
            <p className="text-sm text-gray-600 mt-1">Bestätigung Büro</p>
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
            margin: 1.5cm;
          }
        }
      `}</style>
    </div>
  )
}
