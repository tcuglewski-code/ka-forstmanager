import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken, isAdminRole } from "@/lib/auth-helpers"

// GET — Prüft ob Credentials existieren (gibt NICHT den Klartext zurück)
// AUDIT-FIX T-004: Auth erforderlich
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ quelleId: string }> }
) {
  try {
    const user = await verifyToken(req)
    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    const { quelleId } = await params

    const credential = await prisma.registerCredential.findUnique({
      where: { quelleId },
      select: {
        id: true,
        quelleId: true,
        createdAt: true,
        updatedAt: true,
        // encryptedUser und encryptedPass werden bewusst NICHT zurückgegeben
      },
    })

    if (!credential) {
      return NextResponse.json({ exists: false })
    }

    return NextResponse.json({
      exists: true,
      id: credential.id,
      quelleId: credential.quelleId,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt,
    })
  } catch (err) {
    console.error("GET /api/saatguternte/credentials/[quelleId]", err)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}

// DELETE — Credentials löschen
// AUDIT-FIX T-004: Auth + Admin-Check — jeder konnte Credentials löschen (Sabotage)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ quelleId: string }> }
) {
  try {
    const user = await verifyToken(req)
    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }
    if (!isAdminRole((user as { role?: string }).role)) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
    }

    const { quelleId } = await params

    await prisma.registerCredential.delete({ where: { quelleId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("DELETE /api/saatguternte/credentials/[quelleId]", err)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}
