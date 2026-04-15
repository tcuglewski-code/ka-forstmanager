import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-handler"

export const POST = withErrorHandler(async (req: Request) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { ids, action, data } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: "Keine IDs" }, { status: 400 })
  if (ids.length > 100) return NextResponse.json({ error: "Maximal 100 Einträge" }, { status: 400 })

  if (action === "delete") {
    await prisma.auftrag.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } })
  } else if (action === "update" && data) {
    await prisma.auftrag.updateMany({ where: { id: { in: ids } }, data })
  } else {
    return NextResponse.json({ error: "Unbekannte Aktion" }, { status: 400 })
  }

  return NextResponse.json({ success: true, count: ids.length })
})
