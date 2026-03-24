import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const configs = await prisma.systemConfig.findMany()
  const result: Record<string, string> = {}
  for (const c of configs) result[c.key] = c.value
  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  // body = { key: string, value: string } oder { configs: Record<string, string> }

  if (body.configs) {
    // Bulk update
    for (const [key, value] of Object.entries(body.configs)) {
      await prisma.systemConfig.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    }
  } else if (body.key && body.value !== undefined) {
    await prisma.systemConfig.upsert({
      where: { key: body.key },
      update: { value: String(body.value) },
      create: { key: body.key, value: String(body.value) },
    })
  }

  return NextResponse.json({ ok: true })
}
