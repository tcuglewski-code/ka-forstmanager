import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getNextcloudFileUrl, getNextcloudAuthHeader } from "@/lib/nextcloud"

// GET /api/saisons/[id]/onboarding/download?path=/Koch-Aufforstung/Onboarding/<saisonId>/<file>
// Authenticated proxy to stream onboarding PDFs from Nextcloud.
// Required: query path must start with the saison-spezifischen Onboarding-Ordner.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: saisonId } = await params
  const { searchParams } = new URL(req.url)
  const path = searchParams.get("path")
  if (!path) return NextResponse.json({ error: "path erforderlich" }, { status: 400 })

  // Pfad-Traversal-Schutz: muss exakt im saison-Ordner liegen
  const expectedPrefix = `/Koch-Aufforstung/Onboarding/${saisonId}/`
  if (!path.startsWith(expectedPrefix) || path.includes("..")) {
    return NextResponse.json({ error: "Ungültiger Pfad" }, { status: 400 })
  }

  const fileUrl = getNextcloudFileUrl(path)
  const ncRes = await fetch(fileUrl, {
    headers: { Authorization: getNextcloudAuthHeader() },
  })

  if (!ncRes.ok) {
    return NextResponse.json({ error: `Nextcloud-Fehler: ${ncRes.status}` }, { status: ncRes.status })
  }

  const contentType = ncRes.headers.get("content-type") ?? "application/pdf"
  const contentLength = ncRes.headers.get("content-length")

  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Content-Disposition": "inline",
    "Cache-Control": "private, max-age=300",
  }
  if (contentLength) headers["Content-Length"] = contentLength

  return new NextResponse(ncRes.body, { status: 200, headers })
}
