/**
 * ForstManager OpenAPI 3.0 Specification
 * Generiert für Koch Aufforstung GmbH
 * 
 * Diese Spezifikation dokumentiert alle API-Endpoints des ForstManagers.
 * Gruppiert nach Funktionsbereichen.
 */

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "ForstManager API",
    version: "1.0.0",
    description: `
# ForstManager API

RESTful API für das ForstManager-System der Koch Aufforstung GmbH.

## Authentifizierung

Die meisten Endpoints erfordern Authentifizierung via:
- **Session Cookie**: NextAuth.js Session (Browser)
- **Bearer Token**: JWT für Mobile App
- **API Key**: Für Webhook-Integrationen (x-api-key Header)

## Rate Limiting

- Standard: 100 Requests/Minute
- Uploads: 10 Requests/Minute
- Cron-Jobs: 1 Request/Minute (intern)

## Fehler-Responses

Alle Fehler folgen dem Format:
\`\`\`json
{
  "error": "Fehlerbeschreibung",
  "code": "ERROR_CODE",
  "details": {}
}
\`\`\`
    `,
    contact: {
      name: "Koch Aufforstung IT",
      email: "it@koch-aufforstung.de"
    },
    license: {
      name: "Proprietär",
      url: "https://koch-aufforstung.de"
    }
  },
  servers: [
    {
      url: "https://ka-forstmanager.vercel.app",
      description: "Production"
    },
    {
      url: "http://localhost:3000",
      description: "Development"
    }
  ],
  tags: [
    { name: "Aufträge", description: "Auftragsverwaltung" },
    { name: "Mitarbeiter", description: "Personalverwaltung" },
    { name: "Protokolle", description: "Tages- und Arbeitsprotkolle" },
    { name: "Lohn", description: "Lohnabrechnung und Zeiterfassung" },
    { name: "Saatguternte", description: "Saatguternte-Modul" },
    { name: "Lager", description: "Lagerverwaltung und Inventar" },
    { name: "Rechnungen", description: "Rechnungsstellung" },
    { name: "Fuhrpark", description: "Fahrzeug- und Geräteverwaltung" },
    { name: "Schulungen", description: "Schulungs- und Qualifikationsverwaltung" },
    { name: "Förderung", description: "Betriebs-Assistent und Förderprogramme" },
    { name: "Sync", description: "Mobile App Synchronisation" },
    { name: "Auth", description: "Authentifizierung und Autorisierung" },
    { name: "GDPR", description: "DSGVO-Compliance Endpoints" },
    { name: "Kundenportal", description: "Kundenportal-Zugriff" },
    { name: "Admin", description: "Administrative Funktionen" },
    { name: "Cron", description: "Geplante Hintergrundaufgaben" },
    { name: "KI", description: "KI-gestützte Analysen" },
    { name: "Wochenplanung", description: "Wochenplanung und Disposition" },
    { name: "Reports", description: "Berichte und Statistiken" }
  ],
  paths: {
    // ==================== AUFTRÄGE ====================
    "/api/auftraege": {
      get: {
        tags: ["Aufträge"],
        summary: "Alle Aufträge abrufen",
        description: "Liefert eine Liste aller Aufträge mit Filteroptionen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["offen", "in_bearbeitung", "abgeschlossen", "storniert"] } },
          { name: "saisonId", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
          { name: "offset", in: "query", schema: { type: "integer", default: 0 } }
        ],
        responses: {
          "200": { description: "Liste der Aufträge", content: { "application/json": { schema: { $ref: "#/components/schemas/AuftraegeList" } } } },
          "401": { description: "Nicht authentifiziert" }
        }
      },
      post: {
        tags: ["Aufträge"],
        summary: "Neuen Auftrag erstellen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/AuftragCreate" } } } },
        responses: {
          "201": { description: "Auftrag erstellt" },
          "400": { description: "Validierungsfehler" },
          "401": { description: "Nicht authentifiziert" }
        }
      }
    },
    "/api/auftraege/{id}": {
      get: {
        tags: ["Aufträge"],
        summary: "Auftrag Details abrufen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Auftrag Details", content: { "application/json": { schema: { $ref: "#/components/schemas/Auftrag" } } } },
          "404": { description: "Auftrag nicht gefunden" }
        }
      },
      put: {
        tags: ["Aufträge"],
        summary: "Auftrag aktualisieren",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/AuftragUpdate" } } } },
        responses: {
          "200": { description: "Auftrag aktualisiert" },
          "404": { description: "Nicht gefunden" }
        }
      },
      delete: {
        tags: ["Aufträge"],
        summary: "Auftrag löschen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Gelöscht" },
          "404": { description: "Nicht gefunden" }
        }
      }
    },
    "/api/auftraege/{id}/rechnung-erstellen": {
      post: {
        tags: ["Aufträge", "Rechnungen"],
        summary: "Rechnung für Auftrag erstellen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "201": { description: "Rechnung erstellt" },
          "400": { description: "Auftrag kann nicht abgerechnet werden" }
        }
      }
    },
    "/api/auftraege/{id}/wirtschaftlichkeit": {
      get: {
        tags: ["Aufträge", "Reports"],
        summary: "Wirtschaftlichkeitsanalyse eines Auftrags",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Wirtschaftlichkeitsdaten" }
        }
      }
    },

    // ==================== MITARBEITER ====================
    "/api/mitarbeiter": {
      get: {
        tags: ["Mitarbeiter"],
        summary: "Alle Mitarbeiter abrufen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "aktiv", in: "query", schema: { type: "boolean" } },
          { name: "gruppeId", in: "query", schema: { type: "string" } }
        ],
        responses: {
          "200": { description: "Liste der Mitarbeiter" }
        }
      },
      post: {
        tags: ["Mitarbeiter"],
        summary: "Neuen Mitarbeiter anlegen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/MitarbeiterCreate" } } } },
        responses: {
          "201": { description: "Mitarbeiter erstellt" }
        }
      }
    },
    "/api/mitarbeiter/{id}": {
      get: {
        tags: ["Mitarbeiter"],
        summary: "Mitarbeiter Details",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Mitarbeiter Details" } }
      },
      put: {
        tags: ["Mitarbeiter"],
        summary: "Mitarbeiter aktualisieren",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Aktualisiert" } }
      }
    },
    "/api/mitarbeiter/{id}/export": {
      get: {
        tags: ["Mitarbeiter", "GDPR"],
        summary: "DSGVO Datenexport für Mitarbeiter (Art. 20)",
        description: "Exportiert alle Daten eines Mitarbeiters als JSON oder CSV",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "format", in: "query", schema: { type: "string", enum: ["json", "csv"], default: "json" } }
        ],
        responses: {
          "200": { description: "Datenexport" },
          "403": { description: "Nur Admins" }
        }
      }
    },
    "/api/mitarbeiter/{id}/loeschen": {
      delete: {
        tags: ["Mitarbeiter", "GDPR"],
        summary: "DSGVO Datenlöschung (Soft-Delete mit Anonymisierung)",
        description: "Soft-Delete mit Anonymisierung für GoBD-Konformität",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Gelöscht/Anonymisiert" },
          "403": { description: "Nur Admins" }
        }
      }
    },
    "/api/mitarbeiter/{id}/statistik": {
      get: {
        tags: ["Mitarbeiter", "Reports"],
        summary: "Statistiken eines Mitarbeiters",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Statistiken" } }
      }
    },

    // ==================== PROTOKOLLE ====================
    "/api/protokolle": {
      get: {
        tags: ["Protokolle"],
        summary: "Alle Protokolle abrufen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Liste der Protokolle" } }
      },
      post: {
        tags: ["Protokolle"],
        summary: "Neues Protokoll erstellen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "201": { description: "Erstellt" } }
      }
    },
    "/api/tagesprotokoll": {
      get: {
        tags: ["Protokolle"],
        summary: "Tagesprotokolle abrufen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Tagesprotokolle" } }
      },
      post: {
        tags: ["Protokolle"],
        summary: "Tagesprotokoll erstellen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "201": { description: "Erstellt" } }
      }
    },
    "/api/tagesprotokoll/{id}/einreichen": {
      post: {
        tags: ["Protokolle"],
        summary: "Tagesprotokoll zur Prüfung einreichen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Eingereicht" } }
      }
    },

    // ==================== LOHN ====================
    "/api/lohn": {
      get: {
        tags: ["Lohn"],
        summary: "Lohndaten abrufen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Lohndaten" } }
      }
    },
    "/api/lohn/berechnung": {
      post: {
        tags: ["Lohn"],
        summary: "Lohnberechnung durchführen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Berechnungsergebnis" } }
      }
    },
    "/api/lohn/abrechnung": {
      get: {
        tags: ["Lohn"],
        summary: "Lohnabrechnungen abrufen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Abrechnungen" } }
      },
      post: {
        tags: ["Lohn"],
        summary: "Neue Lohnabrechnung erstellen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "201": { description: "Erstellt" } }
      }
    },
    "/api/stunden": {
      get: {
        tags: ["Lohn"],
        summary: "Stundeneinträge abrufen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Stundeneinträge" } }
      },
      post: {
        tags: ["Lohn"],
        summary: "Stundeneintrag erstellen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "201": { description: "Erstellt" } }
      }
    },
    "/api/export/datev-lohn": {
      get: {
        tags: ["Lohn", "Reports"],
        summary: "DATEV Lohnexport",
        description: "Exportiert Lohndaten im DATEV-Format",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "DATEV Export" } }
      }
    },

    // ==================== SAATGUTERNTE ====================
    "/api/saatguternte/register": {
      get: {
        tags: ["Saatguternte"],
        summary: "Saatgut-Register abrufen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Register-Einträge" } }
      },
      post: {
        tags: ["Saatguternte"],
        summary: "Neuen Register-Eintrag erstellen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "201": { description: "Erstellt" } }
      }
    },
    "/api/saatguternte/ernten": {
      get: {
        tags: ["Saatguternte"],
        summary: "Erntedaten abrufen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Erntedaten" } }
      }
    },
    "/api/saatguternte/anfragen": {
      get: {
        tags: ["Saatguternte"],
        summary: "Saatgut-Anfragen abrufen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Anfragen" } }
      },
      post: {
        tags: ["Saatguternte"],
        summary: "Neue Anfrage erstellen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "201": { description: "Erstellt" } }
      }
    },
    "/api/saatguternte/baumschulen": {
      get: {
        tags: ["Saatguternte"],
        summary: "Baumschulen-Liste",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Baumschulen" } }
      }
    },
    "/api/saatguternte/statistiken": {
      get: {
        tags: ["Saatguternte", "Reports"],
        summary: "Saatguternte-Statistiken",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Statistiken" } }
      }
    },

    // ==================== LAGER ====================
    "/api/lager": {
      get: {
        tags: ["Lager"],
        summary: "Lagerbestand abrufen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Lagerbestand" } }
      },
      post: {
        tags: ["Lager"],
        summary: "Neuen Lagerartikel anlegen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "201": { description: "Erstellt" } }
      }
    },
    "/api/lager/{id}/bewegung": {
      post: {
        tags: ["Lager"],
        summary: "Lagerbewegung buchen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Gebucht" } }
      }
    },
    "/api/lager/bestellungen": {
      get: {
        tags: ["Lager"],
        summary: "Bestellungen abrufen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Bestellungen" } }
      },
      post: {
        tags: ["Lager"],
        summary: "Neue Bestellung anlegen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "201": { description: "Erstellt" } }
      }
    },
    "/api/lager/reservierung": {
      get: {
        tags: ["Lager"],
        summary: "Reservierungen abrufen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Reservierungen" } }
      },
      post: {
        tags: ["Lager"],
        summary: "Material reservieren",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "201": { description: "Reserviert" } }
      }
    },

    // ==================== RECHNUNGEN ====================
    "/api/rechnungen": {
      get: {
        tags: ["Rechnungen"],
        summary: "Rechnungen abrufen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["entwurf", "gesendet", "bezahlt", "storniert"] } }
        ],
        responses: { "200": { description: "Rechnungen" } }
      },
      post: {
        tags: ["Rechnungen"],
        summary: "Rechnung erstellen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "201": { description: "Erstellt" } }
      }
    },
    "/api/rechnungen/{id}": {
      get: {
        tags: ["Rechnungen"],
        summary: "Rechnung Details",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Details" } }
      },
      put: {
        tags: ["Rechnungen"],
        summary: "Rechnung aktualisieren",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Aktualisiert" } }
      }
    },
    "/api/export/datev-rechnungen": {
      get: {
        tags: ["Rechnungen", "Reports"],
        summary: "DATEV Rechnungsexport",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "DATEV Export" } }
      }
    },

    // ==================== SYNC (Mobile App) ====================
    "/api/sync/pull": {
      post: {
        tags: ["Sync"],
        summary: "Daten vom Server ziehen (App Sync)",
        description: "WatermelonDB Pull-Sync für Mobile App",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  lastPulledAt: { type: "integer", description: "Unix Timestamp des letzten Syncs" },
                  schemaVersion: { type: "integer" },
                  migration: { type: "object" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Pull-Changes" }
        }
      }
    },
    "/api/sync/push": {
      post: {
        tags: ["Sync"],
        summary: "Lokale Änderungen pushen (App Sync)",
        description: "WatermelonDB Push-Sync für Mobile App",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Push erfolgreich" } }
      }
    },
    "/api/sync/logs": {
      get: {
        tags: ["Sync", "Admin"],
        summary: "Sync-Logs abrufen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Sync-Logs" } }
      }
    },

    // ==================== AUTH ====================
    "/api/auth/[...nextauth]": {
      get: {
        tags: ["Auth"],
        summary: "NextAuth.js Handler (Session, CSRF, etc.)",
        responses: { "200": { description: "Auth Response" } }
      },
      post: {
        tags: ["Auth"],
        summary: "NextAuth.js Handler (SignIn, SignOut)",
        responses: { "200": { description: "Auth Response" } }
      }
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Neuen Benutzer registrieren",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  name: { type: "string" }
                },
                required: ["email", "password", "name"]
              }
            }
          }
        },
        responses: {
          "201": { description: "Registriert" },
          "400": { description: "Validierungsfehler" },
          "409": { description: "E-Mail existiert bereits" }
        }
      }
    },
    "/api/auth/2fa/setup": {
      post: {
        tags: ["Auth"],
        summary: "2FA einrichten",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": { description: "QR-Code und Secret" }
        }
      }
    },
    "/api/auth/2fa/verify": {
      post: {
        tags: ["Auth"],
        summary: "2FA-Code verifizieren",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  code: { type: "string", pattern: "^[0-9]{6}$" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Verifiziert" } }
      }
    },
    "/api/auth/magic-link": {
      post: {
        tags: ["Auth"],
        summary: "Magic Link anfordern",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Link gesendet" } }
      }
    },

    // ==================== GDPR ====================
    "/api/gdpr": {
      get: {
        tags: ["GDPR"],
        summary: "DSGVO-Status abrufen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "GDPR Status" } }
      }
    },
    "/api/gdpr/{id}": {
      get: {
        tags: ["GDPR"],
        summary: "DSGVO-Anfrage Details",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Details" } }
      }
    },
    "/api/gdpr/restrict": {
      post: {
        tags: ["GDPR"],
        summary: "Datenverarbeitung einschränken (Art. 18)",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Eingeschränkt" } }
      }
    },
    "/api/consent": {
      get: {
        tags: ["GDPR"],
        summary: "Einwilligungsstatus abrufen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Consent Status" } }
      },
      post: {
        tags: ["GDPR"],
        summary: "Einwilligung erteilen/widerrufen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Aktualisiert" } }
      }
    },

    // ==================== KUNDENPORTAL ====================
    "/api/kundenportal/dokumente": {
      get: {
        tags: ["Kundenportal"],
        summary: "Kundendokumente abrufen",
        description: "Für eingeloggte Kunden: ihre Dokumente",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Dokumente" } }
      }
    },
    "/api/kundenportal/dokumente/download": {
      get: {
        tags: ["Kundenportal"],
        summary: "Dokument herunterladen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Dokument-Download" } }
      }
    },

    // ==================== FÖRDERUNG ====================
    "/api/foerderung/suche": {
      get: {
        tags: ["Förderung"],
        summary: "Förderprogramme suchen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "bundesland", in: "query", schema: { type: "string" } },
          { name: "foerderart", in: "query", schema: { type: "string" } }
        ],
        responses: { "200": { description: "Suchergebnisse" } }
      }
    },
    "/api/betriebs-assistent/beraten": {
      post: {
        tags: ["Förderung", "KI"],
        summary: "KI-Beratung zu Förderprogrammen",
        description: "Betriebs-Assistent für Förderberatung (ehemals /foerderung/beraten)",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  frage: { type: "string" },
                  kontext: { type: "object" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "KI-Antwort" } }
      }
    },
    "/api/foerderung/fristen": {
      get: {
        tags: ["Förderung"],
        summary: "Antragsfristen abrufen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Fristen" } }
      }
    },

    // ==================== KI ====================
    "/api/ki/dokument-analyse": {
      post: {
        tags: ["KI"],
        summary: "Dokument mit KI analysieren",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", format: "binary" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Analyse-Ergebnis" } }
      }
    },
    "/api/ki/unterkunft-analyse": {
      post: {
        tags: ["KI"],
        summary: "Unterkunft-Analyse mit KI",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Analyse" } }
      }
    },

    // ==================== FUHRPARK ====================
    "/api/fuhrpark": {
      get: {
        tags: ["Fuhrpark"],
        summary: "Fahrzeuge abrufen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Fahrzeuge" } }
      },
      post: {
        tags: ["Fuhrpark"],
        summary: "Fahrzeug anlegen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "201": { description: "Erstellt" } }
      }
    },
    "/api/geraete": {
      get: {
        tags: ["Fuhrpark"],
        summary: "Geräte abrufen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Geräte" } }
      },
      post: {
        tags: ["Fuhrpark"],
        summary: "Gerät anlegen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "201": { description: "Erstellt" } }
      }
    },

    // ==================== WOCHENPLANUNG ====================
    "/api/wochenplanung": {
      get: {
        tags: ["Wochenplanung"],
        summary: "Wochenplan abrufen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "woche", in: "query", schema: { type: "string", format: "date" } }
        ],
        responses: { "200": { description: "Wochenplan" } }
      },
      post: {
        tags: ["Wochenplanung"],
        summary: "Wochenplan erstellen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "201": { description: "Erstellt" } }
      }
    },
    "/api/wochenplanung/{id}/positionen": {
      get: {
        tags: ["Wochenplanung"],
        summary: "Positionen eines Wochenplans",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Positionen" } }
      },
      post: {
        tags: ["Wochenplanung"],
        summary: "Position hinzufügen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "201": { description: "Hinzugefügt" } }
      }
    },

    // ==================== SCHULUNGEN ====================
    "/api/schulungen": {
      get: {
        tags: ["Schulungen"],
        summary: "Schulungen abrufen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Schulungen" } }
      },
      post: {
        tags: ["Schulungen"],
        summary: "Schulung anlegen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "201": { description: "Erstellt" } }
      }
    },
    "/api/qualifikationen": {
      get: {
        tags: ["Schulungen"],
        summary: "Qualifikationen abrufen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Qualifikationen" } }
      }
    },

    // ==================== REPORTS ====================
    "/api/reports/saison": {
      get: {
        tags: ["Reports"],
        summary: "Saisonbericht",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "saisonId", in: "query", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Bericht" } }
      }
    },
    "/api/reports/mitarbeiter": {
      get: {
        tags: ["Reports"],
        summary: "Mitarbeiterbericht",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Bericht" } }
      }
    },
    "/api/jahresuebersicht": {
      get: {
        tags: ["Reports"],
        summary: "Jahresübersicht",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "jahr", in: "query", schema: { type: "integer" } }],
        responses: { "200": { description: "Jahresübersicht" } }
      }
    },

    // ==================== APP (Mobile) ====================
    "/api/app/auth": {
      post: {
        tags: ["Sync", "Auth"],
        summary: "App-Login (JWT Token)",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string" },
                  password: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "JWT Token" },
          "401": { description: "Ungültige Credentials" }
        }
      }
    },
    "/api/app/me": {
      get: {
        tags: ["Sync"],
        summary: "Aktueller App-Benutzer",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Benutzerdaten" } }
      }
    },
    "/api/app/auftraege": {
      get: {
        tags: ["Sync"],
        summary: "Aufträge für App",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Aufträge" } }
      }
    },

    // ==================== ABNAHMEN ====================
    "/api/abnahmen": {
      get: {
        tags: ["Aufträge"],
        summary: "Abnahmen abrufen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Abnahmen" } }
      },
      post: {
        tags: ["Aufträge"],
        summary: "Abnahme erstellen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "201": { description: "Erstellt" } }
      }
    },
    "/api/abnahmen/{id}/bestaetigen": {
      post: {
        tags: ["Aufträge"],
        summary: "Abnahme bestätigen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Bestätigt" } }
      }
    },

    // ==================== GRUPPEN ====================
    "/api/gruppen": {
      get: {
        tags: ["Mitarbeiter"],
        summary: "Arbeitsgruppen abrufen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Gruppen" } }
      },
      post: {
        tags: ["Mitarbeiter"],
        summary: "Gruppe erstellen",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "201": { description: "Erstellt" } }
      }
    },

    // ==================== WEBHOOKS ====================
    "/api/anfragen/wp-webhook": {
      post: {
        tags: ["Admin"],
        summary: "WordPress Wizard Webhook",
        description: "Empfängt neue Anfragen von WordPress Wizards",
        security: [{ apiKeyAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  data: { type: "object" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Webhook verarbeitet" },
          "401": { description: "Ungültiger API-Key" }
        }
      }
    },
    "/api/telegram/webhook": {
      post: {
        tags: ["Admin"],
        summary: "Telegram Bot Webhook",
        responses: { "200": { description: "OK" } }
      }
    },

    // ==================== CRON (Intern) ====================
    "/api/cron/sync-auftraege": {
      get: {
        tags: ["Cron"],
        summary: "Aufträge synchronisieren",
        description: "Vercel Cron Job",
        security: [{ cronAuth: [] }],
        responses: { "200": { description: "Sync abgeschlossen" } }
      }
    },
    "/api/cron/wetter-update": {
      get: {
        tags: ["Cron"],
        summary: "Wetterdaten aktualisieren",
        security: [{ cronAuth: [] }],
        responses: { "200": { description: "Aktualisiert" } }
      }
    },
    "/api/cron/cleanup-audit": {
      get: {
        tags: ["Cron", "GDPR"],
        summary: "Alte Audit-Logs bereinigen",
        security: [{ cronAuth: [] }],
        responses: { "200": { description: "Bereinigt" } }
      }
    },
    "/api/cron/cleanup-soft-delete": {
      get: {
        tags: ["Cron", "GDPR"],
        summary: "Soft-Delete endgültig löschen (nach Aufbewahrungsfrist)",
        security: [{ cronAuth: [] }],
        responses: { "200": { description: "Bereinigt" } }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT Token für Mobile App"
      },
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "next-auth.session-token",
        description: "NextAuth.js Session Cookie"
      },
      apiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        description: "API Key für Webhooks"
      },
      cronAuth: {
        type: "apiKey",
        in: "header",
        name: "Authorization",
        description: "Vercel Cron Secret"
      }
    },
    schemas: {
      Auftrag: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          nummer: { type: "string" },
          titel: { type: "string" },
          status: { type: "string", enum: ["offen", "in_bearbeitung", "abgeschlossen", "storniert"] },
          kunde: { $ref: "#/components/schemas/Kontakt" },
          saisonId: { type: "string" },
          startDatum: { type: "string", format: "date" },
          endDatum: { type: "string", format: "date" },
          flaeche: { type: "number" },
          baumarten: { type: "array", items: { type: "string" } },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      AuftragCreate: {
        type: "object",
        required: ["titel", "kundeId", "saisonId"],
        properties: {
          titel: { type: "string" },
          kundeId: { type: "string" },
          saisonId: { type: "string" },
          startDatum: { type: "string", format: "date" },
          flaeche: { type: "number" },
          notizen: { type: "string" }
        }
      },
      AuftragUpdate: {
        type: "object",
        properties: {
          titel: { type: "string" },
          status: { type: "string" },
          endDatum: { type: "string", format: "date" },
          notizen: { type: "string" }
        }
      },
      AuftraegeList: {
        type: "object",
        properties: {
          auftraege: { type: "array", items: { $ref: "#/components/schemas/Auftrag" } },
          total: { type: "integer" },
          limit: { type: "integer" },
          offset: { type: "integer" }
        }
      },
      Kontakt: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          telefon: { type: "string" },
          adresse: { type: "string" }
        }
      },
      Mitarbeiter: {
        type: "object",
        properties: {
          id: { type: "string" },
          vorname: { type: "string" },
          nachname: { type: "string" },
          email: { type: "string", format: "email" },
          telefon: { type: "string" },
          position: { type: "string" },
          aktiv: { type: "boolean" },
          gruppeId: { type: "string" },
          qualifikationen: { type: "array", items: { type: "string" } }
        }
      },
      MitarbeiterCreate: {
        type: "object",
        required: ["vorname", "nachname"],
        properties: {
          vorname: { type: "string" },
          nachname: { type: "string" },
          email: { type: "string", format: "email" },
          telefon: { type: "string" },
          position: { type: "string" },
          gruppeId: { type: "string" }
        }
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          code: { type: "string" },
          details: { type: "object" }
        }
      }
    }
  }
};
