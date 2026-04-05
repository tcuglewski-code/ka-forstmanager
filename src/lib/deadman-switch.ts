import { prisma } from './prisma';

// ============================================================
// Dead Man's Switch — Sprint JO (SOS-09+10)
//
// 3-stufige Eskalationskette für verpasste Check-Ins:
// Stufe 1: Koordinatoren (Push + Email) — sofort
// Stufe 2: Notfall-Kontakt (SMS) — +5 Minuten
// Stufe 3: Geschäftsführung + 112-Hinweis — +10 Minuten
// ============================================================

export type EskalationsStufe = 'stufe_1' | 'stufe_2' | 'stufe_3';

export interface EskalationsEvent {
  alertId: number;
  sessionId: string;
  mitarbeiterId: number;
  mitarbeiterName: string;
  latitude: number | null;
  longitude: number | null;
  googleMapsLink: string | null;
  einsatzName: string | null;
  stufe: EskalationsStufe;
  triggeredAt: Date;
}

export interface DeadManSwitchResult {
  success: boolean;
  stufe: EskalationsStufe;
  benachrichtigungen: {
    koordinatoren: number;
    notfallKontakt: boolean;
    geschaeftsfuehrung: boolean;
    notrufHinweis: boolean;
  };
  naechsteEskalation?: {
    stufe: EskalationsStufe;
    inSekunden: number;
  } | null;
  message: string;
}

// ─── Stufe 1: Koordinatoren ───────────────────────────────────

/**
 * Stufe 1: Benachrichtigt alle Koordinatoren via Push + Email
 * Wird bei erstem verpassten Check-In ausgelöst.
 */
export async function eskaliereStufe1(event: EskalationsEvent): Promise<number> {
  const koordinatoren = await prisma.mitarbeiter.findMany({
    where: {
      OR: [
        { rolle: 'koordinator' },
        { rolle: 'admin' },
        { rolle: 'gf' },
      ],
      aktiv: true,
    },
    select: {
      id: true,
      vorname: true,
      nachname: true,
      telefon: true,
      email: true,
      pushToken: true,
    },
  });

  let benachrichtigt = 0;

  // Push-Benachrichtigungen
  for (const koordinator of koordinatoren) {
    if (koordinator.pushToken) {
      try {
        await sendExpoPush({
          to: koordinator.pushToken,
          title: '⚠️ Dead Man\'s Switch aktiviert!',
          body: `${event.mitarbeiterName} reagiert nicht. Bitte sofort prüfen!`,
          data: {
            type: 'DEADMAN_SWITCH_STUFE_1',
            alertId: event.alertId,
            sessionId: event.sessionId,
            latitude: event.latitude,
            longitude: event.longitude,
          },
        });
        benachrichtigt++;
      } catch (e) {
        console.error('[DeadMan] Push fehlgeschlagen:', e);
      }
    }
  }

  // Email-Benachrichtigungen (wenn RESEND konfiguriert)
  if (process.env.RESEND_API_KEY) {
    for (const koordinator of koordinatoren) {
      if (koordinator.email) {
        try {
          await sendEskalationsEmail({
            to: koordinator.email,
            subject: `⚠️ Dead Man's Switch: ${event.mitarbeiterName}`,
            mitarbeiterName: event.mitarbeiterName,
            einsatzName: event.einsatzName,
            googleMapsLink: event.googleMapsLink,
            latitude: event.latitude,
            longitude: event.longitude,
            stufe: 'stufe_1',
          });
        } catch (e) {
          console.error('[DeadMan] Email fehlgeschlagen:', e);
        }
      }
    }
  }

  // Alert-Status aktualisieren
  await prisma.alleinarbeitAlert.update({
    where: { id: event.alertId },
    data: {
      eskalationsStufe: 'stufe_1',
      stufe1At: new Date(),
    },
  });

  console.log(`[DeadMan] Stufe 1: ${benachrichtigt} Koordinatoren benachrichtigt`);
  return benachrichtigt;
}

// ─── Stufe 2: Notfall-Kontakt ─────────────────────────────────

/**
 * Stufe 2: SMS an Notfall-Kontakt des Mitarbeiters
 * Wird 5 Minuten nach Stufe 1 ausgelöst, wenn keine Entwarnung.
 */
export async function eskaliereStufe2(event: EskalationsEvent): Promise<boolean> {
  // Mitarbeiter mit Notfall-Kontakt laden
  const mitarbeiter = await prisma.mitarbeiter.findUnique({
    where: { id: String(event.mitarbeiterId) },
    select: {
      notfallName: true,
      notfallTelefon: true,
      vorname: true,
      nachname: true,
    },
  });

  if (!mitarbeiter?.notfallTelefon) {
    console.log('[DeadMan] Stufe 2: Kein Notfall-Kontakt hinterlegt');
    
    // Direkt zu Stufe 3 eskalieren wenn kein Notfall-Kontakt
    await prisma.alleinarbeitAlert.update({
      where: { id: event.alertId },
      data: {
        eskalationsStufe: 'stufe_2',
        stufe2At: new Date(),
        notfallKontaktBenachrichtigt: false,
        notfallKontaktFehlt: true,
      },
    });
    
    return false;
  }

  // SMS über expo-sms Fallback (wird von App getriggert) oder Twilio
  // Für Server-seitige SMS: Twilio erforderlich
  const smsGesendet = await sendNotfallSMS({
    to: mitarbeiter.notfallTelefon,
    message: `🚨 NOTFALL: ${event.mitarbeiterName} (Koch Aufforstung) reagiert nicht auf Check-In. ` +
      `Letzter Standort: ${event.googleMapsLink || 'Unbekannt'}. ` +
      `Bitte versuchen Sie Kontakt aufzunehmen oder rufen Sie 112.`,
    kontaktName: mitarbeiter.notfallName || 'Notfall-Kontakt',
  });

  await prisma.alleinarbeitAlert.update({
    where: { id: event.alertId },
    data: {
      eskalationsStufe: 'stufe_2',
      stufe2At: new Date(),
      notfallKontaktBenachrichtigt: smsGesendet,
      notfallKontaktName: mitarbeiter.notfallName,
      notfallKontaktTelefon: mitarbeiter.notfallTelefon,
    },
  });

  console.log(`[DeadMan] Stufe 2: Notfall-Kontakt ${smsGesendet ? '' : 'NICHT '}benachrichtigt`);
  return smsGesendet;
}

// ─── Stufe 3: Geschäftsführung + 112-Hinweis ──────────────────

/**
 * Stufe 3: Kritische Eskalation
 * - Geschäftsführung wird benachrichtigt
 * - 112-Notruf-Hinweis wird angezeigt
 * - Status wird auf "kritisch" gesetzt
 */
export async function eskaliereStufe3(event: EskalationsEvent): Promise<{
  gfBenachrichtigt: boolean;
  notrufHinweis: boolean;
}> {
  // Geschäftsführung ermitteln
  const geschaeftsfuehrung = await prisma.mitarbeiter.findMany({
    where: {
      rolle: 'gf',
      aktiv: true,
    },
    select: {
      id: true,
      vorname: true,
      nachname: true,
      telefon: true,
      email: true,
      pushToken: true,
    },
  });

  let gfBenachrichtigt = false;

  // Push + SMS an GF
  for (const gf of geschaeftsfuehrung) {
    if (gf.pushToken) {
      try {
        await sendExpoPush({
          to: gf.pushToken,
          title: '🚨 KRITISCH: Mitarbeiter reagiert nicht!',
          body: `${event.mitarbeiterName} - 10 Min ohne Antwort. NOTRUF ERWÄGEN!`,
          data: {
            type: 'DEADMAN_SWITCH_STUFE_3_KRITISCH',
            alertId: event.alertId,
            sessionId: event.sessionId,
            latitude: event.latitude,
            longitude: event.longitude,
          },
        });
        gfBenachrichtigt = true;
      } catch (e) {
        console.error('[DeadMan] GF Push fehlgeschlagen:', e);
      }
    }

    if (gf.telefon) {
      await sendNotfallSMS({
        to: gf.telefon,
        message: `🚨 KRITISCH: ${event.mitarbeiterName} reagiert seit 10+ Min nicht! ` +
          `GPS: ${event.googleMapsLink || 'Unbekannt'}. 112 Notruf erwägen!`,
        kontaktName: `${gf.vorname} ${gf.nachname}`,
      });
    }
  }

  // Kritische Email an alle mit Rolle GF/Admin
  if (process.env.RESEND_API_KEY) {
    const admins = await prisma.mitarbeiter.findMany({
      where: { rolle: { in: ['gf', 'admin'] }, aktiv: true },
      select: { email: true },
    });

    for (const admin of admins) {
      if (admin.email) {
        await sendEskalationsEmail({
          to: admin.email,
          subject: `🚨 KRITISCH: ${event.mitarbeiterName} - NOTRUF ERWÄGEN`,
          mitarbeiterName: event.mitarbeiterName,
          einsatzName: event.einsatzName,
          googleMapsLink: event.googleMapsLink,
          latitude: event.latitude,
          longitude: event.longitude,
          stufe: 'stufe_3',
        });
      }
    }
  }

  // Alert auf kritisch setzen
  await prisma.alleinarbeitAlert.update({
    where: { id: event.alertId },
    data: {
      eskalationsStufe: 'stufe_3',
      stufe3At: new Date(),
      status: 'kritisch',
      gfBenachrichtigt: gfBenachrichtigt,
      notrufHinweisAngezeigt: true,
    },
  });

  console.log(`[DeadMan] Stufe 3 KRITISCH: GF=${gfBenachrichtigt}, Notruf-Hinweis aktiv`);
  
  return {
    gfBenachrichtigt,
    notrufHinweis: true,
  };
}

// ─── Haupt-Trigger ────────────────────────────────────────────

/**
 * Führt Dead Man's Switch Eskalation basierend auf vergangener Zeit aus.
 * Wird vom Cron-Job oder API aufgerufen.
 */
export async function triggerDeadManSwitch(
  alertId: number,
  forceStufe?: EskalationsStufe
): Promise<DeadManSwitchResult> {
  const alert = await prisma.alleinarbeitAlert.findUnique({
    where: { id: alertId },
    include: {
      alleinarbeitSession: true,
    },
  });

  if (!alert) {
    return {
      success: false,
      stufe: 'stufe_1',
      benachrichtigungen: {
        koordinatoren: 0,
        notfallKontakt: false,
        geschaeftsfuehrung: false,
        notrufHinweis: false,
      },
      message: 'Alert nicht gefunden',
    };
  }

  // Wenn bereits resolved, nicht eskalieren
  if (alert.status === 'resolved') {
    return {
      success: false,
      stufe: alert.eskalationsStufe as EskalationsStufe || 'stufe_1',
      benachrichtigungen: {
        koordinatoren: 0,
        notfallKontakt: false,
        geschaeftsfuehrung: false,
        notrufHinweis: false,
      },
      message: 'Alert bereits aufgelöst',
    };
  }

  const event: EskalationsEvent = {
    alertId: alert.id,
    sessionId: alert.alleinarbeitSession?.sessionId || '',
    mitarbeiterId: alert.mitarbeiterId,
    mitarbeiterName: alert.mitarbeiterName,
    latitude: alert.latitude,
    longitude: alert.longitude,
    googleMapsLink: alert.googleMapsLink,
    einsatzName: alert.einsatzName,
    stufe: 'stufe_1',
    triggeredAt: new Date(),
  };

  // Bestimme aktuelle Stufe basierend auf Zeit
  const now = Date.now();
  const alertCreated = alert.createdAt.getTime();
  const minutesSinceAlert = (now - alertCreated) / 60000;

  let stufe: EskalationsStufe;
  if (forceStufe) {
    stufe = forceStufe;
  } else if (minutesSinceAlert >= 10 || alert.eskalationsStufe === 'stufe_2') {
    stufe = 'stufe_3';
  } else if (minutesSinceAlert >= 5 || alert.eskalationsStufe === 'stufe_1') {
    stufe = 'stufe_2';
  } else {
    stufe = 'stufe_1';
  }

  event.stufe = stufe;

  const result: DeadManSwitchResult = {
    success: true,
    stufe,
    benachrichtigungen: {
      koordinatoren: 0,
      notfallKontakt: false,
      geschaeftsfuehrung: false,
      notrufHinweis: false,
    },
    message: '',
  };

  // Eskalation durchführen
  switch (stufe) {
    case 'stufe_1':
      result.benachrichtigungen.koordinatoren = await eskaliereStufe1(event);
      result.naechsteEskalation = { stufe: 'stufe_2', inSekunden: 300 };
      result.message = 'Stufe 1: Koordinatoren benachrichtigt';
      break;

    case 'stufe_2':
      result.benachrichtigungen.notfallKontakt = await eskaliereStufe2(event);
      result.naechsteEskalation = { stufe: 'stufe_3', inSekunden: 300 };
      result.message = result.benachrichtigungen.notfallKontakt
        ? 'Stufe 2: Notfall-Kontakt benachrichtigt'
        : 'Stufe 2: Kein Notfall-Kontakt verfügbar';
      break;

    case 'stufe_3':
      const stufe3Result = await eskaliereStufe3(event);
      result.benachrichtigungen.geschaeftsfuehrung = stufe3Result.gfBenachrichtigt;
      result.benachrichtigungen.notrufHinweis = stufe3Result.notrufHinweis;
      result.naechsteEskalation = null; // Letzte Stufe
      result.message = 'Stufe 3 KRITISCH: Notruf-Hinweis aktiviert';
      break;
  }

  return result;
}

// ─── Helper Functions ─────────────────────────────────────────

async function sendExpoPush(params: {
  to: string;
  title: string;
  body: string;
  data: Record<string, any>;
}): Promise<boolean> {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: params.to,
        title: params.title,
        body: params.body,
        data: params.data,
        sound: 'default',
        priority: 'high',
        channelId: 'sos-alerts',
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function sendNotfallSMS(params: {
  to: string;
  message: string;
  kontaktName: string;
}): Promise<boolean> {
  // Twilio SMS (wenn konfiguriert)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const twilio = await import('twilio');
      const client = twilio.default(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      await client.messages.create({
        body: params.message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: params.to,
      });

      console.log(`[DeadMan] SMS gesendet an ${params.kontaktName}`);
      return true;
    } catch (e) {
      console.error('[DeadMan] Twilio SMS fehlgeschlagen:', e);
      return false;
    }
  }

  // Fallback: Loggen wenn kein Twilio
  console.log(`[DeadMan] SMS würde gesendet an ${params.kontaktName} (${params.to}): ${params.message}`);
  return false;
}

async function sendEskalationsEmail(params: {
  to: string;
  subject: string;
  mitarbeiterName: string;
  einsatzName: string | null;
  googleMapsLink: string | null;
  latitude: number | null;
  longitude: number | null;
  stufe: EskalationsStufe;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const bgColor = params.stufe === 'stufe_3' ? '#DC2626' : params.stufe === 'stufe_2' ? '#F97316' : '#EAB308';
    const stufeText = params.stufe === 'stufe_3' ? 'KRITISCH' : params.stufe === 'stufe_2' ? 'WARNUNG' : 'ACHTUNG';

    await resend.emails.send({
      from: 'Koch Aufforstung <noreply@koch-aufforstung.de>',
      to: params.to,
      subject: params.subject,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:${bgColor};color:white;padding:20px;text-align:center;">
            <h1 style="margin:0;">⚠️ Dead Man's Switch: ${stufeText}</h1>
          </div>
          <div style="padding:20px;background:#FEE2E2;">
            <p><strong>Mitarbeiter:</strong> ${params.mitarbeiterName}</p>
            ${params.einsatzName ? `<p><strong>Einsatz:</strong> ${params.einsatzName}</p>` : ''}
            <p><strong>Standort:</strong> ${params.googleMapsLink 
              ? `<a href="${params.googleMapsLink}">Google Maps öffnen</a>` 
              : 'Nicht verfügbar'}</p>
            ${params.latitude && params.longitude 
              ? `<p><strong>Koordinaten:</strong> ${params.latitude.toFixed(6)}, ${params.longitude.toFixed(6)}</p>` 
              : ''}
            ${params.stufe === 'stufe_3' ? `
              <div style="background:#7F1D1D;color:white;padding:15px;margin-top:20px;text-align:center;border-radius:8px;">
                <p style="font-size:18px;margin:0;font-weight:bold;">🚨 NOTRUF ERWÄGEN: 112</p>
              </div>
            ` : ''}
            <p style="margin-top:20px;">
              <a href="https://ka-forstmanager.vercel.app/sos" 
                 style="background:${bgColor};color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
                → Zum SOS-Dashboard
              </a>
            </p>
          </div>
        </div>
      `,
    });

    return true;
  } catch (e) {
    console.error('[DeadMan] Email fehlgeschlagen:', e);
    return false;
  }
}

// ─── Cron Helper: Prüft alle aktiven Alerts ───────────────────

/**
 * Prüft alle aktiven Alerts und eskaliert wenn nötig.
 * Sollte alle 1-2 Minuten vom Cron aufgerufen werden.
 */
export async function processActiveAlerts(): Promise<{
  processed: number;
  eskaliert: number;
}> {
  const activeAlerts = await prisma.alleinarbeitAlert.findMany({
    where: {
      status: { in: ['active', 'kritisch'] },
      eskalationsStufe: { not: 'stufe_3' }, // Noch nicht auf höchster Stufe
    },
    orderBy: { createdAt: 'asc' },
  });

  let eskaliert = 0;

  for (const alert of activeAlerts) {
    const now = Date.now();
    const alertCreated = alert.createdAt.getTime();
    const minutesSince = (now - alertCreated) / 60000;

    // Bestimme ob Eskalation fällig
    const currentStufe = alert.eskalationsStufe || 'stufe_1';
    let shouldEscalate = false;
    let targetStufe: EskalationsStufe = currentStufe as EskalationsStufe;

    if (currentStufe === 'stufe_1' && minutesSince >= 5) {
      shouldEscalate = true;
      targetStufe = 'stufe_2';
    } else if (currentStufe === 'stufe_2' && minutesSince >= 10) {
      shouldEscalate = true;
      targetStufe = 'stufe_3';
    }

    if (shouldEscalate) {
      await triggerDeadManSwitch(alert.id, targetStufe);
      eskaliert++;
    }
  }

  return { processed: activeAlerts.length, eskaliert };
}

export default {
  triggerDeadManSwitch,
  processActiveAlerts,
  eskaliereStufe1,
  eskaliereStufe2,
  eskaliereStufe3,
};
