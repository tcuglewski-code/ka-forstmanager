import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"

const GENERIC_MESSAGE = "Falls die E-Mail-Adresse existiert, wurde eine Nachricht gesendet."

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ message: GENERIC_MESSAGE })
    }

    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase().trim(), active: true },
    })

    if (user) {
      // Alte Tokens löschen
      await prisma.passwordResetToken.deleteMany({ where: { email: user.email } })

      const token = crypto.randomBytes(32).toString("hex")
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 Stunde

      await prisma.passwordResetToken.create({
        data: { email: user.email, token, expiresAt },
      })

      const baseUrl =
        process.env.NEXTAUTH_URL ||
        (process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000")
      const resetUrl = `${baseUrl}/reset-password?token=${token}`

      await sendEmail({
        to: user.email,
        subject: "Dein Passwort zurücksetzen — Koch Aufforstung ForstManager",
        html: `
          <div style="font-family: 'Nunito Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2C3A1C; font-family: 'Lora', serif;">Passwort zurücksetzen</h2>
            <p>Du hast eine Anfrage zum Zurücksetzen deines Passworts erhalten.</p>
            <p>Klicke auf den Button, um ein neues Passwort zu vergeben:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #2C3A1C; color: #C5A55A; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Passwort zurücksetzen</a>
            </div>
            <p style="color: #666; font-size: 14px;">Dieser Link ist <strong>1 Stunde</strong> gültig.</p>
            <p style="color: #666; font-size: 14px;">Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px;">Koch Aufforstung — ForstManager</p>
          </div>
        `,
      })
    }

    // Immer gleiche Antwort (verhindert User-Enumeration)
    return NextResponse.json({ message: GENERIC_MESSAGE })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ message: GENERIC_MESSAGE })
  }
}
