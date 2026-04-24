// FM-17: Multi-PDF Export — alle Protokolle eines Auftrags als ZIP
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import archiver from 'archiver'

const GREEN = rgb(0.17, 0.23, 0.11)
const GOLD = rgb(0.77, 0.65, 0.35)
const BLACK = rgb(0, 0, 0)
const GRAY = rgb(0.4, 0.4, 0.4)

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtTime(t: string | null | undefined) {
  if (!t) return '—'
  if (t.includes('T')) {
    return new Date(t).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }
  return t
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateProtokollPdf(protokoll: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const page = pdfDoc.addPage([595, 842])
  const { width, height } = page.getSize()
  let y = height - 50

  function drawHeader(text: string) {
    y -= 10
    page.drawRectangle({ x: 40, y: y - 4, width: width - 80, height: 22, color: rgb(0.95, 0.95, 0.95) })
    page.drawText(text, { x: 45, y, size: 10, font: fontBold, color: GREEN })
    y -= 22
  }

  function drawRow(label: string, value: string | number | null | undefined, unit = '') {
    if (value === null || value === undefined || value === '' || value === 0) return
    const valStr = typeof value === 'number' ? value.toLocaleString('de-DE') : String(value)
    page.drawText(label, { x: 50, y, size: 9, font, color: GRAY })
    page.drawText(`${valStr}${unit ? ' ' + unit : ''}`, { x: 250, y, size: 9, font: fontBold, color: BLACK })
    y -= 16
  }

  page.drawText('Koch Aufforstung GmbH', { x: 40, y, size: 14, font: fontBold, color: GREEN })
  y -= 18
  page.drawText('Tagesprotokoll', { x: 40, y, size: 18, font: fontBold, color: GOLD })
  page.drawText(fmtDate(protokoll.datum), { x: width - 140, y, size: 12, font: fontBold, color: BLACK })
  y -= 8
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: GOLD })
  y -= 10

  drawHeader('Auftrag')
  drawRow('Titel', protokoll.auftrag?.titel)
  drawRow('Nummer', protokoll.auftrag?.nummer)
  drawRow('Waldbesitzer', protokoll.auftrag?.waldbesitzer)
  drawRow('Standort', protokoll.auftrag?.standort)
  if (protokoll.forstamt) drawRow('Forstamt', protokoll.forstamt)
  if (protokoll.revier) drawRow('Revier', protokoll.revier)
  if (protokoll.abteilung) drawRow('Abteilung', protokoll.abteilung)

  drawHeader('Arbeitszeit')
  drawRow('Beginn', fmtTime(protokoll.arbeitsbeginn))
  drawRow('Ende', fmtTime(protokoll.arbeitsende))
  drawRow('Pause', protokoll.pauseMinuten, 'Min.')
  if (protokoll.mitarbeiterAnzahl) drawRow('Mitarbeiter', protokoll.mitarbeiterAnzahl)

  drawHeader('Leistung')
  drawRow('Gepflanzt gesamt', protokoll.gepflanztGesamt, 'Stk.')
  drawRow('Handpflanzung', protokoll.stk_pflanzung, 'Stk.')
  drawRow('Bohrpflanzung', protokoll.stk_pflanzung_mit_bohrer, 'Stk.')
  drawRow('Fläche bearbeitet', protokoll.flaecheBearbeitetHa, 'ha')
  drawRow('Std. Handpflanzung', protokoll.std_handpflanzung, 'Std.')
  drawRow('Std. mit Bohrer', protokoll.std_mit_bohrer, 'Std.')
  drawRow('Std. Freischneider', protokoll.std_freischneider, 'Std.')
  drawRow('Std. Motorsäge', protokoll.std_motorsaege, 'Std.')
  drawRow('Std. Zaunbau', protokoll.std_zaunbau, 'Std.')
  drawRow('Lfm Zaunbau', protokoll.lfm_zaunbau, 'lfm')
  drawRow('Wuchshüllen', protokoll.stk_wuchshuellen, 'Stk.')
  drawRow('Nachbesserung', protokoll.stk_nachbesserung, 'Stk.')

  // Kennzahlen
  {
    let nettoStunden: number | null = null
    if (protokoll.arbeitsbeginn && protokoll.arbeitsende) {
      const begin = new Date(protokoll.arbeitsbeginn).getTime()
      const end = new Date(protokoll.arbeitsende).getTime()
      const pauseMs = (protokoll.pauseMinuten ?? 0) * 60000
      nettoStunden = Math.round(((end - begin - pauseMs) / 3600000) * 100) / 100
    }
    const pflanzrate = nettoStunden && nettoStunden > 0 && protokoll.gepflanztGesamt
      ? Math.round(protokoll.gepflanztGesamt / nettoStunden) : null
    const flaechenrate = nettoStunden && nettoStunden > 0 && protokoll.flaecheBearbeitetHa
      ? Math.round((protokoll.flaecheBearbeitetHa / nettoStunden) * 100) / 100 : null

    if (nettoStunden || pflanzrate || flaechenrate) {
      drawHeader('Kennzahlen')
      if (nettoStunden) drawRow('Netto-Arbeitszeit', nettoStunden, 'Std.')
      if (pflanzrate) drawRow('Pflanzrate', pflanzrate, 'Pfl./Std.')
      if (flaechenrate) drawRow('Flächenrate', flaechenrate, 'ha/Std.')
      if (protokoll.mitarbeiterAnzahl && nettoStunden) {
        const teamStunden = Math.round(nettoStunden * protokoll.mitarbeiterAnzahl * 100) / 100
        drawRow('Team-Stunden gesamt', teamStunden, 'Std.')
      }
    }
  }

  if (protokoll.witterung || protokoll.ausfaelleAnzahl || protokoll.qualitaetsBewertung) {
    drawHeader('Qualität & Witterung')
    drawRow('Witterung', protokoll.witterung)
    drawRow('Ausfälle', protokoll.ausfaelleAnzahl, 'Stk.')
    if (protokoll.ausfaelleGrund) drawRow('Ausfallgrund', protokoll.ausfaelleGrund)
    drawRow('Qualitätsbewertung', protokoll.qualitaetsBewertung ? `${protokoll.qualitaetsBewertung}/5` : null)
    if (protokoll.nachpflanzungNoetig) drawRow('Nachpflanzung', 'Ja')
  }

  if (protokoll.bericht || protokoll.kommentar || protokoll.besonderheiten) {
    drawHeader('Bericht')
    if (protokoll.bericht) {
      const lines = protokoll.bericht.split('\n')
      for (const line of lines) {
        if (y < 80) break
        page.drawText(line.substring(0, 90), { x: 50, y, size: 9, font, color: BLACK })
        y -= 14
      }
    }
    if (protokoll.kommentar) drawRow('Kommentar', protokoll.kommentar.substring(0, 80))
    if (protokoll.besonderheiten) drawRow('Besonderheiten', protokoll.besonderheiten.substring(0, 80))
  }

  // Footer
  y = 60
  page.drawLine({ start: { x: 40, y: y + 10 }, end: { x: width - 40, y: y + 10 }, thickness: 0.5, color: GRAY })
  const statusLabel: Record<string, string> = {
    entwurf: 'Entwurf', eingereicht: 'Eingereicht', genehmigt: 'Genehmigt', abgelehnt: 'Abgelehnt',
  }
  page.drawText(`Status: ${statusLabel[protokoll.status] ?? protokoll.status}`, { x: 40, y, size: 8, font, color: GRAY })
  page.drawText(`Ersteller: ${protokoll.ersteller || '—'}`, { x: 200, y, size: 8, font, color: GRAY })
  y -= 12
  page.drawText(`Erstellt: ${fmtDate(protokoll.createdAt)}`, { x: 40, y, size: 8, font, color: GRAY })
  page.drawText('Genehmigt von: ___________________', { x: 300, y, size: 8, font, color: GRAY })

  return pdfDoc.save()
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const auftrag = await prisma.auftrag.findUnique({
    where: { id },
    select: { id: true, titel: true, nummer: true },
  })
  if (!auftrag) return NextResponse.json({ error: 'Auftrag nicht gefunden' }, { status: 404 })

  const protokolle = await prisma.tagesprotokoll.findMany({
    where: { auftragId: id },
    orderBy: { datum: 'asc' },
    include: {
      auftrag: { select: { titel: true, nummer: true, waldbesitzer: true, standort: true } },
    },
  })

  if (protokolle.length === 0) {
    return NextResponse.json({ error: 'Keine Protokolle vorhanden' }, { status: 404 })
  }

  // Single PDF: return directly without ZIP
  if (protokolle.length === 1) {
    const pdfBytes = await generateProtokollPdf(protokolle[0])
    const datumStr = fmtDate(protokolle[0].datum).replace(/\./g, '-')
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="protokoll-${datumStr}.pdf"`,
      },
    })
  }

  // Multiple PDFs: ZIP archive
  const archive = archiver('zip', { zlib: { level: 6 } })
  const chunks: Buffer[] = []
  archive.on('data', (chunk) => chunks.push(chunk))

  for (const p of protokolle) {
    const pdfBytes = await generateProtokollPdf(p)
    const datumStr = fmtDate(p.datum).replace(/\./g, '-')
    const statusStr = p.status === 'genehmigt' ? '_genehmigt' : ''
    archive.append(Buffer.from(pdfBytes), {
      name: `protokoll-${datumStr}${statusStr}.pdf`,
    })
  }

  await archive.finalize()
  await new Promise<void>((resolve) => archive.on('end', resolve))

  const zipBuffer = Buffer.concat(chunks)
  const nrStr = auftrag.nummer ?? auftrag.id.substring(0, 8)

  return new NextResponse(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="protokolle-${nrStr}.zip"`,
    },
  })
}
