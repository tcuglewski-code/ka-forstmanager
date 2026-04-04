/**
 * DSGVO Art. 17 Recht auf Löschung + GoBD-Compliance
 * DELETE /api/mitarbeiter/:id/loeschen
 * 
 * Implementiert Soft-Delete mit Anonymisierung:
 * - Personenbezogene Daten werden anonymisiert (DSGVO)
 * - Geschäftsrelevante Daten bleiben für GoBD erhalten
 * - Audit-Log dokumentiert die Löschung
 * 
 * Nur für Admin zugänglich
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Anonymisierte Werte gemäß DSGVO/GoBD Best Practices
const ANONYMIZED = {
  vorname: "GELÖSCHT",
  nachname: "GELÖSCHT",
  email: null,
  telefon: null,
  mobil: null,
  adresse: null,
  plz: null,
  ort: null,
  geburtsdatum: null,
  notfallkontakt: null,
  notfalltelefon: null,
  notfallName: null,
  notfallTelefon: null,
  notfallBeziehung: null,
  bankname: null,
  iban: null,
  qualifikationen: null,
  fuehrerschein: null,
  notizen: "[Personenbezogene Daten gemäß DSGVO Art. 17 gelöscht]"
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth check
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Role check: nur Admin darf löschen
  const userRole = (session.user as { role?: string })?.role
  if (!userRole || userRole !== "admin") {
    return NextResponse.json({ error: "Forbidden - Admin required" }, { status: 403 })
  }

  const { id } = await params
  const userId = (session.user as { id?: string })?.id || "system"

  // Mitarbeiter prüfen
  const mitarbeiter = await prisma.mitarbeiter.findUnique({
    where: { id },
    include: {
      user: true,
      stundeneintraege: true,
      lohneintraege: true,
      lohnabrechnungen: true,
    }
  })

  if (!mitarbeiter) {
    return NextResponse.json({ error: "Mitarbeiter nicht gefunden" }, { status: 404 })
  }

  // Bereits gelöscht?
  if (mitarbeiter.deletedAt) {
    return NextResponse.json({ 
      error: "Mitarbeiter bereits gelöscht",
      deletedAt: mitarbeiter.deletedAt 
    }, { status: 409 })
  }

  // Statistiken für Audit-Log sammeln (vor Anonymisierung)
  const stats = {
    stundeneintraege: mitarbeiter.stundeneintraege.length,
    lohneintraege: mitarbeiter.lohneintraege.length,
    lohnabrechnungen: mitarbeiter.lohnabrechnungen.length,
    hatVerknuepftenUser: !!mitarbeiter.userId,
    originalName: `${mitarbeiter.vorname} ${mitarbeiter.nachname}`,
  }

  const now = new Date()

  // Transaction: Anonymisierung + Soft-Delete + Audit-Log
  await prisma.$transaction(async (tx) => {
    // 1. Mitarbeiter anonymisieren + Soft-Delete
    await tx.mitarbeiter.update({
      where: { id },
      data: {
        ...ANONYMIZED,
        deletedAt: now,
        status: "geloescht",
        updatedAt: now,
      }
    })

    // 2. Verknüpften User deaktivieren (falls vorhanden)
    if (mitarbeiter.userId) {
      await tx.user.update({
        where: { id: mitarbeiter.userId },
        data: {
          active: false,
          deletedAt: now,
          name: "GELÖSCHT",
          // Email bleibt für Login-Sperre erhalten (unique constraint)
          updatedAt: now,
        }
      })
    }

    // 3. Dokumente des Mitarbeiters soft-deleten
    await tx.dokument.updateMany({
      where: { 
        mitarbeiterId: id,
        deletedAt: null 
      },
      data: { 
        deletedAt: now,
        beschreibung: "[Personenbezogene Daten gemäß DSGVO Art. 17 gelöscht]"
      }
    })

    // 4. Audit-Log erstellen
    await tx.activityLog.create({
      data: {
        action: "MITARBEITER_GELOESCHT",
        entityType: "Mitarbeiter",
        entityId: id,
        entityName: `MA-${id.slice(-6)}`, // Anonymisierte Referenz
        userId,
        metadata: JSON.stringify({
          dsgvoArtikel: "Art. 17 DSGVO - Recht auf Löschung",
          gobdCompliance: "Geschäftsdaten anonymisiert, aber für Aufbewahrungspflichten erhalten",
          anonymisierteFelderCount: Object.keys(ANONYMIZED).length,
          erhalteneDaten: {
            stundeneintraege: stats.stundeneintraege,
            lohneintraege: stats.lohneintraege,
            lohnabrechnungen: stats.lohnabrechnungen,
          },
          userDeaktiviert: stats.hatVerknuepftenUser,
          loeschDatum: now.toISOString(),
        })
      }
    })

    // 5. DeletionLog für Compliance-Nachweis
    await tx.deletionLog.create({
      data: {
        entityType: "Mitarbeiter",
        entityId: id,
        entitySummary: `MA-${id.slice(-6)} (${stats.originalName.split(" ")[0].charAt(0)}****)`,
        deletedBy: userId,
        reason: "GDPR_REQUEST",
        metadata: {
          hatRelationen: stats.stundeneintraege > 0 || stats.lohneintraege > 0,
          gobdRelevant: stats.lohnabrechnungen > 0,
        }
      }
    })
  })

  // Erfolgsmeldung mit Details
  return NextResponse.json({
    success: true,
    message: "Mitarbeiter erfolgreich gemäß DSGVO Art. 17 gelöscht",
    details: {
      mitarbeiterId: id,
      loeschDatum: now.toISOString(),
      anonymisiert: true,
      gobdCompliance: {
        info: "Geschäftsrelevante Daten bleiben anonymisiert erhalten (§ 147 AO)",
        stundeneintraege: `${stats.stundeneintraege} Einträge erhalten`,
        lohneintraege: `${stats.lohneintraege} Einträge erhalten`,
        lohnabrechnungen: `${stats.lohnabrechnungen} Einträge erhalten`,
      },
      userDeaktiviert: stats.hatVerknuepftenUser,
      dokumenteSoftDeleted: true,
    }
  })
}

// OPTIONS für CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Allow": "DELETE, OPTIONS",
    },
  })
}
