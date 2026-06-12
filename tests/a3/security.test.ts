/**
 * DOK-037/038: A3 Security-Tests — Angriffsvektoren gegen Upload & Parser.
 * Lauf: npx tsx tests/a3/security.test.ts
 */
import { readFileSync } from "fs"
import { join } from "path"
import { validiereDatei, validiereDateiName } from "../../src/lib/dokumente/file-validator"
import { parseXRechnung, XRechnungParseError } from "../../src/lib/dokumente/parser/xrechnung"

let fehler = 0
function assert(bedingung: boolean, name: string) {
  if (bedingung) console.log(`  ✅ ${name}`)
  else {
    console.error(`  ❌ ${name}`)
    fehler++
  }
}

console.log("== File-Validator: Magic-Bytes-Spoofing ==")
{
  // Windows-EXE (MZ-Header) als .pdf getarnt
  const exe = Buffer.concat([Buffer.from("MZ"), Buffer.alloc(64)])
  const r1 = validiereDatei(exe, "rechnung.pdf")
  assert(!r1.ok, "EXE als .pdf abgelehnt")
  // PDF-Inhalt als .png getarnt
  const r2 = validiereDatei(Buffer.from("%PDF-1.4 foo %%EOF"), "bild.png")
  assert(!r2.ok, "PDF als .png abgelehnt (Typ-Mismatch)")
  // HTML als .xml — wird als XML erkannt, aber Parser lehnt später ab; DOCTYPE blockt sofort
  const html = Buffer.from("<!DOCTYPE html><html><script>alert(1)</script></html>")
  const r3 = validiereDatei(html, "doc.xml")
  assert(!r3.ok, "HTML mit DOCTYPE als .xml abgelehnt")
}

console.log("== File-Validator: gefährliche PDFs ==")
{
  const jsPdf = Buffer.from("%PDF-1.4\n1 0 obj << /OpenAction << /S /JavaScript /JS (app.alert(1)) >> >>\n%%EOF")
  assert(!validiereDatei(jsPdf, "x.pdf").ok, "PDF mit JavaScript abgelehnt")
  const launchPdf = Buffer.from("%PDF-1.4\n1 0 obj << /Type /Action /S /Launch >>\n%%EOF")
  assert(!validiereDatei(launchPdf, "x.pdf").ok, "PDF mit Launch-Action abgelehnt")
  const embedPdf = Buffer.from("%PDF-1.4\n1 0 obj << /Names << /EmbeddedFiles 2 0 R >> >>\n%%EOF")
  assert(!validiereDatei(embedPdf, "x.pdf").ok, "PDF mit EmbeddedFiles abgelehnt")
}

console.log("== File-Validator: Dateinamen ==")
{
  assert(validiereDateiName("../../../etc/passwd") !== null, "Pfad-Traversal abgelehnt")
  assert(validiereDateiName("rechnung.pdf.exe") !== null, "Doppel-Extension .pdf.exe abgelehnt")
  assert(validiereDateiName("evil\u0000.pdf") !== null, "Null-Byte abgelehnt")
  assert(validiereDateiName("a".repeat(300) + ".pdf") !== null, "überlanger Name abgelehnt")
  assert(validiereDateiName("Rechnung 2026-05 Müller.pdf") === null, "normaler Name ok")
}

console.log("== File-Validator: Größen ==")
{
  assert(!validiereDatei(Buffer.alloc(0), "x.pdf").ok, "leere Datei abgelehnt")
  const gross = Buffer.concat([Buffer.from("%PDF-"), Buffer.alloc(11 * 1024 * 1024)])
  assert(!validiereDatei(gross, "x.pdf").ok, ">10 MB abgelehnt")
}

console.log("== XRechnung-Parser: XXE / Entity-Angriffe ==")
{
  const xxe = Buffer.from(
    `<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><Invoice><ID>&xxe;</ID></Invoice>`
  )
  let abgelehnt = false
  try {
    parseXRechnung(xxe)
  } catch (e) {
    abgelehnt = e instanceof XRechnungParseError
  }
  assert(abgelehnt, "XXE-Payload wird mit XRechnungParseError abgelehnt")

  const billion = Buffer.from(
    `<?xml version="1.0"?><!DOCTYPE lolz [<!ENTITY lol "lol"><!ENTITY lol2 "&lol;&lol;&lol;">]><Invoice>&lol2;</Invoice>`
  )
  let abgelehnt2 = false
  try {
    parseXRechnung(billion)
  } catch {
    abgelehnt2 = true
  }
  assert(abgelehnt2, "Billion-Laughs abgelehnt")
}

console.log("== Prompt-Injection-Oberfläche (statisch) ==")
{
  // Die LLM-Matcher-Systemprompt muss Untrusted-Framing enthalten (NEVER #23-Umfeld)
  const src = readFileSync(join(__dirname, "..", "..", "src", "lib", "dokumente", "matching", "artikel-matcher.ts"), "utf8")
  assert(src.includes("NICHT vertrauenswürdig"), "LLM-Prompt markiert Input als untrusted")
  assert(src.includes("safeParse"), "LLM-Output wird Zod-validiert")
  assert(src.includes("artikel.find((a) => a.id === parsed.data.artikelId)"), "Halluzinations-Schutz: ID muss existieren")
}

if (fehler > 0) {
  console.error(`\n${fehler} Security-Test(s) fehlgeschlagen`)
  process.exit(1)
}
console.log("\nAlle A3 Security-Tests bestanden")
