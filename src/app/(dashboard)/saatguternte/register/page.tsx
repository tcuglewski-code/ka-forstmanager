export const dynamic = "force-dynamic"
export const revalidate = 0

import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Leaf, Bot, Filter, X } from "lucide-react"
import { RegisterTable } from "./RegisterTable"
import { Prisma } from "@prisma/client"

interface SearchParams {
  bundesland?: string
  baumart?: string
  quelleId?: string
  search?: string
  status?: string
  sonderherkunft?: string
  eigentumsart?: string
  page?: string
  sortBy?: string
  sortDir?: string
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1"))
  const limit = 25
  const skip = (page - 1) * limit
  const sortBy = params.sortBy ?? "registerNr"
  const sortDir = (params.sortDir === "asc" ? "asc" : "desc") as "asc" | "desc"

  // Filter aufbauen
  const where: Prisma.RegisterFlaecheWhereInput = {}

  if (params.bundesland) where.bundesland = params.bundesland
  if (params.baumart) where.baumart = { contains: params.baumart, mode: "insensitive" }
  if (params.quelleId) where.quelleId = params.quelleId
  if (params.status === "zugelassen") where.zugelassen = true
  if (params.status === "abgelaufen") where.zugelassen = false
  if (params.sonderherkunft === "true") where.sonderherkunft = true
  if (params.eigentumsart) where.eigentumsart = params.eigentumsart
  if (params.search) {
    const s = params.search
    where.OR = [
      { registerNr: { contains: s, mode: "insensitive" } },
      { forstamt: { contains: s, mode: "insensitive" } },
      { revier: { contains: s, mode: "insensitive" } },
      { ansprechpartner: { contains: s, mode: "insensitive" } },
    ]
  }

  // OrderBy aufbauen
  const orderBy: Prisma.RegisterFlaecheOrderByWithRelationInput = {}
  const validSortFields = ["registerNr", "bundesland", "baumart", "flaecheHa", "forstamt", "zulassungBis"]
  if (validSortFields.includes(sortBy)) {
    ;(orderBy as Record<string, string>)[sortBy] = sortDir
  } else {
    orderBy.registerNr = "asc"
  }

  const [flaechen, total] = await Promise.all([
    prisma.registerFlaeche.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        quelle: { select: { name: true, kuerzel: true } },
        wetterDaten: { select: { id: true }, take: 1 },
        _count: { select: { medien: true } },
      },
    }),
    prisma.registerFlaeche.count({ where }),
  ])

  // Filter-Optionen
  const [bundeslaender, baumarten, quellen, eigentumsarten] = await Promise.all([
    prisma.registerFlaeche.findMany({
      select: { bundesland: true },
      distinct: ["bundesland"],
      orderBy: { bundesland: "asc" },
    }),
    prisma.registerFlaeche.findMany({
      select: { baumart: true },
      distinct: ["baumart"],
      orderBy: { baumart: "asc" },
    }),
    prisma.ernteRegisterQuelle.findMany({
      select: { id: true, name: true, kuerzel: true },
      orderBy: { name: "asc" },
    }),
    prisma.registerFlaeche.findMany({
      select: { eigentumsart: true },
      distinct: ["eigentumsart"],
      where: { eigentumsart: { not: null } },
      orderBy: { eigentumsart: "asc" },
    }),
  ])

  // Gesamtanzahl aller Flächen
  const gesamtanzahl = await prisma.registerFlaeche.count()

  const hasFilter = !!(
    params.bundesland ||
    params.baumart ||
    params.quelleId ||
    params.search ||
    params.status ||
    params.sonderherkunft ||
    params.eigentumsart
  )

  // Serialisierung für Client Component
  const serializedFlaechen = flaechen.map((f) => ({
    ...f,
    zulassungBis: f.zulassungBis?.toISOString() ?? null,
    zulassungVon: f.zulassungVon?.toISOString() ?? null,
    letzteAktualisierung: f.letzteAktualisierung.toISOString(),
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
    hatWetterdaten: f.wetterDaten.length > 0,
    sonderherkunft: f.sonderherkunft,
  }))

  return (
    <div className="max-w-7xl mx-auto">
      {/* Kopfzeile */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Erntebestand-Register</h1>
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
              {gesamtanzahl.toLocaleString("de-DE")} Flächen
            </span>
          </div>
          <p className="text-zinc-500 text-sm mt-0.5 flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5" />
            Zugelassene Erntbestände aus staatlichen Registern
          </p>
        </div>
        <Link
          href="/saatguternte/crawler"
          className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] hover:bg-[#333] text-zinc-300 rounded-lg text-sm font-medium transition-all"
        >
          <Bot className="w-4 h-4" />
          Crawler verwalten
        </Link>
      </div>

      {/* Filter-Bar */}
      <form method="GET" className="flex gap-3 mb-4 flex-wrap items-center">
        <div className="flex items-center gap-2 text-zinc-500">
          <Filter className="w-4 h-4" />
        </div>
        <input
          type="text"
          name="search"
          defaultValue={params.search ?? ""}
          placeholder="Register-Nr, Forstamt, Revier..."
          className="px-3 py-1.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 w-56"
        />
        <select
          name="bundesland"
          defaultValue={params.bundesland ?? ""}
          className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="">Alle Bundesländer</option>
          {bundeslaender.map((b) => (
            <option key={b.bundesland} value={b.bundesland}>
              {b.bundesland}
            </option>
          ))}
        </select>
        <select
          name="baumart"
          defaultValue={params.baumart ?? ""}
          className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="">Alle Baumarten</option>
          {baumarten.map((b) => (
            <option key={b.baumart} value={b.baumart}>
              {b.baumart}
            </option>
          ))}
        </select>
        <select
          name="quelleId"
          defaultValue={params.quelleId ?? ""}
          className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="">Alle Quellen</option>
          {quellen.map((q) => (
            <option key={q.id} value={q.id}>
              {q.kuerzel} – {q.name}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="">Alle Status</option>
          <option value="zugelassen">Zugelassen</option>
          <option value="abgelaufen">Abgelaufen/Widerruf</option>
        </select>
        <select
          name="eigentumsart"
          defaultValue={params.eigentumsart ?? ""}
          className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="">Alle Eigentumsarten</option>
          {eigentumsarten.map((e) => (
            <option key={e.eigentumsart} value={e.eigentumsart ?? ""}>
              {e.eigentumsart}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 px-3 py-1.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-sm text-zinc-300 cursor-pointer hover:border-amber-500/50 transition-all select-none">
          <input
            type="checkbox"
            name="sonderherkunft"
            value="true"
            defaultChecked={params.sonderherkunft === "true"}
            className="accent-amber-500"
          />
          ⭐ Nur Sonderherkünfte
        </label>
        <button
          type="submit"
          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all"
        >
          Filtern
        </button>
        {hasFilter && (
          <Link
            href="/saatguternte/register"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#333] text-zinc-400 rounded-lg text-sm transition-all"
          >
            <X className="w-3.5 h-3.5" />
            Zurücksetzen
          </Link>
        )}
      </form>

      {/* Tabelle */}
      <RegisterTable
        data={serializedFlaechen}
        total={total}
        page={page}
        limit={limit}
        sortBy={sortBy}
        sortDir={sortDir}
      />
    </div>
  )
}
