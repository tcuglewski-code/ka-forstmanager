/**
 * ForstManager OpenAPI 3.0 Specification
 * Manual spec covering the ~20 most important API routes.
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
    { name: "Rechnungen", description: "Rechnungsverwaltung" },
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
        responses: { "200": { description: "Liste der Rechnungen" } },
      },
      post: {
        tags: ["Rechnungen"],
        summary: "Neue Rechnung erstellen",
        responses: { "201": { description: "Rechnung erstellt" } },
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
