/**
 * Analytics Event Definitions — ForstManager
 * Typisierte Events für Product Analytics (PostHog)
 * TODO: PostHog-Key in ENV setzen, dann Track-Calls aktivieren
 */

export const AnalyticsEvents = {
  // Auth Events
  LOGIN: 'user_login',
  LOGOUT: 'user_logout',
  LOGIN_FAILED: 'user_login_failed',
  MFA_SETUP: 'user_mfa_setup',

  // Auftrags-Events
  AUFTRAG_CREATED: 'auftrag_created',
  AUFTRAG_UPDATED: 'auftrag_updated',
  AUFTRAG_COMPLETED: 'auftrag_completed',
  AUFTRAG_DELETED: 'auftrag_deleted',

  // Protokoll-Events
  PROTOKOLL_CREATED: 'protokoll_created',
  PROTOKOLL_SUBMITTED: 'protokoll_submitted',

  // Rechnungs-Events
  RECHNUNG_CREATED: 'rechnung_created',
  RECHNUNG_EXPORTED: 'rechnung_exported',
  RECHNUNG_XRECHNUNG: 'rechnung_xrechnung_exported',
  RECHNUNG_GOBD_EXPORT: 'rechnung_gobd_export',

  // Wizard/KI-Events
  WIZARD_STARTED: 'wizard_started',
  WIZARD_COMPLETED: 'wizard_completed',
  WIZARD_ABANDONED: 'wizard_abandoned',
  KI_QUERY: 'ki_query_sent',
  KI_RESPONSE: 'ki_response_received',

  // Feature Usage
  MAP_VIEWED: 'map_viewed',
  SOS_TRIGGERED: 'sos_triggered',
  EXPORT_DOWNLOADED: 'export_downloaded',
  SETTINGS_CHANGED: 'settings_changed',
} as const;

export type AnalyticsEvent = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Track an analytics event
 * TODO: Replace with PostHog.capture() when NEXT_PUBLIC_POSTHOG_KEY is set
 */
export function trackEvent(event: AnalyticsEvent, properties?: EventProperties): void {
  // TODO: Activate when PostHog is configured
  // if (typeof window !== 'undefined' && window.posthog) {
  //   window.posthog.capture(event, properties);
  // }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${event}`, properties || '');
  }
}

/**
 * Track page view
 */
export function trackPageView(pageName: string, properties?: EventProperties): void {
  trackEvent('$pageview' as AnalyticsEvent, { page: pageName, ...properties });
}

// TODO: Add track calls at these 5 key locations:
// 1. src/app/(auth)/login/page.tsx → trackEvent(AnalyticsEvents.LOGIN) on successful login
// 2. src/app/(dashboard)/auftraege/page.tsx → trackEvent(AnalyticsEvents.AUFTRAG_CREATED) on create
// 3. src/app/(dashboard)/protokolle/page.tsx → trackEvent(AnalyticsEvents.PROTOKOLL_CREATED) on create
// 4. src/app/(dashboard)/rechnungen/page.tsx → trackEvent(AnalyticsEvents.RECHNUNG_CREATED) on create
// 5. src/components/betriebs-assistent/ → trackEvent(AnalyticsEvents.KI_QUERY) on query
