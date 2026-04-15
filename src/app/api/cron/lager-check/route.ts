import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const TELEGRAM_CHAT_ID = "977688457"

// GET: Cron-Job für Lagerbestandsprüfung
export async function GET(req: NextRequest) {
  // Auth prüfen
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Alle Artikel mit Bestand <= Mindestbestand finden
    const kritischeArtikel = await prisma.lagerArtikel.findMany({
      where: {
        bestand: { lte: prisma.lagerArtikel.fields.mindestbestand }
      },
      include: {
        lieferant: { select: { id: true, name: true } }
      }
    })

    // Alternative Query wenn das obere nicht funktioniert
    const alleArtikel = await prisma.lagerArtikel.findMany({
      include: {
        lieferant: { select: { id: true, name: true } }
      }
    })
    
    const unterMindestbestand = alleArtikel.filter(a => a.bestand <= a.mindestbestand)

    if (unterMindestbestand.length === 0) {
      return NextResponse.json({ 
        message: "Keine kritischen Bestände", 
        checked: alleArtikel.length 
      })
    }

    // Gruppiere nach Lieferant für Bestellvorschlag
    const nachLieferant = unterMindestbestand.reduce((acc, artikel) => {
      const lieferantId = artikel.lieferantId || "ohne_lieferant"
      const lieferantName = artikel.lieferant?.name || "Ohne Lieferant"
      
      if (!acc[lieferantId]) {
        acc[lieferantId] = { name: lieferantName, artikel: [] }
      }
      acc[lieferantId].artikel.push({
        id: artikel.id,
        name: artikel.name,
        bestand: artikel.bestand,
        mindestbestand: artikel.mindestbestand,
        einheit: artikel.einheit,
        empfohleneBestellung: Math.max(artikel.mindestbestand * 2 - artikel.bestand, 1)
      })
      return acc
    }, {} as Record<string, { name: string; artikel: Array<{ id: string; name: string; bestand: number; mindestbestand: number; einheit: string; empfohleneBestellung: number }> }>)

    type LieferantGroup = typeof nachLieferant[string]

    // Telegram-Benachrichtigung senden
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN
    if (telegramToken) {
      const message = `📦 Lager-Alarm: ${unterMindestbestand.length} Artikel unter Mindestbestand\n\n` +
        Object.entries(nachLieferant)
          .map(([_, data]: [string, LieferantGroup]) => {
            const artikelListe = data.artikel
              .map(a => `  • ${a.name}: ${a.bestand}/${a.mindestbestand} ${a.einheit}`)
              .join("\n")
            return `🏭 ${data.name}:\n${artikelListe}`
          })
          .join("\n\n") +
        `\n\n→ ka-forstmanager.vercel.app/lager/bestellungen`

      try {
        await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: "HTML"
          })
        })
      } catch (telegramError) {
        console.error("Telegram-Fehler:", telegramError)
      }
    }

    // Erstelle Draft-Bestellungen für jeden Lieferanten mit kritischen Artikeln
    const erstellteBestellungen = []
    
    for (const [lieferantId, data] of Object.entries(nachLieferant) as [string, LieferantGroup][]) {
      if (lieferantId === "ohne_lieferant") continue
      
      // Prüfe ob bereits ein Entwurf für diesen Lieferanten existiert
      const existierenderEntwurf = await prisma.bestellung.findFirst({
        where: {
          lieferantId,
          status: "ENTWURF"
        }
      })
      
      if (!existierenderEntwurf) {
        // Neue Bestellung als Entwurf erstellen
        const bestellung = await prisma.bestellung.create({
          data: {
            lieferantId,
            status: "ENTWURF",
            notizen: "Automatisch erstellt durch Lager-Check",
            positionen: {
              create: data.artikel.map(a => ({
                artikelId: a.id,
                menge: a.empfohleneBestellung,
                einzelpreis: 0 // Muss manuell eingetragen werden
              }))
            }
          }
        })
        erstellteBestellungen.push(bestellung.id)
      }
    }

    return NextResponse.json({
      message: `${unterMindestbestand.length} Artikel unter Mindestbestand`,
      kritischeArtikel: unterMindestbestand.length,
      nachLieferant,
      erstellteBestellungen,
      telegramGesendet: !!telegramToken
    })
  } catch (error) {
    console.error("Lager-Check Fehler:", error)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}
