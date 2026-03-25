/**
 * POST /api/auftraege/cleanup-wp
 * Löscht alle WP-Posts die in der sync_blocked_wp_ids Blockliste stehen
 * (= in FM gelöschte Aufträge, die noch auf der WP-Website sichtbar sind)
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const WP_CLEANUP_URL = "https://peru-otter-113714.hostingersite.com/wp-json/ka/v1/wp-projekt"
const WP_FM_SECRET = process.env.WP_FM_SECRET ?? "ka-forstmanager-sync-2026"

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

    // Bulk-Delete via Custom Endpoint (batches of 20)
    const BATCH_SIZE = 20
    for (let i = 0; i < blockedWpIds.length; i += BATCH_SIZE) {
      const batch = blockedWpIds.slice(i, i + BATCH_SIZE)
      try {
        const res = await fetch(`${WP_CLEANUP_URL}/bulk-delete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-FM-Secret": WP_FM_SECRET,
          },
          body: JSON.stringify({ ids: batch }),
        })
        if (res.ok) {
          const data = await res.json() as { deleted: number; not_found: number }
          deleted += data.deleted + (data.not_found ?? 0) // not_found = already gone
        } else {
          failed += batch.length
          errors.push(...batch.map(id => ({ id, status: res.status })))
        }
      } catch (err) {
        failed += batch.length
        console.warn(`[cleanup-wp] Batch ${i}-${i + BATCH_SIZE} Fehler:`, err)
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
