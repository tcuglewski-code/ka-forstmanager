/**
 * Product Analytics - Posthog Integration
 * 
 * Feldhub Product Analytics Helper
 * DSGVO-konform mit EU Data Center
 * 
 * Konfiguration:
 * - NEXT_PUBLIC_POSTHOG_KEY: Posthog Project API Key
 * - NEXT_PUBLIC_POSTHOG_HOST: https://eu.posthog.com (EU Data Center)
 * 
 * @see /docs/product-analytics-posthog.md
 */

import posthog from 'posthog-js'

// Singleton check
let initialized = false

/**
 * Initialize Posthog (call once in app entry)
 * DSGVO: opt_out_capturing_by_default = true (Consent required)
 */
export function initAnalytics(): void {
  if (typeof window === 'undefined') return
  if (initialized) return
  
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.posthog.com'
  
  if (!apiKey) {
    console.debug('[Analytics] No NEXT_PUBLIC_POSTHOG_KEY configured - analytics disabled')
    return
  }
  
  posthog.init(apiKey, {
    api_host: host,
    capture_pageview: false, // Manual for App Router
    capture_pageleave: true,
    persistence: 'localStorage',
    // DSGVO: Opt-out by default, require consent
    opt_out_capturing_by_default: true,
    // Disable session recording until explicit consent
    disable_session_recording: true,
  })
  
  initialized = true
  console.debug('[Analytics] Posthog initialized (awaiting consent)')
}

/**
 * Check if analytics is enabled
 */
export function isAnalyticsEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return initialized && !posthog.has_opted_out_capturing?.()
}

// ============================================
// CONSENT MANAGEMENT (DSGVO Art. 6, Art. 7)
// ============================================

/**
 * User consents to analytics tracking
 * Call after user accepts analytics in cookie banner
 */
export function enableAnalytics(): void {
  if (!initialized) return
  posthog.opt_in_capturing()
  posthog.startSessionRecording?.()
  console.debug('[Analytics] Tracking enabled (user consent)')
}

/**
 * User revokes analytics consent
 * Call when user disables analytics in settings
 */
export function disableAnalytics(): void {
  if (!initialized) return
  posthog.opt_out_capturing()
  console.debug('[Analytics] Tracking disabled (user revoked)')
}

// ============================================
// USER IDENTIFICATION
// ============================================

/**
 * Identify user after login (pseudonymized)
 * @param userId - Internal user ID (NOT email)
 * @param traits - Optional user properties (no PII!)
 */
export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  if (!isAnalyticsEnabled()) return
  
  // Never include email, name, or other PII in traits
  const safeTraits = {
    role: traits?.role,
    tenantId: traits?.tenantId,
    plan: traits?.plan,
  }
  
  posthog.identify(userId, safeTraits)
}

/**
 * Reset user identity (call on logout)
 */
export function resetUser(): void {
  if (!initialized) return
  posthog.reset()
}

// ============================================
// PAGE TRACKING
// ============================================

/**
 * Track page view (for Next.js App Router)
 * @param url - Current page URL
 */
export function trackPageView(url: string): void {
  if (!isAnalyticsEnabled()) return
  posthog.capture('$pageview', { $current_url: url })
}

// ============================================
// CUSTOM EVENTS
// ============================================

/**
 * Track custom event
 * @param event - Event name (snake_case)
 * @param properties - Event properties (no PII!)
 */
export function track(event: string, properties?: Record<string, unknown>): void {
  if (!isAnalyticsEnabled()) return
  posthog.capture(event, properties)
}

// ============================================
// PREDEFINED EVENTS (Type-safe)
// ============================================

export const analytics = {
  // ---- User Events ----
  userLogin: (method: 'credentials' | 'biometric' | 'totp') =>
    track('user_login', { method, platform: 'web' }),
  
  userLogout: () =>
    track('user_logout', { platform: 'web' }),
  
  // ---- Wizard Events ----
  wizardStarted: (wizardType: string, referrer?: string) =>
    track('wizard_started', { wizard_type: wizardType, referrer }),
  
  wizardStepCompleted: (wizardType: string, step: number, durationS: number) =>
    track('wizard_step_completed', { 
      wizard_type: wizardType, 
      step, 
      duration_s: durationS 
    }),
  
  wizardCompleted: (wizardType: string, totalDurationS: number, result: string) =>
    track('wizard_completed', { 
      wizard_type: wizardType, 
      total_duration_s: totalDurationS, 
      result 
    }),
  
  wizardAbandoned: (wizardType: string, lastStep: number, durationS: number) =>
    track('wizard_abandoned', { 
      wizard_type: wizardType, 
      last_step: lastStep, 
      duration_s: durationS 
    }),
  
  // ---- Core Business Events ----
  auftragCreated: (auftragType: string, flaecheHa?: number) =>
    track('auftrag_created', { auftrag_type: auftragType, flaeche_ha: flaecheHa }),
  
  protokollSubmitted: (protokollType: string, mitarbeiterCount: number) =>
    track('protokoll_submitted', { 
      protokoll_type: protokollType, 
      mitarbeiter_count: mitarbeiterCount 
    }),
  
  rechnungCreated: (betragRange: string, kundeType: 'privat' | 'gewerblich') =>
    track('rechnung_created', { betrag_range: betragRange, kunde_type: kundeType }),
  
  // ---- KI/AI Events ----
  kiAssistentQuery: (queryType: string, responseTimeMs: number) =>
    track('ki_assistent_query', { 
      query_type: queryType, 
      response_time_ms: responseTimeMs 
    }),
  
  // ---- Export Events ----
  exportGenerated: (exportType: string, format: 'pdf' | 'csv' | 'xlsx' | 'json') =>
    track('export_generated', { export_type: exportType, format }),
  
  // ---- Feature Flag Events ----
  featureFlagEvaluated: (flagKey: string, variant: string, source: string) =>
    track('feature_flag_evaluated', { 
      flag_key: flagKey, 
      variant, 
      source 
    }),
}

export default analytics
