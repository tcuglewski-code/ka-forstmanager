import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

// Nextcloud WebDAV-Konfiguration
const NEXTCLOUD_BASE = "http://187.124.18.244:32774/remote.php/dav/files/polskagenetic"
const NEXTCLOUD_USER = "polskagenetic"
const NEXTCLOUD_APP_PASSWORD = "Sz9S4-2XZpG-HjzXc-pPQy8-38THR"

function getAuthHeader(): string {
  return `Basic ${Buffer.from(`${NEXTCLOUD_USER}:${NEXTCLOUD_APP_PASSWORD}`).toString("base64")}`
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
    const shareUrl = `http://187.124.18.244:32774/remote.php/dav/files/polskagenetic${ncPath}`
    
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
