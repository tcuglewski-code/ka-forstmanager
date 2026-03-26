import { NextRequest, NextResponse } from "next/server"
import { listNextcloudFolder, isImage, isVideo, NextcloudFile } from "@/lib/nextcloud"

// GET /api/saatguternte/medien/browse?path=/Koch-Aufforstung/Projekte/
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const path = searchParams.get("path") ?? "/Koch-Aufforstung/"

    const entries = await listNextcloudFolder(path)

    const folders: string[] = []
    const files: NextcloudFile[] = []

    for (const entry of entries) {
      if (entry.type === "directory") {
        folders.push(entry.path)
      } else if (isImage(entry.name) || isVideo(entry.name)) {
        files.push(entry)
      }
    }

    return NextResponse.json({ files, folders })
  } catch (err) {
    console.error("[medien/browse] GET error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fehler beim Laden" },
      { status: 500 }
    )
  }
}
