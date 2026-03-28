import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: NextRequest) {
  try {
    const { frage, bundesland, waldtyp, flaeche_ha, kalamitaet } = await req.json();
    
    // 1. Strukturierte Suche nach passenden Förderprogrammen
    // Da fastembed Server-seitig nicht einfach in Next.js läuft,
    // verwenden wir Keyword-basierte Suche + strukturierte Filter
    let query = `SELECT * FROM foerderprogramme WHERE status = 'OFFEN'`;
    const params: (string | number)[] = [];
    
    if (bundesland) {
      params.push(bundesland);
      query += ` AND (bundesland = $${params.length} OR bundesland = 'Bund' OR bundesland = 'EU')`;
    }
    
    if (kalamitaet) {
      query += ` AND (kategorien @> ARRAY['wiederbewaldung'] OR kategorien @> ARRAY['waldschutz'] OR kategorien @> ARRAY['kalamitaet'])`;
    }
    
    if (waldtyp) {
      // Filter nach Waldbesitzart wenn angegeben
      params.push(waldtyp);
      query += ` AND (waldbesitzart IS NULL OR waldbesitzart @> ARRAY[$${params.length}]::text[])`;
    }
    
    if (flaeche_ha) {
      // Filter nach Mindestfläche
      params.push(flaeche_ha);
      query += ` AND (mindestflaeche_ha IS NULL OR mindestflaeche_ha <= $${params.length})`;
    }
    
    query += ` ORDER BY 
      CASE 
        WHEN foerdersatz ~ '^[0-9]+' THEN CAST(REGEXP_REPLACE(foerdersatz, '[^0-9]', '', 'g') AS INTEGER)
        ELSE 0 
      END DESC NULLS LAST 
      LIMIT 8`;
    
    const programme = await sql(query, params);
    
    // 2. Kombinationen abrufen für gefundene Programme
    const ids = programme.map((p: Record<string, unknown>) => p.id as number);
    let kombinationen: Record<string, unknown>[] = [];
    
    if (ids.length > 0) {
      kombinationen = await sql(
        `SELECT k.*, a.name as prog_a_name, b.name as prog_b_name 
         FROM foerder_kombinationen k
         JOIN foerderprogramme a ON k.programm_a_id = a.id
         JOIN foerderprogramme b ON k.programm_b_id = b.id
         WHERE k.kombinierbar = true 
         AND (k.programm_a_id = ANY($1) OR k.programm_b_id = ANY($1))
         LIMIT 5`,
        [ids]
      );
    }
    
    // 3. Praxis-Tipps abrufen
    let praxisTipps: Record<string, unknown>[] = [];
    if (ids.length > 0) {
      praxisTipps = await sql(
        `SELECT p.annotation, f.name as programm_name
         FROM foerder_praxis p
         JOIN foerderprogramme f ON p.programm_id = f.id
         WHERE p.programm_id = ANY($1)
         LIMIT 3`,
        [ids]
      );
    }
    
    // 4. Synthese-Text zusammenstellen
    const synthese = `Für Ihre Anfrage (${bundesland || 'Deutschland'}, ${flaeche_ha ? flaeche_ha + ' ha' : 'keine Flächenangabe'}${kalamitaet ? ', Kalamität' : ''}) wurden ${programme.length} relevante Förderprogramme gefunden. ${kombinationen.length > 0 ? `${kombinationen.length} Programmkombinationen sind möglich.` : ''} ${praxisTipps.length > 0 ? 'Praxis-Tipps verfügbar.' : ''} Prüfen Sie die aktuellen Antragsfristen direkt bei den zuständigen Behörden.`;
    
    return NextResponse.json({
      programme,
      kombinationen,
      praxisTipps,
      synthese,
      quellen: programme.map((p: Record<string, unknown>) => p.url).filter(Boolean),
      meta: {
        anzahl_programme: programme.length,
        anzahl_kombinationen: kombinationen.length,
        filter: { bundesland, waldtyp, flaeche_ha, kalamitaet }
      }
    });
    
  } catch (error) {
    console.error('Förderberater API Error:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Förderberatung', details: String(error) },
      { status: 500 }
    );
  }
}

// GET für einfache Statusabfrage
export async function GET() {
  try {
    const stats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM foerderprogramme WHERE status = 'OFFEN') as programme_aktiv,
        (SELECT COUNT(*) FROM foerder_chunks) as chunks_gesamt,
        (SELECT COUNT(*) FROM foerder_kombinationen WHERE kombinierbar = true) as kombinationen
    `;
    
    return NextResponse.json({
      status: 'ok',
      endpoint: '/api/foerderung/beraten',
      methoden: ['GET', 'POST'],
      stats: stats[0],
      version: '1.0.0'
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', error: String(error) },
      { status: 500 }
    );
  }
}
