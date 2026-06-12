#!/bin/bash
# DOK-067: A3 Smoke-Test
URL=${1:-'https://ka-forstmanager.vercel.app'}
echo "A3 Smoke Test: $URL"

# Test 1: Scans-Route existiert (401 = Auth aktiv, 200 = ok)
STATUS=$(curl -s -o /dev/null -w '%{http_code}' "$URL/api/dokumente/scans")
if [ "$STATUS" = "401" ] || [ "$STATUS" = "200" ]; then
  echo "✅ /api/dokumente/scans erreichbar ($STATUS)"
else
  echo "❌ /api/dokumente/scans nicht gefunden ($STATUS)"
fi

# Test 2: Health
curl -s "$URL/api/health" | python3 -c 'import json,sys; d=json.load(sys.stdin); print("✅ Health OK" if d.get("status")=="ok" else "⚠️ Health: %s" % d)' 2>/dev/null || echo '⚠️ /api/health nicht vorhanden'

echo 'Smoke fertig'
