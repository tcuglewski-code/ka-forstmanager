/**
 * ForstManager OpenAPI 3.0 Specification
 * Manual spec covering the major API route groups.
 * Rendered via swagger-ui-react at /api-docs
 * Raw JSON available at GET /api/docs
 */

export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "ForstManager API",
    version: "1.0.0",
    description:
      "Koch Aufforstung ForstManager REST API — Verwaltung von Mitarbeitern, Aufträgen, Protokollen, Lohn, Lager und mehr.",
    contact: {
      name: "Koch Aufforstung",
      url: "https://ka-forstmanager.vercel.app",
    },
  },
  servers: [
    {
      url: "https://ka-forstmanager.vercel.app",
      description: "Production",
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "session-token",
        description: "NextAuth session cookie (browser login)",
      },
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "JWT token from /api/auth or /api/app/auth",
      },
    },
    schemas: {
      Mitarbeiter: {
        type: "object",
        properties: {
          id: { type: "string" },
          vorname: { type: "string" },
          nachname: { type: "string" },
          email: { type: "string", format: "email" },
          telefon: { type: "string" },
          rolle: { type: "string", enum: ["mitarbeiter", "gruppenfuehrer", "admin"] },
          aktiv: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Auftrag: {
        type: "object",
        properties: {
          id: { type: "string" },
          titel: { type: "string" },
          status: { type: "string", enum: ["offen", "in_arbeit", "abgeschlossen", "storniert"] },
          kundeId: { type: "string" },
          saisonId: { type: "string" },
          startDatum: { type: "string", format: "date" },
          endDatum: { type: "string", format: "date" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Protokoll: {
        type: "object",
        properties: {
          id: { type: "string" },
          datum: { type: "string", format: "date" },
          auftragId: { type: "string" },
          mitarbeiterId: { type: "string" },
          notizen: { type: "string" },
          status: { type: "string", enum: ["entwurf", "eingereicht", "genehmigt"] },
        },
      },
      Rechnung: {
        type: "object",
        properties: {
          id: { type: "string" },
          rechnungsnummer: { type: "string" },
          kundeId: { type: "string" },
          betragNetto: { type: "number" },
          betragBrutto: { type: "number" },
          mwstSatz: { type: "number" },
          status: { type: "string", enum: ["entwurf", "offen", "bezahlt", "storniert", "mahnung"] },
          faelligAm: { type: "string", format: "date" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      GdprRequest: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: { type: "string", enum: ["export", "delete", "restrict"] },
          status: { type: "string", enum: ["pending", "processing", "completed", "rejected"] },
          requestedAt: { type: "string", format: "date-time" },
          completedAt: { type: "string", format: "date-time" },
        },
      },
      SosEvent: {
        type: "object",
        properties: {
          id: { type: "string" },
          mitarbeiterId: { type: "string" },
          typ: { type: "string", enum: ["sos", "deadman"] },
          status: { type: "string", enum: ["aktiv", "resolved"] },
          latitude: { type: "number" },
          longitude: { type: "number" },
          triggeredAt: { type: "string", format: "date-time" },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
    },
  },
  security: [{ cookieAuth: [] }, { bearerAuth: [] }],
  tags: [
    { name: "Auth", description: "Authentifizierung & Session-Management" },
    { name: "Mitarbeiter", description: "Mitarbeiterverwaltung (CRUD)" },
    { name: "Auftraege", description: "Auftragsverwaltung" },
    { name: "Protokolle", description: "Tagesprotokolle & Arbeitsnachweise" },
    { name: "Stunden", description: "Zeiterfassung" },
    { name: "Lohn", description: "Lohnabrechnung & Export" },
    { name: "Lager", description: "Lagerverwaltung" },
    { name: "Team", description: "Team-Uebersicht & Live-Status" },
    { name: "Rechnungen", description: "Rechnungsverwaltung, XRechnung, Storno, GoBD-Export" },
    { name: "GDPR", description: "DSGVO: Datenexport, Loeschung, Einschraenkung" },
    { name: "Admin", description: "Administration: Benutzer, Sessions, KPIs, Feature-Flags, Dunning" },
    { name: "Cron", description: "Geplante Hintergrund-Jobs (Vercel Cron)" },
    { name: "Webhooks", description: "Eingehende Webhooks (Stripe, etc.)" },
    { name: "Billing", description: "Stripe Billing & Kundenportal" },
    { name: "SOS", description: "SOS-Notfall: Ausloesung, Koordinator, Status" },
    { name: "Alleinarbeit", description: "Alleinarbeit-Sessions & Check-In" },
    { name: "Buchhaltung", description: "Buchhaltungs-Uebersicht: Rechnungen & Stundeneintraege" },
    { name: "App", description: "Mobile App Endpoints" },
  ],
  paths: {
    // === Auth ===
    "/api/auth/[...nextauth]": {
      get: {
        tags: ["Auth"],
        summary: "NextAuth Handler (GET)",
        description: "NextAuth.js catch-all route for session, signin, signout, csrf, providers.",
        responses: { "200": { description: "NextAuth response" } },
      },
      post: {
        tags: ["Auth"],
        summary: "NextAuth Handler (POST)",
        description: "NextAuth.js catch-all for credentials login, signout, etc.",
        responses: { "200": { description: "NextAuth response" } },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Benutzer registrieren",
        description: "Erstellt einen neuen Benutzer-Account (nur Admin).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  role: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Benutzer erstellt" },
          "400": { description: "Validierungsfehler" },
          "401": { description: "Nicht autorisiert" },
        },
      },
    },
    "/api/auth/change-password": {
      post: {
        tags: ["Auth"],
        summary: "Passwort aendern",
        description: "Aendert das Passwort des eingeloggten Benutzers.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["currentPassword", "newPassword"],
                properties: {
                  currentPassword: { type: "string" },
                  newPassword: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Passwort geaendert" },
          "400": { description: "Falsches aktuelles Passwort" },
        },
      },
    },
    "/api/auth/2fa/setup": {
      post: {
        tags: ["Auth"],
        summary: "2FA einrichten",
        description: "Generiert TOTP-Secret und QR-Code fuer die Zwei-Faktor-Authentifizierung.",
        responses: {
          "200": { description: "TOTP Secret + QR-Code URL" },
          "401": { description: "Nicht autorisiert" },
        },
      },
    },

    // === Mitarbeiter ===
    "/api/mitarbeiter": {
      get: {
        tags: ["Mitarbeiter"],
        summary: "Alle Mitarbeiter auflisten",
        description: "Gibt alle aktiven Mitarbeiter zurueck.",
        responses: {
          "200": {
            description: "Liste der Mitarbeiter",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Mitarbeiter" } },
              },
            },
          },
        },
      },
      post: {
        tags: ["Mitarbeiter"],
        summary: "Neuen Mitarbeiter anlegen",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Mitarbeiter" },
            },
          },
        },
        responses: {
          "201": { description: "Mitarbeiter erstellt" },
          "400": { description: "Validierungsfehler" },
        },
      },
    },
    "/api/mitarbeiter/{id}": {
      get: {
        tags: ["Mitarbeiter"],
        summary: "Einzelnen Mitarbeiter abrufen",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Mitarbeiter-Objekt" },
          "404": { description: "Nicht gefunden" },
        },
      },
      put: {
        tags: ["Mitarbeiter"],
        summary: "Mitarbeiter aktualisieren",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/Mitarbeiter" } } },
        },
        responses: {
          "200": { description: "Mitarbeiter aktualisiert" },
          "404": { description: "Nicht gefunden" },
        },
      },
      delete: {
        tags: ["Mitarbeiter"],
        summary: "Mitarbeiter loeschen (Soft-Delete)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Mitarbeiter deaktiviert" },
          "404": { description: "Nicht gefunden" },
        },
      },
    },

    // === Auftraege ===
    "/api/auftraege": {
      get: {
        tags: ["Auftraege"],
        summary: "Alle Auftraege auflisten",
        parameters: [
          { name: "status", in: "query", schema: { type: "string" }, required: false },
          { name: "saisonId", in: "query", schema: { type: "string" }, required: false },
        ],
        responses: {
          "200": {
            description: "Liste der Auftraege",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Auftrag" } },
              },
            },
          },
        },
      },
      post: {
        tags: ["Auftraege"],
        summary: "Neuen Auftrag anlegen",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/Auftrag" } } },
        },
        responses: { "201": { description: "Auftrag erstellt" } },
      },
    },
    "/api/auftraege/{id}": {
      get: {
        tags: ["Auftraege"],
        summary: "Einzelnen Auftrag abrufen",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Auftrags-Objekt mit Details" },
          "404": { description: "Nicht gefunden" },
        },
      },
      put: {
        tags: ["Auftraege"],
        summary: "Auftrag aktualisieren",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Auftrag aktualisiert" } },
      },
    },

    // === Protokolle ===
    "/api/protokolle": {
      get: {
        tags: ["Protokolle"],
        summary: "Protokolle auflisten",
        responses: {
          "200": {
            description: "Liste der Protokolle",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Protokoll" } },
              },
            },
          },
        },
      },
      post: {
        tags: ["Protokolle"],
        summary: "Neues Protokoll erstellen",
        responses: { "201": { description: "Protokoll erstellt" } },
      },
    },
    "/api/tagesprotokoll/{id}/einreichen": {
      post: {
        tags: ["Protokolle"],
        summary: "Tagesprotokoll einreichen",
        description: "Reicht ein Tagesprotokoll zur Genehmigung ein.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Protokoll eingereicht" },
          "404": { description: "Nicht gefunden" },
        },
      },
    },

    // === Stunden ===
    "/api/stunden": {
      get: {
        tags: ["Stunden"],
        summary: "Stundeneintraege auflisten",
        responses: { "200": { description: "Liste der Stundeneintraege" } },
      },
      post: {
        tags: ["Stunden"],
        summary: "Stundeneintrag erstellen",
        responses: { "201": { description: "Eintrag erstellt" } },
      },
    },

    // === Lohn ===
    "/api/lohn/berechnung": {
      post: {
        tags: ["Lohn"],
        summary: "Lohn berechnen",
        description: "Berechnet den Lohn fuer einen Mitarbeiter in einem Zeitraum.",
        responses: { "200": { description: "Berechnungsergebnis" } },
      },
    },
    "/api/lohn/abrechnung": {
      get: {
        tags: ["Lohn"],
        summary: "Lohnabrechnungen auflisten",
        responses: { "200": { description: "Liste der Abrechnungen" } },
      },
      post: {
        tags: ["Lohn"],
        summary: "Lohnabrechnung erstellen",
        responses: { "201": { description: "Abrechnung erstellt" } },
      },
    },

    // === Lager ===
    "/api/lager": {
      get: {
        tags: ["Lager"],
        summary: "Lagerartikel auflisten",
        responses: { "200": { description: "Liste der Lagerartikel" } },
      },
      post: {
        tags: ["Lager"],
        summary: "Neuen Lagerartikel anlegen",
        responses: { "201": { description: "Artikel erstellt" } },
      },
    },
    "/api/lager/{id}/bewegung": {
      post: {
        tags: ["Lager"],
        summary: "Lagerbewegung buchen",
        description: "Bucht eine Ein- oder Auslagerung fuer einen Artikel.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Bewegung gebucht" } },
      },
    },

    // === Team ===
    "/api/team": {
      get: {
        tags: ["Team"],
        summary: "Team-Uebersicht",
        description: "Gibt die Team-Uebersicht mit allen Mitgliedern zurueck.",
        responses: { "200": { description: "Team-Daten" } },
      },
    },
    "/api/team/live-status": {
      get: {
        tags: ["Team"],
        summary: "Live-Status aller Mitarbeiter",
        description: "Echtzeit-Status: wer ist eingecheckt, wo, seit wann.",
        responses: { "200": { description: "Live-Status Daten" } },
      },
    },

    // === Rechnungen ===
    "/api/rechnungen": {
      get: {
        tags: ["Rechnungen"],
        summary: "Rechnungen auflisten",
        description: "Gibt alle Rechnungen zurueck, optional gefiltert nach Status oder Zeitraum.",
        parameters: [
          { name: "status", in: "query", schema: { type: "string" }, required: false },
          { name: "von", in: "query", schema: { type: "string", format: "date" }, required: false },
          { name: "bis", in: "query", schema: { type: "string", format: "date" }, required: false },
        ],
        responses: {
          "200": {
            description: "Liste der Rechnungen",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Rechnung" } },
              },
            },
          },
        },
      },
      post: {
        tags: ["Rechnungen"],
        summary: "Neue Rechnung erstellen",
        description: "Erstellt eine neue Rechnung mit Positionen. Rechnungsnummer wird automatisch vergeben.",
        responses: { "201": { description: "Rechnung erstellt" } },
      },
    },
    "/api/rechnungen/{id}": {
      get: {
        tags: ["Rechnungen"],
        summary: "Einzelne Rechnung abrufen",
        description: "Gibt eine Rechnung inkl. Positionen und Audit-Trail zurueck.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Rechnungs-Objekt mit Positionen" },
          "404": { description: "Nicht gefunden" },
        },
      },
      put: {
        tags: ["Rechnungen"],
        summary: "Rechnung aktualisieren",
        description: "Aktualisiert eine Rechnung (nur im Status 'entwurf').",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Rechnung aktualisiert" },
          "400": { description: "Rechnung kann nicht mehr bearbeitet werden" },
        },
      },
    },
    "/api/rechnungen/{id}/stornieren": {
      post: {
        tags: ["Rechnungen"],
        summary: "Rechnung stornieren",
        description: "Storniert eine Rechnung und erstellt ggf. eine Stornorechnung. GoBD-konform unveraenderbar.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  grund: { type: "string", description: "Stornierungsgrund" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Rechnung storniert" },
          "400": { description: "Stornierung nicht moeglich" },
        },
      },
    },
    "/api/rechnungen/{id}/xrechnung": {
      get: {
        tags: ["Rechnungen"],
        summary: "XRechnung-XML generieren",
        description: "Generiert die Rechnung im XRechnung/ZUGFeRD-Format (XML) fuer den oeffentlichen Sektor.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "XRechnung XML",
            content: { "application/xml": { schema: { type: "string" } } },
          },
          "404": { description: "Rechnung nicht gefunden" },
        },
      },
    },
    "/api/rechnungen/{id}/audit": {
      get: {
        tags: ["Rechnungen"],
        summary: "Audit-Trail einer Rechnung",
        description: "Gibt die vollstaendige Aenderungshistorie einer Rechnung zurueck (GoBD-Compliance).",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Liste der Audit-Eintraege" },
        },
      },
    },
    "/api/rechnungen/{id}/versions": {
      get: {
        tags: ["Rechnungen"],
        summary: "Versionshistorie einer Rechnung",
        description: "Gibt alle Versionen/Revisionen einer Rechnung zurueck.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Liste der Rechnungs-Versionen" },
        },
      },
    },
    "/api/rechnungen/export/gobd": {
      get: {
        tags: ["Rechnungen"],
        summary: "GoBD-Export aller Rechnungen",
        description: "Exportiert alle Rechnungen im GoBD-konformen Format (ZIP mit CSV + PDFs). Fuer Betriebspruefung.",
        parameters: [
          { name: "von", in: "query", schema: { type: "string", format: "date" }, required: false },
          { name: "bis", in: "query", schema: { type: "string", format: "date" }, required: false },
        ],
        responses: {
          "200": {
            description: "GoBD-Export als ZIP",
            content: { "application/zip": { schema: { type: "string", format: "binary" } } },
          },
        },
      },
    },
    "/api/rechnungen/{id}/pdf": {
      get: {
        tags: ["Rechnungen"],
        summary: "Rechnung als PDF herunterladen",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "PDF-Datei",
            content: { "application/pdf": { schema: { type: "string", format: "binary" } } },
          },
        },
      },
    },

    // === GDPR / DSGVO ===
    "/api/gdpr": {
      get: {
        tags: ["GDPR"],
        summary: "DSGVO-Anfragen auflisten",
        description: "Listet alle DSGVO-Anfragen (Export, Loeschung, Einschraenkung) auf. Nur Admin.",
        responses: {
          "200": {
            description: "Liste der DSGVO-Anfragen",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/GdprRequest" } },
              },
            },
          },
          "401": { description: "Nicht autorisiert" },
        },
      },
      post: {
        tags: ["GDPR"],
        summary: "Neue DSGVO-Anfrage erstellen",
        description: "Erstellt eine neue DSGVO-Anfrage (Auskunft, Loeschung oder Einschraenkung).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["type"],
                properties: {
                  type: { type: "string", enum: ["export", "delete", "restrict"] },
                  reason: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Anfrage erstellt" },
          "400": { description: "Validierungsfehler" },
        },
      },
    },
    "/api/gdpr/{id}": {
      get: {
        tags: ["GDPR"],
        summary: "Einzelne DSGVO-Anfrage abrufen",
        description: "Status und Details einer DSGVO-Anfrage.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "DSGVO-Anfrage-Details" },
          "404": { description: "Nicht gefunden" },
        },
      },
      delete: {
        tags: ["GDPR"],
        summary: "DSGVO-Loeschanfrage ausfuehren",
        description: "Fuehrt die Loeschung personenbezogener Daten gemaess Art. 17 DSGVO durch.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Daten geloescht" },
          "404": { description: "Anfrage nicht gefunden" },
        },
      },
    },
    "/api/gdpr/export": {
      post: {
        tags: ["GDPR"],
        summary: "Datenexport (Art. 20 DSGVO)",
        description: "Exportiert alle personenbezogenen Daten eines Nutzers als JSON/ZIP (Recht auf Datenportabilitaet).",
        responses: {
          "200": {
            description: "Datenexport als ZIP",
            content: { "application/zip": { schema: { type: "string", format: "binary" } } },
          },
          "401": { description: "Nicht autorisiert" },
        },
      },
    },
    "/api/gdpr/restrict": {
      post: {
        tags: ["GDPR"],
        summary: "Verarbeitung einschraenken (Art. 18 DSGVO)",
        description: "Schraenkt die Verarbeitung personenbezogener Daten ein.",
        responses: {
          "200": { description: "Verarbeitung eingeschraenkt" },
          "401": { description: "Nicht autorisiert" },
        },
      },
    },

    // === Admin ===
    "/api/admin/benutzer": {
      get: {
        tags: ["Admin"],
        summary: "Alle Benutzer verwalten",
        description: "Listet alle Benutzer-Accounts mit Rollen und Status auf. Nur Super-Admin.",
        responses: {
          "200": { description: "Liste aller Benutzer" },
          "401": { description: "Nicht autorisiert" },
          "403": { description: "Keine Admin-Berechtigung" },
        },
      },
    },
    "/api/admin/sessions": {
      get: {
        tags: ["Admin"],
        summary: "Aktive Sessions auflisten",
        description: "Zeigt alle aktiven Benutzer-Sessions an. Fuer Security-Monitoring.",
        responses: {
          "200": { description: "Liste aktiver Sessions" },
          "403": { description: "Keine Admin-Berechtigung" },
        },
      },
    },
    "/api/admin/sessions/user/{userId}/invalidate": {
      post: {
        tags: ["Admin"],
        summary: "Benutzer-Sessions invalidieren",
        description: "Beendet alle aktiven Sessions eines Benutzers (z.B. bei Sicherheitsvorfall).",
        parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Sessions invalidiert" },
          "404": { description: "Benutzer nicht gefunden" },
        },
      },
    },
    "/api/admin/kpis": {
      get: {
        tags: ["Admin"],
        summary: "KPI-Dashboard Daten",
        description: "Gibt aktuelle KPIs zurueck: MRR, Churn-Rate, aktive Nutzer, Auftragsvolumen, etc.",
        responses: {
          "200": { description: "KPI-Daten" },
          "403": { description: "Keine Admin-Berechtigung" },
        },
      },
    },
    "/api/admin/feature-flags": {
      get: {
        tags: ["Admin"],
        summary: "Feature-Flags auflisten",
        description: "Gibt alle Feature-Flags mit aktuellem Status zurueck.",
        responses: { "200": { description: "Liste der Feature-Flags" } },
      },
      post: {
        tags: ["Admin"],
        summary: "Feature-Flag setzen",
        description: "Aktiviert oder deaktiviert ein Feature-Flag.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["key", "enabled"],
                properties: {
                  key: { type: "string" },
                  enabled: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Flag aktualisiert" },
          "403": { description: "Keine Admin-Berechtigung" },
        },
      },
    },
    "/api/admin/dunning": {
      get: {
        tags: ["Admin"],
        summary: "Mahnwesen-Uebersicht",
        description: "Listet alle offenen Mahnungen und ueberfaelligen Rechnungen auf.",
        responses: {
          "200": { description: "Dunning-Daten" },
          "403": { description: "Keine Admin-Berechtigung" },
        },
      },
    },
    "/api/admin/payments/unmatched": {
      get: {
        tags: ["Admin"],
        summary: "Nicht zugeordnete Zahlungen",
        description: "Listet Stripe-Zahlungen auf, die keiner Rechnung zugeordnet werden konnten.",
        responses: {
          "200": { description: "Liste nicht zugeordneter Zahlungen" },
          "403": { description: "Keine Admin-Berechtigung" },
        },
      },
    },

    // === Cron Jobs ===
    "/api/cron/cleanup-gps-data": {
      get: {
        tags: ["Cron"],
        summary: "GPS-Daten bereinigen",
        description: "Loescht GPS-Rohdaten aelter als 90 Tage (DSGVO-konform). Laeuft taeglich via Vercel Cron.",
        security: [],
        responses: { "200": { description: "Bereinigung abgeschlossen" } },
      },
    },
    "/api/cron/cleanup-gps-protokoll": {
      get: {
        tags: ["Cron"],
        summary: "GPS-Protokolldaten bereinigen",
        description: "Bereinigt GPS-Protokolldaten nach Aufbewahrungsfrist.",
        security: [],
        responses: { "200": { description: "Bereinigung abgeschlossen" } },
      },
    },
    "/api/cron/cleanup-gps-raw": {
      get: {
        tags: ["Cron"],
        summary: "GPS-Rohdaten bereinigen",
        description: "Loescht unkomprimierte GPS-Rohdaten.",
        security: [],
        responses: { "200": { description: "Bereinigung abgeschlossen" } },
      },
    },
    "/api/cron/cleanup-customers": {
      get: {
        tags: ["Cron"],
        summary: "Inaktive Kundendaten bereinigen",
        description: "Entfernt Daten inaktiver/gekuendigter Kunden nach Aufbewahrungsfrist.",
        security: [],
        responses: { "200": { description: "Bereinigung abgeschlossen" } },
      },
    },
    "/api/cron/cleanup-audit": {
      get: {
        tags: ["Cron"],
        summary: "Alte Audit-Logs bereinigen",
        description: "Loescht Audit-Log-Eintraege aelter als die konfigurierte Aufbewahrungsfrist.",
        security: [],
        responses: { "200": { description: "Bereinigung abgeschlossen" } },
      },
    },
    "/api/cron/cleanup-ai-audit": {
      get: {
        tags: ["Cron"],
        summary: "KI-Audit-Logs bereinigen",
        description: "Bereinigt Audit-Logs der KI-Nutzung (EU AI Act Compliance).",
        security: [],
        responses: { "200": { description: "Bereinigung abgeschlossen" } },
      },
    },
    "/api/cron/cleanup-soft-delete": {
      get: {
        tags: ["Cron"],
        summary: "Soft-Deleted Eintraege endgueltig loeschen",
        description: "Entfernt soft-deleted Datensaetze nach 30-Tage-Karenz endgueltig.",
        security: [],
        responses: { "200": { description: "Bereinigung abgeschlossen" } },
      },
    },
    "/api/cron/cleanup-data": {
      get: {
        tags: ["Cron"],
        summary: "Allgemeine Datenbereinigung",
        description: "Sammeljob fuer diverse Datenbereinigungen (temp files, expired tokens, etc.).",
        security: [],
        responses: { "200": { description: "Bereinigung abgeschlossen" } },
      },
    },
    "/api/cron/cleanup-pd-access-log": {
      get: {
        tags: ["Cron"],
        summary: "Personendaten-Zugriffslog bereinigen",
        description: "Bereinigt das Log der Zugriffe auf personenbezogene Daten.",
        security: [],
        responses: { "200": { description: "Bereinigung abgeschlossen" } },
      },
    },
    "/api/cron/cleanup-invoices-10y": {
      get: {
        tags: ["Cron"],
        summary: "Rechnungen nach 10 Jahren archivieren",
        description: "Archiviert/loescht Rechnungsdaten nach Ablauf der 10-Jahres-Aufbewahrungspflicht (GoBD).",
        security: [],
        responses: { "200": { description: "Archivierung abgeschlossen" } },
      },
    },
    "/api/cron/kpi-snapshot": {
      get: {
        tags: ["Cron"],
        summary: "KPI-Snapshot erstellen",
        description: "Erstellt einen taeglichen Snapshot der wichtigsten KPIs (MRR, Churn, aktive Nutzer).",
        security: [],
        responses: { "200": { description: "Snapshot erstellt" } },
      },
    },
    "/api/cron/churn-notify": {
      get: {
        tags: ["Cron"],
        summary: "Churn-Benachrichtigungen senden",
        description: "Benachrichtigt Kunden, deren Abo bald auslaeuft oder inaktiv ist.",
        security: [],
        responses: { "200": { description: "Benachrichtigungen versendet" } },
      },
    },
    "/api/cron/churn-grace-start": {
      get: {
        tags: ["Cron"],
        summary: "Churn Grace Period starten",
        description: "Startet die Gnadenfrist fuer gekuendigte Kunden (Daten noch X Tage verfuegbar).",
        security: [],
        responses: { "200": { description: "Grace-Period gestartet" } },
      },
    },
    "/api/cron/churn-archive": {
      get: {
        tags: ["Cron"],
        summary: "Churn-Daten archivieren",
        description: "Archiviert Daten von Kunden nach Ablauf der Grace-Period.",
        security: [],
        responses: { "200": { description: "Archivierung abgeschlossen" } },
      },
    },
    "/api/cron/dunning-enforce": {
      get: {
        tags: ["Cron"],
        summary: "Mahnlauf durchfuehren",
        description: "Prueft ueberfaellige Rechnungen und erstellt/eskaliert Mahnungen automatisch.",
        security: [],
        responses: { "200": { description: "Mahnlauf abgeschlossen" } },
      },
    },
    "/api/cron/deadman-check": {
      get: {
        tags: ["Cron"],
        summary: "Dead-Man-Switch pruefen",
        description: "Prueft ob Alleinarbeiter ihren Check-In verpasst haben und loest ggf. SOS aus.",
        security: [],
        responses: { "200": { description: "Pruefung abgeschlossen" } },
      },
    },

    // === Webhooks ===
    "/api/webhooks/stripe": {
      post: {
        tags: ["Webhooks"],
        summary: "Stripe Webhook empfangen",
        description: "Empfaengt Stripe-Events (payment_intent.succeeded, invoice.paid, subscription.updated, etc.). Verifiziert Signatur.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", description: "Stripe Event Payload" },
            },
          },
        },
        responses: {
          "200": { description: "Event verarbeitet" },
          "400": { description: "Ungueltige Signatur" },
        },
      },
    },

    // === Billing ===
    "/api/billing/portal": {
      post: {
        tags: ["Billing"],
        summary: "Stripe Kundenportal-Link erstellen",
        description: "Erstellt einen Stripe Customer Portal Link fuer Self-Service (Abo aendern, Zahlungsmethode, Rechnungen).",
        responses: {
          "200": {
            description: "Portal-URL",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { url: { type: "string", format: "uri" } },
                },
              },
            },
          },
          "401": { description: "Nicht autorisiert" },
        },
      },
    },
    "/api/stripe/checkout": {
      post: {
        tags: ["Billing"],
        summary: "Stripe Checkout Session erstellen",
        description: "Erstellt eine Stripe Checkout Session fuer neue Abonnements.",
        responses: {
          "200": { description: "Checkout-Session URL" },
          "401": { description: "Nicht autorisiert" },
        },
      },
    },

    // === SOS / Notfall ===
    "/api/sos/trigger": {
      post: {
        tags: ["SOS"],
        summary: "SOS-Alarm ausloesen",
        description: "Loest einen SOS-Notfall aus. Benachrichtigt Koordinator und hinterlegt GPS-Position.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  latitude: { type: "number" },
                  longitude: { type: "number" },
                  nachricht: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "SOS-Event erstellt",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SosEvent" },
              },
            },
          },
          "401": { description: "Nicht autorisiert" },
        },
      },
    },
    "/api/sos/koordinator-numbers": {
      get: {
        tags: ["SOS"],
        summary: "Koordinator-Nummern abrufen",
        description: "Gibt die konfigurierten Notfall-Koordinator-Telefonnummern zurueck.",
        responses: {
          "200": { description: "Liste der Koordinator-Nummern" },
        },
      },
      post: {
        tags: ["SOS"],
        summary: "Koordinator-Nummer verwalten",
        description: "Fuegt eine neue Koordinator-Nummer hinzu oder aktualisiert bestehende.",
        responses: {
          "200": { description: "Nummer gespeichert" },
          "403": { description: "Keine Admin-Berechtigung" },
        },
      },
    },
    "/api/sos/events": {
      get: {
        tags: ["SOS"],
        summary: "SOS-Events auflisten",
        description: "Listet alle SOS-Events auf (aktive und resolved).",
        responses: { "200": { description: "Liste der SOS-Events" } },
      },
    },
    "/api/sos/status/{eventId}": {
      get: {
        tags: ["SOS"],
        summary: "SOS-Event Status",
        description: "Gibt den aktuellen Status eines SOS-Events zurueck.",
        parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "SOS-Event Status" },
          "404": { description: "Event nicht gefunden" },
        },
      },
    },
    "/api/sos/resolve/{eventId}": {
      post: {
        tags: ["SOS"],
        summary: "SOS-Event aufloesen",
        description: "Markiert einen SOS-Event als resolved/aufgeloest.",
        parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Event aufgeloest" },
          "404": { description: "Event nicht gefunden" },
        },
      },
    },

    // === Alleinarbeit ===
    "/api/alleinarbeit/sessions": {
      get: {
        tags: ["Alleinarbeit"],
        summary: "Alleinarbeit-Sessions auflisten",
        description: "Listet alle aktiven und vergangenen Alleinarbeit-Sessions auf.",
        responses: { "200": { description: "Liste der Sessions" } },
      },
      post: {
        tags: ["Alleinarbeit"],
        summary: "Alleinarbeit-Session starten",
        description: "Startet eine neue Alleinarbeit-Session mit Check-In-Intervall.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  intervallMinuten: { type: "integer", description: "Check-In Intervall in Minuten" },
                  standort: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Session gestartet" },
          "401": { description: "Nicht autorisiert" },
        },
      },
    },
    "/api/checkin/status": {
      get: {
        tags: ["Alleinarbeit"],
        summary: "Check-In Status abfragen",
        description: "Gibt den aktuellen Check-In-Status des eingeloggten Mitarbeiters zurueck.",
        responses: { "200": { description: "Check-In Status" } },
      },
    },
    "/api/checkin/missed": {
      get: {
        tags: ["Alleinarbeit"],
        summary: "Verpasste Check-Ins auflisten",
        description: "Listet alle verpassten Check-Ins auf (fuer Admin-Dashboard).",
        responses: { "200": { description: "Liste verpasster Check-Ins" } },
      },
    },
    "/api/checkin/deadman-trigger": {
      post: {
        tags: ["Alleinarbeit"],
        summary: "Dead-Man-Switch manuell ausloesen",
        description: "Loest den Dead-Man-Switch manuell aus (Testmodus oder Notfall).",
        responses: {
          "200": { description: "Trigger ausgefuehrt" },
          "403": { description: "Keine Berechtigung" },
        },
      },
    },

    // === Buchhaltung ===
    "/api/buchhaltung/rechnungen": {
      get: {
        tags: ["Buchhaltung"],
        summary: "Buchhaltungs-Rechnungsuebersicht",
        description: "Gibt Rechnungen in der Buchhaltungs-Ansicht zurueck (mit Zahlungsstatus, DATEV-Referenz).",
        parameters: [
          { name: "monat", in: "query", schema: { type: "string" }, required: false, description: "Format: YYYY-MM" },
        ],
        responses: { "200": { description: "Rechnungen fuer Buchhaltung" } },
      },
    },
    "/api/buchhaltung/stundeneintraege": {
      get: {
        tags: ["Buchhaltung"],
        summary: "Stundeneintraege fuer Buchhaltung",
        description: "Gibt Stundeneintraege aggregiert fuer die Lohnbuchhaltung zurueck.",
        parameters: [
          { name: "monat", in: "query", schema: { type: "string" }, required: false, description: "Format: YYYY-MM" },
        ],
        responses: { "200": { description: "Stundeneintraege fuer Buchhaltung" } },
      },
    },
    "/api/export/datev-rechnungen": {
      get: {
        tags: ["Buchhaltung"],
        summary: "DATEV-Export Rechnungen",
        description: "Exportiert Rechnungsdaten im DATEV-kompatiblen CSV-Format fuer den Steuerberater.",
        parameters: [
          { name: "von", in: "query", schema: { type: "string", format: "date" }, required: false },
          { name: "bis", in: "query", schema: { type: "string", format: "date" }, required: false },
        ],
        responses: {
          "200": {
            description: "DATEV-CSV",
            content: { "text/csv": { schema: { type: "string" } } },
          },
        },
      },
    },
    "/api/export/datev-lohn": {
      get: {
        tags: ["Buchhaltung"],
        summary: "DATEV-Export Lohn",
        description: "Exportiert Lohndaten im DATEV-kompatiblen Format.",
        parameters: [
          { name: "monat", in: "query", schema: { type: "string" }, required: false, description: "Format: YYYY-MM" },
        ],
        responses: {
          "200": {
            description: "DATEV-CSV Lohn",
            content: { "text/csv": { schema: { type: "string" } } },
          },
        },
      },
    },

    // === App (Mobile) ===
    "/api/app/auth": {
      post: {
        tags: ["App"],
        summary: "Mobile App Login",
        description: "Authentifiziert einen Mitarbeiter ueber die mobile App und gibt ein JWT zurueck.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "JWT Token" },
          "401": { description: "Ungueltige Anmeldedaten" },
        },
      },
    },
    "/api/app/auftraege": {
      get: {
        tags: ["App"],
        summary: "Auftraege fuer Mobile App",
        description: "Gibt Auftraege zurueck, optimiert fuer die mobile App.",
        responses: { "200": { description: "Auftrags-Liste" } },
      },
    },
    "/api/app/protokolle": {
      get: {
        tags: ["App"],
        summary: "Protokolle fuer Mobile App",
        responses: { "200": { description: "Protokoll-Liste" } },
      },
      post: {
        tags: ["App"],
        summary: "Protokoll ueber Mobile App erstellen",
        responses: { "201": { description: "Protokoll erstellt" } },
      },
    },
    "/api/app/stunden": {
      get: {
        tags: ["App"],
        summary: "Stundeneintraege fuer Mobile App",
        responses: { "200": { description: "Stunden-Liste" } },
      },
      post: {
        tags: ["App"],
        summary: "Stundeneintrag ueber Mobile App",
        responses: { "201": { description: "Eintrag erstellt" } },
      },
    },
  },
} as const;
