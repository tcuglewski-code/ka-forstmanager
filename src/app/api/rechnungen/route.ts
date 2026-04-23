import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { isAdmin, isAdminOrGF } from "@/lib/permissions"
import { sendKANotification } from "@/lib/telegram-notify"
import { z } from "zod"

const RechnungCreateSchema = z.object({
  betrag: z.union([z.number(), z.string().transform(Number)]).pipe(z.number().positive("Betrag muss positiv sein")),
  auftragId: z.string().optional().nullable(),
  nummer: z.string().max(50).optional().nullable(),
  mwst: z.union([z.number(), z.string().transform(Number)]).pipe(z.number().min(0).max(100)).optional(),
  faelligAm: z.string().optional().nullable(),
  notizen: z.string().max(5000).optional().nullable(),
  positionen: z.array(z.object({
    beschreibung: z.string().min(1),
    menge: z.number().positive(),
    einheit: z.string().default("Stk"),
    preisProEinheit: z.number().min(0),
    typ: z.string().default("leistung"),
  })).optional(),
})

// Sprint GB-01: GoBD-Compliance-Konstanten
const GOBD_LOCK_HOURS = 24 // Rechnungen werden nach 24h automatisch gesperrt

/**
 * Sprint GB-01: Prüft ob eine Rechnung GoBD-gesperrt ist
 */
function isRechnungLocked(rechnung: { lockedAt: Date | null; createdAt: Date }): boolean {
  if (rechnung.lockedAt) return true
  
  const lockThreshold = new Date()
  lockThreshold.setHours(lockThreshold.getHours() - GOBD_LOCK_HOURS)
  
  return rechnung.createdAt < lockThreshold
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 200)
  const includeRestricted = searchParams.get("includeRestricted") === "true"
  const includeDeleted = searchParams.get("includeDeleted") === "true" // Sprint GB-04

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  // Sprint GB-04: Soft-deleted Rechnungen standardmäßig ausblenden (außer Admin mit Flag)
  if (!includeDeleted || !isAdmin(session)) {
    where.deletedAt = null
  }

  // Sprint JY: GDPR-eingeschränkte Rechnungen standardmäßig ausblenden (außer Admin mit Flag)
  if (!includeRestricted || !isAdmin(session)) {
    where.gdprRestricted = false
  }

  // Sprint UX: Schnellsuche
  if (search) {
    where.OR = [
      { nummer: { contains: search, mode: "insensitive" } },
      { auftrag: { titel: { contains: search, mode: "insensitive" } } },
      { auftrag: { waldbesitzer: { contains: search, mode: "insensitive" } } },
    ]
  }

  const data = await prisma.rechnung.findMany({
    where,
    include: { auftrag: { select: { id: true, titel: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  })
  
  // Sprint GB-01: Lock-Status für jede Rechnung berechnen
  // Sprint GB-04: Soft-Delete-Status hinzufügen
  // Sprint JY: GDPR-Restriction-Status hinzufügen
  const dataWithStatus = data.map(rechnung => {
    const isLocked = isRechnungLocked(rechnung)
    const isDeleted = !!rechnung.deletedAt // Sprint GB-04
    return {
      ...rechnung,
      isLocked,
      isDeleted, // Sprint GB-04
      lockInfo: isLocked ? {
        lockedAt: rechnung.lockedAt || rechnung.createdAt,
        lockedBy: rechnung.lockedBy || 'SYSTEM',
        lockReason: rechnung.lockReason || 'GoBD-Compliance: Automatische Sperrung nach 24h',
      } : null,
      // Sprint GB-04: Delete-Info (nur für Admin sichtbar wenn includeDeleted=true)
      deleteInfo: isDeleted && isAdmin(session) ? {
        deletedAt: rechnung.deletedAt,
        deletedBy: rechnung.deletedBy,
        retentionUntil: new Date(new Date(rechnung.deletedAt!).setFullYear(new Date(rechnung.deletedAt!).getFullYear() + 10)),
      } : null,
      // Sprint JY: GDPR-Info (nur für Admin sichtbar)
      gdprInfo: rechnung.gdprRestricted && isAdmin(session) ? {
        restrictedAt: rechnung.gdprRestrictedAt,
        restrictedBy: rechnung.gdprRestrictedBy,
        requestId: rechnung.gdprRequestId,
        note: 'DSGVO Art. 18: Einschränkung der Verarbeitung (GoBD-Konflikt)',
      } : null,
    }
  })
  
  return NextResponse.json(dataWithStatus)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json()
  const parsed = RechnungCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({
      error: "Ungültige Daten",
      details: parsed.error.issues.map(e => ({ field: e.path.join("."), message: e.message })),
    }, { status: 400 })
  }
  const validData = parsed.data

  // Auto-Rechnungsnummer: find highest RE-YYYY-NNNN number across ALL records
  let nummer = validData.nummer?.trim()
  if (!nummer) {
    const year = new Date().getFullYear()
    const pattern = `RE-${year}-`
    const allRechnungen = await prisma.rechnung.findMany({
      where: { nummer: { startsWith: pattern } },
      select: { nummer: true },
    })
    let maxNum = 0
    const re = new RegExp(`^RE-${year}-(\\d{4})$`)
    for (const r of allRechnungen) {
      const m = r.nummer.match(re)
      if (m) {
        const n = parseInt(m[1], 10)
        if (n > maxNum) maxNum = n
      }
    }
    nummer = `RE-${year}-${String(maxNum + 1).padStart(4, "0")}`
  }

  try {
    const mwstSatz = validData.mwst ?? 19

    // FM-23: Positionen-basierte Betragsberechnung
    // Wenn Positionen mitgeliefert, betrag = SUM(menge * preisProEinheit)
    let nettoBetrag = validData.betrag
    const positionenData = validData.positionen?.map(p => ({
      beschreibung: p.beschreibung,
      menge: p.menge,
      einheit: p.einheit,
      preisProEinheit: p.preisProEinheit,
      gesamt: p.menge * p.preisProEinheit,
      typ: p.typ,
    }))

    if (positionenData && positionenData.length > 0) {
      nettoBetrag = positionenData.reduce((sum, p) => sum + p.gesamt, 0)
    }

    const bruttoBetrag = nettoBetrag * (1 + mwstSatz / 100)

    const rechnung = await prisma.rechnung.create({
      data: {
        nummer,
        auftragId: validData.auftragId || null,
        betrag: bruttoBetrag,
        nettoBetrag,
        bruttoBetrag,
        mwst: mwstSatz,
        status: "offen",
        faelligAm: validData.faelligAm ? new Date(validData.faelligAm) : null,
        notizen: validData.notizen ?? null,
        ...(positionenData && positionenData.length > 0 ? {
          positionen: { create: positionenData },
        } : {}),
      },
      include: { auftrag: { select: { id: true, titel: true } }, positionen: true },
    })

    // Sprint GB-01: Audit-Log für Erstellung
    try {
      await prisma.rechnungAuditLog.create({
        data: {
          rechnungId: rechnung.id,
          action: 'CREATE',
          userId: session.user?.id || null,
          userName: session.user?.name || null,
          newValue: JSON.stringify({
            nummer: rechnung.nummer,
            betrag: rechnung.betrag,
            auftragId: rechnung.auftragId,
          }),
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
          userAgent: req.headers.get('user-agent') || null,
        },
      })
    } catch (error) {
      console.error("[AUDIT LOG ERROR]", error)
      // Audit-Log-Fehler blockieren nicht die Erstellung
    }

    // Telegram-Benachrichtigung (direkt, kein LLM)
    sendKANotification({
      event: 'rechnung_erstellt',
      data: {
        nummer: rechnung.nummer,
        betrag: rechnung.betrag.toFixed(2),
      },
    }).catch((err) => console.error("[TG-KA] Notification fehlgeschlagen:", err))

    return NextResponse.json({
      ...rechnung,
      isLocked: false,
      lockInfo: null,
    }, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "Rechnungsnummer bereits vergeben. Bitte manuell angeben." }, { status: 409 })
    }
    console.error("[RECHNUNG CREATE ERROR]", error)
    return NextResponse.json({ error: "Fehler beim Erstellen der Rechnung" }, { status: 500 })
  }
}
