import { XMLParser } from "fast-xml-parser"

export interface NextcloudFile {
  name: string
  path: string
  type: "file" | "directory"
  size: number
  lastModified: string
  contentType: string
}

const NC_BASE_URL = "http://187.124.18.244:32774"
const NC_USER = "polskagenetic"
const NC_PASS = "Sz9S4-2XZpG-HjzXc-pPQy8-38THR"
const NC_DAV_BASE = `/remote.php/dav/files/${NC_USER}`

function authHeader(): string {
  const token = Buffer.from(`${NC_USER}:${NC_PASS}`).toString("base64")
  return `Basic ${token}`
}

const PROPFIND_BODY = `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:displayname/>
    <d:getcontentlength/>
    <d:getlastmodified/>
    <d:getcontenttype/>
    <d:resourcetype/>
  </d:prop>
</d:propfind>`

export async function listNextcloudFolder(path: string): Promise<NextcloudFile[]> {
  // Normalisiere den Pfad
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  const url = `${NC_BASE_URL}${NC_DAV_BASE}${cleanPath}`

  const res = await fetch(url, {
    method: "PROPFIND",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/xml",
      Depth: "1",
    },
    body: PROPFIND_BODY,
  })

  if (!res.ok) {
    throw new Error(`WebDAV PROPFIND fehlgeschlagen: ${res.status} ${res.statusText}`)
  }

  const xml = await res.text()

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: true,
  })

  const parsed = parser.parse(xml)

  // Navigiere durch die Multistatus-Response
  const multistatus = parsed?.multistatus
  if (!multistatus) return []

  let responses = multistatus?.response
  if (!responses) return []
  if (!Array.isArray(responses)) responses = [responses]

  const files: NextcloudFile[] = []

  for (const resp of responses) {
    const href: string = resp?.href ?? ""
    const propstat = resp?.propstat
    if (!propstat) continue

    const props = Array.isArray(propstat) ? propstat[0]?.prop : propstat?.prop
    if (!props) continue

    // Ermittle, ob es ein Verzeichnis ist
    const resourcetype = props?.resourcetype
    const isCollection =
      resourcetype != null &&
      (resourcetype?.collection !== undefined || resourcetype === "")

    // Dekodiere den href-Pfad
    const decodedHref = decodeURIComponent(href)

    // Extrahiere den relativen Pfad (entferne den DAV-Basis-Präfix)
    const relativePath = decodedHref.replace(NC_DAV_BASE, "").replace(/\/$/, "")

    // Überspringe den Root-Eintrag selbst
    if (
      relativePath === cleanPath.replace(/\/$/, "") ||
      relativePath === cleanPath
    ) {
      continue
    }

    // Dateiname aus Pfad extrahieren
    const name = relativePath.split("/").filter(Boolean).pop() ?? ""
    if (!name) continue

    const size = Number(props?.getcontentlength ?? 0)
    const lastModified = props?.getlastmodified ?? ""
    const contentType: string =
      isCollection
        ? "httpd/unix-directory"
        : (props?.getcontenttype ?? "application/octet-stream")

    files.push({
      name,
      path: relativePath,
      type: isCollection ? "directory" : "file",
      size,
      lastModified,
      contentType,
    })
  }

  return files
}

export function getNextcloudFileUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  return `${NC_BASE_URL}${NC_DAV_BASE}${cleanPath}`
}

export function getNextcloudAuthHeader(): string {
  return authHeader()
}

export function isImage(filename: string): boolean {
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(filename)
}

export function isVideo(filename: string): boolean {
  return /\.(mp4|mov|avi|mkv|webm)$/i.test(filename)
}

export function isMedia(filename: string): boolean {
  return isImage(filename) || isVideo(filename)
}
