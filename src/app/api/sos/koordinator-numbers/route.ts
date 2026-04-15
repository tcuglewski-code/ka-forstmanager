import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// ============================================================
// GET /api/sos/koordinator-numbers
// Sprint JK (SOS-03): Liefert Telefonnummern aller Koordinatoren
// für SMS-Fallback bei Offline-SOS
// ============================================================

export async function GET(req: NextRequest) {
  try {
    // Authentifizierung prüfen
    const authResult = await verifyToken(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    // Alle Koordinatoren (Gruppenführer, Admins) mit hinterlegter Telefonnummer laden
    // Schema: rolle (nicht role), status (nicht aktiv), telefon + mobil
    const koordinatoren = await prisma.mitarbeiter.findMany({
      where: {
        AND: [
          { status: 'aktiv' },
          { deletedAt: null },
          {
            OR: [
              { rolle: 'admin' },
              { rolle: 'gruppenfuehrer' },
              { rolle: 'koordinator' },
            ],
          },
          {
            OR: [
              { telefon: { not: null } },
              { mobil: { not: null } },
            ],
          },
        ],
      },
      select: {
        id: true,
        vorname: true,
        nachname: true,
        telefon: true,
        mobil: true,
        rolle: true,
      },
    });

    // Nur gültige Telefonnummern extrahieren (bevorzuge mobil, dann telefon)
    const numbers = koordinatoren
      .map((k) => k.mobil || k.telefon)
      .filter((n): n is string => !!n && n.trim().length >= 6)
      .map((n) => n.replace(/\s+/g, '')); // Leerzeichen entfernen

    // Fallback: Wenn keine Koordinatoren gefunden, alle Admins nehmen
    if (numbers.length === 0) {
      const admins = await prisma.mitarbeiter.findMany({
        where: {
          status: 'aktiv',
          deletedAt: null,
          rolle: 'admin',
        },
        select: {
          telefon: true,
          mobil: true,
        },
      });

      const adminNumbers = admins
        .map((a) => a.mobil || a.telefon)
        .filter((n): n is string => !!n && n.trim().length >= 6)
        .map((n) => n.replace(/\s+/g, ''));

      return NextResponse.json({
        numbers: adminNumbers,
        count: adminNumbers.length,
        source: 'admin_fallback',
      });
    }

    return NextResponse.json({
      numbers,
      count: numbers.length,
      source: 'koordinatoren',
    });
  } catch (error: any) {
    console.error('[API] Koordinator-Nummern Fehler:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler', numbers: [] },
      { status: 500 }
    );
  }
}
