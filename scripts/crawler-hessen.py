import os
#!/usr/bin/env python3
"""
NW-FVA Hessen EZR Crawler v2 - Optimiert
Erkenntnis: Einmaliger GET/POST gibt ALLE Hessen-Einträge zurück (303+)
Strategie: 1x Listenpage → alle show-IDs + Basisdaten → Detailseiten für Koordinaten
"""
import urllib.request, urllib.parse, ssl, http.cookiejar, re, time, json, sys
import psycopg2

DB_URL = "postgresql://neondb_owner:" + os.environ.get("NEON_PASSWORD","") + "@ep-misty-moon-aldvc64t-pooler.c-3.eu-central-1.aws.neon.tech/ForstManagerKADB?sslmode=require"
BASE_URL = "https://www.nw-fva.de/EZR-HE"
USERNAME = "cuglewski@koch-aufforstung.de"
PASSWORD = "Stani123"

def login():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(
        urllib.request.HTTPSHandler(context=ctx),
        urllib.request.HTTPCookieProcessor(cj)
    )
    opener.addheaders = [('User-Agent', 'Mozilla/5.0 ForstManager-Crawler/1.0')]
    
    try:
        opener.open(f"{BASE_URL}/protected/search.jsp", timeout=15)
    except Exception as e:
        print(f"  GET: {e}")
    
    data = urllib.parse.urlencode({'j_username': USERNAME, 'j_password': PASSWORD}).encode()
    r = opener.open(f"{BASE_URL}/j_security_check", data, timeout=15)
    print(f"  Login URL: {r.url}")
    
    if 'search.jsp' in r.url or 'protected' in r.url:
        print("✅ Login erfolgreich")
        return opener
    raise Exception(f"Login fehlgeschlagen: {r.url}")

def get_all_entries_from_list(opener):
    """
    Holt ALLE Hessen-Einträge aus der Listenseite.
    Die Seite gibt alle Einträge auf einmal zurück (kein Paging).
    Extrahiert: show_id, register_nr, baumart, kategorie, ausgangsmaterial,
                herkunft_code, zustaendige_stelle, revier, forstamt
    """
    print("Lade Listenseite...")
    r = opener.open(f"{BASE_URL}/protected/search.jsp", timeout=30)
    content = r.read(1000000).decode('utf-8', errors='ignore')
    print(f"  Seiteninhalt: {len(content)} Zeichen")
    
    entries = []
    
    # Parse Tabellenzeilen: jede Zeile hat format:
    # <tr><td>BAUMART</td><td>KATEGORIE</td><td>AUSGANGSMATERIAL</td>
    #     <td>HERKUNFT_CODE</td><td>ZUSTAENDIGE_STELLE</td>
    #     <td>REVIER</td><td>FORSTAMT</td><td>REGISTER_NR</td>
    #     <td>...show=SHOW_ID...</td></tr>
    
    # Extrahiere alle Zeilen
    rows = re.findall(r'<tr[^>]*>(.*?)</tr>', content, re.DOTALL)
    print(f"  Tabellenzeilen gefunden: {len(rows)}")
    
    for row in rows:
        # Show-ID aus dem Link extrahieren
        show_match = re.search(r'search\.jsp\?show=(\d+)', row)
        if not show_match:
            continue
        show_id = show_match.group(1)
        
        # Alle td-Inhalte extrahieren
        cells = re.findall(r'<td[^>]*>(.*?)</td>', row, re.DOTALL)
        if len(cells) < 8:
            continue
        
        def clean(s):
            return re.sub(r'<[^>]+>', '', s).strip()
        
        entry = {
            'show_id': show_id,
            'baumart': clean(cells[0]),
            'kategorie': clean(cells[1]),
            'ausgangsmaterial': clean(cells[2]),
            'herkunft_code': clean(cells[3]),
            'zustaendige_stelle': clean(cells[4]),
            'revier': clean(cells[5]),
            'forstamt': clean(cells[6]),
            'register_nr': clean(cells[7]),
        }
        
        if entry['register_nr'] and entry['baumart']:
            entries.append(entry)
    
    print(f"  Einträge geparst: {len(entries)}")
    
    # Statistik
    baumarten = {}
    for e in entries:
        baumarten[e['baumart']] = baumarten.get(e['baumart'], 0) + 1
    print(f"  Baumarten: {dict(sorted(baumarten.items()))}")
    
    return entries

def _parse_detail_html(content):
    """Hilfsfunktion: extrahiert Key-Value Paare aus dem Detail-HTML."""
    detail = {}
    tables = re.findall(r'<table[^>]*>(.*?)</table>', content, re.DOTALL)
    for t in tables:
        rows = re.findall(r'<tr[^>]*>(.*?)</tr>', t, re.DOTALL)
        for row in rows:
            cells = re.findall(r'<t[hd][^>]*>(.*?)</t[hd]>', row, re.DOTALL)
            if len(cells) >= 2:
                key = re.sub(r'<[^>]+>', '', cells[0]).strip()
                val = re.sub(r'<[^>]+>', '', cells[1]).strip()
                val = (val.replace('&amp;', '&').replace('&lt;', '<')
                          .replace('&gt;', '>').replace('&#8200;', ' ')
                          .replace('&nbsp;', ' '))
                if key and val and key != '&#8200;':
                    detail[key] = val
    return detail


def get_detail_coords(show_id, auth_opener=None):
    """
    Detail-Daten holen.
    Primär: authenticated /protected/search.jsp?show=X (mehr Felder)
    Fallback: public /public/search.jsp?show=X
    """
    # 1. Versuch: authenticated protected endpoint
    if auth_opener is not None:
        try:
            url = f"{BASE_URL}/protected/search.jsp?show={show_id}"
            r = auth_opener.open(url, timeout=15)
            content = r.read(100000).decode('utf-8', errors='ignore')
            detail = _parse_detail_html(content)
            if detail:
                return detail
        except Exception:
            pass

    # 2. Fallback: public endpoint (ohne Auth)
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        opener = urllib.request.build_opener(urllib.request.HTTPSHandler(context=ctx))
        opener.addheaders = [('User-Agent', 'Mozilla/5.0')]
        r = opener.open(f"{BASE_URL}/public/search.jsp?show={show_id}", timeout=15)
        content = r.read(30000).decode('utf-8', errors='ignore')
        return _parse_detail_html(content)
    except Exception:
        return {}


def parse_jahr(text):
    """Extrahiert das Jahr (4-stellig) aus einem Text."""
    if not text:
        return None
    m = re.search(r'(19|20)\d{2}', text)
    return int(m.group(0)) if m else None


def parse_hoehe_range(text):
    """'375 - 495' / '375–495' / '375' → (von, bis)"""
    if not text:
        return None, None
    text = text.replace('–', '-').replace('—', '-')
    m = re.search(r'(\d+)\s*-\s*(\d+)', text)
    if m:
        return int(m.group(1)), int(m.group(2))
    m = re.search(r'(\d+)', text)
    if m:
        v = int(m.group(1))
        return v, v
    return None, None

def parse_koordinaten(raw):
    """DMS-Format: '50°8' N 8°10' O' → (lat, lon)"""
    if not raw:
        return None, None
    try:
        raw = raw.replace("\u2019", "'").replace("\u00b4", "'")
        m = re.search(r"(\d+)[°º](\d+)['\u2032]\s*[N]?\s*(\d+)[°º](\d+)['\u2032]\s*[OEW]?", raw)
        if m:
            lat = int(m.group(1)) + int(m.group(2)) / 60
            lon = int(m.group(3)) + int(m.group(4)) / 60
            return lat, lon
    except:
        pass
    return None, None

def upsert_flaeche(conn, quelle_id, entry, detail, is_sonderherkunft_detected):
    """Einfügen oder Update der Fläche"""
    register_nr = entry['register_nr']
    baumart = entry['baumart']
    forstamt = entry['forstamt'] or entry['zustaendige_stelle']
    revier = entry['revier']
    ausgangsmaterial = entry['ausgangsmaterial']
    
    # Herkunftsgebiet aus Detail
    herkunft = detail.get('Herkunftsgebiet: Bezeichnung', 
               detail.get('Herkunftsgebiet', ''))
    
    # Koordinaten
    koordinaten_raw = detail.get('Koordinaten', '')
    lat, lon = parse_koordinaten(koordinaten_raw)
    
    # Flächen
    flaeche_ha = None
    flaeche_red_ha = None
    for key in ['Absolute Fläche [ha]', 'Fläche [ha]']:
        val = detail.get(key, '').replace(',', '.').strip()
        if val and val != '-':
            try:
                flaeche_ha = float(val)
                break
            except: pass
    
    for key in ['Reduzierte Fläche [ha]', 'Anerkannte Fläche [ha]']:
        val = detail.get(key, '').replace(',', '.').strip()
        if val and val != '-':
            try:
                flaeche_red_ha = float(val)
                break
            except: pass
    
    # Höhenlage
    hoehe_raw = detail.get('Höhenlage [m]', detail.get('Höhenlage', ''))
    hoehe_von, hoehe_bis = parse_hoehe_range(hoehe_raw)

    # Eigentumsart / Eigentümer
    besitzart = detail.get('Eigentumsart', detail.get('Besitzart', ''))
    eigentumsart = detail.get('Eigentumsart', '') or besitzart
    eigentuemer = detail.get('Eigentümer', detail.get('Eigentuemer', ''))

    # Forstrevier (alternativ zu revier, oft mehr Detail)
    forstrevier = detail.get('Forstrevier', detail.get('Revier', revier))
    if forstrevier and not revier:
        revier = forstrevier

    # Forstamt aus Detail (überschreibt falls genauer)
    forstamt_detail = (detail.get('Forstamt / Forstverwaltung')
                       or detail.get('Forstamt')
                       or detail.get('FA')
                       or detail.get('Hoheitlich zuständige Stelle')
                       or detail.get('Zuständige Stelle'))
    if forstamt_detail:
        forstamt = forstamt_detail

    # Wuchsbezirk
    wuchsbezirk = detail.get('Wuchsbezirk', '')

    # Zulassung bis (Jahr)
    zulassung_bis_raw = detail.get('Ende der Zulassung', detail.get('Zulassung bis', ''))
    zulassung_bis_jahr = parse_jahr(zulassung_bis_raw)
    zulassung_bis = f"{zulassung_bis_jahr}-12-31" if zulassung_bis_jahr else None
    zulassung_bis_text = zulassung_bis_raw or None

    # Erstes Jahr der Bestandesbegründung
    erstes_jahr_raw = detail.get('Erstes Jahr der Bestandesbegründung',
                                detail.get('Erstes Jahr', ''))
    erstes_jahr = parse_jahr(erstes_jahr_raw)

    # Bemerkungen
    bemerkungen = detail.get('Bemerkungen zur Zulassungseinheit',
                             detail.get('Bemerkungen', ''))

    # Zugelassene Flächen (Liste als Text)
    zulaessige_flaechen = detail.get('Zugelassene Flächen', '')

    # Verkehrsbeschränkung nach §13 FoVG
    verkehr_raw = detail.get('Verkehrsbeschränkungen nach §13 FoVG',
                             detail.get('Verkehrsbeschränkung', '')).strip().lower()
    verkehrsbeschraenkung = verkehr_raw == 'ja'

    # Rohdaten: das komplette Detail-Dict als JSON für spätere Verwendung
    rohdaten_json = json.dumps(detail, ensure_ascii=False)

    # Quelleurl
    quelle_url = f"{BASE_URL}/public/search.jsp?show={entry['show_id']}"

    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO "RegisterFlaeche" (
                id, "quelleId", "registerNr", bundesland, baumart,
                "latDez", "lonDez", "koordinatenRaw",
                "flaecheHa", "flaecheRedHa",
                "hoeheVon", "hoeheBis",
                forstamt, revier, besitzart, eigentumsart,
                "quelleUrl", "zugelassen", "ausgangsmaterial",
                "herkunftsgebiet", "wuchsbezirk",
                "zulassungBis", "zulassungBisText",
                "erstesJahr", "zulaessigeFlaechen",
                "verkehrsbeschraenkung",
                "rohdaten", "datenstand",
                "createdAt", "updatedAt", "letzteAktualisierung"
            ) VALUES (
                gen_random_uuid()::text, %s, %s, 'Hessen', %s,
                %s, %s, %s,
                %s, %s,
                %s, %s,
                %s, %s, %s, %s,
                %s, true, %s,
                %s, %s,
                %s, %s,
                %s, %s,
                %s,
                %s::jsonb, '2024',
                NOW(), NOW(), NOW()
            )
            ON CONFLICT ("quelleId", "registerNr") DO UPDATE SET
                baumart = EXCLUDED.baumart,
                "latDez" = EXCLUDED."latDez",
                "lonDez" = EXCLUDED."lonDez",
                "koordinatenRaw" = EXCLUDED."koordinatenRaw",
                "flaecheHa" = EXCLUDED."flaecheHa",
                "flaecheRedHa" = EXCLUDED."flaecheRedHa",
                "hoeheVon" = EXCLUDED."hoeheVon",
                "hoeheBis" = EXCLUDED."hoeheBis",
                forstamt = EXCLUDED.forstamt,
                revier = EXCLUDED.revier,
                besitzart = EXCLUDED.besitzart,
                eigentumsart = EXCLUDED.eigentumsart,
                "ausgangsmaterial" = EXCLUDED."ausgangsmaterial",
                "herkunftsgebiet" = EXCLUDED."herkunftsgebiet",
                "wuchsbezirk" = EXCLUDED."wuchsbezirk",
                "zulassungBis" = EXCLUDED."zulassungBis",
                "zulassungBisText" = EXCLUDED."zulassungBisText",
                "erstesJahr" = EXCLUDED."erstesJahr",
                "zulaessigeFlaechen" = EXCLUDED."zulaessigeFlaechen",
                "verkehrsbeschraenkung" = EXCLUDED."verkehrsbeschraenkung",
                "rohdaten" = EXCLUDED."rohdaten",
                "updatedAt" = NOW(),
                "letzteAktualisierung" = NOW()
        """, (
            quelle_id, register_nr, baumart,
            lat, lon, koordinaten_raw,
            flaeche_ha, flaeche_red_ha,
            hoehe_von, hoehe_bis,
            forstamt, revier, besitzart, eigentumsart,
            quelle_url,
            ausgangsmaterial,
            herkunft,
            wuchsbezirk,
            zulassung_bis, zulassung_bis_text,
            erstes_jahr, zulaessige_flaechen,
            verkehrsbeschraenkung,
            rohdaten_json,
        ))
        # Eigentümer und Bemerkungen werden im rohdaten-JSON gespeichert
        # (keine eigenen Spalten in RegisterFlaeche).
        conn.commit()

def main():
    print("=== NW-FVA Hessen EZR Crawler v2 ===\n")
    
    # Login
    print("--- Login ---")
    opener = login()
    
    # Alle Einträge aus Listenseite holen
    print("\n--- Lade alle Einträge ---")
    entries = get_all_entries_from_list(opener)
    
    if not entries:
        print("❌ Keine Einträge gefunden!")
        return False
    
    # DB-Verbindung
    print("\n--- DB-Verbindung ---")
    conn = psycopg2.connect(DB_URL)
    print("✅ DB verbunden")
    
    with conn.cursor() as cur:
        cur.execute('SELECT id FROM "ErnteRegisterQuelle" WHERE kuerzel = %s', ('NW-FVA',))
        row = cur.fetchone()
        if not row:
            cur.execute('SELECT id, name, kuerzel FROM "ErnteRegisterQuelle" LIMIT 10')
            print(f"Quellen: {cur.fetchall()}")
            print("❌ NW-FVA Quelle nicht gefunden!")
            return False
        quelle_id = row[0]
        print(f"NW-FVA Quelle ID: {quelle_id}")
    
    # Import
    total = 0
    errors = 0
    sonderherkuenfte_count = 0
    
    print(f"\n--- Importiere {len(entries)} Flächen ---")
    
    for i, entry in enumerate(entries):
        show_id = entry['show_id']
        
        # Detail holen (Koordinaten, Fläche, Herkunft) — mit Auth für mehr Felder
        detail = get_detail_coords(show_id, auth_opener=opener)
        
        # Sonderherkunft prüfen
        herkunft = detail.get('Herkunftsgebiet: Bezeichnung', detail.get('Herkunftsgebiet', ''))
        is_sonderherkunft = bool(herkunft and herkunft.strip() and 
                                  herkunft.lower() not in ['-', 'übriges bundesgebiet', 'übriges deutschland'])
        
        try:
            upsert_flaeche(conn, quelle_id, entry, detail, is_sonderherkunft)
            total += 1
            sonder_mark = " 🌟" if is_sonderherkunft else ""
            koordinaten_mark = f" [{detail.get('Koordinaten', '-')}]" if detail.get('Koordinaten') else ""
            print(f"  [{i+1}/{len(entries)}] ✅ {entry['register_nr']} ({entry['baumart']}){koordinaten_mark}{sonder_mark}")
            
            if is_sonderherkunft:
                sonderherkuenfte_count += 1
                print(f"     Herkunft: {herkunft}")
        except Exception as e:
            errors += 1
            print(f"  [{i+1}] ❌ {entry['register_nr']}: {e}")
        
        time.sleep(0.2)  # Rate limiting
    
    conn.close()
    
    print(f"\n{'='*50}")
    print(f"=== FERTIG ===")
    print(f"Importiert: {total}")
    print(f"Fehler: {errors}")
    print(f"Sonderherkünfte: {sonderherkuenfte_count}")
    print(f"{'='*50}")
    
    return True

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
