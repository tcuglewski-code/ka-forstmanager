/**
 * BS-MKT-01 Phase 2: Admin Freigabe-Flow für selbst-registrierte Baumschulen
 *
 * POST /api/saatguternte/baumschulen/[id]/freigabe
 *   body: { action: "approve" | "reject", reason?: string }
 *
 * - approve: status → "aktiv", generiert Login-Token + sendet Mail mit Magic-Link
 * - reject:  status → "abgelehnt", optional Begründungs-Mail
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { withErrorHandler } from "@/lib/api-handler"
import { sendEmail } from "@/lib/email"
import crypto from "crypto"
import bcrypt from "bcryptjs"

const ADMIN_ROLES = ["admin", "ka_admin", "administrator", "supervisor"]

export const POST = withErrorHandler(async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  const role = session.user.role ?? ""
  if (!ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 })
  }

  const { id } = await params
  const body = (await req.json().catch(() => null)) as
    | { action?: string; reason?: string }
    | null

  if (!body || (body.action !== "approve" && body.action !== "reject")) {
    return NextResponse.json(
      { error: "action muss 'approve' oder 'reject' sein" },
      { status: 400 }
    )
  }

  const baumschule = await prisma.baumschule.findUnique({
    where: { id },
    include: { user: true },
  })
  if (!baumschule) {
    return NextResponse.json({ error: "Baumschule nicht gefunden" }, { status: 404 })
  }

  // Ablehnung
  if (body.action === "reject") {
    await prisma.baumschule.update({
      where: { id },
      data: { status: "abgelehnt", aktiv: false },
    })

    if (baumschule.email) {
      void sendEmail({
        to: baumschule.email,
        subject: "Ihre Bewerbung bei Koch Aufforstung",
        html: `
          <p>Sehr geehrte/r ${escapeHtml(baumschule.ansprechpartner || baumschule.name)},</p>
          <p>vielen Dank für Ihr Interesse an einer Partnerschaft mit Koch Aufforstung GmbH.</p>
          <p>Leider können wir Ihre Bewerbung aktuell nicht in unser Baumschul-Netzwerk aufnehmen.</p>
          ${
            body.reason
              ? `<p><strong>Hinweis:</strong> ${escapeHtml(body.reason)}</p>`
              : ""
          }
          <p>Bei Rückfragen stehen wir Ihnen gerne zur Verfügung.</p>
          <p>Mit freundlichen Grüßen<br>Ihr Team der Koch Aufforstung GmbH</p>
        `,
      }).catch((e) => console.warn("[Freigabe] Ablehnungs-Mail fehlgeschlagen:", e))
    }

    return NextResponse.json({ ok: true, status: "abgelehnt" })
  }

  // Freigabe: status=aktiv + Magic-Link generieren
  const token = crypto.randomBytes(32).toString("hex")
  const tokenExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000)

  let userId = baumschule.userId
  if (!userId) {
    const userEmail = baumschule.email ?? `baumschule-${id}@ka-intern.local`
    const randomPasswort = crypto.randomBytes(16).toString("hex")
    const hashedPasswort = await bcrypt.hash(randomPasswort, 10)

    // E-Mail kollidiert evtl. mit bestehendem User — defensiv
    const existingUser = await prisma.user.findUnique({ where: { email: userEmail } })
    if (existingUser) {
      userId = existingUser.id
    } else {
      const user = await prisma.user.create({
        data: {
          name: baumschule.name,
          email: userEmail,
          password: hashedPasswort,
          role: "baumschule",
          active: true,
        },
      })
      userId = user.id
    }
  }

  await prisma.baumschule.update({
    where: { id },
    data: {
      status: "aktiv",
      aktiv: true,
      loginToken: token,
      loginTokenExpiry: tokenExpiry,
      userId,
    },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://ka-forstmanager.vercel.app"
  const loginLink = `${baseUrl}/baumschule/login?token=${token}`

  if (baumschule.email) {
    void sendEmail({
      to: baumschule.email,
      subject: "Willkommen im Koch-Aufforstung-Baumschul-Netzwerk 🌲",
      html: `
        <p>Sehr geehrte/r ${escapeHtml(baumschule.ansprechpartner || baumschule.name)},</p>
        <p>wir freuen uns, Ihnen mitteilen zu können, dass <strong>${escapeHtml(baumschule.name)}</strong> in unser Baumschul-Netzwerk aufgenommen wurde.</p>
        <p>Ab sofort können Sie Pflanzanfragen aus unserer Plattform einsehen und beantworten. Loggen Sie sich über den folgenden persönlichen Link in Ihr Portal ein:</p>
        <p style="margin: 20px 0;">
          <a href="${loginLink}"
             style="display:inline-block; padding: 12px 24px; background:#012d1d; color:#fff; border-radius:8px; text-decoration:none; font-weight:bold;">
            🌲 Portal öffnen
          </a>
        </p>
        <p style="font-size: 12px; color: #666;">
          Der Link ist 72 Stunden gültig (bis ${tokenExpiry.toLocaleDateString("de-DE")}).
          Falls Sie ihn nicht klicken können, kopieren Sie diese URL in Ihren Browser:<br>
          <code>${loginLink}</code>
        </p>
        <p>Bei Fragen sind wir jederzeit für Sie erreichbar.</p>
        <p>Mit freundlichen Grüßen<br>Ihr Team der Koch Aufforstung GmbH</p>
      `,
    }).catch((e) => console.warn("[Freigabe] Willkommens-Mail fehlgeschlagen:", e))
  }

  return NextResponse.json({
    ok: true,
    status: "aktiv",
    loginLink,
    gueltigBis: tokenExpiry.toISOString(),
    emailGesendet: Boolean(baumschule.email),
  })
})

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
