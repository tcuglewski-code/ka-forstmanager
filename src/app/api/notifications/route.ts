import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getReads, markAll } from "@/lib/notifications-store"

export const dynamic = "force-dynamic"

export type NotificationType =
  | "auftrag_neu"
  | "signatur_faellig"
  | "lager_warnung"
  | "system"

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: string
  link?: string
}

// BUG-FIX: echte Benachrichtigungen aus DB statt demoNotifications()
async function buildNotifications(): Promise<NotificationItem[]> {
  const items: NotificationItem[] = []
  const now = Date.now()
  const nowIso = new Date(now).toISOString()

  const [lagerWarnungen, offeneAbnahmen, neueAuftraege, stundenPending] = await Promise.all([
    // 1. Lager unter Mindestbestand (field-zu-field Vergleich → queryRaw)
    prisma.$queryRaw<
      { id: string; name: string; bestand: number; mindestbestand: number }[]
    >`SELECT id, name, bestand, mindestbestand FROM "LagerArtikel" WHERE bestand < mindestbestand AND "deletedAt" IS NULL LIMIT 5`.catch(
      () => []
    ),
    // 2. Abnahmen ausstehend
    prisma.abnahme.count({ where: { status: "offen" } }).catch(() => 0),
    // 3. Neue Aufträge (letzte 24h)
    prisma.auftrag
      .findMany({
        where: { createdAt: { gte: new Date(now - 24 * 60 * 60 * 1000) }, deletedAt: null },
        select: { id: true, titel: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      })
      .catch(() => []),
    // 4. Stunden ausstehend
    prisma.stundeneintrag.count({ where: { genehmigt: false } }).catch(() => 0),
  ])

  for (const artikel of lagerWarnungen) {
    items.push({
      id: `lager-${artikel.id}`,
      type: "lager_warnung",
      title: "Lagerbestand niedrig",
      message: `${artikel.name}: ${artikel.bestand} (unter Mindestbestand ${artikel.mindestbestand})`,
      read: false,
      createdAt: nowIso,
      link: "/lager",
    })
  }

  if (offeneAbnahmen > 0) {
    items.push({
      id: "abnahmen-ausstehend",
      type: "signatur_faellig",
      title: "Abnahmen ausstehend",
      message: `${offeneAbnahmen} Abnahme${offeneAbnahmen > 1 ? "n" : ""} wartet auf Bestätigung`,
      read: false,
      createdAt: nowIso,
      link: "/abnahmen?status=offen",
    })
  }

  for (const auftrag of neueAuftraege) {
    items.push({
      id: `auftrag-${auftrag.id}`,
      type: "auftrag_neu",
      title: "Neuer Auftrag eingegangen",
      message: auftrag.titel,
      read: false,
      createdAt: auftrag.createdAt.toISOString(),
      link: `/auftraege/${auftrag.id}`,
    })
  }

  if (stundenPending > 0) {
    items.push({
      id: "stunden-ausstehend",
      type: "system",
      title: "Stunden ausstehend",
      message: `${stundenPending} Stundeneintr${stundenPending > 1 ? "äge" : "ag"} nicht genehmigt`,
      read: false,
      createdAt: nowIso,
      link: "/stunden?filter=ausstehend",
    })
  }

  return items
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const reads = getReads(session.user.id)
  const items = (await buildNotifications()).map((n) => ({
    ...n,
    read: n.read || reads.has(n.id),
  }))
  return NextResponse.json({
    notifications: items,
    unreadCount: items.filter((n) => !n.read).length,
  })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const all = body?.all === true
  if (all) {
    markAll(
      session.user.id,
      (await buildNotifications()).map((n) => n.id)
    )
  }
  return NextResponse.json({ ok: true })
}
