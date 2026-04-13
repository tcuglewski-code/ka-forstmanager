/**
 * Server-side input sanitization utility (defense-in-depth).
 * Strips HTML tags from string inputs to prevent stored XSS.
 * Prisma parameterizes queries, so SQL injection is already handled.
 */

const HTML_TAG_REGEX = /<[^>]*>/g

/** Strip all HTML tags from a string. Returns empty string for non-string input. */
export function stripHtml(input: unknown): string {
  if (typeof input !== "string") return ""
  return input.replace(HTML_TAG_REGEX, "").trim()
}

/** Sanitize all string values in a flat object (one level deep). */
export function sanitizeStrings<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj }
  for (const key in result) {
    if (typeof result[key] === "string") {
      ;(result as Record<string, unknown>)[key] = (result[key] as string)
        .replace(HTML_TAG_REGEX, "")
        .trim()
    }
  }
  return result
}
