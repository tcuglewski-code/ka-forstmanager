"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
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
  ClipboardCheck,
  Search,
  Keyboard,
  HelpCircle,
  User,
  Shield,
  Command,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { resetAndStartTour } from "@/components/tour/ForstManagerTour"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tourId: "dashboard" },
  { href: "/auftraege", label: "Aufträge", icon: ClipboardList, tourId: "auftraege" },
  { href: "/angebote", label: "Angebote", icon: FileText },
  { href: "/saisons", label: "Saisons", icon: Calendar },
  { href: "/mitarbeiter", label: "Mitarbeiter", icon: Users, tourId: "mitarbeiter" },
  { href: "/gruppen", label: "Gruppen", icon: UsersRound },
  { href: "/lager", label: "Lager", icon: Package, tourId: "lager" },
  { href: "/fuhrpark", label: "Fuhrpark", icon: Car },
  { href: "/lohn", label: "Lohn", icon: DollarSign },
  { href: "/stunden", label: "Stunden", icon: Clock },
  { href: "/vorschuesse", label: "Vorschüsse", icon: TrendingDown },
  { href: "/rechnungen", label: "Rechnungen", icon: Receipt, tourId: "rechnungen" },
  { href: "/qualifikationen", label: "Qualifikationen", icon: GraduationCap },
  { href: "/schulungen", label: "Schulungen", icon: BookOpen },
  { href: "/dokumente", label: "Dokumente", icon: FileText },
  { href: "/protokolle", label: "Protokolle", icon: ScrollText, tourId: "protokolle" },
  { href: "/abnahmen", label: "Abnahmen", icon: CheckSquare, tourId: "abnahmen" },
  { href: "/kontakte", label: "Kontakte", icon: MapPin },
  { href: "/wissensbank", label: "Wissensbank", icon: BookOpen },
  { href: "/foerderung", label: "Förderberater", icon: Leaf },
  { href: "/foerderung/praxis", label: "Unsere Erfahrungen", icon: BookOpen },
  { href: "/foerderung/dashboard", label: "Erfolgsquoten", icon: BarChart3 },
  { href: "/reports", label: "Reports", icon: BarChart3, tourId: "reports" },
  { href: "/jahresuebersicht", label: "Jahresübersicht", icon: BarChart3 },
  { href: "/einstellungen", label: "Einstellungen", icon: Settings, tourId: "einstellungen" },
]

const saatgutSubItems = [
  { href: "/saatguternte/register", label: "Register-Übersicht", icon: List },
  { href: "/saatguternte/planung", label: "Flächenplanung", icon: Map },
  { href: "/saatguternte/ernte", label: "Erntehistorie", icon: History },
  { href: "/saatguternte/anfragen", label: "Ernteanfragen", icon: ClipboardCheck },
  { href: "/saatguternte/gruppen", label: "Gruppen", icon: UsersRound },
  { href: "/saatguternte/vertrag", label: "Verträge", icon: FileText },
  { href: "/saatguternte/crawler", label: "Crawler", icon: Bot },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const isSaatgutActive = pathname.startsWith("/saatguternte")
  const [saatgutOpen, setSaatgutOpen] = useState(isSaatgutActive)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const user = session?.user
  const userRole = (user as { role?: string })?.role
  const isAdmin = userRole === "ka_admin" || userRole === "admin"

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "ka_admin":
        return "Admin"
      case "ka_gruppenführer":
        return "Gruppenführer"
      case "ka_mitarbeiter":
        return "Mitarbeiter"
      case "baumschule":
        return "Baumschule"
      default:
        return role || ""
    }
  }

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Keyboard shortcut handler für Schnellsuche und Shortcuts
  const openSearch = () => {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    })
    document.dispatchEvent(event)
  }

  const openShortcuts = () => {
    const event = new KeyboardEvent("keydown", {
      key: "/",
      metaKey: true,
      bubbles: true,
    })
    document.dispatchEvent(event)
  }

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

        {/* Schnellsuche Button */}
        <div className="px-3 pt-3">
          <button
            onClick={openSearch}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-[#1e1e1e] hover:text-white transition-all border border-[#2a2a2a]"
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">Suchen...</span>
            <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#2a2a2a] rounded text-[10px] text-zinc-500">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </button>
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
                data-tour={item.tourId}
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

          {/* Admin: Benutzerverwaltung */}
          {isAdmin && (
            <Link
              href="/admin/benutzer"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                pathname === "/admin/benutzer"
                  ? "bg-[#2C3A1C] text-emerald-400 font-medium"
                  : "text-zinc-400 hover:bg-[#1e1e1e] hover:text-white"
              )}
            >
              <Shield className="w-4 h-4 flex-shrink-0" />
              <span>Benutzerverwaltung</span>
            </Link>
          )}
        </nav>

        {/* Quick Actions */}
        <div className="px-3 pb-2 space-y-0.5">
          <button
            onClick={openShortcuts}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-[#1e1e1e] hover:text-white transition-all"
          >
            <Keyboard className="w-4 h-4" />
            <span className="flex-1 text-left">Tastenkürzel</span>
            <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#2a2a2a] rounded text-[10px] text-zinc-500">
              <Command className="w-2.5 h-2.5" />/
            </kbd>
          </button>
          <button
            onClick={() => {
              setOpen(false)
              resetAndStartTour()
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-[#1e1e1e] hover:text-white transition-all"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="flex-1 text-left">Tour starten</span>
          </button>
        </div>

        {/* User Menu */}
        <div className="p-3 border-t border-[#2a2a2a]" ref={userMenuRef}>
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1e1e1e] transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center overflow-hidden flex-shrink-0">
                {(user as { avatar?: string })?.avatar ? (
                  <img
                    src={(user as { avatar?: string }).avatar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-zinc-500" />
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm text-white truncate">{user?.name || "Benutzer"}</p>
                <p className="text-xs text-zinc-500 flex items-center gap-1">
                  {isAdmin && <Shield className="w-3 h-3 text-emerald-400" />}
                  {getRoleLabel(userRole)}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-zinc-500 transition-transform",
                  userMenuOpen && "rotate-180"
                )}
              />
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl overflow-hidden">
                <Link
                  href="/profil"
                  onClick={() => {
                    setUserMenuOpen(false)
                    setOpen(false)
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:bg-[#222] hover:text-white"
                >
                  <User className="w-4 h-4" />
                  Mein Profil
                </Link>
                <button
                  onClick={() => {
                    setUserMenuOpen(false)
                    openShortcuts()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:bg-[#222] hover:text-white"
                >
                  <Keyboard className="w-4 h-4" />
                  Tastenkürzel
                </button>
                <button
                  onClick={() => {
                    setUserMenuOpen(false)
                    setOpen(false)
                    resetAndStartTour()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:bg-[#222] hover:text-white"
                >
                  <HelpCircle className="w-4 h-4" />
                  Tour starten
                </button>
                {isAdmin && (
                  <Link
                    href="/admin/benutzer"
                    onClick={() => {
                      setUserMenuOpen(false)
                      setOpen(false)
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:bg-[#222] hover:text-white"
                  >
                    <Shield className="w-4 h-4" />
                    Benutzerverwaltung
                  </Link>
                )}
                <div className="border-t border-[#2a2a2a]">
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10"
                  >
                    <LogOut className="w-4 h-4" />
                    Abmelden
                  </button>
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-zinc-700 px-3 mt-2">Koch Aufforstung GmbH</p>
        </div>
      </aside>
    </>
  )
}
