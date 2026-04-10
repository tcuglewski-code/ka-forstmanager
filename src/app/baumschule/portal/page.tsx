import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BaumschulePortal } from "@/components/baumschule/BaumschulePortal"

export default async function BaumschulePortalPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/baumschule/login")
  }

  const userRole = (session.user as any).role
  if (userRole !== "baumschule" && userRole !== "ka_admin") {
    redirect("/dashboard")
  }

  // Baumschule des eingeloggten Users laden
  const baumschule = await prisma.baumschule.findFirst({
    where: { userId: session.user.id },
  })

  if (!baumschule) {
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
