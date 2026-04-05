/**
 * XRechnung Export API Route
 * 
 * Sprint FM-02: GET /api/rechnungen/:id/xrechnung
 * Generiert XRechnung 3.0 konformes XML für eine Rechnung
 * 
 * @see https://xeinkauf.de/xrechnung/
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isAdminOrGF } from '@/lib/permissions'
import { 
  generateXRechnungXml, 
  rechnungToXRechnungData, 
  validateXRechnungData 
} from '@/lib/xrechnung'

// Firmendaten (Koch Aufforstung GmbH) - aus ENV oder Default
const FIRMA = {
  name: process.env.COMPANY_NAME || 'Koch Aufforstung GmbH',
  strasse: process.env.COMPANY_STREET || 'Hauptstraße 42',
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

/**
 * GET /api/rechnungen/:id/xrechnung
 * 
 * Generiert XRechnung XML für eine Rechnung
 * 
 * Query-Parameter:
 * - leitwegId: Leitweg-ID für öffentliche Auftraggeber (BT-10)
 * - bestellnummer: Bestellnummer des Käufers (BT-13)
 * - validate: "true" - Validierung durchführen, Fehler bei Problemen
 * - download: "true" - Als Datei-Download statt inline
 * 
 * Response:
 * - application/xml mit XRechnung 3.0 konformem XML
 * 
 * Fehler:
 * - 401: Nicht authentifiziert
 * - 403: Keine Berechtigung (nur Admin/GF)
 * - 404: Rechnung nicht gefunden
 * - 410: Rechnung gelöscht (Soft-Delete)
 * - 422: Validierungsfehler (wenn validate=true)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const resolvedParams = await params

  // Auth-Check
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Nicht authentifiziert' },
      { status: 401 }
    )
  }

  // Permissions-Check: Nur Admin, Geschäftsführer oder Accountant
  const adminOrGF = await isAdminOrGF(session.user.id)
  const userRole = (session.user as { rolle?: string }).rolle
  const isAccountant = userRole === 'accountant'
  
  if (!adminOrGF && !isAccountant) {
    return NextResponse.json(
      { error: 'Keine Berechtigung für XRechnung-Export' },
      { status: 403 }
    )
  }

  // Query-Parameter
  const searchParams = request.nextUrl.searchParams
  const leitwegId = searchParams.get('leitwegId') ?? undefined
  const bestellnummer = searchParams.get('bestellnummer') ?? undefined
  const shouldValidate = searchParams.get('validate') === 'true'
  const asDownload = searchParams.get('download') === 'true'

  try {
    // Rechnung laden mit Auftrag und Positionen
    const rechnung = await prisma.rechnung.findUnique({
      where: { id: resolvedParams.id },
      include: {
        auftrag: true,
        positionen: true,
      },
    })

    if (!rechnung) {
      return NextResponse.json(
        { error: 'Rechnung nicht gefunden' },
        { status: 404 }
      )
    }

    // Soft-Delete Check
    if (rechnung.deletedAt) {
      return NextResponse.json(
        { error: 'Rechnung wurde gelöscht' },
        { status: 410 }
      )
    }

    // GDPR Restriction Check - auch eingeschränkte Rechnungen dürfen exportiert werden
    // (für steuerliche Zwecke), aber wir loggen den Zugriff
    if (rechnung.gdprRestricted) {
      console.log(
        `[XRechnung] Zugriff auf DSGVO-eingeschränkte Rechnung ${rechnung.nummer} durch User ${session.user.id}`
      )
    }

    // Konvertierung zu XRechnung-Daten
    const xrechnungData = rechnungToXRechnungData(
      rechnung,
      FIRMA,
      { leitwegId, bestellnummer }
    )

    // Optionale Validierung
    if (shouldValidate) {
      const validationErrors = validateXRechnungData(xrechnungData)
      if (validationErrors.length > 0) {
        return NextResponse.json(
          {
            error: 'XRechnung-Validierung fehlgeschlagen',
            validationErrors,
            hint: 'Bitte ergänzen Sie die fehlenden Pflichtfelder',
          },
          { status: 422 }
        )
      }
    }

    // XML generieren
    const xml = generateXRechnungXml(xrechnungData)

    // Dateiname für Download
    const filename = `xrechnung_${rechnung.nummer.replace(/[^a-zA-Z0-9-]/g, '_')}.xml`

    // Response mit XML
    const headers: HeadersInit = {
      'Content-Type': 'application/xml; charset=utf-8',
      'X-XRechnung-Version': '3.0',
      'X-Invoice-Number': rechnung.nummer,
    }

    if (asDownload) {
      headers['Content-Disposition'] = `attachment; filename="${filename}"`
    } else {
      headers['Content-Disposition'] = `inline; filename="${filename}"`
    }

    return new NextResponse(xml, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('[XRechnung] Export-Fehler:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler beim XRechnung-Export' },
      { status: 500 }
    )
  }
}

/**
 * HEAD - Prüft ob XRechnung-Export verfügbar ist
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
    },
  })
}
