import { NextRequest, NextResponse } from 'next/server';
import { querySecondBrain } from '@/lib/secondbrain-db';
import { auth } from '@/lib/auth';

/**
 * API-Route für Förderantrags-Verläufe
 * GET: Alle Antragsverläufe abrufen (mit optionalem programm_id Filter)
 * POST: Neuen Antragsverlauf anlegen
 * PATCH: Status eines Antrags aktualisieren
 */

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url);
  const programmId = searchParams.get('programm_id');
  const auftragId = searchParams.get('auftrag_id');
  
  try {
    let query = `
      SELECT av.*, p.name as programm_name, p.bundesland as programm_bundesland
      FROM foerder_antragsverlauf av
      JOIN foerderprogramme p ON av.programm_id = p.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];
    
    if (programmId) {
      params.push(parseInt(programmId));
      query += ` AND av.programm_id = $${params.length}`;
    }
    if (auftragId) {
      params.push(auftragId);
      query += ` AND av.auftrag_id = $${params.length}`;
    }
    
    query += ` ORDER BY av.erstellt_am DESC LIMIT 50`;
    
    const verlauf = await querySecondBrain(query, params);
    const statistik = await querySecondBrain(`
      SELECT * FROM foerder_statistik 
      WHERE anzahl_antraege > 0
      ORDER BY anzahl_antraege DESC
      LIMIT 20
    `);
    
    return NextResponse.json({ verlauf, statistik });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json();
    const { programm_id, auftrag_id, status, eingereicht_am, beantragter_betrag_eur, bewilligungsstelle, notizen } = body;
    
    if (!programm_id) return NextResponse.json({ error: 'programm_id fehlt' }, { status: 400 });
    
    const result = await querySecondBrain(`
      INSERT INTO foerder_antragsverlauf 
        (programm_id, auftrag_id, status, eingereicht_am, beantragter_betrag_eur, bewilligungsstelle, notizen)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [programm_id, auftrag_id || null, status || 'geplant', 
        eingereicht_am || null, beantragter_betrag_eur || null, 
        bewilligungsstelle || null, notizen || null]);
    
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json();
    const { id, status, entschieden_am, bewilligter_betrag_eur, notizen } = body;
    
    if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 });
    
    const result = await querySecondBrain(`
      UPDATE foerder_antragsverlauf SET
        status = COALESCE($1, status),
        entschieden_am = COALESCE($2, entschieden_am),
        bewilligter_betrag_eur = COALESCE($3, bewilligter_betrag_eur),
        notizen = COALESCE($4, notizen),
        aktualisiert_am = NOW()
      WHERE id = $5
      RETURNING *
    `, [status || null, entschieden_am || null, bewilligter_betrag_eur || null, notizen || null, id]);
    
    return NextResponse.json(result[0]);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
