/**
 * DOK-009/010/011: OCR-Adapter mit austauschbarem Provider.
 *
 * - AzureDocumentAiAdapter: Azure Document Intelligence (prebuilt-invoice,
 *   Region West Europe — EU-Datenresidenz). Aktiv sobald
 *   AZURE_DOCUMENT_INTELLIGENCE_KEY + _ENDPOINT gesetzt sind.
 * - MockOcrAdapter: deterministische Fixture-Antworten für Tests/Dev
 *   (NEVER #22: keine Live-OCR-Aufrufe ohne Cache/Freigabe).
 *
 * Alle Provider-Antworten laufen durch Zod (NEVER #23) — kaputtes
 * Provider-JSON führt zu LOW-Konfidenz-Feldern, nie zu einem Throw
 * in der Pipeline.
 */
import { z } from "zod"
import type { DokTyp } from "@prisma/client"

// ---------- Kanonisches Extrakt (Zod, DOK-011) ----------

export const OcrFeldSchema = z.object({
  wert: z.string(),
  konfidenz: z.number().min(0).max(1),
})

export const OcrPositionSchema = z.object({
  artikelBezeichnung: z.string(),
  lieferantArtikelNr: z.string().nullable().default(null),
  menge: z.number().default(0),
  einheit: z.string().default("Stück"),
  einzelpreis: z.number().default(0),
  gesamtpreis: z.number().default(0),
  mwstSatz: z.number().default(0),
  konfidenz: z.number().min(0).max(1).default(0),
})

export const OcrExtraktionSchema = z.object({
  typ: z.enum(["XRECHNUNG", "ZUGFERD", "PDF_RECHNUNG", "LIEFERSCHEIN", "GUTSCHRIFT"]),
  felder: z.record(z.string(), OcrFeldSchema),
  positionen: z.array(OcrPositionSchema),
  /** Provider-Kosten in EUR (geschätzt), für DOK-059 Kosten-Tracking */
  kostenEur: z.number().default(0),
  provider: z.string(),
})

export type OcrExtraktion = z.infer<typeof OcrExtraktionSchema>
export type OcrPosition = z.infer<typeof OcrPositionSchema>

export interface OcrAdapter {
  readonly name: string
  extractFromDocument(buffer: Buffer, mimeType: string, typHinweis?: DokTyp): Promise<OcrExtraktion>
}

// ---------- Azure Document Intelligence ----------

/** Azure-Antwort: nur die Teile die wir lesen, defensiv via Zod */
const AzureFieldSchema = z.object({
  content: z.string().optional(),
  valueString: z.string().optional(),
  valueNumber: z.number().optional(),
  valueCurrency: z.object({ amount: z.number().optional() }).optional(),
  confidence: z.number().optional(),
})

const AzureItemValueSchema = z.object({
  valueObject: z.record(z.string(), AzureFieldSchema.optional()).optional(),
})

const AzureAnalyzeResultSchema = z.object({
  status: z.string(),
  analyzeResult: z
    .object({
      documents: z
        .array(
          z.object({
            fields: z.record(z.string(), z.unknown()).optional(),
          })
        )
        .optional(),
      pages: z.array(z.unknown()).optional(),
    })
    .optional(),
})

function azureFeld(raw: unknown): { wert: string; konfidenz: number } | null {
  const parsed = AzureFieldSchema.safeParse(raw)
  if (!parsed.success) return null
  const f = parsed.data
  const wert =
    f.valueString ?? (f.valueNumber !== undefined ? String(f.valueNumber) : undefined) ??
    (f.valueCurrency?.amount !== undefined ? String(f.valueCurrency.amount) : undefined) ??
    f.content
  if (wert === undefined) return null
  return { wert, konfidenz: f.confidence ?? 0.5 }
}

export class AzureDocumentAiAdapter implements OcrAdapter {
  readonly name = "azure-document-intelligence"

  constructor(
    private endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT ?? "",
    private key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY ?? ""
  ) {}

  async extractFromDocument(buffer: Buffer, mimeType: string, typHinweis?: DokTyp): Promise<OcrExtraktion> {
    const url = `${this.endpoint.replace(/\/$/, "")}/documentintelligence/documentModels/prebuilt-invoice:analyze?api-version=2024-11-30`
    const start = await fetch(url, {
      method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": this.key, "Content-Type": mimeType },
      body: new Uint8Array(buffer),
    })
    if (!start.ok) throw new Error(`Azure DI Start fehlgeschlagen: ${start.status}`)
    const operationLocation = start.headers.get("operation-location")
    if (!operationLocation) throw new Error("Azure DI: keine operation-location")

    // Polling (max 60s, Retry-freundlich)
    let result: z.infer<typeof AzureAnalyzeResultSchema> | null = null
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000))
      const poll = await fetch(operationLocation, {
        headers: { "Ocp-Apim-Subscription-Key": this.key },
      })
      if (!poll.ok) continue
      const json: unknown = await poll.json()
      const parsed = AzureAnalyzeResultSchema.safeParse(json)
      if (!parsed.success) continue
      if (parsed.data.status === "succeeded") {
        result = parsed.data
        break
      }
      if (parsed.data.status === "failed") throw new Error("Azure DI: Analyse fehlgeschlagen")
    }
    if (!result) throw new Error("Azure DI: Timeout beim Polling")

    const fields = result.analyzeResult?.documents?.[0]?.fields ?? {}
    const felder: Record<string, { wert: string; konfidenz: number }> = {}
    const mapping: Record<string, string> = {
      InvoiceId: "rechnungsNr",
      InvoiceDate: "datum",
      DueDate: "faelligDatum",
      VendorName: "lieferantName",
      VendorTaxId: "lieferantUstId",
      InvoiceTotal: "gesamtBetrag",
      SubTotal: "nettoBetrag",
      TotalTax: "mwstBetrag",
      CurrencyCode: "waehrung",
    }
    for (const [azureKey, zielKey] of Object.entries(mapping)) {
      const feld = azureFeld(fields[azureKey])
      if (feld) felder[zielKey] = feld
    }

    const positionen: OcrPosition[] = []
    const itemsRaw = fields["Items"]
    const items = z.object({ valueArray: z.array(z.unknown()).optional() }).safeParse(itemsRaw)
    for (const itemRaw of items.success ? items.data.valueArray ?? [] : []) {
      const item = AzureItemValueSchema.safeParse(itemRaw)
      if (!item.success) continue
      const obj = item.data.valueObject ?? {}
      const desc = azureFeld(obj["Description"])
      const qty = azureFeld(obj["Quantity"])
      const unitPrice = azureFeld(obj["UnitPrice"])
      const amount = azureFeld(obj["Amount"])
      const pos = OcrPositionSchema.safeParse({
        artikelBezeichnung: desc?.wert ?? "",
        lieferantArtikelNr: azureFeld(obj["ProductCode"])?.wert ?? null,
        menge: qty ? Number(qty.wert) || 0 : 0,
        einheit: azureFeld(obj["Unit"])?.wert ?? "Stück",
        einzelpreis: unitPrice ? Number(unitPrice.wert) || 0 : 0,
        gesamtpreis: amount ? Number(amount.wert) || 0 : 0,
        mwstSatz: 0,
        konfidenz: Math.min(desc?.konfidenz ?? 0.5, qty?.konfidenz ?? 0.5),
      })
      if (pos.success) positionen.push(pos.data)
    }

    const seiten = result.analyzeResult?.pages?.length ?? 1
    return OcrExtraktionSchema.parse({
      typ: typHinweis ?? "PDF_RECHNUNG",
      felder,
      positionen,
      kostenEur: seiten * 0.01, // ~1 ct/Seite prebuilt-invoice
      provider: this.name,
    })
  }
}

// ---------- Mock-Adapter (Fixtures) ----------

export class MockOcrAdapter implements OcrAdapter {
  readonly name = "mock-ocr"

  async extractFromDocument(_buffer: Buffer, _mimeType: string, typHinweis?: DokTyp): Promise<OcrExtraktion> {
    const fs = await import("fs/promises")
    const path = await import("path")
    const fixture =
      typHinweis === "LIEFERSCHEIN" ? "mock-ocr-lieferschein.json" : "mock-ocr-rechnung.json"
    const file = path.join(process.cwd(), "tests", "fixtures", "a3", fixture)
    const raw: unknown = JSON.parse(await fs.readFile(file, "utf8"))
    return OcrExtraktionSchema.parse(raw)
  }
}

// ---------- Auswahl ----------

export function getOcrAdapter(): OcrAdapter {
  if (
    process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY &&
    process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT
  ) {
    return new AzureDocumentAiAdapter()
  }
  return new MockOcrAdapter()
}
