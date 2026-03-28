import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import Anthropic from '@anthropic-ai/sdk';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: NextRequest) {
  try {
    const { frage, bundesland, waldtyp, flaeche_ha, kalamitaet } = await req.json();

    // 1. Strukturierte DB-Suche
    let query = `SELECT id, name, bundesland, foerdergegenstand as beschreibung, foerdersatz, kategorien,
      url, foerderkulisse, antragsfrist, antragsweg, min_foerdersumme_eur, max_foerdersumme_eur,
      waldbesitzart, mindestflaeche_ha, required_docs, foerderperiode_start, foerderperiode_ende
      FROM foerderprogramme WHERE status = 'OFFEN'`;
    const params: (string | number)[] = [];

    if (bundesland) {
      params.push(bundesland);
      query += ` AND (bundesland = $${params.length} OR bundesland = 'Bund' OR bundesland = 'EU')`;
    }
    if (kalamitaet) {
      query += ` AND (kategorien @> ARRAY['wiederbewaldung'] OR kategorien @> ARRAY['waldschutz'])`;
    }
    if (waldtyp) {
      params.push(waldtyp);
      query += ` AND (waldbesitzart IS NULL OR waldbesitzart @> ARRAY[$${params.length}]::text[])`;
    }
    if (flaeche_ha) {
      params.push(Number(flaeche_ha));
      query += ` AND (mindestflaeche_ha IS NULL OR mindestflaeche_ha <= $${params.length})`;
    }
    query += ` ORDER BY id DESC LIMIT 8`;

    const programme = await sql(query, params);

    // 2. Kumulations-Regeln
    const ids = programme.map((p: Record<string, unknown>) => p.id as number);
    let kombinationen: Record<string, unknown>[] = [];
    if (ids.length > 0) {
      try {
        kombinationen = await sql(
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
        praxis = await sql(
          `SELECT pr.annotation, pr.fallstricke, p.name as programm_name
           FROM foerder_praxis pr
           JOIN foerderprogramme p ON pr.programm_id = p.id
           WHERE pr.programm_id = ANY($1)
           LIMIT 5`,
          [ids]
        );
      } catch {}
    }

    // 4. Dokument-Chunks abrufen (RAG)
    let dokChunks: Record<string, unknown>[] = [];
    try {
      dokChunks = await sql(
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

        const programmeListe = programme.map((p: Record<string, unknown>) =>
          `**${p.name}** (${p.bundesland}): ${p.beschreibung || ''} | Fördersatz: ${p.foerdersatz || 'variabel'} | Antragsfrist: ${p.antragsfrist || 'laufend'}`
        ).join('\n');

        const kombinationenListe = kombinationen.length > 0
          ? kombinationen.map((k: Record<string, unknown>) =>
              `${k.prog_a_name} + ${k.prog_b_name}: ${k.bedingung || 'kombinierbar'}`
            ).join('\n')
          : 'Keine Kombinations-Regeln bekannt.';

        const praxisListe = praxis.length > 0
          ? praxis.map((p: Record<string, unknown>) =>
              `${p.programm_name}: ${p.annotation}${p.fallstricke ? ' ⚠️ ' + p.fallstricke : ''}`
            ).join('\n')
          : '';

        const dokListe = dokChunks.length > 0
          ? dokChunks.map((d: Record<string, unknown>) =>
              `[${d.dokument_titel}${d.paragraf_ref ? ' ' + d.paragraf_ref : ''}]: ${d.content}`
            ).join('\n\n')
          : '';

        const systemPrompt = `Du bist ein Experte für deutsche Forstförderung. Du hilfst Waldbesitzern und Forstdienstleistern dabei, passende Förderprogramme zu finden und zu kombinieren. Antworte präzise, klar und praktisch. Verwende immer konkrete Angaben zu Fördersätzen und Fristen wenn verfügbar.`;

        const userPrompt = `Anfrage: "${frage}"
${bundesland ? `Bundesland: ${bundesland}` : ''}
${waldtyp ? `Waldtyp: ${waldtyp}` : ''}
${flaeche_ha ? `Fläche: ${flaeche_ha} ha` : ''}
${kalamitaet ? `Kalamität: ${kalamitaet}` : ''}

Gefundene Förderprogramme:
${programmeListe}

Kombinierbare Programme:
${kombinationenListe}

${praxisListe ? `Praxis-Erfahrungen:\n${praxisListe}` : ''}

${dokListe ? `Relevante Förderrichtlinien-Auszüge:\n${dokListe}` : ''}

Erstelle eine strukturierte Empfehlung:
1. Welche Programme passen am besten zur Anfrage und warum?
2. Welche Programme können kombiniert werden?
3. Wichtige Fristen und nächste Schritte?
4. Praxis-Hinweise und Fallstricke?

Antworte auf Deutsch, maximal 400 Wörter.`;

        const message = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          messages: [{ role: 'user', content: userPrompt }],
          system: systemPrompt,
        });

        synthese = message.content[0].type === 'text' ? message.content[0].text : '';
        quellenAngaben = [
          ...programme.map((p: Record<string, unknown>) => p.url as string).filter(Boolean),
          ...dokChunks.map((d: Record<string, unknown>) => `${d.dokument_titel}${d.paragraf_ref ? ' ' + d.paragraf_ref : ''}`).filter(Boolean),
        ];
      } catch (err) {
        console.error('Anthropic error:', err);
        synthese = `${programme.length} passende Förderprogramme gefunden für ${bundesland || 'Deutschland'}. Bitte prüfen Sie die Antragsfristen direkt bei den Behörden.`;
      }
    } else {
      synthese = `${programme.length} passende Förderprogramme gefunden${bundesland ? ' für ' + bundesland : ''}. ${kombinationen.length > 0 ? kombinationen.length + ' Programme können kombiniert werden.' : ''} Bitte prüfen Sie die aktuellen Antragsfristen direkt bei den zuständigen Behörden.`;
    }

    return NextResponse.json({
      programme,
      kombinationen,
      praxis,
      synthese,
      quellen: quellenAngaben,
      meta: {
        bundesland: bundesland || null,
        waldtyp: waldtyp || null,
        flaeche_ha: flaeche_ha || null,
        kalamitaet: kalamitaet || null,
        programme_gefunden: programme.length,
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
    const stats = await sql(`
      SELECT
        COUNT(*) as gesamt,
        COUNT(*) FILTER (WHERE status = 'OFFEN') as offen,
        COUNT(DISTINCT bundesland) as bundeslaender
      FROM foerderprogramme
    `);
    const chunks = await sql(`SELECT COUNT(*) as gesamt FROM foerder_chunks`);
    return NextResponse.json({
      programme: stats[0],
      chunks: chunks[0].gesamt,
      ki_aktiv: !!process.env.ANTHROPIC_API_KEY
    });
  } catch (error) {
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
