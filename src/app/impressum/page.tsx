// AUDIT-FIX: [Dead-Link] /impressum war verlinkt (Buchhaltung-Footer/Login), existierte aber nicht (404)
export const metadata = { title: "Impressum — Koch Aufforstung" }

export default function ImpressumPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-zinc-800">
      <h1 className="text-3xl font-bold mb-8">Impressum</h1>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold mb-2">Angaben gemäß § 5 TMG / § 18 MStV</h2>
          <p>
            Koch Aufforstung
            <br />
            Inhaber: Koch
            <br />
            Deutschland
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Kontakt</h2>
          <p>
            E-Mail: info@koch-aufforstung.de
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Verantwortlich für den Inhalt</h2>
          <p>Koch Aufforstung (Anschrift wie oben)</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Haftung für Inhalte</h2>
          <p>
            Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen
            Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir
            als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
            Informationen zu überwachen oder nach Umständen zu forschen, die auf eine
            rechtswidrige Tätigkeit hinweisen.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Haftung für Links</h2>
          <p>
            Unser Angebot enthält ggf. Links zu externen Websites Dritter, auf deren Inhalte wir
            keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr
            übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter
            oder Betreiber der Seiten verantwortlich.
          </p>
        </div>
      </section>

      <p className="mt-10 text-xs text-zinc-500">
        Hinweis: Bitte vollständige Anbieterkennzeichnung (Anschrift, Vertretungsberechtigte,
        ggf. USt-IdNr.) vor Produktivschaltung ergänzen.
      </p>
    </main>
  )
}
