import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  parseMultiEntryBaumart,
  isCorruptedEntry,
  calculateDataQuality,
  type DataQualityStats
} from '@/lib/register-parser'
import { auth } from "@/lib/auth"

/**
 * GET /api/saatguternte/admin/re-parse
 * 
 * Analysiert die Datenqualität und identifiziert fehlerhafte Einträge
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if ((session.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Alle Einträge laden (für Analyse)
    const allEntries = await prisma.registerFlaeche.findMany({
      select: {
        id: true,
        registerNr: true,
        baumart: true,
        latDez: true,
        lonDez: true,
        flaecheHa: true,
        bundesland: true,
        quelleId: true,
      },
    })
    
    // Datenqualität berechnen
    const quality = calculateDataQuality(allEntries)
    
    // Fehlerhafte Einträge identifizieren
    const corruptedEntries = allEntries.filter(e => 
      isCorruptedEntry(e.baumart, e.registerNr)
    )
    
    // Schätze wie viele echte Einträge extrahierbar sind
    let estimatedRealEntries = 0
    const sampleCorrupted = corruptedEntries.slice(0, 10)
    
    for (const entry of sampleCorrupted) {
      if (entry.baumart) {
        const parsed = parseMultiEntryBaumart(entry.baumart)
        estimatedRealEntries += parsed.length
      }
    }
    
    // Hochrechnung basierend auf Sample
    const avgEntriesPerCorrupted = sampleCorrupted.length > 0 
      ? estimatedRealEntries / sampleCorrupted.length 
      : 0
    const totalEstimatedEntries = Math.round(corruptedEntries.length * avgEntriesPerCorrupted)
    
    // Gruppiere nach Bundesland
    const byBundesland: Record<string, { total: number; corrupted: number }> = {}
    for (const entry of allEntries) {
      const bl = entry.bundesland || 'Unbekannt'
      if (!byBundesland[bl]) {
        byBundesland[bl] = { total: 0, corrupted: 0 }
      }
      byBundesland[bl].total++
      if (isCorruptedEntry(entry.baumart, entry.registerNr)) {
        byBundesland[bl].corrupted++
      }
    }
    
    return NextResponse.json({
      ok: true,
      analysis: {
        quality,
        corruptedCount: corruptedEntries.length,
        corruptedIds: corruptedEntries.slice(0, 50).map(e => e.id),
        estimatedRealEntries: totalEstimatedEntries,
        byBundesland,
        sampleParsed: sampleCorrupted.slice(0, 3).map(e => ({
          id: e.id,
          originalRegisterNr: e.registerNr,
          originalBaumartLength: e.baumart?.length || 0,
          parsedEntries: e.baumart ? parseMultiEntryBaumart(e.baumart).slice(0, 5) : [],
        })),
      },
      recommendation: corruptedEntries.length > 0
        ? `${corruptedEntries.length} fehlerhafte Einträge gefunden. Diese enthalten schätzungsweise ${totalEstimatedEntries} echte Register-Einträge. Verwende POST /api/saatguternte/admin/re-parse um die Daten zu bereinigen.`
        : 'Keine fehlerhaften Einträge gefunden.',
    })
  } catch (error) {
    console.error('GET /api/saatguternte/admin/re-parse', error)
    return NextResponse.json(
      { ok: false, error: 'Analyse fehlgeschlagen' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/saatguternte/admin/re-parse
 * 
 * Führt das Re-Parsing durch:
 * 1. Identifiziert fehlerhafte Einträge
 * 2. Parst die zusammengefügten Strings
 * 3. Erstellt neue, korrekte Einträge
 * 4. Löscht die alten fehlerhaften Einträge
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if ((session.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const { dryRun = true, limit = 100 } = body
    
    // Alle fehlerhaften Einträge laden
    const allEntries = await prisma.registerFlaeche.findMany({
      select: {
        id: true,
        quelleId: true,
        registerNr: true,
        baumart: true,
        baumartWiss: true,
        bundesland: true,
        quelleUrl: true,
      },
    })
    
    const corruptedEntries = allEntries
      .filter(e => isCorruptedEntry(e.baumart, e.registerNr))
      .slice(0, limit)
    
    if (corruptedEntries.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'Keine fehlerhaften Einträge gefunden.',
        stats: { processed: 0, created: 0, deleted: 0 },
      })
    }
    
    const results = {
      processed: 0,
      parsed: 0,
      created: 0,
      deleted: 0,
      errors: 0,
      samples: [] as Array<{
        originalId: string
        originalRegisterNr: string
        newEntries: number
      }>,
    }
    
    for (const entry of corruptedEntries) {
      results.processed++
      
      if (!entry.baumart) continue
      
      // Parse die zusammengefügten Einträge
      const parsed = parseMultiEntryBaumart(entry.baumart)
      results.parsed += parsed.length
      
      if (parsed.length === 0) {
        results.errors++
        continue
      }
      
      // Sample für Response
      if (results.samples.length < 5) {
        results.samples.push({
          originalId: entry.id,
          originalRegisterNr: entry.registerNr,
          newEntries: parsed.length,
        })
      }
      
      if (!dryRun) {
        // Erstelle neue Einträge
        for (const p of parsed) {
          try {
            // Prüfe ob schon existiert (quelleId + registerNr ist unique)
            const exists = await prisma.registerFlaeche.findFirst({
              where: {
                quelleId: entry.quelleId,
                registerNr: p.registerNr,
              },
            })
            
            if (!exists) {
              await prisma.registerFlaeche.create({
                data: {
                  quelleId: entry.quelleId,
                  registerNr: p.registerNr,
                  bundesland: entry.bundesland,
                  baumart: p.baumart,
                  baumartWiss: entry.baumartWiss,
                  herkunftsgebiet: p.herkunftsCode,
                  kategorie: p.kategorie,
                  ausgangsmaterial: p.ausgangsmaterial,
                  landkreis: p.behoerde,
                  quelleUrl: entry.quelleUrl,
                  zugelassen: true,
                  rohdaten: {
                    originalId: entry.id,
                    parsedFrom: entry.baumart.substring(0, 500),
                    parsedAt: new Date().toISOString(),
                  },
                  letzteAktualisierung: new Date(),
                },
              })
              results.created++
            }
          } catch (createError) {
            // Unique constraint violation - ignorieren
            console.error('Create error:', createError)
          }
        }
        
        // Lösche den alten fehlerhaften Eintrag
        try {
          await prisma.registerFlaeche.delete({
            where: { id: entry.id },
          })
          results.deleted++
        } catch (deleteError) {
          console.error('Delete error:', deleteError)
        }
      }
    }
    
    return NextResponse.json({
      ok: true,
      dryRun,
      message: dryRun 
        ? `Dry-Run: ${results.processed} Einträge analysiert. ${results.parsed} neue Einträge würden erstellt werden.`
        : `Re-Parsing abgeschlossen: ${results.created} neue Einträge erstellt, ${results.deleted} fehlerhafte gelöscht.`,
      stats: results,
      nextStep: dryRun
        ? 'Um tatsächlich zu bereinigen: POST mit { "dryRun": false }'
        : null,
    })
  } catch (error) {
    console.error('POST /api/saatguternte/admin/re-parse', error)
    return NextResponse.json(
      { ok: false, error: 'Re-Parsing fehlgeschlagen' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/saatguternte/admin/re-parse
 * 
 * Löscht alle fehlerhaften Einträge ohne Re-Parsing
 * (Für den Fall dass die Excel-Dateien neu importiert werden sollen)
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if ((session.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const confirm = searchParams.get('confirm') === 'true'
    
    // Alle fehlerhaften Einträge identifizieren
    const allEntries = await prisma.registerFlaeche.findMany({
      select: {
        id: true,
        registerNr: true,
        baumart: true,
      },
    })
    
    const corruptedIds = allEntries
      .filter(e => isCorruptedEntry(e.baumart, e.registerNr))
      .map(e => e.id)
    
    if (!confirm) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        message: `${corruptedIds.length} fehlerhafte Einträge würden gelöscht werden.`,
        corruptedCount: corruptedIds.length,
        nextStep: 'Um tatsächlich zu löschen: DELETE mit ?confirm=true',
      })
    }
    
    // Löschen
    const deleted = await prisma.registerFlaeche.deleteMany({
      where: {
        id: { in: corruptedIds },
      },
    })
    
    return NextResponse.json({
      ok: true,
      message: `${deleted.count} fehlerhafte Einträge gelöscht.`,
      deletedCount: deleted.count,
    })
  } catch (error) {
    console.error('DELETE /api/saatguternte/admin/re-parse', error)
    return NextResponse.json(
      { ok: false, error: 'Löschen fehlgeschlagen' },
      { status: 500 }
    )
  }
}
