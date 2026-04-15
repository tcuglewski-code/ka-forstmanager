import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createCipheriv, randomBytes } from "crypto"
import { auth } from "@/lib/auth"

function getEncryptionKey(): Buffer {
  let keyHex = process.env.ENCRYPTION_KEY

  if (!keyHex || keyHex.length < 64) {
    // Generiere neuen Key und logge ihn (für Vercel ENV)
    const newKey = randomBytes(32).toString("hex")
    console.warn(
      "⚠️  ENCRYPTION_KEY nicht gesetzt! Generierter Key (in Vercel ENV eintragen):",
      newKey
    )
    keyHex = newKey
  }

  return Buffer.from(keyHex.slice(0, 64), "hex")
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if ((session.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { quelleId, username, password } = body

    if (!quelleId || !username || !password) {
      return NextResponse.json(
        { error: "quelleId, username und password erforderlich" },
        { status: 400 }
      )
    }

    const key = getEncryptionKey()
    const iv = randomBytes(12) // 96-bit IV für GCM

    // Username verschlüsseln
    const cipherUser = createCipheriv("aes-256-gcm", key, iv)
    const encUser = Buffer.concat([cipherUser.update(username, "utf8"), cipherUser.final()])
    const authTagUser = cipherUser.getAuthTag()

    // Passwort verschlüsseln (gleicher IV — in Produktion pro Feld eigenen IV nutzen)
    const ivPass = randomBytes(12)
    const cipherPass = createCipheriv("aes-256-gcm", key, ivPass)
    const encPass = Buffer.concat([cipherPass.update(password, "utf8"), cipherPass.final()])
    const authTagPass = cipherPass.getAuthTag()

    // Alles als hex speichern: iv:encryptedData:authTag
    const encryptedUser = `${iv.toString("hex")}:${encUser.toString("hex")}:${authTagUser.toString("hex")}`
    const encryptedPass = `${ivPass.toString("hex")}:${encPass.toString("hex")}:${authTagPass.toString("hex")}`

    const credential = await prisma.registerCredential.upsert({
      where: { quelleId },
      create: {
        quelleId,
        encryptedUser,
        encryptedPass,
        iv: iv.toString("hex"),
        authTag: authTagUser.toString("hex"),
      },
      update: {
        encryptedUser,
        encryptedPass,
        iv: iv.toString("hex"),
        authTag: authTagUser.toString("hex"),
      },
    })

    return NextResponse.json({ ok: true, id: credential.id })
  } catch (err) {
    console.error("POST /api/saatguternte/credentials", err)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}
