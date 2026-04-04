/**
 * Next.js Middleware (Sprint DA-29)
 * Protokolliert automatisch alle Zugriffe auf personenbezogene Daten
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// PD-relevante API-Pfade (personenbezogene Daten)
const PD_PATHS = [
  '/api/users',              // User-Profile
  '/api/mitarbeiter',        // Mitarbeiter-Stammdaten
  '/api/stundeneintraege',   // Zeiterfassung
  '/api/lohneintraege',      // Lohneinträge
  '/api/kontakte',           // Kontakte
  '/api/auftraege',          // Aufträge (enthält Waldbesitzer-Daten)
  '/api/rechnungen',         // Rechnungen
  '/api/protokolle',         // Tagesprotokolle (GPS, Mitarbeiter)
  '/api/tagesprotokolle',    // Tagesprotokolle (GPS, Mitarbeiter)
  '/api/gdpr',               // DSGVO-Anfragen
  '/api/dokumente',          // Dokumente
  '/api/export',             // DATEV-Exporte etc.
  '/api/abwesenheiten',      // Abwesenheiten
  '/api/kundenportal',       // Kundenportal
  '/api/saison-anmeldungen', // Saison-Anmeldungen
]

// Ausnahmen (keine Logs für diese)
const EXCLUDED_PATHS = [
  '/api/auth',               // Auth-Logs separat
  '/api/cron',               // Cron-Jobs
  '/api/health',             // Health-Checks
  '/api/activity',           // Activity-Logs selbst
]

function shouldLogPdAccess(pathname: string): boolean {
  // Ausnahmen prüfen
  if (EXCLUDED_PATHS.some(p => pathname.startsWith(p))) {
    return false
  }
  // PD-Pfade prüfen
  return PD_PATHS.some(p => pathname.startsWith(p))
}

function getResourceFromPath(pathname: string): string {
  if (pathname.includes('/users')) return 'USER_PROFILE'
  if (pathname.includes('/mitarbeiter')) return 'MITARBEITER'
  if (pathname.includes('/stundeneintraege')) return 'TIME_ENTRIES'
  if (pathname.includes('/lohneintraege')) return 'TIME_ENTRIES'
  if (pathname.includes('/protokolle') || pathname.includes('/tagesprotokolle')) return 'GPS_DATA'
  if (pathname.includes('/rechnungen')) return 'INVOICE'
  if (pathname.includes('/kontakte')) return 'KONTAKT'
  if (pathname.includes('/auftraege')) return 'WALDBESITZER'
  if (pathname.includes('/dokumente')) return 'DOKUMENT'
  if (pathname.includes('/gdpr')) return 'CONSENT'
  if (pathname.includes('/kundenportal')) return 'WALDBESITZER'
  return 'USER_PROFILE'
}

function getActionFromMethod(method: string): string {
  switch (method) {
    case 'GET': return 'READ'
    case 'POST': return 'WRITE'
    case 'PUT':
    case 'PATCH': return 'WRITE'
    case 'DELETE': return 'DELETE'
    default: return 'READ'
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Nur PD-relevante Pfade loggen
  if (shouldLogPdAccess(pathname)) {
    // Async logging ohne await - non-blocking
    const logData = {
      resource: getResourceFromPath(pathname),
      action: getActionFromMethod(request.method),
      endpoint: pathname,
      method: request.method,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          request.headers.get('x-real-ip') ||
          'unknown',
      userAgent: request.headers.get('user-agent') || null,
      timestamp: new Date().toISOString(),
    }

    // Log via API-Route (async, non-blocking)
    // Wird im Route-Handler selbst geloggt, hier nur für Edge-Cases
    // Die eigentliche Protokollierung erfolgt in den API-Routen
    request.headers.set('x-pd-log', JSON.stringify(logData))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
}
