#!/usr/bin/env python3
"""
Fix RegisterFlaeche Coordinates - Sprint IL
Holt fehlende Koordinaten + Flächen von NW-FVA Detail-Seiten

Funktionsweise:
1. Crawlt die Listenseite (mit Auth) → bekommt show_ids + Register-Nr
2. Für jeden Eintrag: Detail-Seite (public) → Koordinaten, Fläche, etc.
3. Update der bestehenden DB-Einträge über registerNr-Matching
"""
import urllib.request, urllib.parse, ssl, http.cookiejar, re, time, sys
import psycopg2

DB_URL = "postgresql://neondb_owner:REDACTED_DB_PASSWORD@ep-misty-moon-aldvc64t-pooler.c-3.eu-central-1.aws.neon.tech/ForstManagerKADB?sslmode=require"

# NW-FVA Portale
PORTALS = {
    'HE': {
        'base_url': 'https://www.nw-fva.de/EZR-HE',
        'username': 'cuglewski@koch-aufforstung.de',
        'password': 'Stani123',
        'bundesland': 'Hessen'
    },
    'SH': {
        'base_url': 'https://www.nw-fva.de/EZR-SH', 
        'username': 'cuglewski@koch-aufforstung.de',
        'password': 'Stani123',
        'bundesland': 'Schleswig-Holstein'
    },
    'ST': {
        'base_url': 'https://www.nw-fva.de/EZR-ST',
        'username': 'cuglewski@koch-aufforstung.de', 
        'password': 'Stani123',
        'bundesland': 'Sachsen-Anhalt'
    }
}

def get_ssl_opener(with_cookies=False):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    handlers = [urllib.request.HTTPSHandler(context=ctx)]
    if with_cookies:
        handlers.append(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    opener = urllib.request.build_opener(*handlers)
    opener.addheaders = [('User-Agent', 'Mozilla/5.0 ForstManager-Crawler/2.0')]
    return opener

def login(base_url, username, password):
    opener = get_ssl_opener(with_cookies=True)
    try:
        opener.open(f"{base_url}/protected/search.jsp", timeout=15)
    except:
        pass
    data = urllib.parse.urlencode({'j_username': username, 'j_password': password}).encode()
    r = opener.open(f"{base_url}/j_security_check", data, timeout=15)
    if 'search.jsp' in r.url or 'protected' in r.url:
        return opener
    return None

def get_list_entries(opener, base_url):
    """Holt alle Einträge aus der Listenseite mit show_id + registerNr"""
    r = opener.open(f"{base_url}/protected/search.jsp", timeout=30)
    content = r.read(2000000).decode('utf-8', errors='ignore')
    
    entries = []
    rows = re.findall(r'<tr[^>]*>(.*?)</tr>', content, re.DOTALL)
    
    for row in rows:
        show_match = re.search(r'search\.jsp\?show=(\d+)', row)
        if not show_match:
            continue
        show_id = show_match.group(1)
        
        cells = re.findall(r'<td[^>]*>(.*?)</td>', row, re.DOTALL)
        if len(cells) < 8:
            continue
        
        def clean(s):
            return re.sub(r'<[^>]+>', '', s).strip()
        
        # Register-Nr ist typischerweise in der letzten Spalte vor dem Link
        register_nr = clean(cells[7]) if len(cells) > 7 else ''
        baumart = clean(cells[0]) if cells else ''
        
        if register_nr and baumart:
            entries.append({
                'show_id': show_id,
                'register_nr': register_nr,
                'baumart': baumart
            })
    
    return entries

def get_detail_data(base_url, show_id):
    """Holt Detail-Daten von der public Seite"""
    opener = get_ssl_opener()
    url = f"{base_url}/public/search.jsp?show={show_id}"
    
    try:
        r = opener.open(url, timeout=15)
        content = r.read(50000).decode('utf-8', errors='ignore')
        
        data = {}
        tables = re.findall(r'<table[^>]*>(.*?)</table>', content, re.DOTALL)
        for t in tables:
            rows = re.findall(r'<tr[^>]*>(.*?)</tr>', t, re.DOTALL)
            for row in rows:
                cells = re.findall(r'<t[hd][^>]*>(.*?)</t[hd]>', row, re.DOTALL)
                if len(cells) >= 2:
                    key = re.sub(r'<[^>]+>', '', cells[0]).strip()
                    val = re.sub(r'<[^>]+>', '', cells[1]).strip()
                    val = val.replace('&amp;', '&').replace('&#8200;', ' ')
                    if key and val:
                        data[key] = val
        
        return data
    except Exception as e:
        return {}

def parse_koordinaten(raw):
    """DMS-Format: '51°31' N 9°33' O' → (lat, lon)"""
    if not raw:
        return None, None
    try:
        raw = raw.replace("\u2019", "'").replace("\u00b4", "'").replace("′", "'")
        m = re.search(r"(\d+)[°º](\d+)['\u2032]\s*[NS]?\s*(\d+)[°º](\d+)['\u2032]\s*[OEW]?", raw)
        if m:
            lat = int(m.group(1)) + int(m.group(2)) / 60
            lon = int(m.group(3)) + int(m.group(4)) / 60
            return round(lat, 6), round(lon, 6)
    except:
        pass
    return None, None

def parse_float(val):
    if not val or val == '-':
        return None
    try:
        return float(val.replace(',', '.').strip())
    except:
        return None

def parse_hoehe(raw):
    """Höhenlage: '355 - 365' → (355, 365)"""
    if not raw or raw == '-':
        return None, None
    try:
        m = re.search(r'(\d+)\s*[-–]\s*(\d+)', raw)
        if m:
            return int(m.group(1)), int(m.group(2))
        m = re.search(r'(\d+)', raw)
        if m:
            return int(m.group(1)), None
    except:
        pass
    return None, None

def update_db_entry(conn, register_nr, bundesland, detail, show_id, base_url):
    """Update eines DB-Eintrags mit den Detail-Daten"""
    koordinaten_raw = detail.get('Koordinaten', '')
    lat, lon = parse_koordinaten(koordinaten_raw)
    
    flaeche_ha = parse_float(detail.get('Absolute Fläche [ha]', detail.get('Fläche [ha]', '')))
    flaeche_red = parse_float(detail.get('Reduzierte Fläche [ha]', detail.get('Anerkannte Fläche [ha]', '')))
    
    hoehe_raw = detail.get('Höhenlage [m]', '')
    hoehe_von, hoehe_bis = parse_hoehe(hoehe_raw)
    
    herkunft = detail.get('Herkunftsgebiet: Bezeichnung', detail.get('Herkunftsgebiet', ''))
    wuchsbezirk = detail.get('Wuchsbezirk', '')
    landkreis = detail.get('Landkreis', '')
    forstamt = detail.get('Forstamt / Forstverwaltung', '')
    revier = detail.get('Forstrevier', '')
    besitzart = detail.get('Eigentumsart', '')
    
    quelle_url = f"{base_url}/public/search.jsp?show={show_id}"
    
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE "RegisterFlaeche"
            SET 
                "latDez" = COALESCE(%s, "latDez"),
                "lonDez" = COALESCE(%s, "lonDez"),
                "koordinatenRaw" = COALESCE(NULLIF(%s, ''), "koordinatenRaw"),
                "flaecheHa" = COALESCE(%s, "flaecheHa"),
                "flaecheRedHa" = COALESCE(%s, "flaecheRedHa"),
                "hoeheVon" = COALESCE(%s, "hoeheVon"),
                "hoeheBis" = COALESCE(%s, "hoeheBis"),
                "herkunftsgebiet" = COALESCE(NULLIF(%s, ''), "herkunftsgebiet"),
                "wuchsbezirk" = COALESCE(NULLIF(%s, ''), "wuchsbezirk"),
                "landkreis" = COALESCE(NULLIF(%s, ''), "landkreis"),
                "forstamt" = COALESCE(NULLIF(%s, ''), "forstamt"),
                "revier" = COALESCE(NULLIF(%s, ''), "revier"),
                "besitzart" = COALESCE(NULLIF(%s, ''), "besitzart"),
                "quelleUrl" = %s,
                "updatedAt" = NOW(),
                "letzteAktualisierung" = NOW()
            WHERE "registerNr" = %s AND bundesland = %s
        """, (
            lat, lon, koordinaten_raw,
            flaeche_ha, flaeche_red,
            hoehe_von, hoehe_bis,
            herkunft, wuchsbezirk, landkreis,
            forstamt, revier, besitzart,
            quelle_url,
            register_nr, bundesland
        ))
        conn.commit()
        return cur.rowcount

def process_portal(portal_key, portal_config, conn):
    """Verarbeitet ein NW-FVA Portal"""
    base_url = portal_config['base_url']
    bundesland = portal_config['bundesland']
    
    print(f"\n{'='*50}")
    print(f"=== {bundesland} ({portal_key}) ===")
    print(f"{'='*50}")
    
    # Login
    print("Login...", end=" ")
    opener = login(base_url, portal_config['username'], portal_config['password'])
    if not opener:
        print("❌ FEHLGESCHLAGEN")
        return 0, 0
    print("✅")
    
    # Liste holen
    print("Lade Listenseite...", end=" ")
    entries = get_list_entries(opener, base_url)
    print(f"{len(entries)} Einträge gefunden")
    
    if not entries:
        return 0, 0
    
    # Detail-Daten holen und updaten
    updated = 0
    errors = 0
    coords_found = 0
    
    for i, entry in enumerate(entries):
        show_id = entry['show_id']
        register_nr = entry['register_nr']
        
        # Detail-Daten holen
        detail = get_detail_data(base_url, show_id)
        
        if detail:
            # Check ob Koordinaten vorhanden
            if detail.get('Koordinaten') and detail.get('Koordinaten') != '-':
                coords_found += 1
            
            # DB updaten
            try:
                rows = update_db_entry(conn, register_nr, bundesland, detail, show_id, base_url)
                if rows > 0:
                    updated += 1
                    lat, lon = parse_koordinaten(detail.get('Koordinaten', ''))
                    coord_str = f" [{lat:.4f}, {lon:.4f}]" if lat else ""
                    print(f"  [{i+1}/{len(entries)}] ✅ {register_nr}{coord_str}")
                else:
                    print(f"  [{i+1}/{len(entries)}] ⚠️  {register_nr} nicht in DB gefunden")
            except Exception as e:
                errors += 1
                print(f"  [{i+1}/{len(entries)}] ❌ {register_nr}: {e}")
        else:
            errors += 1
            print(f"  [{i+1}/{len(entries)}] ❌ {register_nr}: Keine Detail-Daten")
        
        # Rate limiting
        time.sleep(0.15)
    
    print(f"\n--- {bundesland} Zusammenfassung ---")
    print(f"  Einträge: {len(entries)}")
    print(f"  Mit Koordinaten: {coords_found}")
    print(f"  Updated: {updated}")
    print(f"  Fehler: {errors}")
    
    return updated, errors

def main():
    print("=" * 60)
    print("=== RegisterFlaeche Koordinaten-Fix ===")
    print("=" * 60)
    
    # DB-Verbindung
    print("\nDB-Verbindung...", end=" ")
    conn = psycopg2.connect(DB_URL)
    print("✅")
    
    # Stats vor dem Fix
    with conn.cursor() as cur:
        cur.execute('SELECT COUNT(*) FROM "RegisterFlaeche" WHERE "latDez" IS NOT NULL')
        before_coords = cur.fetchone()[0]
        cur.execute('SELECT COUNT(*) FROM "RegisterFlaeche" WHERE "flaecheHa" IS NOT NULL')
        before_flaeche = cur.fetchone()[0]
    
    print(f"\nVor dem Fix:")
    print(f"  Mit Koordinaten: {before_coords}")
    print(f"  Mit Fläche: {before_flaeche}")
    
    total_updated = 0
    total_errors = 0
    
    # Alle Portale durchgehen
    for portal_key, portal_config in PORTALS.items():
        updated, errors = process_portal(portal_key, portal_config, conn)
        total_updated += updated
        total_errors += errors
    
    # Stats nach dem Fix
    with conn.cursor() as cur:
        cur.execute('SELECT COUNT(*) FROM "RegisterFlaeche" WHERE "latDez" IS NOT NULL')
        after_coords = cur.fetchone()[0]
        cur.execute('SELECT COUNT(*) FROM "RegisterFlaeche" WHERE "flaecheHa" IS NOT NULL')
        after_flaeche = cur.fetchone()[0]
    
    conn.close()
    
    print("\n" + "=" * 60)
    print("=== FERTIG ===")
    print("=" * 60)
    print(f"Gesamt Updated: {total_updated}")
    print(f"Gesamt Fehler: {total_errors}")
    print(f"\nNach dem Fix:")
    print(f"  Mit Koordinaten: {after_coords} (+{after_coords - before_coords})")
    print(f"  Mit Fläche: {after_flaeche} (+{after_flaeche - before_flaeche})")
    print("=" * 60)
    
    return total_errors == 0

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
