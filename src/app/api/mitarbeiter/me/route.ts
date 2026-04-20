import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const user = await verifyToken(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Load linked Mitarbeiter record
  const mitarbeiter = await prisma.mitarbeiter.findFirst({
    where: {
      OR: [
        { userId: user.id },
        { email: user.email },
      ],
      deletedAt: null,
    },
    include: {
      gruppen: {
        include: {
          gruppe: { select: { id: true, name: true } },
        },
      },
    },
  })

  const gruppe = mitarbeiter?.gruppen?.[0]?.gruppe

  return NextResponse.json({
    id: user.id,
    name: mitarbeiter ? `${mitarbeiter.vorname} ${mitarbeiter.nachname}` : (user.name || user.email),
    username: user.email,
    email: user.email,
    role: user.role,
    roles: [user.role],
    gruppe_id: gruppe?.id ? Number(gruppe.id) || undefined : undefined,
    gruppe_name: gruppe?.name,
    mitarbeiter_id: mitarbeiter?.id,
  })
}
