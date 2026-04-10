import { NextResponse } from "next/server"

// WooCommerce is not installed on the WP website.
// Customer orders flow through: WP Wizard → /api/anfragen/wp-webhook → Auftrag in FM.
export async function POST() {
  return NextResponse.json(
    { message: "WooCommerce not installed — orders come via /api/anfragen/wp-webhook" },
    { status: 200 }
  )
}
