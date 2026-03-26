import { NextRequest, NextResponse } from "next/server"
import { getNextcloudFileUrl, getNextcloudAuthHeader } from "@/lib/nextcloud"

// GET /api/saatguternte/medien/proxy?path=/Koch-Aufforstung/...
// Proxy-Route: Lädt Datei von Nextcloud und streamt sie weiter
// Verhindert direktes Credential-Exposure im Frontend
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const path = searchParams.get("path")

    if (!path) {
      return NextResponse.json({ error: "path erforderlich" }, { status: 400 })
    }

    const fileUrl = getNextcloudFileUrl(path)

    const ncRes = await fetch(fileUrl, {
      headers: {
        Authorization: getNextcloudAuthHeader(),
      },
    })

    if (!ncRes.ok) {
      return NextResponse.json(
        { error: `Nextcloud-Fehler: ${ncRes.status}` },
        { status: ncRes.status }
      )
    }

    const contentType =
      ncRes.headers.get("content-type") ?? "application/octet-stream"
    const contentLength = ncRes.headers.get("content-length")

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    }

    if (contentLength) {
      headers["Content-Length"] = contentLength
    }

    return new NextResponse(ncRes.body, {
      status: 200,
      headers,
    })
  } catch (err) {
    console.error("[medien/proxy] GET error:", err)
    return NextResponse.json({ error: "Proxy-Fehler" }, { status: 500 })
  }
}
