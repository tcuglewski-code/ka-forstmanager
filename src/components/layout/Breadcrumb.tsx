"use client"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href?: string
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-zinc-500 mb-6" aria-label="Breadcrumb">
      <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">Dashboard</Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3" />
          {item.href ? (
            <Link href={item.href} className="hover:text-zinc-300 transition-colors">{item.label}</Link>
          ) : (
            <span className="text-zinc-300">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
