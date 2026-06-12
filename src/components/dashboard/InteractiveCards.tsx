"use client"

import Link from "next/link"
import { type ReactNode } from "react"

export function StatCard({ label, value, icon, href, alert }: {
  label: string; value: string; icon: ReactNode; href: string; alert?: boolean
}) {
  return (
    <Link
      href={href}
      className="block bento-card p-5 cursor-pointer transition hover:opacity-80 hover:ring-2 hover:ring-[#8CAA1F]/30"
      style={alert ? { backgroundColor: "rgba(186,26,26,0.05)", borderColor: "rgba(186,26,26,0.2)" } : undefined}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[10px] font-bold uppercase"
          style={{ color: "var(--color-on-surface-variant)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}
        >
          {label}
        </span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: alert ? "rgba(186,26,26,0.1)" : "var(--color-primary-container)" }}>{icon}</div>
      </div>
      <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)", color: alert ? "var(--color-error)" : "var(--color-on-surface)" }}>{value}</p>
    </Link>
  )
}

export function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="block px-3 py-2 rounded-lg text-sm tonal-transition" style={{ color: "var(--color-on-surface-variant)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-surface-container)"; (e.currentTarget as HTMLElement).style.color = "var(--color-primary)" }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--color-on-surface-variant)" }}
    >{label}</Link>
  )
}

export function HoverLink({ href, children, className, bgColor }: { href: string; children: ReactNode; className?: string; bgColor?: string }) {
  return (
    <Link href={href} className={`tonal-transition ${className ?? ""}`}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--color-surface-container)")}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = bgColor ?? "transparent")}
    >{children}</Link>
  )
}

export function HoverActionCard({ label, href, icon, desc }: { label: string; href: string; icon: string; desc: string }) {
  return (
    <Link href={href} className="flex flex-col gap-1 p-4 rounded-xl tonal-transition ambient-shadow-md"
      style={{ backgroundColor: "var(--color-surface-container-low)" }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--color-surface-container)")}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--color-surface-container-low)")}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-semibold mt-1" style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-display)" }}>{label}</span>
      <span className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>{desc}</span>
    </Link>
  )
}
