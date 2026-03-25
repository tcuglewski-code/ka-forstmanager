/**
 * POST /api/auftraege/cleanup-wp
 * Löscht alle WP-Posts die in der sync_blocked_wp_ids Blockliste stehen
 * (= in FM gelöschte Aufträge, die noch auf der WP-Website sichtbar sind)
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const WP_API_URL =
  "https://peru-otter-113714.hostingersite.com/wp-json/wp/v2/ka_projekt"
const WP_USER = process.env.WP_USER ?? "openclaw"
const WP_PASS = process.env.WP_PASSWORD ?? ""
const WP_AUTH = Buffer.from(`${WP_USER}:${WP_PASS}`).toString("base64")

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const config = await prisma.systemConfig.findUnique({ where: { key: "sync_blocked_wp_ids" } })
    const blockedWpIds: string[] = config?.value ? JSON.parse(config.value as string) : []

    if (blockedWpIds.length === 0) {
      return NextResponse.json({ message: "Keine blockierten WP-IDs gefunden.", deleted: 0, failed: 0 })
    }

    let deleted = 0
    let failed = 0
    const errors: { id: string; status: number }[] = []

    for (const wpId of blockedWpIds) {
      try {
        const res = await fetch(`${WP_API_URL}/${wpId}?force=true`, {
          method: "DELETE",
          headers: { Authorization: `Basic ${WP_AUTH}` },
        })
        if (res.ok || res.status === 404) {
          // 404 = already gone, that's fine
          deleted++
        } else {
          failed++
          errors.push({ id: wpId, status: res.status })
          console.warn(`[cleanup-wp] WP-Post ${wpId} → ${res.status}`)
        }
      } catch (err) {
        failed++
        console.warn(`[cleanup-wp] WP-Post ${wpId} Fehler:`, err)
      }
    }

    return NextResponse.json({
      total: blockedWpIds.length,
      deleted,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("[cleanup-wp]", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
