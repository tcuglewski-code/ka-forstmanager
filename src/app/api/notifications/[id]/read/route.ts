import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { markRead } from "@/lib/notifications-store"

export const dynamic = "force-dynamic"

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const { id } = await params
  markRead(session.user.id, id)
  return NextResponse.json({ ok: true })
}
