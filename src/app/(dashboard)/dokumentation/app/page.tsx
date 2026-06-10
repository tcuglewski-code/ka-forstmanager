import { Smartphone, WifiOff, ClipboardCheck, Camera, ShieldAlert } from "lucide-react"

export default function MobileAppDocPage() {
  return (
    <article style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-body)" }}>
      <header className="mb-8">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3"
          style={{ backgroundColor: "rgba(44,58,28,0.1)", color: "#2C3A1C" }}
        >
          <Smartphone className="w-3.5 h-3.5" />
          Funktionen
        </div>
        <h1
          className="text-3xl md:text-4xl font-bold mb-3"
          style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-display)" }}
        >
          Mobile App
        </h1>
        <p className="text-base md:text-lg leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
          Die ForstManager-App ist das Werkzeug für die Mitarbeiter im Feld. Sie läuft auf
          iOS und Android, funktioniert auch offline und synchronisiert sobald wieder Empfang
          besteht.
        </p>
      </header>

      <section className="mb-10">
        <h2
          className="text-2xl font-bold mb-3 pb-2"
          style={{
            color: "var(--color-on-surface)",
            fontFamily: "var(--font-display)",
            borderBottom: "1px solid var(--color-outline-variant)",
          }}
        >
          Installation und Login
        </h2>
        <p className="leading-relaxed mb-3">
          Die App steht im <strong>Apple App Store</strong> und im <strong>Google Play Store</strong>{" "}
          unter dem Namen &bdquo;ForstManager &mdash; Koch Aufforstung&ldquo; bereit. Nach der
          Installation öffnet sich ein Login-Bildschirm, der die gleichen Zugangsdaten wie die
          Web-Anwendung erwartet. Die App speichert das Login nach einmaliger Anmeldung sicher
          auf dem Gerät, sodass das tägliche Starten ohne Eingabe von Passwörtern möglich ist.
        </p>
        <p className="leading-relaxed mb-3">
          Beim ersten Start lädt die App alle relevanten Auftragsdaten herunter und legt sie
          im lokalen Speicher ab. Dieser Vorgang dauert je nach Datenmenge zwischen wenigen
          Sekunden und einer Minute. Anschließend ist die App auch ohne Mobilfunkverbindung
          voll einsatzfähig.
        </p>
      </section>

      <section className="mb-10">
        <h2
          className="text-2xl font-bold mb-3 pb-2"
          style={{
            color: "var(--color-on-surface)",
            fontFamily: "var(--font-display)",
            borderBottom: "1px solid var(--color-outline-variant)",
          }}
        >
          Offline-Modus
        </h2>
        <div className="flex items-start gap-3 p-4 rounded-lg my-3" style={{ backgroundColor: "rgba(44,58,28,0.05)" }}>
          <WifiOff className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#2C3A1C" }} />
          <p className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
            <strong style={{ color: "var(--color-on-surface)" }}>Forstflächen liegen oft im
            Funkloch.</strong> Die ForstManager-App ist dafür ausgelegt: alle Eingaben werden
            zunächst lokal gespeichert und automatisch synchronisiert, sobald wieder eine
            Verbindung besteht.
          </p>
        </div>
        <p className="leading-relaxed mb-3">
          Im Offline-Modus sind alle Funktionen verfügbar, die keine Server-Antwort erfordern:
          Tagesprotokoll führen, Fotos aufnehmen, Material entnehmen, Pausen erfassen. Sobald
          das Gerät wieder Verbindung hat, läuft die Synchronisation im Hintergrund. Konflikte
          werden nach dem Prinzip &bdquo;letzte Änderung gewinnt&ldquo; aufgelöst, wobei
          serverseitige Validierungsfehler dem Benutzer als Hinweis angezeigt werden.
        </p>
        <p className="leading-relaxed">
          Ein kleiner Indikator in der App-Leiste zeigt den aktuellen Sync-Status:{" "}
          <span className="font-mono text-xs">●</span> grün = synchron, gelb = ausstehende
          Änderungen, grau = offline.
        </p>
      </section>

      <section className="mb-10">
        <h2
          className="text-2xl font-bold mb-3 pb-2"
          style={{
            color: "var(--color-on-surface)",
            fontFamily: "var(--font-display)",
            borderBottom: "1px solid var(--color-outline-variant)",
          }}
        >
          Tagesprotokoll
        </h2>
        <div className="flex items-start gap-3 p-4 rounded-lg my-3" style={{ backgroundColor: "var(--color-surface-container-low)" }}>
          <ClipboardCheck className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#2C3A1C" }} />
          <p className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
            Das Tagesprotokoll wird vom <strong>Gruppenführer</strong> geführt und bildet die
            Grundlage für Lohnabrechnung, Materialverbrauch und Auftragsfortschritt.
          </p>
        </div>
        <p className="leading-relaxed mb-3">
          Pro Arbeitstag wird ein Tagesprotokoll mit Beginn, Ende, Pausen, beteiligten
          Mitarbeitern und der ausgeführten Tätigkeit erfasst. Die App schlägt anhand der
          Position automatisch den passenden Auftrag vor — sofern die Standortfreigabe erteilt
          wurde. Bei mehreren Aufträgen pro Tag können beliebig viele Einträge ergänzt werden.
        </p>
        <p className="leading-relaxed">
          Material wird direkt im Protokoll entnommen: Der Gruppenführer wählt den Artikel,
          gibt die Menge ein, und der Lagerbestand wird beim nächsten Sync automatisch
          aktualisiert. So entfällt die manuelle Lagerbuchung am Abend.
        </p>
      </section>

      <section className="mb-10">
        <h2
          className="text-2xl font-bold mb-3 pb-2"
          style={{
            color: "var(--color-on-surface)",
            fontFamily: "var(--font-display)",
            borderBottom: "1px solid var(--color-outline-variant)",
          }}
        >
          Fotos und Dokumentation
        </h2>
        <div className="flex items-start gap-3 p-4 rounded-lg my-3" style={{ backgroundColor: "var(--color-surface-container-low)" }}>
          <Camera className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#2C3A1C" }} />
          <p className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
            Fotos sind ein wichtiges Mittel zur Beweissicherung — sowohl gegenüber dem Forstamt
            als auch gegenüber dem Kunden bei Reklamationen.
          </p>
        </div>
        <p className="leading-relaxed mb-3">
          Über das Kamera-Symbol in jedem Auftrag können Fotos direkt der Fläche zugeordnet
          werden. Die App speichert sie mit GPS-Koordinaten und Zeitstempel. Bilder werden
          komprimiert ins Web-System übertragen — ein originalgetreues Backup bleibt zusätzlich
          auf dem Gerät, bis die Synchronisation erfolgreich war.
        </p>
      </section>

      <section className="mb-6">
        <h2
          className="text-2xl font-bold mb-3 pb-2"
          style={{
            color: "var(--color-on-surface)",
            fontFamily: "var(--font-display)",
            borderBottom: "1px solid var(--color-outline-variant)",
          }}
        >
          SOS-Funktion
        </h2>
        <div
          className="flex items-start gap-3 p-4 rounded-xl my-3"
          style={{
            backgroundColor: "rgba(220,38,38,0.06)",
            border: "1px solid rgba(220,38,38,0.2)",
          }}
        >
          <ShieldAlert className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#dc2626" }} />
          <div>
            <p className="text-sm font-semibold mb-1">Im Notfall</p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
              Über den roten SOS-Button im Hauptmenü kann eine Notfallmeldung mit aktuellen
              Koordinaten an die Zentrale gesendet werden. Bei aktiver Verbindung erfolgt
              zusätzlich ein automatischer Anruf bei der hinterlegten Notfallnummer.
            </p>
          </div>
        </div>
      </section>
    </article>
  )
}
