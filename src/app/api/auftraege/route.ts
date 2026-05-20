import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth-helpers"
// Sprint AG: E-Mail-Benachrichtigung beim Erstellen eines Auftrags
import { emailService } from "@/lib/email"
import { sendKANotification } from "@/lib/telegram-notify"
import { z } from "zod"
import crypto from "crypto"

// Optional: Resend für E-Mail-Versand des Kunden-Logins
let resend: { emails: { send: (opts: unknown) => Promise<unknown> } } | null = null
try {
  if (process.env.RESEND_API_KEY) {
    const { Resend } = require("resend")
    resend = new Resend(process.env.RESEND_API_KEY)
  }
} catch {
  // Resend nicht verfügbar — Login-Mail wird übersprungen
}

async function ensureKundenAccountAndLogin(opts: {
  email: string
  name?: string | null
  auftragId: string
  auftragTitel: string
}) {
  const email = opts.email.toLowerCase().trim()
  try {
    let user = await prisma.user.findUnique({ where: { email } })
    if (user && user.role !== "kunde") {
      // Bestehender Nicht-Kunden-Account → keine Magic-Mail
      return
    }
    if (!user) {
      const randomPassword = crypto.randomBytes(24).toString("hex")
      user = await prisma.user.create({
        data: {
          id: "kunde_" + crypto.randomBytes(8).toString("hex"),
          name: opts.name || email.split("@")[0],
          email,
          role: "kunde",
          password: randomPassword, // wird nicht für Login verwendet (Magic-Link Flow)
          active: true,
        },
      })
    }

    // Alte Token invalidieren
    await prisma.magicToken.updateMany({
      where: { email: user.email, used: false },
      data: { used: true },
    })

    // Neuen Token erstellen (24h)
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await prisma.magicToken.create({
      data: { email: user.email, token, expiresAt },
    })

    const baseUrl = process.env.NEXTAUTH_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://ka-forstmanager.vercel.app")
    const magicLink = `${baseUrl}/auth/magic?token=${token}`

    if (resend) {
      await resend.emails.send({
        from: "Koch Aufforstung <onboarding@resend.dev>",
        to: user.email,
        subject: "Ihre Anfrage bei Koch Aufforstung",
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
            <div style="background: #2C3A1C; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 22px;">🌲 Koch Aufforstung</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <p>Hallo ${user.name},</p>
              <p>vielen Dank für Ihre Anfrage <strong>${opts.auftragTitel}</strong>.</p>
              <p>Wir haben Ihren Auftrag aufgenommen. Über Ihr persönliches Kundenportal können Sie den Status jederzeit verfolgen:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${magicLink}"
                   style="background: #2C3A1C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Zum Kundenportal
                </a>
              </p>
              <p style="color: #666; font-size: 14px;">
                Der Link ist 24 Stunden gültig. Sie können sich später jederzeit erneut anmelden unter
                <a href="${baseUrl}/auth/magic">${baseUrl}/auth/magic</a>.
              </p>
            </div>
            <div style="padding: 15px; text-align: center; color: #999; font-size: 12px;">
              © ${new Date().getFullYear()} Koch Aufforstung GmbH
            </div>
          </div>
        `,
      })
    } else {
      console.log("[Auftrag→Kunde] Magic-Link (kein RESEND_API_KEY):", magicLink)
    }
  } catch (err) {
    console.error("[Auftrag→Kunde] Account/Login fehlgeschlagen:", err)
  }
}

// KC-1: Zod Schema für Auftrags-Validierung
const FlaecheSchema = z.object({
  id: z.string().optional(),
  flaeche_ha: z.string().optional(),
  standort: z.string().optional(),
  forstamt: z.string().optional(),
  revier: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
})

const AuftragCreateSchema = z.object({
  titel: z.string().min(1, "Titel ist ein Pflichtfeld"),
  typ: z.string().min(1, "Typ ist ein Pflichtfeld"),
  waldbesitzer: z.string().min(1, "Waldbesitzer ist ein Pflichtfeld").nullable().optional()
    .refine((val) => val && val.trim().length > 0, { message: "Waldbesitzer ist ein Pflichtfeld" }),
  status: z.string().optional().default("anfrage"),
  beschreibung: z.string().optional().nullable(),
  flaeche_ha: z.union([z.string(), z.number()]).optional().nullable(),
  standort: z.string().optional().nullable(),
  bundesland: z.string().optional().nullable(),
  waldbesitzerEmail: z.string().email().optional().nullable().or(z.literal("")),
  email: z.string().email().optional().nullable().or(z.literal("")),
  waldbesitzerTelefon: z.string().optional().nullable(),
  lat: z.union([z.string(), z.number()]).optional().nullable(),
  lng: z.union([z.string(), z.number()]).optional().nullable(),
  saisonId: z.string().optional().nullable(),
  gruppeId: z.string().optional().nullable(),
  startDatum: z.string().optional().nullable(),
  endDatum: z.string().optional().nullable(),
  wpProjektId: z.string().optional().nullable(),
  wizardDaten: z.object({
    flaechen: z.array(FlaecheSchema).optional().nullable(),
    treffpunkt: z.string().optional().nullable(),
    flaeche_forstamt: z.string().optional().nullable(),
    flaeche_revier: z.string().optional().nullable(),
    bezugsquelle: z.string().optional().nullable(),
    lieferant: z.string().optional().nullable(),
    baumarten: z.string().optional().nullable(),
    pflanzverband: z.string().optional().nullable(),
    zauntyp: z.string().optional().nullable(),
    zaunlaenge: z.string().optional().nullable(),
    schutztyp: z.array(z.string()).optional().nullable(),
    schutzart: z.string().optional().nullable(),
    anzahlHuellen: z.string().optional().nullable(),
    robinienstab: z.string().optional().nullable(),
    aufwuchsart: z.array(z.string()).optional().nullable(),
    arbeitsmethode: z.string().optional().nullable(),
    turnus: z.string().optional().nullable(),
    bestandstyp: z.string().optional().nullable(),
    pflegeart: z.string().optional().nullable(),
    // F-5: zusätzliche Auftrags-Wizard-Felder
    hangneigung: z.string().optional().nullable(),
    bodenbeschaffenheit: z.string().optional().nullable(),
    begleitvegetation: z.string().optional().nullable(),
  }).optional().nullable(),
}).refine(
  (data) => {
    // KC-1: Mindestens eine Fläche mit flaeche_ha > 0 erforderlich
    const flaechen = data.wizardDaten?.flaechen
    if (flaechen && flaechen.length > 0) {
      const hasValidFlaeche = flaechen.some(f => f.flaeche_ha && parseFloat(f.flaeche_ha) > 0)
      if (hasValidFlaeche) return true
    }
    // Oder direkt flaeche_ha angegeben
    if (data.flaeche_ha) {
      const ha = typeof data.flaeche_ha === "string" ? parseFloat(data.flaeche_ha) : data.flaeche_ha
      return ha > 0
    }
    return false
  },
  { message: "Mindestens eine Fläche mit gültiger Hektar-Angabe ist erforderlich", path: ["flaeche_ha"] }
)

export async function GET(req: NextRequest) {
  // ⚠️ GET ist auth-geschützt — Aufträge sind interne Dashboard-Daten
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const statusIn = searchParams.get("statusIn") // FM-28: comma-separated list
  const typ = searchParams.get("typ")
  const search = searchParams.get("search")

  // Paginierung (Sprint P)
  const take = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200)
  const skip = parseInt(searchParams.get("offset") ?? "0")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (status) where.status = status
  else if (statusIn) where.status = { in: statusIn.split(",") }
  if (typ) where.typ = typ

  // Sprint UX: Schnellsuche
  if (search) {
    where.OR = [
      { titel: { contains: search, mode: "insensitive" } },
      { nummer: { contains: search, mode: "insensitive" } },
      { waldbesitzer: { contains: search, mode: "insensitive" } },
      { standort: { contains: search, mode: "insensitive" } },
    ]
  }

  // Role-based filtering: GF/MA only see their group's orders
  const userRole = (user as { role?: string }).role
  const userEmail = (user as { email?: string }).email
  const isAdmin = userRole && ["admin", "ka_admin", "administrator"].includes(userRole)

  if (!isAdmin && (userRole === "ka_gruppenführer" || userRole === "ka_gruppenfuhrer") && userEmail) {
    const ownMitarbeiter = await prisma.mitarbeiter.findFirst({
      where: { email: userEmail, deletedAt: null },
      select: { id: true },
    })
    const meineGruppen = await prisma.gruppe.findMany({
      where: { gruppenfuehrerId: ownMitarbeiter?.id ?? "" },
      select: { id: true },
    })
    where.gruppeId = { in: meineGruppen.map(g => g.id) }
  } else if (!isAdmin && userRole === "ka_mitarbeiter" && userEmail) {
    const ownMitarbeiter = await prisma.mitarbeiter.findFirst({
      where: { email: userEmail, deletedAt: null },
      select: { id: true },
    })
    const mitgliedschaften = await prisma.gruppeMitglied.findMany({
      where: { mitarbeiterId: ownMitarbeiter?.id ?? "" },
      select: { gruppeId: true },
    })
    where.gruppeId = { in: mitgliedschaften.map(m => m.gruppeId) }
  }

  const [auftraege, total] = await Promise.all([
    prisma.auftrag.findMany({
      where,
      include: {
        saison: { select: { id: true, name: true } },
        gruppe: { select: { id: true, name: true } },
        unterkunft: { select: { name: true } },
      },
      orderBy: { wpErstelltAm: "desc" },
      take,
      skip,
    }),
    prisma.auftrag.count({ where }),
  ])

  // Strip waldbesitzer contact details for non-admin roles
  const sanitizedAuftraege = isAdmin
    ? auftraege
    : auftraege.map(a => ({ ...a, waldbesitzerEmail: null, waldbesitzerTelefon: null }))

  return NextResponse.json(sanitizedAuftraege, {
    headers: { "X-Total-Count": String(total) },
  })
}

export async function POST(req: NextRequest) {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()

    // KC-1: Zod-Validierung
    const validation = AuftragCreateSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.issues.map(e => ({
        field: e.path.join("."),
        message: e.message
      }))
      return NextResponse.json({ 
        error: "Validierungsfehler", 
        details: errors,
        message: errors.map(e => e.message).join(", ")
      }, { status: 400 })
    }

    const validatedData = validation.data

    // Sprint Q: Auto-Auftragsnummer generieren falls nicht angegeben
    let auftragNummer = body.nummer?.trim() || null
    if (!auftragNummer) {
      const year = new Date().getFullYear()
      const lastAuftrag = await prisma.auftrag.findFirst({
        where: { nummer: { startsWith: `AU-${year}-` } },
        orderBy: { nummer: "desc" },
        select: { nummer: true },
      })
      let nextNum = 1
      if (lastAuftrag?.nummer) {
        const match = lastAuftrag.nummer.match(/AU-\d{4}-(\d+)/)
        if (match) nextNum = parseInt(match[1], 10) + 1
      }
      auftragNummer = `AU-${year}-${String(nextNum).padStart(4, "0")}`
    }

    // KC-1: Verwende validierte Daten
    const flaeche = validatedData.flaeche_ha 
      ? (typeof validatedData.flaeche_ha === "string" ? parseFloat(validatedData.flaeche_ha) : validatedData.flaeche_ha)
      : null

    const auftrag = await prisma.auftrag.create({
      data: {
        nummer: auftragNummer,
        titel: validatedData.titel,
        typ: validatedData.typ,
        status: validatedData.status ?? "anfrage",
        beschreibung: validatedData.beschreibung ?? null,
        flaeche_ha: flaeche,
        standort: validatedData.standort ?? null,
        bundesland: validatedData.bundesland ?? null,
        waldbesitzer: validatedData.waldbesitzer ?? null,
        waldbesitzerEmail: validatedData.waldbesitzerEmail || null,
        waldbesitzerTelefon: validatedData.waldbesitzerTelefon ?? null,
        // FM-02: GPS-Koordinaten
        lat: validatedData.lat != null && validatedData.lat !== "" ? parseFloat(String(validatedData.lat)) : null,
        lng: validatedData.lng != null && validatedData.lng !== "" ? parseFloat(String(validatedData.lng)) : null,
        // wizardDaten für erweiterte Felder (FM-01, FM-03, FM-05, FM-06)
        wizardDaten: validatedData.wizardDaten ?? null,
        wpProjektId: validatedData.wpProjektId ?? null,
        saisonId: validatedData.saisonId ?? null,
        gruppeId: validatedData.gruppeId ?? null,
        startDatum: validatedData.startDatum ? new Date(validatedData.startDatum) : null,
        endDatum: validatedData.endDatum ? new Date(validatedData.endDatum) : null,
      },
    })

    // Loop 4: Auto-create AuftragPflanzItems aus wizardDaten.baumarten
    // Format: "Eiche: 500 Stk., Buche: 300 Stk., ..."
    const baumartenStr = validatedData.wizardDaten?.baumarten
    if (baumartenStr && typeof baumartenStr === "string") {
      const parts = baumartenStr.split(",").map((s) => s.trim()).filter(Boolean)
      for (const part of parts) {
        const m = part.match(/^(.+?):\s*(\d+)\s*Stk\.?/i)
        if (!m) continue
        const baumart = m[1].trim()
        const stueckzahl = parseInt(m[2], 10)
        try {
          const firstWord = baumart.split(/\s+/)[0]
          const preisliste = await prisma.baumschulPreisliste.findFirst({
            where: { baumart: { contains: firstWord, mode: "insensitive" }, aktiv: true },
          })
          await prisma.auftragPflanzItem.create({
            data: {
              auftragId: auftrag.id,
              preislisteId: preisliste?.id ?? null,
              baumart,
              sorte: preisliste?.sorte ?? null,
              hkg: preisliste?.hkg ?? null,
              fovg: preisliste?.fovg ?? false,
              sollMenge: stueckzahl,
              preisProStk: preisliste?.preis
                ?? (preisliste?.preis_pro_100 != null ? preisliste.preis_pro_100 / 100 : null),
            },
          })
        } catch (err) {
          console.warn("[Auftraege POST] PflanzItem auto-create failed:", part, err)
        }
      }
    }

    // Kunden-Login: Falls E-Mail vorhanden → Magic-Link senden, Account anlegen
    // WICHTIG: auf Vercel Serverless wird die Funktion nach dem Response beendet —
    // deshalb await, nicht fire-and-forget. Resend-Latenz ist akzeptabel (<500ms).
    const kundenEmail = (body?.email ?? validatedData.waldbesitzerEmail)?.toString()?.trim()
    if (kundenEmail) {
      await ensureKundenAccountAndLogin({
        email: kundenEmail,
        name: validatedData.waldbesitzer ?? null,
        auftragId: auftrag.id,
        auftragTitel: auftrag.titel,
      })
    }

    // Sprint AG: E-Mail-Benachrichtigung — Auftrag erstellt
    emailService.auftragErstellt({
      auftragId: auftrag.id,
      auftragNummer: auftrag.nummer ?? auftrag.id,
      auftragTitel: auftrag.titel,
      waldbesitzerName: auftrag.waldbesitzer ?? undefined,
      waldbesitzerEmail: auftrag.waldbesitzerEmail ?? undefined,
      flaeche_ha: auftrag.flaeche_ha ?? undefined,
      standort: auftrag.standort ?? undefined,
    }).catch((err) => console.error("[Email] auftragErstellt fehlgeschlagen:", err))

    // Telegram-Benachrichtigung (direkt, kein LLM)
    sendKANotification({
      event: 'auftrag_erstellt',
      data: {
        name: auftrag.titel,
        kunde: auftrag.waldbesitzer ?? 'Unbekannt',
        datum: new Date().toLocaleDateString('de-DE'),
      },
    }).catch((err) => console.error("[TG-KA] Notification fehlgeschlagen:", err))

    return NextResponse.json(auftrag, { status: 201 })
  } catch (error) {
    console.error("[Auftraege POST]", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}
