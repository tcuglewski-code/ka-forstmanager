"use client"

import { useCallback, useEffect, useState } from "react"

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

export function useNotifications(pollMs = 60_000) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    if (!pollMs) return
    const t = setInterval(load, pollMs)
    return () => clearInterval(t)
  }, [load, pollMs])

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    setUnreadCount((c) => Math.max(0, c - 1))
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" })
  }, [])

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    })
  }, [])

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh: load }
}
