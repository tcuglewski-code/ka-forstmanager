import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const WP_API_URL = "https://peru-otter-113714.hostingersite.com/wp-json/wp/v2/ka_projekt"
const WP_USER = process.env.WP_USER ?? "openclaw"
const WP_PASS = process.env.WP_PASSWORD ?? ""
const WP_AUTH = Buffer.from(`${WP_USER}:${WP_PASS}`).toString("base64")
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
      content?: { rendered: string }
      date: string
      meta: {
        ka_wizard_daten?: string
        ka_baumarten?: string
        ka_neu_flag?: number
        ka_angelegt?: number
        // Bug B5: Direkte WP-Meta-Felder (Aufträge ohne Wizard)
        ka_flaeche_ha?: string | number
        ka_waldbesitzer_name?: string
        ka_kontakt_name?: string
        ka_waldbesitzer_email?: string
        ka_kontakt_email?: string
        ka_waldbesitzer_telefon?: string
        ka_kontakt_telefon?: string
        ka_ort?: string
        ka_gemeinde?: string
        ka_bundesland?: string
        ka_beschreibung?: string
        ka_auftragstyp?: string
        ka_zeitraum?: string
      }
    }>

    // Geblockte WP-IDs laden (in FM manuell gelöscht)
    const blockConfig = await prisma.systemConfig.findUnique({ where: { key: "sync_blocked_wp_ids" } })
    const blockedWpIds = new Set<string>(blockConfig?.value ? JSON.parse(blockConfig.value as string) : [])

    let newCount = 0
    let updatedCount = 0

    for (const post of posts) {
      const wpId = String(post.id)

      // Überspringe in FM gelöschte WP-Posts
      if (blockedWpIds.has(wpId)) continue

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

      // Bug B5: Felder aus wizard-Daten ODER direkt aus WP-Meta-Feldern lesen
      const waldbesitzer = String(wizard.name ?? post.meta?.ka_waldbesitzer_name ?? post.meta?.ka_kontakt_name ?? "")
      const waldbesitzerEmail = String(wizard.email ?? post.meta?.ka_waldbesitzer_email ?? post.meta?.ka_kontakt_email ?? "")
      const waldbesitzerTelefon = String(wizard.telefon ?? post.meta?.ka_waldbesitzer_telefon ?? post.meta?.ka_kontakt_telefon ?? "")
      const bundesland = String(wizard.bundesland ?? post.meta?.ka_bundesland ?? "")
      const baumarten = String(wizard.baumarten ?? wizard.baumart ?? post.meta?.ka_baumarten ?? "")
      const flaecheRaw = wizard.flaeche_ha ?? post.meta?.ka_flaeche_ha
      const flaeche_ha = flaecheRaw ? parseFloat(String(flaecheRaw)) : null
      const zeitraum = String(wizard.zeitraum ?? post.meta?.ka_zeitraum ?? "")
      const standort = String(wizard.ort ?? post.meta?.ka_ort ?? post.meta?.ka_gemeinde ?? "")
      const beschreibung = String(wizard.bemerkung ?? post.meta?.ka_beschreibung ?? post.content?.rendered?.replace(/<[^>]+>/g, "").trim() ?? "")
      const typ = String(wizard.leistung ?? post.meta?.ka_auftragstyp ?? "unbekannt")
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_äöüß]/g, "")

      // Bug B5: Upsert statt nur Create — damit bestehende Aufträge mit leeren Details aktualisiert werden
      const existing = await prisma.auftrag.findUnique({ where: { wpProjektId: wpId }, select: { id: true } })

      if (!existing) {
        await prisma.auftrag.create({
          data: {
            titel,
            typ,
            status: "anfrage",
            beschreibung,
            waldbesitzer,
            waldbesitzerEmail,
            waldbesitzerTelefon,
            bundesland,
            baumarten,
            flaeche_ha,
            standort,
            zeitraum,
            neuFlag: (post.meta?.ka_neu_flag ?? 0) === 1,
            wpProjektId: wpId,
            wizardDaten: Object.keys(wizard).length > 0 ? (wizard as import("@prisma/client").Prisma.InputJsonValue) : undefined,
            wpErstelltAm: post.meta?.ka_angelegt
              ? new Date(post.meta.ka_angelegt * 1000)
              : new Date(post.date)
          }
        })
        newCount++
      } else {
        // Bestehenden Auftrag mit fehlenden Details aktualisieren
        await prisma.auftrag.update({
          where: { wpProjektId: wpId },
          data: {
            titel,
            ...(beschreibung ? { beschreibung } : {}),
            ...(waldbesitzer ? { waldbesitzer } : {}),
            ...(waldbesitzerEmail ? { waldbesitzerEmail } : {}),
            ...(waldbesitzerTelefon ? { waldbesitzerTelefon } : {}),
            ...(bundesland ? { bundesland } : {}),
            ...(baumarten ? { baumarten } : {}),
            ...(flaeche_ha !== null ? { flaeche_ha } : {}),
            ...(standort ? { standort } : {}),
            ...(zeitraum ? { zeitraum } : {}),
          }
        })
        updatedCount++
      }
    }

    return NextResponse.json({
      ok: true,
      checked: posts.length,
      new: newCount,
      updated: updatedCount,
      ts: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
