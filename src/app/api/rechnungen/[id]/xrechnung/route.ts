/**
 * ZUGFeRD / XRechnung Export API Route
 *
 * GET /api/rechnungen/:id/xrechnung
 *
 * Returns a PDF/A-3b document with embedded ZUGFeRD 2.3 XML (Factur-X EN16931).
 * Query param ?format=xml returns raw XRechnung XML instead.
 *
 * This is the machine-readable invoice. The pretty PDF is at /api/rechnungen/:id/pdf.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isAdminOrGF } from '@/lib/permissions'
import {
  generateXRechnungXml,
  rechnungToXRechnungData,
  validateXRechnungData,
} from '@/lib/xrechnung'
import {
  generateZUGFeRDXml,
  rechnungToZUGFeRDData,
} from '@/lib/zugferd'
import { generateZUGFeRDPdf } from '@/lib/zugferd-pdf'

// Firmendaten (Koch Aufforstung GmbH)
const FIRMA = {
  name: process.env.COMPANY_NAME || 'Koch Aufforstung GmbH',
  strasse: process.env.COMPANY_STREET || 'Hauptstra\u00dfe 42',
  plz: process.env.COMPANY_ZIP || '54290',
  ort: process.env.COMPANY_CITY || 'Trier',
  land: process.env.COMPANY_COUNTRY || 'DE',
  telefon: process.env.COMPANY_PHONE || '+49 651 12345678',
  email: process.env.COMPANY_EMAIL || 'info@koch-aufforstung.de',
  iban: process.env.COMPANY_IBAN || 'DE89 3704 0044 0532 0130 00',
  bic: process.env.COMPANY_BIC || 'COBADEFFXXX',
  bank: process.env.COMPANY_BANK || 'Commerzbank Trier',
  steuernummer: process.env.COMPANY_TAX_NUMBER || '22/123/45678',
  ustIdNr: process.env.COMPANY_VAT_ID || 'DE123456789',
}

interface RouteParams {
  params: Promise<{ id: string }>
}

function formatEuro(n: number | null | undefined): string {
  return (n ?? 0).toFixed(2)
}

function formatDatum(d: Date | string | null | undefined): string {
  if (!d) return new Date().toISOString().slice(0, 10).split('-').reverse().join('.')
  const date = new Date(d)
  if (isNaN(date.getTime())) return new Date().toISOString().slice(0, 10).split('-').reverse().join('.')
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

/**
 * Sanitizes text for PDF rendering: strips newlines and control characters.
 * pdf-lib's drawText() crashes on newline characters with standard fonts.
 */
function sanitizeText(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(/[\r\n]+/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const resolvedParams = await params

  // Auth
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  const adminOrGF = isAdminOrGF(session)
  const userRole = (session.user as { rolle?: string }).rolle
  const isAccountant = userRole === 'accountant'

  if (!adminOrGF && !isAccountant) {
    return NextResponse.json(
      { error: 'Keine Berechtigung fuer XRechnung-Export' },
      { status: 403 }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const format = searchParams.get('format') // "xml" for raw XML, default = PDF
  const leitwegId = searchParams.get('leitwegId') ?? undefined
  const bestellnummer = searchParams.get('bestellnummer') ?? undefined
  const shouldValidate = searchParams.get('validate') === 'true'

  try {
    const rechnung = await prisma.rechnung.findUnique({
      where: { id: resolvedParams.id },
      include: {
        auftrag: true,
        positionen: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!rechnung) {
      return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 })
    }

    if (rechnung.deletedAt) {
      return NextResponse.json({ error: 'Rechnung wurde geloescht' }, { status: 410 })
    }

    if (rechnung.gdprRestricted) {
      console.log(
        `[XRechnung] Zugriff auf DSGVO-eingeschraenkte Rechnung ${rechnung.nummer} durch User ${session.user.id}`
      )
    }

    // ── Format: Raw XRechnung XML ──
    if (format === 'xml') {
      const xrechnungData = rechnungToXRechnungData(rechnung, FIRMA, {
        leitwegId,
        bestellnummer,
      })

      if (shouldValidate) {
        const validationErrors = validateXRechnungData(xrechnungData)
        if (validationErrors.length > 0) {
          return NextResponse.json(
            { error: 'XRechnung-Validierung fehlgeschlagen', validationErrors },
            { status: 422 }
          )
        }
      }

      const xml = generateXRechnungXml(xrechnungData)
      const filename = `xrechnung_${rechnung.nummer.replace(/[^a-zA-Z0-9-]/g, '_')}.xml`

      return new NextResponse(xml, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'X-XRechnung-Version': '3.0',
          'X-Invoice-Number': rechnung.nummer,
        },
      })
    }

    // ── Default: ZUGFeRD PDF/A-3b ──

    // Generate ZUGFeRD XML
    const zugferdData = rechnungToZUGFeRDData(rechnung, {
      name: FIRMA.name,
      strasse: FIRMA.strasse,
      plz: FIRMA.plz,
      ort: FIRMA.ort,
      land: FIRMA.land,
      steuernummer: FIRMA.steuernummer,
      ustIdNr: FIRMA.ustIdNr,
      iban: FIRMA.iban,
      bic: FIRMA.bic,
      bank: FIRMA.bank,
    })
    const zugferdXml = generateZUGFeRDXml(zugferdData)

    // Calculate amounts for PDF display (with defensive null guards)
    const mwstSatz = rechnung.mwst ?? 19
    const netto = rechnung.nettoBetrag ?? rechnung.betrag ?? 0
    const rabattAbsolut = rechnung.rabattBetrag ?? ((rechnung.rabatt ?? 0) * netto / 100)
    const nettoNachRabatt = netto - rabattAbsolut
    const mwstBetrag = (nettoNachRabatt * mwstSatz) / 100
    const brutto = rechnung.bruttoBetrag ?? nettoNachRabatt + mwstBetrag

    // Build positions for PDF — sanitize all text to prevent drawText crashes from newlines
    const positionen = rechnung.positionen.length > 0
      ? rechnung.positionen.map(pos => ({
          beschreibung: sanitizeText(pos.beschreibung) || 'Position',
          menge: (pos.menge ?? 1).toFixed(2),
          einheit: sanitizeText(pos.einheit) || 'Stk',
          einzelpreis: formatEuro(pos.preisProEinheit),
          gesamt: formatEuro(pos.gesamt),
        }))
      : [{
          beschreibung: sanitizeText(rechnung.notizen) || sanitizeText(rechnung.auftrag?.titel) || 'Forstdienstleistung',
          menge: '1.00',
          einheit: 'pauschal',
          einzelpreis: formatEuro(netto),
          gesamt: formatEuro(netto),
        }]

    // Generate PDF/A-3b with embedded ZUGFeRD XML
    const pdfBytes = await generateZUGFeRDPdf(zugferdXml, {
      rechnungsNummer: rechnung.nummer ?? 'OHNE-NR',
      rechnungsDatum: formatDatum(rechnung.rechnungsDatum),
      empfaenger: sanitizeText(rechnung.auftrag?.waldbesitzer) || 'Kunde',
      nettoBetrag: formatEuro(nettoNachRabatt),
      mwstBetrag: formatEuro(mwstBetrag),
      bruttoBetrag: formatEuro(brutto),
      mwstSatz,
      positionen,
      firma: {
        name: FIRMA.name,
        strasse: FIRMA.strasse,
        plz: FIRMA.plz,
        ort: FIRMA.ort,
        iban: FIRMA.iban,
        bic: FIRMA.bic,
        steuernummer: FIRMA.steuernummer,
        ustIdNr: FIRMA.ustIdNr,
      },
    })

    const filename = `ZUGFeRD_${rechnung.nummer.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`

    console.log(`[ZUGFeRD] PDF/A-3b generiert fuer Rechnung ${rechnung.nummer} (${pdfBytes.length} bytes)`)

    return new NextResponse(pdfBytes as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBytes.length.toString(),
        'X-ZUGFeRD-Status': 'embedded',
        'X-ZUGFeRD-Profile': 'EN16931',
        'X-Invoice-Number': rechnung.nummer,
      },
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    const errStack = error instanceof Error ? error.stack : undefined
    console.error('[XRechnung] Export-Fehler:', errMsg)
    if (errStack) console.error('[XRechnung] Stack:', errStack)
    return NextResponse.json(
      { error: 'Interner Serverfehler beim Export', details: errMsg },
      { status: 500 }
    )
  }
}

/**
 * HEAD - Check if export is available
 */
export async function HEAD(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const resolvedParams = await params

  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse(null, { status: 401 })
  }

  const rechnung = await prisma.rechnung.findUnique({
    where: { id: resolvedParams.id },
    select: { id: true, deletedAt: true, nummer: true },
  })

  if (!rechnung || rechnung.deletedAt) {
    return new NextResponse(null, { status: 404 })
  }

  return new NextResponse(null, {
    status: 200,
    headers: {
      'X-Invoice-Number': rechnung.nummer,
      'X-XRechnung-Available': 'true',
      'X-ZUGFeRD-Available': 'true',
    },
  })
}
