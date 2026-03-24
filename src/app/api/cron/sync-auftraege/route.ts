import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const WP_API_URL = "https://peru-otter-113714.hostingersite.com/wp-json/wp/v2/ka_projekt"
const WP_AUTH = Buffer.from("openclaw:aZ*rd^)AHcUZiY9F39#yHYHI").toString("base64")
const CRON_SECRET = process.env.CRON_SECRET ?? "forstmanager-cron-2026"

export async function GET(req: Request) {
  // Vercel Cron Auth
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // WP Posts abrufen (letzte 50, nach Datum sortiert)
    const url = `${WP_API_URL}?per_page=50&orderby=date&order=desc&_fields=id,title,date,meta`
    const res = await fetch(url, {
      headers: { Authorization: `Basic ${WP_AUTH}` },
      cache: "no-store"
    })

    if (!res.ok) {
      return NextResponse.json({ error: `WP API: ${res.status}` }, { status: 500 })
    }

    const posts = await res.json() as Array<{
      id: number
      title: { rendered: string }
      date: string
      meta: {
        ka_wizard_daten?: string
        ka_baumarten?: string
        ka_neu_flag?: number
        ka_angelegt?: number
      }
    }>

    let newCount = 0
    for (const post of posts) {
      const wpId = String(post.id)

      // Nur neue anlegen, nicht updaten (Cron-Mode)
      const existing = await prisma.auftrag.findUnique({ where: { wpProjektId: wpId }, select: { id: true } })
      if (existing) continue

      let wizard: Record<string, unknown> = {}
      if (post.meta?.ka_wizard_daten) {
        try {
          wizard = typeof post.meta.ka_wizard_daten === "string"
            ? JSON.parse(post.meta.ka_wizard_daten)
            : post.meta.ka_wizard_daten
        } catch { /* skip */ }
      }

      const titel = post.title.rendered
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .trim()

      await prisma.auftrag.create({
        data: {
          titel,
          typ: String(wizard.leistung ?? "unbekannt")
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_äöüß]/g, ""),
          status: "anfrage",
          beschreibung: String(wizard.bemerkung ?? ""),
          waldbesitzer: String(wizard.name ?? ""),
          waldbesitzerEmail: String(wizard.email ?? ""),
          waldbesitzerTelefon: String(wizard.telefon ?? ""),
          bundesland: String(wizard.bundesland ?? ""),
          baumarten: String(wizard.baumarten ?? wizard.baumart ?? post.meta?.ka_baumarten ?? ""),
          flaeche_ha: wizard.flaeche_ha ? parseFloat(String(wizard.flaeche_ha)) : null,
          zeitraum: String(wizard.zeitraum ?? ""),
          neuFlag: (post.meta?.ka_neu_flag ?? 0) === 1,
          wpProjektId: wpId,
          wizardDaten: Object.keys(wizard).length > 0 ? (wizard as import("@prisma/client").Prisma.InputJsonValue) : undefined,
          wpErstelltAm: post.meta?.ka_angelegt
            ? new Date(post.meta.ka_angelegt * 1000)
            : new Date(post.date)
        }
      })
      newCount++
    }

    return NextResponse.json({
      ok: true,
      checked: posts.length,
      new: newCount,
      ts: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
