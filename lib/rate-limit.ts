/**
 * Rate Limiting Configuration (Sprint SC-02)
 * Verwendet Upstash Redis für Serverless-kompatibles Rate-Limiting
 * 
 * ENV-Variablen benötigt:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Prüfe ob Upstash konfiguriert ist
const isUpstashConfigured = 
  process.env.UPSTASH_REDIS_REST_URL && 
  process.env.UPSTASH_REDIS_REST_TOKEN

// Redis Client (nur wenn konfiguriert)
const redis = isUpstashConfigured 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

/**
 * Standard Rate Limiter: 60 Requests pro Minute pro IP
 * Für allgemeine API-Routen
 */
export const apiRateLimiter = redis 
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      analytics: true,
      prefix: 'ratelimit:api',
    })
  : null

/**
 * Strenger Rate Limiter: 5 Requests pro Minute pro IP
 * Für Auth-Routen (Brute-Force-Schutz)
 */
export const authRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: 'ratelimit:auth',
    })
  : null

/**
 * Sehr strenger Rate Limiter: 3 Requests pro Minute
 * Für sensitive Operationen (Password Reset, 2FA Setup)
 */
export const sensitiveRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 m'),
      analytics: true,
      prefix: 'ratelimit:sensitive',
    })
  : null

/**
 * Hilfsfunktion: Extrahiert IP aus Request
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (realIp) {
    return realIp
  }
  return 'unknown'
}

/**
 * Status: Ist Rate-Limiting aktiv?
 */
export const isRateLimitingEnabled = isUpstashConfigured

/**
 * Rate-Limit Check Ergebnis
 */
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

/**
 * Prüft Rate-Limit für eine IP
 */
export async function checkRateLimit(
  ip: string,
  type: 'api' | 'auth' | 'sensitive' = 'api'
): Promise<RateLimitResult> {
  // Wenn Upstash nicht konfiguriert → immer erlauben
  if (!isUpstashConfigured) {
    return {
      success: true,
      limit: 60,
      remaining: 60,
      reset: Date.now() + 60000,
    }
  }

  const limiter = 
    type === 'auth' ? authRateLimiter :
    type === 'sensitive' ? sensitiveRateLimiter :
    apiRateLimiter

  if (!limiter) {
    return {
      success: true,
      limit: 60,
      remaining: 60,
      reset: Date.now() + 60000,
    }
  }

  const result = await limiter.limit(ip)
  
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
  }
}
