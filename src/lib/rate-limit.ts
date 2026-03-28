/**
 * Einfaches In-Memory Rate-Limiting.
 * Für Produktion: Redis verwenden (Upstash/Vercel KV).
 */

const requests = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxRequests = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = requests.get(key);

  if (!entry || now > entry.resetAt) {
    requests.set(key, { count: 1, resetAt: now + windowMs });
    return true; // OK
  }

  if (entry.count >= maxRequests) {
    return false; // Limit überschritten
  }

  entry.count++;
  return true;
}

// Cleanup: alte Einträge alle 5 Minuten entfernen
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of requests.entries()) {
      if (now > entry.resetAt) requests.delete(key);
    }
  }, 5 * 60_000);
}
