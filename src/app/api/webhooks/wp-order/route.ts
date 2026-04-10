import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

const WC_WEBHOOK_SECRET = "KochAufforstungWebhook2026"

function verifySignature(body: string, signature: string): boolean {
  const hmac = crypto.createHmac("sha256", WC_WEBHOOK_SECRET)
  hmac.update(body, "utf8")
  const expected = hmac.digest("base64")
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

// POST: WooCommerce Webhook bei neuer Bestellung
export async function POST(req: Request) {
  const signature = req.headers.get("x-wc-webhook-signature")
  if (!signature) {
    return NextResponse.json({ error: "Fehlende Signatur" }, { status: 401 })
  }

  const rawBody = await req.text()

  try {
    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: "Ungültige Signatur" }, { status: 401 })
    }
  } catch {
    return NextResponse.json({ error: "Signaturprüfung fehlgeschlagen" }, { status: 401 })
  }

  const order = JSON.parse(rawBody)

  // Erste aktive Baumschule als Standard-Zuordnung
  const baumschule = await prisma.baumschule.findFirst({
    where: { aktiv: true },
    orderBy: { createdAt: "asc" },
  })

  if (!baumschule) {
    console.error("[WP-Order Webhook] Keine aktive Baumschule gefunden")
    return NextResponse.json({ error: "Keine aktive Baumschule" }, { status: 500 })
  }

  const lineItems: Array<{ name: string; quantity: number; price: string }> = order.line_items || []

  const bestellungen = []
  for (const item of lineItems) {
    const bestellung = await prisma.baumschulBestellung.create({
      data: {
        baumschuleId: baumschule.id,
        wpOrderId: order.id ? Number(order.id) : null,
        baumart: item.name,
        menge: item.quantity || 1,
        preis: item.price ? parseFloat(item.price) : null,
        einheit: "Stück",
        status: "neu",
        notizen: `WooCommerce Order #${order.number || order.id}`,
      },
    })
    bestellungen.push(bestellung)
  }

  return NextResponse.json({
    message: `${bestellungen.length} Bestellung(en) erstellt`,
    ids: bestellungen.map((b) => b.id),
  })
}
