import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const WP_API_URL =
  "https://peru-otter-113714.hostingersite.com/wp-json/wp/v2/ka_projekt"
const WP_USER = process.env.WP_USER ?? "openclaw"
const WP_PASS = process.env.WP_PASSWORD ?? ""
const WP_AUTH = Buffer.from(`${WP_USER}:${WP_PASS}`).toString("base64")

interface WpPost {
  id: number
  title: { rendered: string }
  date: string
  meta: {
    ka_wizard_daten?: string
    ka_baumarten?: string
    ka_neu_flag?: number
    ka_angelegt?: number
  }
}

interface WizardDaten {
  leistung?: string
  baumarten?: string
  baumart?: string
  flaeche_ha?: number | string
  flaechen_str?: string
  zeitraum?: string
  bundesland?: string
  name?: string
  email?: string
  telefon?: string
  bemerkung?: string
  flaechen?: unknown[]
}

async function fetchAllWpPosts(): Promise<WpPost[]> {
  const posts: WpPost[] = []
  let page = 1

  while (true) {
    const url = `${WP_API_URL}?per_page=100&page=${page}&_fields=id,title,date,meta`
    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${WP_AUTH}`,
        "Content-Type": "application/json",
      },
      // Disable caching for fresh data
      cache: "no-store",
    })

    if (!res.ok) {
      if (res.status === 400) break // no more pages
      throw new Error(`WP API error: ${res.status} ${res.statusText}`)
    }

    const data: WpPost[] = await res.json()
    if (!Array.isArray(data) || data.length === 0) break

    posts.push(...data)

    const totalPages = parseInt(res.headers.get("X-WP-TotalPages") ?? "1", 10)
    if (page >= totalPages) break
    page++
  }

  return posts
}

function parseFlaeche(wizard: WizardDaten): number | null {
  if (wizard.flaeche_ha) {
    const val = parseFloat(String(wizard.flaeche_ha))
    if (!isNaN(val)) return val
  }
  if (wizard.flaechen_str) {
    const match = wizard.flaechen_str.match(/[\d.,]+/)
    if (match) {
      const val = parseFloat(match[0].replace(",", "."))
      if (!isNaN(val)) return val
    }
  }
  return null
}

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const posts = await fetchAllWpPosts()

    // Geblockte WP-IDs laden (in FM manuell gelöscht)
    const blockConfig = await prisma.systemConfig.findUnique({ where: { key: "sync_blocked_wp_ids" } })
    const blockedWpIds = new Set<string>(blockConfig?.value ? JSON.parse(blockConfig.value as string) : [])

    let newCount = 0
    let updatedCount = 0

    for (const post of posts) {
      const wpId = String(post.id)

      // Überspringe geblockte (in FM gelöschte) WP-Posts
      if (blockedWpIds.has(wpId)) continue

      // Parse wizard data
      let wizard: WizardDaten = {}
      let wizardDaten: object | null = null
      if (post.meta?.ka_wizard_daten) {
        try {
          const wiz = post.meta.ka_wizard_daten
          wizardDaten = typeof wiz === 'string' ? JSON.parse(wiz) : wiz
          wizard = wizardDaten as WizardDaten
        } catch {
          // ignore parse errors
        }
      }

      const typ = (wizard.leistung ?? "unbekannt").toLowerCase()
        .replace(/ä/g, "ae")
        .replace(/ö/g, "oe")
        .replace(/ü/g, "ue")
        .replace(/ß/g, "ss")
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "")

      const titel = post.title.rendered
        .replace(/<[^>]+>/g, "") // strip HTML entities
        .replace(/&amp;/g, "&")
        .replace(/&#8212;/g, "—")
        .trim()

      const baumarten = wizard.baumarten ?? wizard.baumart ?? post.meta?.ka_baumarten ?? null
      const flaeche_ha = parseFlaeche(wizard)
      const neuFlag = (post.meta?.ka_neu_flag ?? 0) === 1

      // WP-Erstellungsdatum: ka_angelegt Unix-Timestamp oder post.date
      const kaAngelegt = post.meta?.ka_angelegt
      const wpErstelltAm = kaAngelegt ? new Date(kaAngelegt * 1000) : new Date(post.date)

      // Check if exists
      const existing = await prisma.auftrag.findUnique({
        where: { wpProjektId: wpId },
        select: { id: true, status: true },
      })

      if (!existing) {
        // Create new
        await prisma.auftrag.create({
          data: {
            titel,
            typ,
            status: "anfrage",
            beschreibung: wizard.bemerkung || null,
            flaeche_ha,
            bundesland: wizard.bundesland ?? null,
            waldbesitzer: wizard.name ?? null,
            waldbesitzerEmail: wizard.email ?? null,
            waldbesitzerTelefon: wizard.telefon ?? null,
            baumarten,
            zeitraum: wizard.zeitraum ?? null,
            neuFlag,
            wpProjektId: wpId,
            wizardDaten: wizardDaten ?? undefined,
            wpErstelltAm,
          },
        })
        newCount++
      } else {
        // Update — keep existing status if manually set
        await prisma.auftrag.update({
          where: { wpProjektId: wpId },
          data: {
            titel,
            typ,
            beschreibung: wizard.bemerkung || null,
            flaeche_ha,
            bundesland: wizard.bundesland ?? null,
            waldbesitzer: wizard.name ?? null,
            waldbesitzerEmail: wizard.email ?? null,
            waldbesitzerTelefon: wizard.telefon ?? null,
            baumarten,
            zeitraum: wizard.zeitraum ?? null,
            neuFlag,
            wizardDaten: wizardDaten ?? undefined,
            wpErstelltAm,
            // status bleibt erhalten wenn bereits manuell gesetzt
          },
        })
        updatedCount++
      }
    }

    return NextResponse.json({
      synced: posts.length,
      new: newCount,
      updated: updatedCount,
    })
  } catch (error) {
    console.error("[Auftraege Sync POST]", error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
