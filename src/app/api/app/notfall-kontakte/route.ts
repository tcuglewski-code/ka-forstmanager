import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

/**
 * GET /api/app/notfall-kontakte
 * Returns company emergency contact info for the mobile app.
 *
 * PUBLIC ENDPOINT - no auth required.
 * Notfall screen must be accessible without login.
 *
 * Response: {
 *   buero: { name: string, telefon: string, email: string },
 *   notfall: { name: string, telefon: string }
 * }
 *
 * BUG-001: Notfall-Nummern in FM konfigurierbar machen
 */
export async function GET() {

  // Read config values from SystemConfig
  const configs = await prisma.systemConfig.findMany({
    where: {
      key: {
        in: [
          "notfall_buero_name",
          "notfall_buero_telefon",
          "notfall_hotline_name",
          "notfall_hotline_telefon",
          "firma_email", // For email fallback
        ],
      },
    },
  })

  const configMap: Record<string, string> = {}
  for (const c of configs) {
    configMap[c.key] = c.value
  }

  return NextResponse.json({
    buero: {
      name: configMap.notfall_buero_name || "Koch Aufforstung GmbH",
      telefon: configMap.notfall_buero_telefon || "",
      email: configMap.firma_email || "info@koch-aufforstung.de",
    },
    notfall: {
      name: configMap.notfall_hotline_name || "",
      telefon: configMap.notfall_hotline_telefon || "",
    },
  })
}
