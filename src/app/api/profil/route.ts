import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/profil — Aktuellen User-Profil abrufen (erweitert um Mitarbeiter-Daten)
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        notifyMaengel: true,
        notifyAuftraege: true,
        notifyAbnahmen: true,
        lastLoginAt: true,
        permissions: true,
        createdAt: true,
        // Sprint Q015: 2FA
        twoFactorEnabled: true,
        twoFactorVerifiedAt: true,
        // Sprint Q044: Mitarbeiter-Daten
        mitarbeiter: {
          select: {
            id: true,
            vorname: true,
            nachname: true,
            telefon: true,
            mobil: true,
            adresse: true,
            plz: true,
            ort: true,
            geburtsdatum: true,
            eintrittsdatum: true,
            stundenlohn: true,
            // Notfallkontakt
            notfallName: true,
            notfallTelefon: true,
            notfallBeziehung: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 })
    }

    // Berechne Arbeitszeitkonto (Soll vs. Ist im aktuellen Monat)
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    let arbeitszeitkonto = null
    let urlaubstage = null

    if (user.mitarbeiter) {
      // Ist-Stunden aus Stundeneinträgen
      const stundenAgg = await prisma.stundeneintrag.aggregate({
        where: {
          mitarbeiterId: user.mitarbeiter.id,
          datum: { gte: startOfMonth, lte: endOfMonth },
          typ: "arbeit",
        },
        _sum: { stunden: true },
      })

      // Soll-Stunden: Arbeitstage im Monat * 8h (vereinfacht)
      // Zähle Wochentage im aktuellen Monat
      let arbeitstage = 0
      const tempDate = new Date(startOfMonth)
      while (tempDate <= endOfMonth) {
        const dayOfWeek = tempDate.getDay()
        if (dayOfWeek !== 0 && dayOfWeek !== 6) arbeitstage++
        tempDate.setDate(tempDate.getDate() + 1)
      }
      const sollStunden = arbeitstage * 8

      arbeitszeitkonto = {
        monat: now.toLocaleString("de-DE", { month: "long", year: "numeric" }),
        sollStunden,
        istStunden: stundenAgg._sum.stunden || 0,
        differenz: (stundenAgg._sum.stunden || 0) - sollStunden,
      }

      // Urlaubstage (ganzes Jahr)
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59)

      const abwesenheiten = await prisma.abwesenheit.findMany({
        where: {
          mitarbeiterId: user.mitarbeiter.id,
          typ: "urlaub",
          von: { gte: startOfYear },
          bis: { lte: endOfYear },
        },
      })

      // Berechne genommene Urlaubstage
      let genommeneTage = 0
      for (const abw of abwesenheiten) {
        const von = new Date(abw.von)
        const bis = new Date(abw.bis)
        // Zähle nur Werktage
        const tempD = new Date(von)
        while (tempD <= bis) {
          const dow = tempD.getDay()
          if (dow !== 0 && dow !== 6) genommeneTage++
          tempD.setDate(tempD.getDate() + 1)
        }
      }

      // Standard-Urlaubsanspruch: 24 Tage (könnte aus SystemConfig kommen)
      const urlaubsAnspruch = 24
      urlaubstage = {
        jahr: now.getFullYear(),
        anspruch: urlaubsAnspruch,
        genommen: genommeneTage,
        rest: urlaubsAnspruch - genommeneTage,
      }
    }

    return NextResponse.json({
      ...user,
      arbeitszeitkonto,
      urlaubstage,
    })
  } catch (error) {
    console.error("Profil laden fehlgeschlagen:", error)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}

// PUT /api/profil — Profil aktualisieren (erweitert um Mitarbeiter-Daten + Notfallkontakt)
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { 
      name, 
      avatar, 
      notifyMaengel, 
      notifyAuftraege, 
      notifyAbnahmen,
      // Sprint Q044: Kontaktdaten
      telefon,
      mobil,
      adresse,
      plz,
      ort,
      // Sprint Q044: Notfallkontakt
      notfallName,
      notfallTelefon,
      notfallBeziehung,
    } = body

    // User-Daten updaten
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(avatar !== undefined && { avatar }),
        ...(notifyMaengel !== undefined && { notifyMaengel }),
        ...(notifyAuftraege !== undefined && { notifyAuftraege }),
        ...(notifyAbnahmen !== undefined && { notifyAbnahmen }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        notifyMaengel: true,
        notifyAuftraege: true,
        notifyAbnahmen: true,
        lastLoginAt: true,
        permissions: true,
        createdAt: true,
        twoFactorEnabled: true,
        twoFactorVerifiedAt: true,
        mitarbeiter: { select: { id: true } },
      },
    })

    // Mitarbeiter-Daten updaten (falls vorhanden)
    if (updated.mitarbeiter) {
      const mitarbeiterUpdate: Record<string, unknown> = {}
      if (telefon !== undefined) mitarbeiterUpdate.telefon = telefon
      if (mobil !== undefined) mitarbeiterUpdate.mobil = mobil
      if (adresse !== undefined) mitarbeiterUpdate.adresse = adresse
      if (plz !== undefined) mitarbeiterUpdate.plz = plz
      if (ort !== undefined) mitarbeiterUpdate.ort = ort
      if (notfallName !== undefined) mitarbeiterUpdate.notfallName = notfallName
      if (notfallTelefon !== undefined) mitarbeiterUpdate.notfallTelefon = notfallTelefon
      if (notfallBeziehung !== undefined) mitarbeiterUpdate.notfallBeziehung = notfallBeziehung

      if (Object.keys(mitarbeiterUpdate).length > 0) {
        await prisma.mitarbeiter.update({
          where: { id: updated.mitarbeiter.id },
          data: mitarbeiterUpdate,
        })
      }
    }

    // Vollständiges Profil zurückgeben (ruft GET-Logik auf)
    const fullProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        notifyMaengel: true,
        notifyAuftraege: true,
        notifyAbnahmen: true,
        lastLoginAt: true,
        permissions: true,
        createdAt: true,
        twoFactorEnabled: true,
        twoFactorVerifiedAt: true,
        mitarbeiter: {
          select: {
            id: true,
            vorname: true,
            nachname: true,
            telefon: true,
            mobil: true,
            adresse: true,
            plz: true,
            ort: true,
            notfallName: true,
            notfallTelefon: true,
            notfallBeziehung: true,
          },
        },
      },
    })

    return NextResponse.json(fullProfile)
  } catch (error) {
    console.error("Profil speichern fehlgeschlagen:", error)
    return NextResponse.json({ error: "Speichern fehlgeschlagen" }, { status: 500 })
  }
}
