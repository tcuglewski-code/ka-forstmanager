// Sprint AL: Nextcloud WebDAV Hilfsfunktionen
// WebDAV-Client für Dateioperationen in der Nextcloud-Instanz

const NEXTCLOUD_URL = process.env.NEXTCLOUD_URL ?? "http://187.124.18.244:32774"
const NEXTCLOUD_USER = process.env.NEXTCLOUD_USER ?? "polskagenetic"
const NEXTCLOUD_PASS = process.env.NEXTCLOUD_PASS ?? "Sz9S4-2XZpG-HjzXc-pPQy8-38THR"

// WebDAV-Basis-URL
const WEBDAV_BASE = `${NEXTCLOUD_URL}/remote.php/dav/files/${NEXTCLOUD_USER}`

// Basic-Auth Header
function authHeader(): string {
  return "Basic " + Buffer.from(`${NEXTCLOUD_USER}:${NEXTCLOUD_PASS}`).toString("base64")
}

// Pfad normalisieren
function normalizePath(pfad: string): string {
  return pfad.startsWith("/") ? pfad : `/${pfad}`
}

// ── Ordner erstellen (MKCOL) ─────────────────────────────────────────────────

export async function ordnerErstellen(pfad: string): Promise<boolean> {
  const url = `${WEBDAV_BASE}${normalizePath(pfad)}`
  try {
    const res = await fetch(url, {
      method: "MKCOL",
      headers: { Authorization: authHeader() },
    })
    // 201 = erstellt, 405 = bereits vorhanden (beides OK)
    return res.status === 201 || res.status === 405
  } catch (err) {
    console.error("[Nextcloud] Fehler beim Erstellen des Ordners:", err)
    return false
  }
}

// ── Datei hochladen (PUT) ────────────────────────────────────────────────────

export interface UploadErgebnis {
  erfolg: boolean
  pfad: string
  url: string
  fehler?: string
}

export async function dateiHochladen(
  inhalt: ArrayBuffer | Uint8Array,
  zielpfad: string,
  mimeType: string = "application/octet-stream"
): Promise<UploadErgebnis> {
  const normPfad = normalizePath(zielpfad)
  const url = `${WEBDAV_BASE}${normPfad}`

  try {
    // Übergeordneten Ordner erstellen (falls nicht vorhanden)
    const ordnerPfad = normPfad.substring(0, normPfad.lastIndexOf("/"))
    if (ordnerPfad) {
      await ordnerErstellen(ordnerPfad)
    }

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: authHeader(),
        "Content-Type": mimeType,
      },
      body: inhalt as BodyInit,
    })

    if (res.status === 201 || res.status === 204) {
      return {
        erfolg: true,
        pfad: normPfad,
        url: `${NEXTCLOUD_URL}/f/${normPfad}`, // Öffentliche Share-URL (vereinfacht)
      }
    }

    return {
      erfolg: false,
      pfad: normPfad,
      url: "",
      fehler: `HTTP ${res.status}: ${await res.text()}`,
    }
  } catch (err) {
    return {
      erfolg: false,
      pfad: normPfad,
      url: "",
      fehler: String(err),
    }
  }
}

// ── Dateien auflisten (PROPFIND) ─────────────────────────────────────────────

export interface DateiInfo {
  name: string
  pfad: string
  groesse: number
  geaendertAm: string
  contentType: string
  istOrdner: boolean
}

export async function dateiListeAbrufen(pfad: string): Promise<DateiInfo[]> {
  const normPfad = normalizePath(pfad)
  const url = `${WEBDAV_BASE}${normPfad}`

  const propfindBody = `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:displayname/>
    <d:getcontentlength/>
    <d:getlastmodified/>
    <d:getcontenttype/>
    <d:resourcetype/>
  </d:prop>
</d:propfind>`

  try {
    const res = await fetch(url, {
      method: "PROPFIND",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/xml",
        Depth: "1",
      },
      body: propfindBody,
    })

    if (!res.ok && res.status !== 207) {
      return []
    }

    const xmlText = await res.text()
    return xmlZuDateiInfos(xmlText, normPfad)
  } catch (err) {
    console.error("[Nextcloud] Fehler beim Auflisten:", err)
    return []
  }
}

// Einfacher XML-Parser für PROPFIND-Antworten
function xmlZuDateiInfos(xml: string, basePfad: string): DateiInfo[] {
  const dateien: DateiInfo[] = []

  // Einfache Regex-basierte Extraktion (kein XML-Parser nötig)
  const responsesRegex = /<d:response>([\s\S]*?)<\/d:response>/gi
  let match

  while ((match = responsesRegex.exec(xml)) !== null) {
    const block = match[1]

    const hrefMatch = block.match(/<d:href>(.*?)<\/d:href>/i)
    if (!hrefMatch) continue

    const href = decodeURIComponent(hrefMatch[1])
    const dateiPfad = href.replace(`/remote.php/dav/files/${NEXTCLOUD_USER}`, "")

    // Basisordner überspringen
    if (dateiPfad === basePfad || dateiPfad === basePfad + "/") continue

    const istOrdner = /<d:resourcetype>[\s\S]*?<d:collection\/>[\s\S]*?<\/d:resourcetype>/i.test(block)
    const groesseMatch = block.match(/<d:getcontentlength>(.*?)<\/d:getcontentlength>/i)
    const geaendertMatch = block.match(/<d:getlastmodified>(.*?)<\/d:getlastmodified>/i)
    const contentTypeMatch = block.match(/<d:getcontenttype>(.*?)<\/d:getcontenttype>/i)
    const nameMatch = block.match(/<d:displayname>(.*?)<\/d:displayname>/i)

    dateien.push({
      name: nameMatch?.[1] ?? dateiPfad.split("/").pop() ?? "Unbekannt",
      pfad: dateiPfad,
      groesse: parseInt(groesseMatch?.[1] ?? "0"),
      geaendertAm: geaendertMatch?.[1] ?? "",
      contentType: contentTypeMatch?.[1] ?? "application/octet-stream",
      istOrdner,
    })
  }

  return dateien
}

// ── Datei löschen (DELETE) ───────────────────────────────────────────────────

export async function dateiLoeschen(pfad: string): Promise<boolean> {
  const url = `${WEBDAV_BASE}${normalizePath(pfad)}`
  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: authHeader() },
    })
    return res.status === 204 || res.status === 200
  } catch {
    return false
  }
}

// ── Download-URL erstellen ───────────────────────────────────────────────────

export function downloadUrl(pfad: string): string {
  return `${WEBDAV_BASE}${normalizePath(pfad)}`
}

export function downloadHeaders(): { Authorization: string } {
  return { Authorization: authHeader() }
}

// ── Englische Alias-Exports (für Kompatibilität mit bestehenden Importen) ────

/**
 * NextcloudFile: Englische Schnittstelle für Dateieinträge
 * (kompatibel mit browse/route.ts und anderen Importen)
 */
export interface NextcloudFile {
  name: string
  path: string
  size: number
  lastModified: string
  type: "file" | "directory"
  contentType?: string
}

/**
 * Gibt die vollständige WebDAV-URL für einen Nextcloud-Pfad zurück
 */
export function getNextcloudFileUrl(pfad: string): string {
  return `${WEBDAV_BASE}${normalizePath(pfad)}`
}

/**
 * Gibt den Basic-Auth Header-Wert zurück
 */
export function getNextcloudAuthHeader(): string {
  return authHeader()
}

/**
 * Listet den Inhalt eines Nextcloud-Ordners auf (englischer Alias für dateiListeAbrufen)
 */
export async function listNextcloudFolder(pfad: string): Promise<NextcloudFile[]> {
  const eintraege = await dateiListeAbrufen(pfad)
  return eintraege.map((e) => ({
    name: e.name,
    path: e.pfad,
    size: e.groesse,
    lastModified: e.geaendertAm,
    type: e.istOrdner ? "directory" : "file",
    contentType: e.contentType,
  }))
}

/**
 * Prüft ob ein Dateiname ein Bild ist
 */
export function isImage(dateiname: string): boolean {
  return /\.(jpe?g|png|gif|webp|svg|bmp|tiff?)$/i.test(dateiname)
}

/**
 * Prüft ob ein Dateiname ein Video ist
 */
export function isVideo(dateiname: string): boolean {
  return /\.(mp4|mov|avi|mkv|webm|ogv|m4v)$/i.test(dateiname)
}

/**
 * Lädt eine Datei in Nextcloud hoch (englischer Alias für dateiHochladen)
 */
export async function uploadToNextcloud(
  filePath: string,
  content: Buffer,
  mimeType: string = "application/octet-stream"
): Promise<string> {
  const ergebnis = await dateiHochladen(content, filePath, mimeType)
  if (!ergebnis.erfolg) {
    throw new Error(`Upload fehlgeschlagen: ${ergebnis.fehler}`)
  }
  return ergebnis.url
}

/**
 * Erstellt einen Ordner in Nextcloud (englischer Alias für ordnerErstellen)
 */
export async function createNextcloudFolder(folderPath: string): Promise<void> {
  await ordnerErstellen(folderPath)
}

/**
 * Löscht eine Datei in Nextcloud (englischer Alias für dateiLoeschen)
 */
export async function deleteFromNextcloud(filePath: string): Promise<void> {
  await dateiLoeschen(filePath)
}
