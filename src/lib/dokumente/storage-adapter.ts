/**
 * DOK-056: Storage-Adapter für Dokumenten-Uploads.
 *
 * Hintergrund: @vercel/blob bietet keine garantierte EU-Datenresidenz
 * (Region nicht frei wählbar). Für DSGVO-relevante Belege muss der
 * Storage-Backend austauschbar sein (S3-EU / Nextcloud), ohne dass
 * aufrufender Code geändert wird.
 *
 * Aktuelle Implementierung: Vercel Blob wenn BLOB_READ_WRITE_TOKEN gesetzt,
 * sonst lokales Dateisystem (Dev/Fallback). Späterer Wechsel: neue Klasse
 * implementiert DokumentStorage und wird in getStorage() gewählt.
 */
import { createHash } from "crypto"
import { mkdir, writeFile } from "fs/promises"
import path from "path"

export interface StoredFile {
  /** Abrufbare URL bzw. Pfad des gespeicherten Originals */
  url: string
  /** SHA-256 Hex-Hash des Dateiinhalts */
  hash: string
  /** Dateigröße in Bytes */
  size: number
}

export interface DokumentStorage {
  /** Speichert eine Datei und gibt URL + Hash zurück */
  put(filename: string, data: Buffer, contentType: string): Promise<StoredFile>
}

export function sha256(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex")
}

function safeFilename(filename: string): string {
  const base = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "_")
  return `${Date.now()}-${base}`
}

/** Vercel Blob — nur wenn BLOB_READ_WRITE_TOKEN vorhanden. */
class VercelBlobStorage implements DokumentStorage {
  async put(filename: string, data: Buffer, contentType: string): Promise<StoredFile> {
    // Dynamischer Import: Paket ist optional, kein harter Build-Bezug
    const { put } = await import("@vercel/blob")
    const blob = await put(`dokumente/${safeFilename(filename)}`, data, {
      access: "public",
      contentType,
    })
    return { url: blob.url, hash: sha256(data), size: data.length }
  }
}

/** Lokales Dateisystem — Dev-Fallback ohne Blob-Token. */
class LocalFileStorage implements DokumentStorage {
  private dir = path.join(process.cwd(), ".uploads", "dokumente")

  async put(filename: string, data: Buffer): Promise<StoredFile> {
    await mkdir(this.dir, { recursive: true })
    const name = safeFilename(filename)
    const filePath = path.join(this.dir, name)
    await writeFile(filePath, data)
    return { url: `file://${filePath}`, hash: sha256(data), size: data.length }
  }
}

let instance: DokumentStorage | null = null

export function getStorage(): DokumentStorage {
  if (!instance) {
    instance = process.env.BLOB_READ_WRITE_TOKEN
      ? new VercelBlobStorage()
      : new LocalFileStorage()
  }
  return instance
}
