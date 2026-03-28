import { NextResponse } from 'next/server';
import { querySecondBrain } from '@/lib/secondbrain-db';

/**
 * Gibt Förderprogramme zurück deren Antragsfrist bald abläuft.
 * GET /api/foerderung/fristen?tage=30
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tage = parseInt(searchParams.get('tage') || '60');
  
  try {
    // Programme mit konkreten Datumsangaben im Fristen-Feld
    // Filtert nach Mustern wie "31.12.2025", "15. März 2026", "30.06.2026"
    const programme = await querySecondBrain(`
      SELECT id, name, bundesland, antragsfrist, url, foerdersatz, traeger
      FROM foerderprogramme
      WHERE status = 'OFFEN'
        AND antragsfrist IS NOT NULL
        AND antragsfrist != ''
        AND antragsfrist NOT ILIKE '%laufend%'
        AND antragsfrist NOT ILIKE '%fortlaufend%'
        AND antragsfrist NOT ILIKE '%jederzeit%'
        AND antragsfrist NOT ILIKE '%keine Frist%'
      ORDER BY name
      LIMIT 50
    `);
    
    return NextResponse.json({
      programme,
      gesamt: programme.length,
      hinweis: 'Bitte aktuelle Fristen direkt bei der Bewilligungsstelle prüfen.'
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
