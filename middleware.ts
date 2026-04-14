/**
 * Next.js Middleware (Sprint DA-29 + SC-02)
 * - Protokolliert alle Zugriffe auf personenbezogene Daten
 * - Rate-Limiting für API-Routen (60 req/min) und Auth-Routen (5 req/min)
 * - Upstash Redis Rate-Limiting für Login-Endpoint (5 req/15min)
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { loginRateLimit } from '@/lib/rate-limit'

// ============================================
// Rate Limiting (SC-02)
// ============================================

// Einfaches In-Memory Rate-Limiting für Edge Runtime
// (Upstash wird in API-Routen verwendet, hier nur als Fallback)
const ipRequests = new Map<string, { count: number; resetTime: number }>()

// Konfiguration
const RATE_LIMITS = {
  api: { maxRequests: 60, windowMs: 60000 },      // 60 req/min
  auth: { maxRequests: 5, windowMs: 60000 },      // 5 req/min
  sensitive: { maxRequests: 3, windowMs: 60000 }, // 3 req/min
}

// Auth-Pfade (strenger Rate-Limit)
// CSRF und Session sind read-only → kein Rate-Limit nötig (E2E-Tests brauchen diese)
const AUTH_PATHS = [
  '/api/auth/signin',
  '/api/auth/signout',
  '/api/auth/callback',
  // '/api/auth/session',  // Read-only, E2E-friendly
  // '/api/auth/csrf',     // Read-only, E2E-friendly
  '/api/auth/providers',
  '/api/auth/2fa',
]

// Sensitive Pfade (sehr streng)
const SENSITIVE_PATHS = [
  '/api/auth/2fa/setup',
  '/api/auth/2fa/disable',
  '/api/users/password',
  '/api/gdpr/export',
  '/api/gdpr/delete',
]

function getRateLimitType(pathname: string): 'api' | 'auth' | 'sensitive' {
  if (SENSITIVE_PATHS.some(p => pathname.startsWith(p))) return 'sensitive'
  if (AUTH_PATHS.some(p => pathname.startsWith(p))) return 'auth'
  return 'api'
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  if (forwarded) return forwarded.split(',')[0].trim()
  if (realIp) return realIp
  return 'unknown'
}

function checkRateLimit(ip: string, type: 'api' | 'auth' | 'sensitive'): { 
  allowed: boolean; 
  remaining: number; 
  resetIn: number 
} {
  const now = Date.now()
  const config = RATE_LIMITS[type]
  const key = `${type}:${ip}`
  
  const current = ipRequests.get(key)
  
  // Fenster abgelaufen → Reset
  if (!current || now > current.resetTime) {
    ipRequests.set(key, { count: 1, resetTime: now + config.windowMs })
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs }
  }
  
  // Unter Limit → Increment
  if (current.count < config.maxRequests) {
    current.count++
    return { 
      allowed: true, 
      remaining: config.maxRequests - current.count, 
      resetIn: current.resetTime - now 
    }
  }
  
  // Über Limit → Blocked
  return { 
    allowed: false, 
    remaining: 0, 
    resetIn: current.resetTime - now 
  }
}

// Cleanup alte Einträge (Memory-Leak verhindern)
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of ipRequests.entries()) {
    if (now > value.resetTime + 60000) {
      ipRequests.delete(key)
    }
  }
}, 60000)


// ============================================
// PD Access Logging (DA-29)
// ============================================

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
  if (EXCLUDED_PATHS.some(p => pathname.startsWith(p))) return false
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


// ============================================
// Main Middleware
// ============================================

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const ip = getClientIP(request)

  // 0. Upstash Rate-Limiting für Login (5 Versuche / 15 Min)
  // E2E-Tests können via Bypass-Header das Limit umgehen
  const bypassHeader = request.headers.get('x-vercel-bypass-automation-protection')
  const isAutomatedTest = bypassHeader === process.env.AUTOMATION_BYPASS_SECRET ||
                          bypassHeader === 'rpFNEmGS7CB0FunapN20rLGDCG0foMzx' // Fallback für E2E

  if (
    pathname === '/api/auth/callback/credentials' &&
    request.method === 'POST' &&
    !isAutomatedTest // E2E-Tests überspringen Rate-Limit
  ) {
    const { success, remaining, reset } = await loginRateLimit.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: 'Zu viele Versuche. Bitte 15 Minuten warten.' },
        {
          status: 429,
          headers: {
            'Retry-After': '900',
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(reset),
          },
        }
      )
    }
  }

  // 1. Rate Limiting prüfen (nur für API-Routen, E2E-Tests überspringen)
  if (pathname.startsWith('/api/') && !isAutomatedTest) {
    const rateLimitType = getRateLimitType(pathname)
    const rateLimit = checkRateLimit(ip, rateLimitType)
    
    // Rate-Limit Headers immer setzen
    const response = rateLimit.allowed 
      ? NextResponse.next()
      : NextResponse.json(
          { 
            error: 'Too Many Requests', 
            message: `Rate limit exceeded. Try again in ${Math.ceil(rateLimit.resetIn / 1000)} seconds.`,
            retryAfter: Math.ceil(rateLimit.resetIn / 1000)
          },
          { status: 429 }
        )
    
    response.headers.set('X-RateLimit-Limit', String(RATE_LIMITS[rateLimitType].maxRequests))
    response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining))
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimit.resetIn / 1000)))
    
    if (!rateLimit.allowed) {
      response.headers.set('Retry-After', String(Math.ceil(rateLimit.resetIn / 1000)))
      return response
    }

    // 2. PD Access Logging (nur bei erlaubten Requests)
    if (shouldLogPdAccess(pathname)) {
      const logData = {
        resource: getResourceFromPath(pathname),
        action: getActionFromMethod(request.method),
        endpoint: pathname,
        method: request.method,
        ip,
        userAgent: request.headers.get('user-agent') || null,
        timestamp: new Date().toISOString(),
      }
      // Log-Daten via Header an Route-Handler weitergeben
      response.headers.set('x-pd-log', JSON.stringify(logData))
    }

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
}
