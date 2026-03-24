import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import DruckButton from "./DruckButton"

export default async function RechnungDrucken({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const rechnung = await prisma.rechnung.findUnique({
    where: { id },
    include: {
      auftrag: {
        select: {
          titel: true,
          waldbesitzer: true,
          waldbesitzerEmail: true,
          flaeche_ha: true,
          bundesland: true,
        },
      },
    },
  })
  if (!rechnung) notFound()

  const datum = new Date(rechnung.rechnungsDatum).toLocaleDateString("de-DE")
  const betrag = rechnung.betrag.toFixed(2)
  const mwstSatz = rechnung.mwst ?? 19
  const mwstBetrag = ((rechnung.betrag * mwstSatz) / 100).toFixed(2)
  const brutto = (rechnung.betrag * (1 + mwstSatz / 100)).toFixed(2)

  return (
    <div
      className="max-w-2xl mx-auto p-12 bg-white text-black print:p-0"
      style={{ fontFamily: "Georgia, serif" }}
    >
      {/* Kopfzeile */}
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-2xl font-bold">Koch Aufforstung GmbH</h1>
          <p className="text-sm text-gray-600 mt-1">Forstdienstleistungen</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-bold text-lg">RECHNUNG</p>
          <p>Nr: {rechnung.nummer}</p>
          <p>Datum: {datum}</p>
        </div>
      </div>

      {/* Rechnungsempfänger */}
      <div className="mb-8 p-4 bg-gray-50 rounded">
        <p className="font-semibold">Rechnungsempfänger:</p>
        <p>{rechnung.auftrag?.waldbesitzer ?? "—"}</p>
        {rechnung.auftrag?.waldbesitzerEmail && (
          <p className="text-sm text-gray-600">{rechnung.auftrag.waldbesitzerEmail}</p>
        )}
      </div>

      {/* Leistungsübersicht */}
      <table className="w-full mb-8 border-collapse">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left py-2">Leistung</th>
            <th className="text-right py-2">Betrag (netto)</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="py-3">
              {rechnung.notizen ?? rechnung.auftrag?.titel ?? "Forstdienstleistung"}
            </td>
            <td className="text-right py-3">{betrag} €</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="border-t">
            <td className="py-2 text-right text-sm text-gray-600">Netto:</td>
            <td className="text-right py-2 text-sm">{betrag} €</td>
          </tr>
          <tr>
            <td className="py-2 text-right text-sm text-gray-600">MwSt. {mwstSatz}%:</td>
            <td className="text-right py-2 text-sm">{mwstBetrag} €</td>
          </tr>
          <tr className="font-bold text-lg">
            <td className="py-2 text-right">Gesamt:</td>
            <td className="text-right py-2">{brutto} €</td>
          </tr>
        </tfoot>
      </table>

      {/* Zahlungsziel */}
      {rechnung.faelligAm && (
        <p className="text-sm text-gray-600 mb-4">
          Zahlbar bis:{" "}
          {new Date(rechnung.faelligAm).toLocaleDateString("de-DE")}
        </p>
      )}

      {/* Fußzeile */}
      <div className="mt-12 text-xs text-gray-500 border-t pt-4">
        <p>
          Koch Aufforstung GmbH · info@koch-aufforstung.de ·
          https://peru-otter-113714.hostingersite.com
        </p>
      </div>

      {/* Drucken-Button (wird beim Drucken ausgeblendet) */}
      <DruckButton />
    </div>
  )
}
