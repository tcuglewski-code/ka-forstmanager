import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
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

export function demoNotifications(): NotificationItem[] {
  const now = Date.now()
  return [
    {
      id: "demo-1",
      type: "signatur_faellig",
      title: "Abnahme ausstehend",
      message: "Fläche Nordwald wartet auf Förster-Signatur",
      read: false,
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      link: "/abnahmen",
    },
    {
      id: "demo-2",
      type: "lager_warnung",
      title: "Lagerbestand niedrig",
      message: "Eichensetzlinge: 450 Stück (unter Mindestbestand 500)",
      read: false,
      createdAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
      link: "/lager",
    },
    {
      id: "demo-3",
      type: "auftrag_neu",
      title: "Neuer Auftrag eingegangen",
      message: "Aufforstung Südwald — 3,5 ha",
      read: true,
      createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      link: "/auftraege",
    },
    {
      id: "demo-4",
      type: "system",
      title: "System-Update",
      message: "Neue Features verfügbar: Analytics-Dashboard",
      read: true,
      createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      link: "/analytics",
    },
  ]
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const reads = getReads(session.user.id)
  const items = demoNotifications().map((n) => ({
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
      demoNotifications().map((n) => n.id)
    )
  }
  return NextResponse.json({ ok: true })
}
