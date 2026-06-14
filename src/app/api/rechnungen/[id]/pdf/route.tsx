// Sprint Q036/Q037: Rechnungs-PDF (ZUGFeRD 2.3 / Factur-X, EN 16931, PDF/A-3b)
// A8 Rechnungs-Agent (REC-004): Rendering ausgelagert nach @/lib/rechnungen/pdf
// → identische Bytes für Download UND E-Mail-Versand (REC-006).

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isAdminOrGF } from "@/lib/permissions"
import { generateRechnungsPdf } from "@/lib/rechnungen/pdf"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })

  const { id } = await params

  let pdf
  try {
    pdf = await generateRechnungsPdf(id)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "PDF-Erzeugung fehlgeschlagen"
    const status = msg.includes("nicht gefunden") ? 404 : 500
    return NextResponse.json({ error: msg }, { status })
  }

  return new NextResponse(pdf.bytes as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdf.dateiname}"`,
      "Content-Length": pdf.bytes.length.toString(),
      "X-ZUGFeRD-Status": pdf.zugferdEmbedded ? "embedded" : "error",
    },
  })
}
