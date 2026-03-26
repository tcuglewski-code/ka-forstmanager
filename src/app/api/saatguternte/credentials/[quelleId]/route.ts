import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET — Prüft ob Credentials existieren (gibt NICHT den Klartext zurück)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ quelleId: string }> }
) {
  try {
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
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ quelleId: string }> }
) {
  try {
    const { quelleId } = await params

    await prisma.registerCredential.delete({ where: { quelleId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("DELETE /api/saatguternte/credentials/[quelleId]", err)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}
