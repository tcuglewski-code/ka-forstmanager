import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

// Nextcloud WebDAV-Konfiguration
const NC_URL = process.env.NEXTCLOUD_URL ?? ""
const NC_USER = process.env.NEXTCLOUD_USER ?? ""
const NC_PASS = process.env.NEXTCLOUD_APP_PASSWORD ?? process.env.NEXTCLOUD_PASS ?? ""
const NEXTCLOUD_BASE = `${NC_URL}/remote.php/dav/files/${NC_USER}`

if (!NC_URL || !NC_USER || !NC_PASS) {
  console.error("NEXTCLOUD_URL, NEXTCLOUD_USER, or NEXTCLOUD_APP_PASSWORD not set")
}

function getAuthHeader(): string {
  return `Basic ${Buffer.from(`${NC_USER}:${NC_PASS}`).toString("base64")}`
}

// Ordner erstellen (ignoriert Fehler wenn Ordner existiert)
async function ensureFolder(path: string): Promise<void> {
  const parts = path.split("/").filter(Boolean)
  let currentPath = ""
  
  for (const part of parts) {
    currentPath += `/${part}`
    try {
      await fetch(`${NEXTCLOUD_BASE}${currentPath}`, {
        method: "MKCOL",
        headers: { Authorization: getAuthHeader() },
      })
    } catch {
      // Ordner existiert bereits - ignorieren
    }
  }
}

export async function POST(req: NextRequest) {
  // Auth prüfen
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const folder = formData.get("folder") as string || "/Koch-Aufforstung/Uploads"
    const customFilename = formData.get("filename") as string | null

    if (!file) {
      return NextResponse.json({ error: "Keine Datei angegeben" }, { status: 400 })
    }

    // Dateiname bereinigen
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const filename = customFilename || `${timestamp}_${originalName}`

    // Ordner sicherstellen
    await ensureFolder(folder)

    // Datei-Buffer erstellen
    const buffer = Buffer.from(await file.arrayBuffer())

    // Auf Nextcloud hochladen
    const ncPath = `${folder}/${filename}`
    const uploadRes = await fetch(`${NEXTCLOUD_BASE}${ncPath}`, {
      method: "PUT",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": file.type || "application/octet-stream",
      },
      body: buffer,
    })

    if (!uploadRes.ok) {
      const text = await uploadRes.text().catch(() => "")
      console.error("[UPLOAD] Nextcloud Fehler:", uploadRes.status, text)
      return NextResponse.json(
        { error: "Upload zu Nextcloud fehlgeschlagen" },
        { status: 500 }
      )
    }

    // Erfolg - URL zurückgeben
    const shareUrl = `${NEXTCLOUD_BASE}${ncPath}`
    
    return NextResponse.json({
      success: true,
      filename,
      path: ncPath,
      url: shareUrl,
      nextcloudPath: ncPath,
    })

  } catch (error) {
    console.error("[UPLOAD] Fehler:", error)
    return NextResponse.json(
      { error: "Upload fehlgeschlagen" },
      { status: 500 }
    )
  }
}

// Config für Next.js - größere Dateien erlauben
export const config = {
  api: {
    bodyParser: false,
  },
}
