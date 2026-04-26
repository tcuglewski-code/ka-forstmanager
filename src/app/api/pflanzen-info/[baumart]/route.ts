import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ baumart: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { baumart } = await params
  const decoded = decodeURIComponent(baumart)

  const item = await prisma.pflanzenInfo.findFirst({
    where: {
      OR: [
        { baumart: { equals: decoded, mode: "insensitive" } },
        { id: decoded },
      ],
    },
  })

  if (!item) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  return NextResponse.json(item)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ baumart: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { baumart } = await params
  const decoded = decodeURIComponent(baumart)
  const body = await req.json()

  try {
    // Find by baumart name or ID
    const existing = await prisma.pflanzenInfo.findFirst({
      where: {
        OR: [
          { baumart: { equals: decoded, mode: "insensitive" } },
          { id: decoded },
        ],
      },
    })

    if (!existing) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })

    const updated = await prisma.pflanzenInfo.update({
      where: { id: existing.id },
      data: body,
    })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
