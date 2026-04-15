import { NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-handler"


// WooCommerce is not installed on the WP website.
// Customer orders flow through: WP Wizard → /api/anfragen/wp-webhook → Auftrag in FM.
export const POST = withErrorHandler(async () => {
  return NextResponse.json(
    { message: "WooCommerce not installed — orders come via /api/anfragen/wp-webhook" },
    { status: 200 }
  )
})
