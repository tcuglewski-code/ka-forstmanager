/**
 * Tests für DOK-004 Typ-Erkennung.
 * Ausführen: npx tsx src/lib/dokumente/typ-erkennung.test.ts
 */
import { erkenneDokTyp, classifyPDF } from "./typ-erkennung"

let failed = 0
function expectEqual(name: string, actual: unknown, expected: unknown) {
  if (actual === expected) {
    console.log(`✅ ${name}`)
  } else {
    failed++
    console.error(`❌ ${name}: erwartet ${String(expected)}, erhalten ${String(actual)}`)
  }
}

// 1: XML-Inhalt → XRECHNUNG
expectEqual(
  "XML-Deklaration → XRECHNUNG",
  erkenneDokTyp(Buffer.from('<?xml version="1.0"?><Invoice/>'), "rechnung.bin"),
  "XRECHNUNG"
)

// 2: .xml-Endung ohne Deklaration → XRECHNUNG
expectEqual(
  ".xml-Endung → XRECHNUNG",
  erkenneDokTyp(Buffer.from("<Invoice></Invoice>"), "rechnung.XML"),
  "XRECHNUNG"
)

// 3: XML mit PDF-Header → ZUGFERD
expectEqual(
  "XML + PDF-Header → ZUGFERD",
  erkenneDokTyp(Buffer.from("%PDF-1.7 <?xml version=\"1.0\"?>"), "doc.pdf"),
  "ZUGFERD"
)

// 4: PDF mit factur-x.xml-Anhang → ZUGFERD
expectEqual(
  "PDF mit factur-x.xml → ZUGFERD",
  erkenneDokTyp(
    Buffer.from("%PDF-1.7\n/EmbeddedFile /F (factur-x.xml)\n%%EOF"),
    "invoice.pdf"
  ),
  "ZUGFERD"
)

// 5: PDF mit OCR-Text 'Lieferschein' → LIEFERSCHEIN
expectEqual(
  "PDF + 'Lieferschein' → LIEFERSCHEIN",
  erkenneDokTyp(Buffer.from("%PDF-1.4 plain"), "ls.pdf", "Lieferschein Nr. 4711"),
  "LIEFERSCHEIN"
)

// 6: PDF mit OCR-Text 'Gutschrift' → GUTSCHRIFT (hat Vorrang vor 'Rechnung')
expectEqual(
  "PDF + 'Gutschrift' → GUTSCHRIFT",
  erkenneDokTyp(Buffer.from("%PDF-1.4 plain"), "gs.pdf", "Gutschrift zur Rechnung 123"),
  "GUTSCHRIFT"
)

// 7: PDF ohne Textauszug → PDF_RECHNUNG (Default)
expectEqual(
  "PDF ohne OCR → PDF_RECHNUNG",
  erkenneDokTyp(Buffer.from("%PDF-1.4 plain"), "scan.pdf"),
  "PDF_RECHNUNG"
)

// 8: Bild ohne Textauszug → UNBEKANNT
expectEqual(
  "JPG ohne OCR → UNBEKANNT",
  erkenneDokTyp(Buffer.from([0xff, 0xd8, 0xff, 0xe0]), "foto.jpg"),
  "UNBEKANNT"
)

// Bonus: classifyPDF nur erste 200 Zeichen
expectEqual(
  "classifyPDF ignoriert Text nach 200 Zeichen",
  classifyPDF("x".repeat(250) + " Rechnung"),
  "UNBEKANNT"
)

if (failed > 0) {
  console.error(`${failed} Test(s) fehlgeschlagen`)
  process.exit(1)
}
console.log("Alle Typ-Erkennungs-Tests bestanden")
