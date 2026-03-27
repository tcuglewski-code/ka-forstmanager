import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdminOrGF } from "@/lib/permissions"
// Sprint AG: E-Mail-Benachrichtigung bei Lohnabrechnung-Freigabe
import { emailService } from "@/lib/email"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  // Vorherigen Status laden (für E-Mail-Trigger)
  const vorher = body.status
    ? await prisma.lohnabrechnung.findUnique({
        where: { id },
        select: { status: true },
      })
    : null

  const updated = await prisma.lohnabrechnung.update({
    where: { id },
    data: {
      status: body.status ?? undefined,
      auszahlung: body.auszahlung !== undefined ? parseFloat(body.auszahlung) : undefined,
      vorschuesse: body.vorschuesse !== undefined ? parseFloat(body.vorschuesse) : undefined,
      notizen: body.notizen ?? undefined,
    },
    include: {
      mitarbeiter: { select: { vorname: true, nachname: true, email: true } },
    },
  })

  // Sprint AG: E-Mail senden wenn Status auf "freigegeben" gesetzt wird
  if (body.status === "freigegeben" && vorher?.status !== "freigegeben") {
    emailService.lohnabrechnungFreigegeben({
      abrechnungId: id,
      mitarbeiterName: `${updated.mitarbeiter.vorname} ${updated.mitarbeiter.nachname}`,
      mitarbeiterEmail: updated.mitarbeiter.email ?? undefined,
      zeitraumVon: updated.zeitraumVon,
      zeitraumBis: updated.zeitraumBis,
      auszahlung: updated.auszahlung,
    }).catch((err) => console.error("[Email] lohnabrechnungFreigegeben fehlgeschlagen:", err))
  }

  return NextResponse.json(updated)
}
