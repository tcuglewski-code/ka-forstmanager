import { NextRequest, NextResponse } from 'next/server';
import { querySecondBrain as query } from '@/lib/secondbrain-db';
import Anthropic from '@anthropic-ai/sdk';

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

  // Bundesland: muss aus erlaubter Liste sein
  const bundeslandClean = typeof bundesland === 'string' ? bundesland.trim() : '';
  if (bundeslandClean && !ERLAUBTE_BUNDESLAENDER.has(bundeslandClean)) {
    return NextResponse.json({ error: `Ungültiges Bundesland: ${bundeslandClean}` }, { status: 400 });
  }

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

    // 5. LLM-Synthese mit Anthropic
    let synthese = '';
    let quellenAngaben: string[] = [];

    if (process.env.ANTHROPIC_API_KEY && programme.length > 0) {
      try {
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        const programmeListe = programme.map((p) =>
          `**${p.name}** (${p.bundesland}): ${p.beschreibung || ''} | Fördersatz: ${p.foerdersatz || 'variabel'} | Antragsfrist: ${p.antragsfrist || 'laufend'}`
        ).join('\n');

        const kombinationenListe = kombinationen.length > 0
          ? kombinationen.map((k) => `${k.prog_a_name} + ${k.prog_b_name}: ${k.bedingung || 'kombinierbar'}`).join('\n')
          : 'Keine Kombinations-Regeln bekannt.';

        const praxisListe = praxis.length > 0
          ? praxis.map((p) => `${p.programm_name}: ${p.annotation}${p.fallstricke ? ' ⚠️ ' + p.fallstricke : ''}`).join('\n')
          : '';

        const dokListe = dokChunks.length > 0
          ? dokChunks.map((d) => `[${d.dokument_titel}${d.paragraf_ref ? ' ' + d.paragraf_ref : ''}]: ${d.content}`).join('\n\n')
          : '';

        const message = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: 'Du bist ein Experte für deutsche Forstförderung. Du hilfst Waldbesitzern und Forstdienstleistern dabei, passende Förderprogramme zu finden und zu kombinieren. Antworte präzise, klar und praktisch auf Deutsch.',
          messages: [{
            role: 'user',
            content: `Anfrage: "${frageClean}"
${bundeslandClean ? `Bundesland: ${bundeslandClean}` : ''}${waldtyp ? `\nWaldtyp: ${waldtyp}` : ''}${flaecheClean ? `\nFläche: ${flaecheClean} ha` : ''}${kalamitaet ? `\nKalamität: ${kalamitaet}` : ''}

Gefundene Förderprogramme:
${programmeListe}

Kombinierbare Programme:
${kombinationenListe}
${praxisListe ? `\nPraxis-Erfahrungen:\n${praxisListe}` : ''}${dokListe ? `\n\nRelevante Förderrichtlinien:\n${dokListe}` : ''}

Erstelle eine strukturierte Empfehlung (max. 400 Wörter):
1. Welche Programme passen am besten?
2. Welche können kombiniert werden?
3. Wichtige Fristen und nächste Schritte?
4. Praxis-Hinweise und Fallstricke?`
          }],
        });

        synthese = message.content[0].type === 'text' ? message.content[0].text : '';
        quellenAngaben = [
          ...programme.map((p) => p.url as string).filter(Boolean),
          ...dokChunks.map((d) => `${d.dokument_titel}${d.paragraf_ref ? ' ' + d.paragraf_ref : ''}`).filter(Boolean),
        ];
      } catch (err) {
        console.error('Anthropic error:', err);
        synthese = `${programme.length} passende Förderprogramme gefunden für ${bundeslandClean || 'Deutschland'}. Bitte prüfen Sie die Antragsfristen direkt bei den Behörden.`;
      }
    } else {
      synthese = `${programme.length} passende Förderprogramme gefunden${bundeslandClean ? ' für ' + bundeslandClean : ''}. ${kombinationen.length > 0 ? kombinationen.length + ' Programme können kombiniert werden.' : ''} Bitte aktuelle Antragsfristen bei den Behörden prüfen.`;
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
        ki_synthese: !!process.env.ANTHROPIC_API_KEY,
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
