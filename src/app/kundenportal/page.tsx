import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export const dynamic = "force-dynamic"

const STATUS_LABELS: Record<string, string> = {
  anfrage: "Anfrage",
  angebot: "Angebot",
  geplant: "Geplant",
  aktiv: "Aktiv",
  in_bearbeitung: "In Bearbeitung",
  abgeschlossen: "Abgeschlossen",
  storniert: "Storniert",
}

const STATUS_FARBEN: Record<string, string> = {
  anfrage: "bg-blue-100 text-blue-800",
  angebot: "bg-violet-100 text-violet-800",
  geplant: "bg-cyan-100 text-cyan-800",
  aktiv: "bg-lime-100 text-lime-800",
  in_bearbeitung: "bg-yellow-100 text-yellow-800",
  abgeschlossen: "bg-green-100 text-green-800",
  storniert: "bg-gray-100 text-gray-600",
}

export default async function KundenPortalPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/kundenlogin")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user || user.role !== "kunde") {
    redirect("/kundenlogin")
  }

  const auftraege = await prisma.auftrag.findMany({
    where: { waldbesitzerEmail: user.email },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      titel: true,
      status: true,
      typ: true,
      startDatum: true,
      endDatum: true,
      createdAt: true,
    },
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Willkommen, {user.name}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Übersicht über Ihre Aufforstungsprojekte
          </p>
        </div>

        {auftraege.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-200">
            <p className="text-gray-600">
              Aktuell sind keine Aufträge für Ihr Konto hinterlegt.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {auftraege.map((a: typeof auftraege[number]) => (
              <div
                key={a.id}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-medium text-gray-900">
                      {a.titel}
                    </h2>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        STATUS_FARBEN[a.status] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {STATUS_LABELS[a.status] ?? a.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {a.typ} · Erstellt am{" "}
                    {new Date(a.createdAt).toLocaleDateString("de-DE")}
                    {a.startDatum && (
                      <>
                        {" · Start "}
                        {new Date(a.startDatum).toLocaleDateString("de-DE")}
                      </>
                    )}
                  </p>
                </div>
                <Link
                  href="/kunde/dashboard"
                  className="text-emerald-700 hover:text-emerald-900 text-sm font-medium"
                >
                  Details →
                </Link>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/kunde/dashboard"
            className="inline-block text-sm text-emerald-700 hover:text-emerald-900"
          >
            Zum vollständigen Dashboard →
          </Link>
        </div>
      </div>
    </div>
  )
}
