"use client"

import { Sidebar } from "./Sidebar"

interface AppShellProps {
  children: React.ReactNode
  title?: string
}

export function AppShell({ children, title }: AppShellProps) {
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
    </div>
  )
}
