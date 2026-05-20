import { redirect } from "next/navigation"

export default function KundenLoginPage() {
  // Magic-Link Login ist bereits unter /auth/magic implementiert
  redirect("/auth/magic")
}
