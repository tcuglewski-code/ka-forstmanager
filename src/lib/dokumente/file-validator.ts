/**
 * DOK-022-025: Datei-Validierung für Dokumenten-Uploads.
 *
 * Verteidigung in der Tiefe (zusätzlich zu MIME/Extension-Check der Route):
 *  - Magic-Bytes müssen zur Extension passen (kein .pdf das eine EXE ist)
 *  - Größenlimits (10 MB, leer verboten)
 *  - Dateinamen-Hygiene (Pfad-Traversal, Steuerzeichen, Doppel-Extension)
 *  - PDF: aktive Inhalte (JavaScript, Launch-Actions, eingebettete Dateien) → Ablehnung
 *  - XML: DOCTYPE/ENTITY verboten (XXE — auch im Parser geprüft, hier früh)
 *
 * Kein ClamAV verfügbar (Service-Inventar) — diese Checks sind der Ersatz
 * für die häufigsten Angriffsvektoren; Befund wird im Audit dokumentiert.
 */

export type DateiTyp = "pdf" | "xml" | "jpeg" | "png"

export interface ValidierungOk {
  ok: true
  typ: DateiTyp
}
export interface ValidierungFehler {
  ok: false
  grund: string
}
export type ValidierungsErgebnis = ValidierungOk | ValidierungFehler

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

const ERLAUBTE_EXTENSIONS: Record<string, DateiTyp> = {
  ".pdf": "pdf",
  ".xml": "xml",
  ".jpg": "jpeg",
  ".jpeg": "jpeg",
  ".png": "png",
}

function erkenneMagicBytes(buf: Buffer): DateiTyp | null {
  if (buf.length < 8) return null
  if (buf.subarray(0, 5).toString("latin1") === "%PDF-") return "pdf"
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png"
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg"
  // XML: optional UTF-8 BOM + Whitespace, dann "<"
  let start = 0
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) start = 3
  const head = buf.subarray(start, start + 100).toString("utf8").trimStart()
  if (head.startsWith("<?xml") || head.startsWith("<")) return "xml"
  return null
}

export function validiereDateiName(name: string): ValidierungFehler | null {
  if (!name || name.length > 255) return { ok: false, grund: "Ungültiger Dateiname" }
  if (name.includes("/") || name.includes("\\") || name.includes("..")) {
    return { ok: false, grund: "Pfadangaben im Dateinamen nicht erlaubt" }
  }
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f]/.test(name)) return { ok: false, grund: "Steuerzeichen im Dateinamen" }
  // Doppel-Extension wie rechnung.pdf.exe
  const teile = name.toLowerCase().split(".")
  if (teile.length > 2) {
    const verdaechtig = ["exe", "bat", "cmd", "sh", "js", "vbs", "scr", "com", "ps1", "php", "html", "svg"]
    if (teile.slice(1, -1).some((t) => verdaechtig.includes(t)) || verdaechtig.includes(teile[teile.length - 1])) {
      return { ok: false, grund: "Verdächtige Doppel-Extension" }
    }
  }
  return null
}

function pruefePdfAktiveInhalte(buf: Buffer): string | null {
  // Suche nur in latin1-Repräsentation (PDF-Syntax ist ASCII-basiert)
  const text = buf.toString("latin1")
  if (/\/JavaScript\b|\/JS\b/.test(text)) return "PDF enthält JavaScript"
  if (/\/Launch\b/.test(text)) return "PDF enthält Launch-Action"
  if (/\/EmbeddedFiles\b|\/Filespec\b/.test(text)) return "PDF enthält eingebettete Dateien"
  if (/\/AA\b|\/OpenAction\b/.test(text)) return "PDF enthält automatische Aktionen"
  return null
}

export function validiereDatei(buffer: Buffer, dateiName: string): ValidierungsErgebnis {
  const nameFehler = validiereDateiName(dateiName)
  if (nameFehler) return nameFehler

  if (buffer.length === 0) return { ok: false, grund: "Datei ist leer" }
  if (buffer.length > MAX_FILE_SIZE) return { ok: false, grund: "Datei größer als 10 MB" }

  const ext = (dateiName.match(/\.[a-zA-Z0-9]+$/)?.[0] || "").toLowerCase()
  const erwarteterTyp = ERLAUBTE_EXTENSIONS[ext]
  if (!erwarteterTyp) return { ok: false, grund: "Nur PDF, XML, JPG oder PNG erlaubt" }

  const echterTyp = erkenneMagicBytes(buffer)
  if (!echterTyp) return { ok: false, grund: "Dateiinhalt nicht erkennbar (Magic-Bytes)" }
  if (echterTyp !== erwarteterTyp) {
    return { ok: false, grund: `Dateiinhalt (${echterTyp}) passt nicht zur Endung ${ext}` }
  }

  if (echterTyp === "pdf") {
    const befund = pruefePdfAktiveInhalte(buffer)
    if (befund) return { ok: false, grund: befund }
  }

  if (echterTyp === "xml") {
    const head = buffer.toString("utf8", 0, Math.min(buffer.length, 4096))
    if (/<!DOCTYPE|<!ENTITY/i.test(head)) {
      return { ok: false, grund: "XML mit DOCTYPE/ENTITY nicht erlaubt (XXE-Schutz)" }
    }
  }

  return { ok: true, typ: echterTyp }
}
