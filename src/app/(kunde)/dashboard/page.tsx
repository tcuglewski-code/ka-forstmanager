import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"

export const dynamic = "force-dynamic"

// Statusfarben für Projekte
function getStatusBadge(status: string) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    anfrage: { label: "Anfrage", color: "bg-yellow-100 text-yellow-800" },
    geplant: { label: "Geplant", color: "bg-blue-100 text-blue-800" },
    in_bearbeitung: { label: "In Bearbeitung", color: "bg-green-100 text-green-800" },
    abgeschlossen: { label: "Abgeschlossen", color: "bg-gray-100 text-gray-800" },
    pausiert: { label: "Pausiert", color: "bg-orange-100 text-orange-800" },
  }
  const config = statusConfig[status] || { label: status, color: "bg-gray-100 text-gray-800" }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}

// Rechnungsstatus
function getRechnungsStatusBadge(status: string) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    offen: { label: "Offen", color: "bg-yellow-100 text-yellow-800" },
    bezahlt: { label: "Bezahlt", color: "bg-green-100 text-green-800" },
    ueberfaellig: { label: "Überfällig", color: "bg-red-100 text-red-800" },
    storniert: { label: "Storniert", color: "bg-gray-100 text-gray-800" },
  }
  const config = statusConfig[status] || { label: status, color: "bg-gray-100 text-gray-800" }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}

export default async function KundeDashboard() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user || user.role !== "kunde") {
    redirect("/login")
  }

  // Projekte des Waldbesitzers laden (basierend auf E-Mail)
  const projekte = await prisma.auftrag.findMany({
    where: {
      waldbesitzerEmail: user.email,
    },
    orderBy: { updatedAt: "desc" },
    include: {
      dokumente: true,
      rechnungen: true,
    },
  })

  // Alle Dokumente des Kunden
  const alleDokumente = projekte.flatMap(p => p.dokumente)
  
  // Alle Rechnungen des Kunden
  const alleRechnungen = projekte.flatMap(p => p.rechnungen)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "-"
    return new Intl.DateTimeFormat('de-DE').format(new Date(date))
  }

  return (
    <div className="space-y-6">
      {/* Begrüßung */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <h1 className="text-xl font-semibold text-gray-900">
          Willkommen, {user.name}! 👋
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Hier finden Sie alle Informationen zu Ihren Aufforstungsprojekten.
        </p>
      </div>

      {/* Projekte */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span>🌲</span> Ihre Projekte
        </h2>
        
        {projekte.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-center">
            <p className="text-gray-500">
              Noch keine Projekte vorhanden.
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Kontaktieren Sie uns für eine Beratung.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {projekte.map((projekt) => (
              <div 
                key={projekt.id} 
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">{projekt.titel}</h3>
                  {getStatusBadge(projekt.status)}
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  {projekt.standort && (
                    <p className="flex items-center gap-1">
                      <span>📍</span> {projekt.standort}
                    </p>
                  )}
                  {projekt.flaeche_ha && (
                    <p className="flex items-center gap-1">
                      <span>📐</span> {projekt.flaeche_ha} ha
                    </p>
                  )}
                  {projekt.baumarten && (
                    <p className="flex items-center gap-1">
                      <span>🌳</span> {projekt.baumarten}
                    </p>
                  )}
                </div>

                {/* Fortschritt (vereinfacht) */}
                {projekt.status === "in_bearbeitung" && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Fortschritt</span>
                      <span>In Arbeit</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: "50%" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Dokumente */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span>📄</span> Ihre Dokumente
        </h2>
        
        {alleDokumente.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-center">
            <p className="text-gray-500">
              Noch keine Dokumente vorhanden.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y">
            {alleDokumente.slice(0, 5).map((dok) => (
              <div key={dok.id} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg">
                    {dok.typ === "pdf" ? "📕" : dok.typ === "bild" ? "🖼️" : "📄"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {dok.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(dok.createdAt)}
                    </p>
                  </div>
                </div>
                {dok.url && (
                  <a 
                    href={dok.url} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2C3A1C] hover:underline text-sm whitespace-nowrap"
                  >
                    Download
                  </a>
                )}
              </div>
            ))}
            {alleDokumente.length > 5 && (
              <div className="p-3 text-center">
                <p className="text-sm text-gray-500">
                  + {alleDokumente.length - 5} weitere Dokumente
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Rechnungen */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span>💰</span> Ihre Rechnungen
        </h2>
        
        {alleRechnungen.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-center">
            <p className="text-gray-500">
              Noch keine Rechnungen vorhanden.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alleRechnungen.map((rechnung) => (
              <div 
                key={rechnung.id} 
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      Rechnung {rechnung.nummer}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(rechnung.rechnungsDatum)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(rechnung.bruttoBetrag || rechnung.betrag)}
                    </p>
                    {getRechnungsStatusBadge(rechnung.status)}
                  </div>
                </div>
                
                {rechnung.pdfUrl && (
                  <div className="mt-3 pt-3 border-t">
                    <a 
                      href={rechnung.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-[#2C3A1C] hover:underline"
                    >
                      <span>📥</span> PDF herunterladen
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Kontakt */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span>📞</span> Kontakt
        </h2>
        
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-sm text-gray-600 mb-4">
            Haben Sie Fragen zu Ihren Projekten? Wir helfen Ihnen gerne weiter.
          </p>
          
          <div className="space-y-2">
            <a 
              href="mailto:info@koch-aufforstung.de"
              className="flex items-center gap-3 p-3 bg-[#2C3A1C] text-white rounded-lg hover:bg-[#3d4f29] transition-colors"
            >
              <span className="text-xl">✉️</span>
              <div>
                <p className="font-medium">E-Mail schreiben</p>
                <p className="text-sm text-white/80">info@koch-aufforstung.de</p>
              </div>
            </a>
            
            <a 
              href="tel:+4912345678900"
              className="flex items-center gap-3 p-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <span className="text-xl">📱</span>
              <div>
                <p className="font-medium">Anrufen</p>
                <p className="text-sm text-gray-600">+49 123 456 789 00</p>
              </div>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
