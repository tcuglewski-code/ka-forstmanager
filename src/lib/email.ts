// Sprint AG: E-Mail Benachrichtigungssystem
// EmailService Klasse für transaktionale E-Mails via SMTP
// ⚠️ ABSENDER IMMER: cuglewski@koch-aufforstung.de

import nodemailer from "nodemailer"
import type { Transporter } from "nodemailer"

// ── Typen für Trigger-Events ──────────────────────────────────────────────────

export interface AuftragErstelltDaten {
  auftragId: string
  auftragNummer: string
  auftragTitel: string
  waldbesitzerName?: string
  waldbesitzerEmail?: string
  flaeche_ha?: number
  standort?: string
}

export interface AuftragStatusUpdateDaten {
  auftragId: string
  auftragNummer: string
  auftragTitel: string
  alterStatus: string
  neuerStatus: string
  waldbesitzerEmail?: string
  notiz?: string
}

export interface LohnabrechnungFreigegebenDaten {
  abrechnungId: string
  mitarbeiterName: string
  mitarbeiterEmail?: string
  zeitraumVon: Date
  zeitraumBis: Date
  auszahlung: number
}

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

function fmtDatum(d: Date): string {
  return d.toLocaleDateString("de-DE")
}

function fmtEuro(n: number): string {
  return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    anfrage: "Anfrage",
    angebot: "Angebot",
    beauftragt: "Beauftragt",
    in_arbeit: "In Arbeit",
    abgeschlossen: "Abgeschlossen",
    storniert: "Storniert",
  }
  return map[status] ?? status
}

// HTML-Basis-Template (Koch Aufforstung GmbH Branding)
function basisTemplate(inhalt: string, betreff: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${betreff}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; background: #f4f4f4; margin: 0; padding: 0; color: #1a1a1a; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: #2C3A1C; color: #fff; padding: 24px 32px; }
    .header h1 { margin: 0; font-size: 22px; font-weight: bold; }
    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.8; }
    .body { padding: 28px 32px; }
    .body h2 { color: #2C3A1C; font-size: 16px; margin-top: 0; }
    .info-block { background: #f8f8f5; border-left: 4px solid #2C3A1C; padding: 12px 16px; margin: 16px 0; border-radius: 4px; }
    .info-block p { margin: 4px 0; font-size: 14px; }
    .info-block strong { color: #2C3A1C; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; background: #e8f0e0; color: #2C3A1C; }
    .badge-alt { background: #f5e8d0; color: #a05000; }
    .footer { background: #f4f4f4; padding: 16px 32px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #e0e0e0; }
    .btn { display: inline-block; background: #2C3A1C; color: #fff; padding: 10px 22px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌲 Koch Aufforstung GmbH</h1>
      <p>Professionelle Forstwirtschaft</p>
    </div>
    <div class="body">
      ${inhalt}
    </div>
    <div class="footer">
      <p>Koch Aufforstung GmbH · Diese E-Mail wurde automatisch generiert.</p>
      <p>Bei Fragen antworten Sie auf diese E-Mail oder wenden Sie sich an cuglewski@koch-aufforstung.de</p>
    </div>
  </div>
</body>
</html>`
}

// ── EmailService Klasse ───────────────────────────────────────────────────────

export class EmailService {
  private transporter: Transporter

  // ⚠️ Absender IMMER cuglewski@koch-aufforstung.de — niemals info@ oder andere Adressen!
  private readonly ABSENDER = '"Koch Aufforstung GmbH" <cuglewski@koch-aufforstung.de>'
  private readonly INTERN_EMPFAENGER = "cuglewski@koch-aufforstung.de"

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT ?? "587"),
      secure: false, // STARTTLS
      auth: {
        user: process.env.SMTP_USER ?? "cuglewski@koch-aufforstung.de",
        pass: process.env.SMTP_PASS ?? "",
      },
    })
  }

  // Interne Methode zum Versenden mit Fehlerbehandlung
  private async senden(options: {
    to: string
    subject: string
    html: string
    bcc?: string
  }): Promise<boolean> {
    // Im Dev-Modus nur loggen (kein echter Versand wenn SMTP_PASS fehlt)
    if (!process.env.SMTP_PASS) {
      console.log(`[EmailService] DEV-Modus — E-Mail nicht versendet:`)
      console.log(`  An: ${options.to}`)
      console.log(`  Betreff: ${options.subject}`)
      return true
    }

    try {
      await this.transporter.sendMail({
        from: this.ABSENDER,
        to: options.to,
        bcc: options.bcc,
        subject: options.subject,
        html: options.html,
      })
      console.log(`[EmailService] E-Mail versendet an: ${options.to} | Betreff: ${options.subject}`)
      return true
    } catch (fehler) {
      console.error(`[EmailService] Fehler beim Versenden an ${options.to}:`, fehler)
      return false
    }
  }

  // ── Trigger 1: Auftrag erstellt ──────────────────────────────────────────

  async auftragErstellt(daten: AuftragErstelltDaten): Promise<void> {
    const betreff = `Neuer Auftrag: ${daten.auftragNummer} – ${daten.auftragTitel}`

    const inhalt = `
      <h2>Neuer Auftrag eingegangen</h2>
      <p>Ein neuer Auftrag wurde im ForstManager erfasst.</p>
      <div class="info-block">
        <p><strong>Auftragsnummer:</strong> ${daten.auftragNummer}</p>
        <p><strong>Titel:</strong> ${daten.auftragTitel}</p>
        ${daten.waldbesitzerName ? `<p><strong>Waldbesitzer:</strong> ${daten.waldbesitzerName}</p>` : ""}
        ${daten.flaeche_ha ? `<p><strong>Fläche:</strong> ${daten.flaeche_ha} ha</p>` : ""}
        ${daten.standort ? `<p><strong>Standort:</strong> ${daten.standort}</p>` : ""}
        <p><strong>Status:</strong> <span class="badge">Anfrage</span></p>
      </div>
      <p>Bitte prüfen und weiterbearbeiten im <a href="https://ka-forstmanager.vercel.app/auftraege/${daten.auftragId}">ForstManager</a>.</p>
    `

    // Intern benachrichtigen
    await this.senden({
      to: this.INTERN_EMPFAENGER,
      subject: `[ForstManager] ${betreff}`,
      html: basisTemplate(inhalt, betreff),
    })

    // Waldbesitzer benachrichtigen (falls E-Mail vorhanden)
    if (daten.waldbesitzerEmail) {
      const waldbesitzerInhalt = `
        <h2>Ihre Anfrage wurde erfasst</h2>
        <p>Sehr geehrte Damen und Herren,</p>
        <p>vielen Dank für Ihre Anfrage. Wir haben Ihren Auftrag erfolgreich im System erfasst.</p>
        <div class="info-block">
          <p><strong>Auftragsnummer:</strong> ${daten.auftragNummer}</p>
          <p><strong>Bezeichnung:</strong> ${daten.auftragTitel}</p>
          ${daten.flaeche_ha ? `<p><strong>Fläche:</strong> ${daten.flaeche_ha} ha</p>` : ""}
          <p><strong>Status:</strong> <span class="badge">In Bearbeitung</span></p>
        </div>
        <p>Wir werden uns zeitnah mit Ihnen in Verbindung setzen.</p>
        <p>Mit freundlichen Grüßen<br><strong>Koch Aufforstung GmbH</strong></p>
      `
      await this.senden({
        to: daten.waldbesitzerEmail,
        subject: `Ihre Anfrage ${daten.auftragNummer} wurde erfasst – Koch Aufforstung GmbH`,
        html: basisTemplate(waldbesitzerInhalt, `Anfrage ${daten.auftragNummer} erfasst`),
      })
    }
  }

  // ── Trigger 2: Auftrag Status-Update ────────────────────────────────────

  async auftragStatusUpdate(daten: AuftragStatusUpdateDaten): Promise<void> {
    const betreff = `Auftrag ${daten.auftragNummer} – Status geändert: ${statusLabel(daten.neuerStatus)}`

    const inhalt = `
      <h2>Auftragsstatus geändert</h2>
      <div class="info-block">
        <p><strong>Auftragsnummer:</strong> ${daten.auftragNummer}</p>
        <p><strong>Titel:</strong> ${daten.auftragTitel}</p>
        <p><strong>Alter Status:</strong> <span class="badge badge-alt">${statusLabel(daten.alterStatus)}</span></p>
        <p><strong>Neuer Status:</strong> <span class="badge">${statusLabel(daten.neuerStatus)}</span></p>
        ${daten.notiz ? `<p><strong>Notiz:</strong> ${daten.notiz}</p>` : ""}
      </div>
      <a href="https://ka-forstmanager.vercel.app/auftraege/${daten.auftragId}" class="btn">Auftrag anzeigen</a>
    `

    // Intern benachrichtigen
    await this.senden({
      to: this.INTERN_EMPFAENGER,
      subject: `[ForstManager] ${betreff}`,
      html: basisTemplate(inhalt, betreff),
    })

    // Waldbesitzer benachrichtigen (falls E-Mail vorhanden)
    if (daten.waldbesitzerEmail) {
      const waldInhalt = `
        <h2>Status Ihres Auftrags wurde aktualisiert</h2>
        <p>Sehr geehrte Damen und Herren,</p>
        <p>der Status Ihres Auftrags hat sich geändert.</p>
        <div class="info-block">
          <p><strong>Auftragsnummer:</strong> ${daten.auftragNummer}</p>
          <p><strong>Bezeichnung:</strong> ${daten.auftragTitel}</p>
          <p><strong>Neuer Status:</strong> <span class="badge">${statusLabel(daten.neuerStatus)}</span></p>
          ${daten.notiz ? `<p><strong>Hinweis:</strong> ${daten.notiz}</p>` : ""}
        </div>
        <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
        <p>Mit freundlichen Grüßen<br><strong>Koch Aufforstung GmbH</strong></p>
      `
      await this.senden({
        to: daten.waldbesitzerEmail,
        subject: `Ihr Auftrag ${daten.auftragNummer} – Statusänderung – Koch Aufforstung GmbH`,
        html: basisTemplate(waldInhalt, `Auftrag ${daten.auftragNummer} Statusänderung`),
      })
    }
  }

  // ── Trigger 3: Lohnabrechnung freigegeben ────────────────────────────────

  async lohnabrechnungFreigegeben(daten: LohnabrechnungFreigegebenDaten): Promise<void> {
    const betreff = `Lohnabrechnung freigegeben: ${daten.mitarbeiterName}`

    const inhalt = `
      <h2>Lohnabrechnung freigegeben</h2>
      <p>Eine Lohnabrechnung wurde freigegeben und ist auszahlungsbereit.</p>
      <div class="info-block">
        <p><strong>Mitarbeiter:</strong> ${daten.mitarbeiterName}</p>
        <p><strong>Zeitraum:</strong> ${fmtDatum(daten.zeitraumVon)} – ${fmtDatum(daten.zeitraumBis)}</p>
        <p><strong>Auszahlungsbetrag:</strong> <strong style="color:#2C3A1C; font-size:16px">${fmtEuro(daten.auszahlung)}</strong></p>
      </div>
      <a href="https://ka-forstmanager.vercel.app/api/lohn/export-pdf/${daten.abrechnungId}" class="btn">📄 PDF herunterladen</a>
    `

    // Intern benachrichtigen (für Buchhaltung/Auszahlung)
    await this.senden({
      to: this.INTERN_EMPFAENGER,
      subject: `[ForstManager] ${betreff}`,
      html: basisTemplate(inhalt, betreff),
    })

    // Mitarbeiter benachrichtigen (falls E-Mail vorhanden)
    if (daten.mitarbeiterEmail) {
      const mitarbeiterInhalt = `
        <h2>Ihre Lohnabrechnung ist bereit</h2>
        <p>Guten Tag ${daten.mitarbeiterName},</p>
        <p>Ihre Lohnabrechnung für den Zeitraum <strong>${fmtDatum(daten.zeitraumVon)} – ${fmtDatum(daten.zeitraumBis)}</strong> wurde freigegeben.</p>
        <div class="info-block">
          <p><strong>Auszahlungsbetrag:</strong> <strong style="color:#2C3A1C; font-size:16px">${fmtEuro(daten.auszahlung)}</strong></p>
        </div>
        <p>Bei Fragen wenden Sie sich an Ihren Vorgesetzten.</p>
        <p>Mit freundlichen Grüßen<br><strong>Koch Aufforstung GmbH</strong></p>
      `
      await this.senden({
        to: daten.mitarbeiterEmail,
        subject: `Ihre Lohnabrechnung – Koch Aufforstung GmbH`,
        html: basisTemplate(mitarbeiterInhalt, "Lohnabrechnung bereit"),
      })
    }
  }
}

// Singleton-Instanz exportieren
export const emailService = new EmailService()
