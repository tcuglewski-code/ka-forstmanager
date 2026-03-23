"use client"

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
  Wrench,
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
} from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, active: true },
  { href: "/auftraege", label: "Aufträge", icon: ClipboardList, active: true },
  { href: "/saisons", label: "Saisons", icon: Calendar, active: true },
  { href: "/mitarbeiter", label: "Mitarbeiter", icon: Users, active: true },
  { href: "/gruppen", label: "Gruppen", icon: UsersRound, active: true },
  { href: "/lager", label: "Lager", icon: Package, active: true },
  { href: "/fuhrpark", label: "Fuhrpark", icon: Car, active: true },
  { href: "/geraete", label: "Geräte", icon: Wrench, active: true },
  { href: "/lohn", label: "Lohn", icon: DollarSign, active: true },
  { href: "/stunden", label: "Stunden", icon: Clock, active: false },
  { href: "/qualifikationen", label: "Qualifikationen", icon: GraduationCap, active: false },
  { href: "/schulungen", label: "Schulungen", icon: BookOpen, active: false },
  { href: "/dokumente", label: "Dokumente", icon: FileText, active: false },
  { href: "/abnahmen", label: "Abnahmen", icon: CheckSquare, active: false },
  { href: "/reports", label: "Reports", icon: BarChart3, active: false },
  { href: "/kontakte", label: "Kontakte", icon: MapPin, active: true },
  { href: "/einstellungen", label: "Einstellungen", icon: Settings, active: false },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-[#161616] border-r border-[#2a2a2a] flex flex-col z-30">
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

          if (!item.active) {
            return (
              <div
                key={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-600 cursor-not-allowed select-none"
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
                <span className="ml-auto text-[10px] bg-zinc-800 text-zinc-600 px-1.5 py-0.5 rounded">
                  Bald
                </span>
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
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
  )
}
