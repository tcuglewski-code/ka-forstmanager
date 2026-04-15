import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const quellen = await prisma.ernteRegisterQuelle.findMany({
      include: {
        _count: { select: { flaechen: true } },
        credential: { select: { id: true } },
      },
      orderBy: { name: "asc" },
    })

    const result = quellen.map((q) => ({
      id: q.id,
      name: q.name,
      kuerzel: q.kuerzel,
      bundeslaender: q.bundeslaender,
      baseUrl: q.baseUrl,
      crawlUrl: q.crawlUrl,
      loginRequired: q.loginRequired,
      crawlStatus: q.crawlStatus,
      letzterCrawl: q.letzterCrawl,
      naechsterCrawl: q.naechsterCrawl,
      crawlLog: q.crawlLog,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
      hasCredentials: !!q.credential,
      _count: q._count,
    }))

    return NextResponse.json(result)
  } catch (err) {
    console.error("GET /api/saatguternte/quellen", err)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, kuerzel, bundeslaender, baseUrl, crawlUrl, loginRequired } = body

    if (!name || !kuerzel) {
      return NextResponse.json({ error: "name und kuerzel erforderlich" }, { status: 400 })
    }

    const quelle = await prisma.ernteRegisterQuelle.create({
      data: {
        name,
        kuerzel,
        bundeslaender: bundeslaender ?? [],
        baseUrl: baseUrl ?? null,
        crawlUrl: crawlUrl ?? null,
        loginRequired: loginRequired ?? false,
      },
    })

    return NextResponse.json(quelle, { status: 201 })
  } catch (err) {
    console.error("POST /api/saatguternte/quellen", err)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}
