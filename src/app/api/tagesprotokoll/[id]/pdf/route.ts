import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getGruppenIdsForUser } from '@/lib/auth-helpers'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

const GREEN = rgb(0.17, 0.23, 0.11) // #2C3A1C
const GOLD = rgb(0.77, 0.65, 0.35) // #C5A55A
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const protokoll = await prisma.tagesprotokoll.findUnique({
    where: { id },
    include: {
      auftrag: { select: { titel: true, nummer: true, waldbesitzer: true, standort: true, gruppeId: true } },
    },
  })

  if (!protokoll) {
    return NextResponse.json({ error: 'Protokoll nicht gefunden' }, { status: 404 })
  }

  // Role-based: GF/MA can only access PDFs for their group's Aufträge
  const userRole = (user as { role?: string }).role
  const userEmail = (user as { email?: string }).email
  const gruppenIds = await getGruppenIdsForUser(userEmail, userRole)
  if (gruppenIds.length > 0 && (!protokoll.auftrag?.gruppeId || !gruppenIds.includes(protokoll.auftrag.gruppeId))) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const page = pdfDoc.addPage([595, 842]) // A4
  const { width, height } = page.getSize()
  let y = height - 50

  // Helper functions
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

  // Title
  page.drawText('Koch Aufforstung GmbH', { x: 40, y, size: 14, font: fontBold, color: GREEN })
  y -= 18
  page.drawText('Tagesprotokoll', { x: 40, y, size: 18, font: fontBold, color: GOLD })
  page.drawText(fmtDate(protokoll.datum), { x: width - 140, y, size: 12, font: fontBold, color: BLACK })
  y -= 8

  // Divider
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: GOLD })
  y -= 10

  // Auftrag
  drawHeader('Auftrag')
  drawRow('Titel', protokoll.auftrag?.titel)
  drawRow('Nummer', protokoll.auftrag?.nummer)
  drawRow('Waldbesitzer', protokoll.auftrag?.waldbesitzer)
  drawRow('Standort', protokoll.auftrag?.standort)
  if (protokoll.forstamt) drawRow('Forstamt', protokoll.forstamt)
  if (protokoll.revier) drawRow('Revier', protokoll.revier)
  if (protokoll.abteilung) drawRow('Abteilung', protokoll.abteilung)

  // Arbeitszeit
  drawHeader('Arbeitszeit')
  drawRow('Beginn', fmtTime(protokoll.arbeitsbeginn))
  drawRow('Ende', fmtTime(protokoll.arbeitsende))
  drawRow('Pause', protokoll.pauseMinuten, 'Min.')
  if (protokoll.mitarbeiterAnzahl) drawRow('Mitarbeiter', protokoll.mitarbeiterAnzahl)

  // Leistung
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

  // Kennzahlen (FM-16)
  {
    let nettoStunden: number | null = null
    if (protokoll.arbeitsbeginn && protokoll.arbeitsende) {
      const begin = new Date(protokoll.arbeitsbeginn).getTime()
      const end = new Date(protokoll.arbeitsende).getTime()
      const pauseMs = (protokoll.pauseMinuten ?? 0) * 60000
      nettoStunden = Math.round(((end - begin - pauseMs) / 3600000) * 100) / 100
    }
    const pflanzrate = nettoStunden && nettoStunden > 0 && protokoll.gepflanztGesamt
      ? Math.round(protokoll.gepflanztGesamt / nettoStunden)
      : null
    const flaechenrate = nettoStunden && nettoStunden > 0 && protokoll.flaecheBearbeitetHa
      ? Math.round((protokoll.flaecheBearbeitetHa / nettoStunden) * 100) / 100
      : null

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

  // Qualität & Witterung
  if (protokoll.witterung || protokoll.ausfaelleAnzahl || protokoll.qualitaetsBewertung) {
    drawHeader('Qualität & Witterung')
    drawRow('Witterung', protokoll.witterung)
    drawRow('Ausfälle', protokoll.ausfaelleAnzahl, 'Stk.')
    if (protokoll.ausfaelleGrund) drawRow('Ausfallgrund', protokoll.ausfaelleGrund)
    drawRow('Qualitätsbewertung', protokoll.qualitaetsBewertung ? `${protokoll.qualitaetsBewertung}/5` : null)
    if (protokoll.nachpflanzungNoetig) drawRow('Nachpflanzung', 'Ja')
  }

  // Bericht
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

  const pdfBytes = await pdfDoc.save()
  const datumStr = fmtDate(protokoll.datum).replace(/\./g, '-')

  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="protokoll-${datumStr}.pdf"`,
    },
  })
}
