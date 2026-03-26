import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowLeft, Bot } from "lucide-react"
import { CrawlerClient } from "./CrawlerClient"

export default async function CrawlerPage() {
  const quellen = await prisma.ernteRegisterQuelle.findMany({
    include: {
      _count: { select: { flaechen: true } },
      credential: { select: { id: true } },
    },
    orderBy: { name: "asc" },
  })

  const serialized = quellen.map((q) => ({
    id: q.id,
    name: q.name,
    kuerzel: q.kuerzel,
    bundeslaender: q.bundeslaender,
    crawlStatus: q.crawlStatus,
    letzterCrawl: q.letzterCrawl?.toISOString() ?? null,
    loginRequired: q.loginRequired,
    hasCredentials: !!q.credential,
    _count: q._count,
  }))

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/saatguternte/register"
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Register-Übersicht
        </Link>
        <span className="text-zinc-700">/</span>
        <span className="text-sm text-zinc-400">Crawler</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Crawler-Management</h1>
          </div>
          <p className="text-zinc-500 text-sm mt-0.5 flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5" />
            Registerquellen verwalten und Crawls starten
          </p>
        </div>
      </div>

      <CrawlerClient initialQuellen={serialized} />
    </div>
  )
}
