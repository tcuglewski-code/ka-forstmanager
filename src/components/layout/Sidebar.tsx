"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  TreePine,
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  Package,
  Car,
  DollarSign,
  Clock,
  GraduationCap,
  BookOpen,
  FileText,
  CheckSquare,
  BarChart3,
  MapPin,
  Settings,
  UsersRound,
  LogOut,
  Receipt,
  TrendingDown,
  ScrollText,
  Menu,
  X,
  Leaf,
  ChevronDown,
  ChevronRight,
  List,
  Map,
  History,
  Bot,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/auftraege", label: "Aufträge", icon: ClipboardList },
  { href: "/angebote", label: "Angebote", icon: FileText },
  { href: "/saisons", label: "Saisons", icon: Calendar },
  { href: "/mitarbeiter", label: "Mitarbeiter", icon: Users },
  { href: "/gruppen", label: "Gruppen", icon: UsersRound },
  { href: "/lager", label: "Lager", icon: Package },
  { href: "/fuhrpark", label: "Fuhrpark", icon: Car },
  { href: "/lohn", label: "Lohn", icon: DollarSign },
  { href: "/stunden", label: "Stunden", icon: Clock },
  { href: "/vorschuesse", label: "Vorschüsse", icon: TrendingDown },
  { href: "/rechnungen", label: "Rechnungen", icon: Receipt },
  { href: "/qualifikationen", label: "Qualifikationen", icon: GraduationCap },
  { href: "/schulungen", label: "Schulungen", icon: BookOpen },
  { href: "/dokumente", label: "Dokumente", icon: FileText },
  { href: "/protokolle", label: "Protokolle", icon: ScrollText },
  { href: "/abnahmen", label: "Abnahmen", icon: CheckSquare },
  { href: "/kontakte", label: "Kontakte", icon: MapPin },
  { href: "/wissensbank", label: "Wissensbank", icon: BookOpen },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/jahresuebersicht", label: "Jahresübersicht", icon: BarChart3 },
  { href: "/einstellungen", label: "Einstellungen", icon: Settings },
]

const saatgutSubItems = [
  { href: "/saatguternte/register", label: "Register-Übersicht", icon: List },
  { href: "/saatguternte/planung", label: "Flächenplanung", icon: Map },
  { href: "/saatguternte/ernte", label: "Erntehistorie", icon: History },
  { href: "/saatguternte/crawler", label: "Crawler", icon: Bot },
]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const isSaatgutActive = pathname.startsWith("/saatguternte")
  const [saatgutOpen, setSaatgutOpen] = useState(isSaatgutActive)

  return (
    <>
      {/* Hamburger Button — nur Mobile sichtbar */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#161616] border border-[#2a2a2a] rounded-lg text-zinc-400 hover:text-white"
        aria-label="Menü öffnen"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay — Mobile */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-60 bg-[#161616] border-r border-[#2a2a2a] flex flex-col z-40 transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        {/* Close Button — nur Mobile */}
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-1 text-zinc-500 hover:text-white"
          aria-label="Menü schließen"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand */}
        <div className="p-5 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2C3A1C] flex items-center justify-center flex-shrink-0">
              <TreePine className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">ForstManager</p>
              <p className="text-xs text-zinc-500 leading-tight">Koch Aufforstung</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                  isActive
                    ? "bg-[#2C3A1C] text-emerald-400 font-medium"
                    : "text-zinc-400 hover:bg-[#1e1e1e] hover:text-white"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}

          {/* Saatguternte mit Sub-Menü */}
          <div>
            <button
              onClick={() => setSaatgutOpen((v) => !v)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                isSaatgutActive
                  ? "bg-[#2C3A1C] text-emerald-400 font-medium"
                  : "text-zinc-400 hover:bg-[#1e1e1e] hover:text-white"
              )}
            >
              <Leaf className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">Saatguternte</span>
              {saatgutOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
            {saatgutOpen && (
              <div className="mt-0.5 ml-3 pl-3 border-l border-[#2a2a2a] space-y-0.5">
                {saatgutSubItems.map((sub) => {
                  const SubIcon = sub.icon
                  const isSubActive =
                    pathname === sub.href || pathname.startsWith(sub.href + "/")
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all",
                        isSubActive
                          ? "bg-[#2C3A1C] text-emerald-400 font-medium"
                          : "text-zinc-500 hover:bg-[#1e1e1e] hover:text-white"
                      )}
                    >
                      <SubIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{sub.label}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[#2a2a2a]">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-[#1e1e1e] hover:text-red-400 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Abmelden</span>
          </button>
          <p className="text-xs text-zinc-700 px-3 mt-2">Koch Aufforstung GmbH</p>
        </div>
      </aside>
    </>
  )
}
