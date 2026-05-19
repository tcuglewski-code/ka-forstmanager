import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { BaumschulePortal } from "@/components/baumschule/BaumschulePortal"

// FIX 8: Portal akzeptiert jetzt einen Token via URL (?token=xxx).
// Kein NextAuth-Session nötig — Token wird auf jeder Seite verifiziert.
export default async function BaumschulePortalPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    redirect("/baumschule/login")
  }

  // Token verifizieren
  const baumschule = await prisma.baumschule.findUnique({
    where: { loginToken: token },
  })

  if (!baumschule || !baumschule.loginTokenExpiry || baumschule.loginTokenExpiry < new Date()) {
    redirect("/baumschule/login")
  }

  const [sortiment, ernteanfragen] = await Promise.all([
    prisma.baumschulPreisliste.findMany({
      where: { baumschuleId: baumschule.id },
      orderBy: [{ verfuegbar: "desc" }, { baumart: "asc" }],
    }),
    prisma.ernteanfrage.findMany({
      where: { baumschuleId: baumschule.id },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return (
    <BaumschulePortal
      baumschule={JSON.parse(JSON.stringify(baumschule))}
      sortiment={JSON.parse(JSON.stringify(sortiment))}
      ernteanfragen={JSON.parse(JSON.stringify(ernteanfragen))}
    />
  )
}
