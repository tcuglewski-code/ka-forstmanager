import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// DELETE /api/saatguternte/medien/zuordnung/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.mediaZuordnung.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[medien/zuordnung/[id]] DELETE error:", err)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}
