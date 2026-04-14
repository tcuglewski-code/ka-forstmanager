"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
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
  Plus,
  TreeDeciduous,
  MessageCircle,
  Bell,
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
  { href: "/saatguternte/baumschulen", label: "Baumschulen", icon: TreeDeciduous },
  { href: "/kontakte", label: "Kontakte", icon: MapPin },
  { href: "/wissensbank", label: "Wissensbank", icon: BookOpen },
  { href: "/foerderung", label: "Förderberater", icon: Leaf },
  { href: "/foerderung/news", label: "Aktuelle Updates", icon: Bell },
  { href: "/foerderung/praxis", label: "Unsere Erfahrungen", icon: BookOpen },
  { href: "/foerderung/dashboard", label: "Erfolgsquoten", icon: BarChart3 },
  { href: "/reports", label: "Reports", icon: BarChart3, tourId: "reports" },
  { href: "/jahresuebersicht", label: "Jahresübersicht", icon: BarChart3 },
  { href: "/einstellungen", label: "Einstellungen", icon: Settings, tourId: "einstellungen" },
  { href: "/einstellungen/telegram", label: "Telegram", icon: MessageCircle },
]

const saatgutSubItems = [
  { href: "/saatguternte/register", label: "Register-Übersicht", icon: List },
  { href: "/saatguternte/planung", label: "Flächenplanung", icon: Map },
  { href: "/saatguternte/ernte", label: "Erntehistorie", icon: History },
  { href: "/saatguternte/anfragen", label: "Ernteanfragen", icon: ClipboardCheck },
  { href: "/saatguternte/gruppen", label: "Gruppen", icon: UsersRound },
  { href: "/saatguternte/vertrag", label: "Verträge", icon: FileText },
  { href: "/saatguternte/baumschulen", label: "Baumschulen", icon: TreeDeciduous },
  { href: "/saatguternte/crawler", label: "Crawler", icon: Bot },
]

/* ================================================================
   Koch Aufforstung Logo — Hexagon SVG
   ================================================================ */
function KaLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 60 60" fill="none" aria-hidden="true">
      <path d="M30 3L55.98 18V48L30 57L4.02 48V18L30 3Z" fill="#1C3D2E" />
      <line x1="16" y1="35" x2="32" y2="16" stroke="#C8852A" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="22" y1="42" x2="42" y2="18" stroke="#C8852A" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="30" y1="47" x2="50" y2="24" stroke="#C8852A" strokeWidth="2.5" strokeLinecap="round" opacity={0.55} />
    </svg>
  )
}

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
      case "ka_admin": return "Admin"
      case "ka_gruppenführer": return "Gruppenführer"
      case "ka_mitarbeiter": return "Mitarbeiter"
      case "baumschule": return "Baumschule"
      default: return role || ""
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const openSearch = () => {
    const event = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
    document.dispatchEvent(event)
  }

  const openShortcuts = () => {
    const event = new KeyboardEvent("keydown", { key: "/", metaKey: true, bubbles: true })
    document.dispatchEvent(event)
  }

  /* ── Shared style helpers ── */
  const navItemBase =
    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all tonal-transition cursor-pointer"

  const navItemActive = {
    backgroundColor: "var(--sidebar-active)",
    color: "#ffffff",
    fontWeight: 600,
  } as const

  const navItemDefault = {
    color: "var(--sidebar-text)",
  } as const

  const subNavItemBase =
    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all tonal-transition"

  return (
    <>
      {/* Hamburger — Mobile only */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl border"
        style={{
          backgroundColor: "var(--color-surface-container)",
          borderColor: "var(--color-outline-variant)",
          color: "var(--color-on-surface-variant)",
        }}
        aria-label="Menü öffnen"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay — Mobile */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-60 flex flex-col z-40 transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
        style={{ backgroundColor: "var(--sidebar-bg)" }}
      >
        {/* Close Button — Mobile only */}
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-1"
          style={{ color: "var(--sidebar-text-muted)" }}
          aria-label="Menü schließen"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ── Brand ── */}
        <div
          className="px-5 py-5 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-3">
            <KaLogo />
            <div>
              <p
                className="text-sm font-bold leading-tight tracking-tight"
                style={{ color: "#ffffff", fontFamily: "var(--font-display)" }}
              >
                ForstManager
              </p>
              <p className="text-xs leading-tight mt-0.5" style={{ color: "var(--sidebar-text-muted)" }}>
                Koch Aufforstung
              </p>
            </div>
          </div>
        </div>

        {/* ── Schnellsuche ── */}
        <div className="px-3 pt-3 flex-shrink-0">
          <button
            onClick={openSearch}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all"
            style={{
              backgroundColor: "rgba(255,255,255,0.06)",
              color: "var(--sidebar-text-muted)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)")}
          >
            <Search className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left" style={{ fontFamily: "var(--font-body)" }}>
              Suchen…
            </span>
            <kbd
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px]"
              style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "var(--sidebar-text-muted)" }}
            >
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                data-tour={item.tourId}
                className={navItemBase}
                style={isActive ? navItemActive : navItemDefault}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--sidebar-hover)"
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"
                }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem" }}>
                  {item.label}
                </span>
              </Link>
            )
          })}

          {/* ── Saatguternte Sub-Menü ── */}
          <div>
            <button
              onClick={() => setSaatgutOpen((v) => !v)}
              className={cn(navItemBase, "w-full")}
              style={isSaatgutActive ? navItemActive : navItemDefault}
              onMouseEnter={e => {
                if (!isSaatgutActive) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--sidebar-hover)"
              }}
              onMouseLeave={e => {
                if (!isSaatgutActive) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"
              }}
            >
              <Leaf className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left" style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem" }}>
                Saatguternte
              </span>
              {saatgutOpen ? (
                <ChevronDown className="w-3.5 h-3.5" style={{ color: "var(--sidebar-text-muted)" }} />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" style={{ color: "var(--sidebar-text-muted)" }} />
              )}
            </button>

            {saatgutOpen && (
              <div
                className="mt-0.5 ml-3 pl-3 space-y-0.5"
                style={{ borderLeft: "1px solid rgba(255,255,255,0.1)" }}
              >
                {saatgutSubItems.map((sub) => {
                  const SubIcon = sub.icon
                  const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + "/")
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={() => setOpen(false)}
                      className={subNavItemBase}
                      style={isSubActive ? navItemActive : { color: "var(--sidebar-text-muted)" }}
                      onMouseEnter={e => {
                        if (!isSubActive) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = "var(--sidebar-hover)"
                          ;(e.currentTarget as HTMLElement).style.color = "var(--sidebar-text)"
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isSubActive) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"
                          ;(e.currentTarget as HTMLElement).style.color = "var(--sidebar-text-muted)"
                        }
                      }}
                    >
                      <SubIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span style={{ fontFamily: "var(--font-body)" }}>{sub.label}</span>
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
              className={navItemBase}
              style={
                pathname === "/admin/benutzer" ? navItemActive : navItemDefault
              }
              onMouseEnter={e => {
                if (pathname !== "/admin/benutzer") (e.currentTarget as HTMLElement).style.backgroundColor = "var(--sidebar-hover)"
              }}
              onMouseLeave={e => {
                if (pathname !== "/admin/benutzer") (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"
              }}
            >
              <Shield className="w-4 h-4 flex-shrink-0" />
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem" }}>Benutzerverwaltung</span>
            </Link>
          )}
        </nav>

        {/* ── Quick Actions ── */}
        <div className="px-3 pb-2 flex-shrink-0 space-y-0.5">
          <button
            onClick={openShortcuts}
            className={cn(navItemBase, "w-full")}
            style={{ color: "var(--sidebar-text-muted)" }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLElement).style.backgroundColor = "var(--sidebar-hover)"
              ;(e.currentTarget as HTMLElement).style.color = "var(--sidebar-text)"
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLElement).style.backgroundColor = "transparent"
              ;(e.currentTarget as HTMLElement).style.color = "var(--sidebar-text-muted)"
            }}
          >
            <Keyboard className="w-4 h-4" />
            <span className="flex-1 text-left" style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem" }}>
              Tastenkürzel
            </span>
            <kbd
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px]"
              style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "var(--sidebar-text-muted)" }}
            >
              <Command className="w-2.5 h-2.5" />/
            </kbd>
          </button>
          <button
            onClick={() => { setOpen(false); resetAndStartTour() }}
            className={cn(navItemBase, "w-full")}
            style={{ color: "var(--sidebar-text-muted)" }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLElement).style.backgroundColor = "var(--sidebar-hover)"
              ;(e.currentTarget as HTMLElement).style.color = "var(--sidebar-text)"
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLElement).style.backgroundColor = "transparent"
              ;(e.currentTarget as HTMLElement).style.color = "var(--sidebar-text-muted)"
            }}
          >
            <HelpCircle className="w-4 h-4" />
            <span className="flex-1 text-left" style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem" }}>
              Tour starten
            </span>
          </button>
        </div>

        {/* ── CTA: Neuer Auftrag ── */}
        <div className="px-3 pb-3 flex-shrink-0">
          <Link
            href="/auftraege/neu"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              backgroundColor: "var(--sidebar-active)",
              color: "#ffffff",
              fontFamily: "var(--font-display)",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            <Plus className="w-4 h-4" />
            Neuer Auftrag
          </Link>
        </div>

        {/* ── User Menu ── */}
        <div
          className="p-3 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          ref={userMenuRef}
        >
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all"
              style={{ color: "var(--sidebar-text)" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--sidebar-hover)")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
              >
                {(user as { avatar?: string })?.avatar ? (
                  <img
                    src={(user as { avatar?: string }).avatar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4" style={{ color: "var(--sidebar-text-muted)" }} />
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p
                  className="text-sm truncate"
                  style={{
                    color: "var(--sidebar-text)",
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                  }}
                >
                  {user?.name || "Benutzer"}
                </p>
                <p className="text-xs flex items-center gap-1" style={{ color: "var(--sidebar-text-muted)" }}>
                  {isAdmin && <Shield className="w-3 h-3" style={{ color: "#52a87e" }} />}
                  {getRoleLabel(userRole)}
                </p>
              </div>
              <ChevronDown
                className={cn("w-4 h-4 transition-transform", userMenuOpen && "rotate-180")}
                style={{ color: "var(--sidebar-text-muted)" }}
              />
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <div
                className="absolute bottom-full left-0 right-0 mb-2 rounded-xl shadow-xl overflow-hidden"
                style={{
                  backgroundColor: "#0d2b1f",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 -8px 32px rgba(0,0,0,0.3)",
                }}
              >
                <Link
                  href="/profil"
                  onClick={() => { setUserMenuOpen(false); setOpen(false) }}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm transition-all"
                  style={{ color: "var(--sidebar-text)" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--sidebar-hover)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <User className="w-4 h-4" />
                  Mein Profil
                </Link>
                <button
                  onClick={() => { setUserMenuOpen(false); openShortcuts() }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all"
                  style={{ color: "var(--sidebar-text)" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--sidebar-hover)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Keyboard className="w-4 h-4" />
                  Tastenkürzel
                </button>
                <button
                  onClick={() => { setUserMenuOpen(false); setOpen(false); resetAndStartTour() }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all"
                  style={{ color: "var(--sidebar-text)" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--sidebar-hover)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <HelpCircle className="w-4 h-4" />
                  Tour starten
                </button>
                {isAdmin && (
                  <Link
                    href="/admin/benutzer"
                    onClick={() => { setUserMenuOpen(false); setOpen(false) }}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm transition-all"
                    style={{ color: "var(--sidebar-text)" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--sidebar-hover)")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <Shield className="w-4 h-4" />
                    Benutzerverwaltung
                  </Link>
                )}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all"
                    style={{ color: "#f87171" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(186,26,26,0.15)")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <LogOut className="w-4 h-4" />
                    Abmelden
                  </button>
                </div>
              </div>
            )}
          </div>

          <p
            className="text-[10px] px-3 mt-2"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            Koch Aufforstung GmbH
          </p>
          <div className="text-[10px] px-3 mt-1 flex gap-2" style={{ color: "rgba(255,255,255,0.2)" }}>
            <a 
              href="https://peru-otter-113714.hostingersite.com/datenschutz/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-60 transition-opacity underline"
            >
              Datenschutz
            </a>
            <a 
              href="https://peru-otter-113714.hostingersite.com/impressum/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-60 transition-opacity underline"
            >
              Impressum
            </a>
          </div>
        </div>
      </aside>
    </>
  )
}
