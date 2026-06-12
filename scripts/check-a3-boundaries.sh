#!/usr/bin/env bash
# DOK-070: A3 Boundary-Check — statische Verifikation der Sicherheits-Invarianten.
# Lauf: bash scripts/check-a3-boundaries.sh   (Exit 0 = alle Invarianten gehalten)
set -uo pipefail
cd "$(dirname "$0")/.."

FEHLER=0
ok()   { echo "  ✅ $1"; }
fail() { echo "  ❌ $1"; FEHLER=$((FEHLER + 1)); }

echo "== NEVER #21: Kill-Switch =="
grep -q "istAutoBuchungAktiv" src/lib/dokumente/pipeline/orchestrator.ts \
  && ok "Orchestrator prüft Kill-Switch" || fail "Kill-Switch-Prüfung fehlt im Orchestrator"
grep -q 'dok_ki_auto_buchung_aktiv' src/app/api/settings/dokumente-ki/route.ts \
  && ok "Kill-Switch per Settings-API steuerbar" || fail "Settings-API kennt Kill-Switch nicht"

echo "== NEVER #23: Zod an allen LLM/OCR/JSON-Grenzen =="
for f in \
  src/lib/dokumente/matching/artikel-matcher.ts \
  src/lib/dokumente/ocr/ocr-adapter.ts \
  src/lib/dokumente/parser/xrechnung.ts \
  src/lib/dokumente/matching/bestell-abgleich.ts \
  src/app/api/dokumente/kosten/route.ts \
  src/app/api/dokumente/export/route.ts; do
  grep -q "safeParse\|\.parse(" "$f" && ok "Zod in $(basename "$f")" || fail "kein Zod in $f"
done

echo "== Keine unsicheren Casts in A3-Code =="
TREFFER=$(grep -rn "as any\|as Record<" src/lib/dokumente src/app/api/dokumente 2>/dev/null | grep -v "\.test\.ts" || true)
if [ -z "$TREFFER" ]; then ok "kein 'as any' / 'as Record<'"; else fail "unsichere Casts gefunden:"; echo "$TREFFER"; fi

echo "== Upload-Härtung (DOK-022-026) =="
grep -q "validiereDatei" src/app/api/dokumente/scans/route.ts \
  && ok "File-Validator eingebunden" || fail "File-Validator fehlt in Upload-Route"
grep -q "dokUploadRateLimit" src/app/api/dokumente/scans/route.ts \
  && ok "Rate-Limit eingebunden" || fail "Rate-Limit fehlt in Upload-Route"
grep -q "processEntities: false" src/lib/dokumente/parser/xrechnung.ts \
  && ok "XML-Parser: Entities deaktiviert (XXE)" || fail "processEntities nicht deaktiviert"

echo "== Worker-Auth =="
grep -q "CRON_SECRET" src/app/api/dokumente/process/route.ts \
  && ok "Process-Route verlangt CRON_SECRET" || fail "Process-Route ohne CRON_SECRET-Auth"

echo "== Vercel Hobby: nur tägliche/seltenere Crons =="
# Minuten-Cron = Schedule deren Minutenfeld "*" oder "*/n" ist
if grep -E '"schedule":\s*"(\*|\*/[0-9]+) ' vercel.json >/dev/null 2>&1; then
  fail "Minuten-Cron in vercel.json (blockt Hobby-Deploys!)"
else
  ok "keine Minuten-Crons in vercel.json"
fi

echo "== Repo-Struktur =="
[ ! -d app ] && ok "kein root app/ (Pages/App-Router-Konflikt)" || fail "root app/ existiert"

echo ""
if [ "$FEHLER" -gt 0 ]; then
  echo "❌ $FEHLER Boundary-Verstoß/Verstöße"
  exit 1
fi
echo "✅ Alle A3-Boundaries gehalten"
