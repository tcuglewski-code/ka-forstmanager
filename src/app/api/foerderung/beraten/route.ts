import { NextRequest, NextResponse } from 'next/server';
import { querySecondBrain as query } from '@/lib/secondbrain-db';
// TODO: Anthropic-Import für spätere KI-Synthese-Nachrüstung
// import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  // ── Integrität: Input-Validierung ──────────────────────────────────────────
  const ERLAUBTE_BUNDESLAENDER = new Set([
    'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen',
    'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen',
    'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland', 'Sachsen',
    'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen',
    'Bund', 'Bundesweit', 'EU', '', // leer = alle
  ]);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }

  const { frage, bundesland, waldtyp, flaeche_ha, kalamitaet } = body as {
    frage?: string; bundesland?: string; waldtyp?: string;
    flaeche_ha?: number; kalamitaet?: string;
  };

  // Frage: maximal 500 Zeichen, kein Null-Byte, keine System-Prompt-Injection
  if (frage && typeof frage !== 'string') {
    return NextResponse.json({ error: 'frage muss ein String sein' }, { status: 400 });
  }
  const frageClean = (frage || '').slice(0, 500).replace(/\0/g, '').trim();
  const INJECTION_PATTERNS = [/ignore previous/i, /system prompt/i, /\[INST\]/i, /<\|im_start\|>/i];
  if (INJECTION_PATTERNS.some(p => p.test(frageClean))) {
    return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 });
  }

  // Bundesland: Sanitize — wenn nicht in Whitelist, ignorieren statt ablehnen
  // (Auftragsfelder können Abkürzungen oder abweichende Schreibweise enthalten)
  const bundeslandRaw = typeof bundesland === 'string' ? bundesland.trim() : '';
  const bundeslandClean = ERLAUBTE_BUNDESLAENDER.has(bundeslandRaw) ? bundeslandRaw : '';

  // Fläche: muss eine positive Zahl sein, max. 100.000 ha
  const flaecheClean = flaeche_ha ? Math.min(Math.max(0, Number(flaeche_ha)), 100000) : undefined;
  if (flaeche_ha && isNaN(flaecheClean!)) {
    return NextResponse.json({ error: 'flaeche_ha muss eine Zahl sein' }, { status: 400 });
  }

  // Rate-Limiting: max 10 Anfragen/Min pro IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { checkRateLimit } = await import('@/lib/rate-limit');
  if (!checkRateLimit(`foerder-beraten:${ip}`, 10, 60_000)) {
    return NextResponse.json(
      { error: 'Zu viele Anfragen. Bitte warte eine Minute.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  try {
    // 1. Strukturierte DB-Suche
    // ── SQL-Injection: Durch parameterisierte Queries ($1, $2, ...) gesichert ──
    // Garbage-Namen ausfiltern (Crawler hat HTML-Spaltenheader als Programmnamen gespeichert)
    const GARBAGE_NAMES = ['Hinweis', 'Fördersatz', 'Fördergegenstand', 'Hinweise', 'Antragsweg',
      'Bewilligungsstelle', 'Förderart', 'Förderkulisse', 'Antragsfrist', 'Zielgruppe', 'Status'];

    const params: (string | number)[] = [];

    // Base WHERE clauses (garbage filter via static SQL — no injection risk on static list)
    const garbageList = GARBAGE_NAMES.map(n => `'${n.replace(/'/g, "''")}'`).join(', ');

    let queryText = `SELECT DISTINCT ON (COALESCE(url, id::text)) id, name, bundesland,
      foerdergegenstand as beschreibung, foerdersatz, kategorien,
      url, foerderkulisse, antragsfrist, antragsweg, min_foerdersumme_eur, max_foerdersumme_eur,
      waldbesitzart, mindestflaeche_ha, required_docs, foerderperiode_start, foerderperiode_ende
      FROM foerderprogramme WHERE status = 'OFFEN'
      AND name IS NOT NULL
      AND length(name) > 10
      AND name NOT IN (${garbageList})`;

    if (bundeslandClean) {
      params.push(bundeslandClean);
      queryText += ` AND (bundesland = $${params.length} OR bundesland = 'Bund' OR bundesland = 'EU')`;
    }
    if (kalamitaet) {
      queryText += ` AND (kategorien @> ARRAY['wiederbewaldung'] OR kategorien @> ARRAY['waldschutz'])`;
    }
    if (waldtyp) {
      params.push(waldtyp);
      queryText += ` AND (waldbesitzart IS NULL OR waldbesitzart @> ARRAY[$${params.length}]::text[])`;
    }
    if (flaecheClean) {
      params.push(flaecheClean);
      queryText += ` AND (mindestflaeche_ha IS NULL OR mindestflaeche_ha <= $${params.length})`;
    }
    // DISTINCT ON erfordert ORDER BY mit der DISTINCT-Spalte zuerst
    queryText += ` ORDER BY COALESCE(url, id::text), id DESC LIMIT 8`;

    const programme = await query(queryText, params);

    // 2. Kumulations-Regeln
    const ids = programme.map((p) => p.id as number);
    let kombinationen: Record<string, unknown>[] = [];
    if (ids.length > 0) {
      try {
        kombinationen = await query(
          `SELECT k.kombinierbar, k.bedingung, k.quelle,
            a.name as prog_a_name, b.name as prog_b_name
           FROM foerder_kombinationen k
           JOIN foerderprogramme a ON k.programm_a_id = a.id
           JOIN foerderprogramme b ON k.programm_b_id = b.id
           WHERE k.kombinierbar = true
           AND (k.programm_a_id = ANY($1) OR k.programm_b_id = ANY($1))
           LIMIT 5`,
          [ids]
        );
      } catch {}
    }

    // 3. Praxis-Tipps
    let praxis: Record<string, unknown>[] = [];
    if (ids.length > 0) {
      try {
        praxis = await query(
          `SELECT pr.annotation, pr.fallstricke, p.name as programm_name
           FROM foerder_praxis pr
           JOIN foerderprogramme p ON pr.programm_id = p.id
           WHERE pr.programm_id = ANY($1)
           LIMIT 5`,
          [ids]
        );
      } catch {}
    }

    // 4. Dokument-Chunks (RAG)
    let dokChunks: Record<string, unknown>[] = [];
    try {
      dokChunks = await query(
        `SELECT content, paragraf_ref, dokument_titel
         FROM foerder_dokumente
         WHERE programm_id = ANY($1)
         ORDER BY chunk_index ASC
         LIMIT 10`,
        [ids]
      );
    } catch {}

    // 5. Strukturierte Synthese (ohne externe KI — serverside, kostenlos)
    // TODO: Anthropic API-Anbindung optional nachrüsten wenn API-Key verfügbar
    const quellenAngaben: string[] = programme.map((p) => p.url as string).filter(Boolean);

    const topProgramme = programme.slice(0, 3).map((p) => (p.name as string)).join(', ');
    const flaecheText = flaecheClean ? ` für ${flaecheClean} ha` : '';
    const kalamitaetText = kalamitaet ? ', Kalamitätsfläche' : '';

    let synthese = '';

    if (programme.length === 0) {
      synthese = `Für Ihre Anfrage${bundeslandClean ? ' in ' + bundeslandClean : ''}${flaecheText}${kalamitaetText} wurden keine passenden Förderprogramme gefunden. Versuchen Sie eine breitere Suche ohne Bundesland-Filter.`;
    } else {
      // Hauptsatz
      synthese = `${programme.length} passende Förderprogramm${programme.length === 1 ? '' : 'e'} gefunden`;
      if (bundeslandClean) synthese += ` für ${bundeslandClean}`;
      if (flaecheClean) synthese += ` (${flaecheClean} ha)`;
      if (kalamitaet) synthese += ` — Kalamität/Schadholz berücksichtigt`;
      synthese += '.';

      // Top-Programme
      if (programme.length > 0) {
        synthese += `\n\n**Empfohlene Programme:** ${topProgramme}${programme.length > 3 ? ` und ${programme.length - 3} weitere` : ''}.`;
      }

      // Kombinationen
      if (kombinationen.length > 0) {
        const kombText = (kombinationen as Array<{prog_a_name: string; prog_b_name: string}>)
          .slice(0, 2)
          .map(k => `${k.prog_a_name} + ${k.prog_b_name}`)
          .join('; ');
        synthese += `\n\n**Kombinierbar:** ${kombText}.`;
      }

      // Praxis-Hinweise
      if (praxis.length > 0) {
        synthese += `\n\n**Praxis-Hinweis:** ${(praxis[0] as {annotation: string}).annotation}`;
      }

      // Fristen
      const mitFrist = programme.filter((p) => p.antragsfrist && !(p.antragsfrist as string).toLowerCase().includes('laufend'));
      if (mitFrist.length > 0) {
        synthese += `\n\n**Fristen beachten:** ${mitFrist.length} Programm${mitFrist.length === 1 ? '' : 'e'} mit konkreter Antragsfrist — direkt bei der Bewilligungsstelle prüfen.`;
      }

      synthese += '\n\n⚠️ Alle Angaben ohne Gewähr. Aktuelle Konditionen direkt bei der zuständigen Behörde prüfen.';
    }

    // ── Ausgabe-Validierung: Programme ohne Namen filtern ──
    const programmeValidiert = programme.filter((p: Record<string, unknown>) =>
      p.name && typeof p.name === 'string' && (p.name as string).length > 10
    );

    // Disclaimer anhängen wenn kein KI-Text
    const syntheseFinal = synthese + (
      !synthese.includes('Behörde') && !synthese.includes('Antragstellung')
        ? '\n\n⚠️ Alle Angaben ohne Gewähr. Prüfen Sie aktuelle Konditionen direkt bei der zuständigen Bewilligungsstelle.'
        : ''
    );

    return NextResponse.json({
      programme: programmeValidiert,
      kombinationen,
      praxis,
      synthese: syntheseFinal,
      quellen: quellenAngaben,
      meta: {
        bundesland: bundeslandClean || null,
        waldtyp: waldtyp || null,
        flaeche_ha: flaecheClean || null,
        kalamitaet: kalamitaet || null,
        programme_gefunden: programmeValidiert.length,
        ki_synthese: false, // TODO: auf true setzen wenn Anthropic API-Key verfügbar
      }
    });
  } catch (error) {
    console.error('Förderberater error:', error);
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const stats = await query(`
      SELECT COUNT(*) as gesamt,
        COUNT(*) FILTER (WHERE status = 'OFFEN') as offen,
        COUNT(DISTINCT bundesland) as bundeslaender
      FROM foerderprogramme
    `);
    const chunks = await query(`SELECT COUNT(*) as gesamt FROM foerder_chunks`);
    return NextResponse.json({
      programme: stats[0],
      chunks: chunks[0]?.gesamt,
      ki_aktiv: !!process.env.ANTHROPIC_API_KEY
    });
  } catch (error) {
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
