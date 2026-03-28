"use client"

import { useState } from "react"
import { Sidebar } from "./Sidebar"
import { ForstManagerTour } from "@/components/tour/ForstManagerTour"
import { QuickSearch } from "@/components/search/QuickSearch"
import { KeyboardShortcuts } from "@/components/shortcuts/KeyboardShortcuts"

interface AppShellProps {
  children: React.ReactNode
  title?: string
}

export function AppShell({ children, title }: AppShellProps) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Sidebar />
      <div className="flex-1 ml-0 lg:ml-60">
        {title && (
          <header className="sticky top-0 z-20 bg-[#0f0f0f]/80 backdrop-blur border-b border-[#2a2a2a] px-8 py-4">
            <h1 className="text-lg font-semibold text-white">{title}</h1>
          </header>
        )}
        <main className="p-8">{children}</main>
      </div>

      {/* Global Components */}
      <ForstManagerTour autoStart={true} />
      <QuickSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <KeyboardShortcuts onOpenSearch={() => setSearchOpen(true)} />
    </div>
  )
}
