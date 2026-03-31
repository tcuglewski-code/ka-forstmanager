import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isCorruptedEntry, calculateDataQuality } from '@/lib/register-parser'

/**
 * GET /api/saatguternte/admin/quality
 * 
 * Liefert detaillierte Datenqualitäts-Statistiken
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const bundesland = searchParams.get('bundesland')
    
    // Basis-Query
    const where = bundesland ? { bundesland } : {}
    
    // Alle Einträge laden
    const entries = await prisma.registerFlaeche.findMany({
      where,
      select: {
        id: true,
        registerNr: true,
        baumart: true,
        latDez: true,
        lonDez: true,
        flaecheHa: true,
        forstamt: true,
        bundesland: true,
        kategorie: true,
        ausgangsmaterial: true,
      },
    })
    
    // Basis-Statistiken
    const quality = calculateDataQuality(entries)
    
    // Detaillierte Analyse
    const stats = {
      total: entries.length,
      quality,
      
      // GPS-Daten
      withGps: entries.filter(e => e.latDez != null && e.lonDez != null).length,
      withoutGps: entries.filter(e => e.latDez == null || e.lonDez == null).length,
      
      // Flächen-Daten  
      withFlaeche: entries.filter(e => e.flaecheHa != null).length,
      withoutFlaeche: entries.filter(e => e.flaecheHa == null).length,
      
      // Forstamt
      withForstamt: entries.filter(e => e.forstamt != null && e.forstamt.length > 0).length,
      
      // Fehlerhafte Einträge
      corrupted: entries.filter(e => isCorruptedEntry(e.baumart, e.registerNr)).length,
      
      // Bundesland-Verteilung
      byBundesland: {} as Record<string, {
        total: number
        withGps: number
        withFlaeche: number
        corrupted: number
      }>,
      
      // Datenqualitäts-Score (0-100)
      qualityScore: 0,
    }
    
    // Berechne pro Bundesland
    for (const entry of entries) {
      const bl = entry.bundesland || 'Unbekannt'
      if (!stats.byBundesland[bl]) {
        stats.byBundesland[bl] = {
          total: 0,
          withGps: 0,
          withFlaeche: 0,
          corrupted: 0,
        }
      }
      
      stats.byBundesland[bl].total++
      
      if (entry.latDez != null && entry.lonDez != null) {
        stats.byBundesland[bl].withGps++
      }
      if (entry.flaecheHa != null) {
        stats.byBundesland[bl].withFlaeche++
      }
      if (isCorruptedEntry(entry.baumart, entry.registerNr)) {
        stats.byBundesland[bl].corrupted++
      }
    }
    
    // Berechne Qualitäts-Score
    // - 40% für GPS-Daten
    // - 30% für Flächen-Daten
    // - 30% für keine fehlerhaften Einträge
    const gpsRatio = stats.total > 0 ? stats.withGps / stats.total : 0
    const flaecheRatio = stats.total > 0 ? stats.withFlaeche / stats.total : 0
    const corruptedRatio = stats.total > 0 ? (stats.total - stats.corrupted) / stats.total : 0
    
    stats.qualityScore = Math.round(
      gpsRatio * 40 + flaecheRatio * 30 + corruptedRatio * 30
    )
    
    return NextResponse.json({
      ok: true,
      stats,
      interpretation: {
        qualityLevel: stats.qualityScore >= 80 ? 'gut' :
                      stats.qualityScore >= 50 ? 'mittel' : 'schlecht',
        mainIssues: [
          ...(stats.corrupted > 0 ? [`${stats.corrupted} fehlerhafte Einträge (zusammengefügte Daten)`] : []),
          ...(stats.withoutGps > entries.length * 0.5 ? [`${Math.round(stats.withoutGps / entries.length * 100)}% ohne GPS-Koordinaten`] : []),
          ...(stats.withoutFlaeche > entries.length * 0.5 ? [`${Math.round(stats.withoutFlaeche / entries.length * 100)}% ohne Flächenangabe`] : []),
        ],
        recommendations: [
          ...(stats.corrupted > 0 ? ['POST /api/saatguternte/admin/re-parse aufrufen um fehlerhafte Daten zu bereinigen'] : []),
          ...(stats.withoutGps > 100 ? ['Crawler mit Detailseiten-Abruf für GPS-Koordinaten ausstatten'] : []),
        ],
      },
    })
  } catch (error) {
    console.error('GET /api/saatguternte/admin/quality', error)
    return NextResponse.json(
      { ok: false, error: 'Qualitätsanalyse fehlgeschlagen' },
      { status: 500 }
    )
  }
}
