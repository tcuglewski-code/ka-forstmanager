#!/usr/bin/env bash
# MAT-021: A2 Boundary-Check — statische Verifikation der Sicherheits-Invarianten.
# Lauf: bash scripts/check-a2-boundaries.sh   (Exit 0 = alle Invarianten gehalten)
set -uo pipefail
cd "$(dirname "$0")/.."

FEHLER=0
ok()   { echo "  ✅ $1"; }
fail() { echo "  ❌ $1"; FEHLER=$((FEHLER + 1)); }

echo "== NEVER #21: Kill-Switch (Default false) =="
grep -q '\[MAT_CONFIG_KEYS.agentAktiv\]: "false"' src/lib/material/config.ts \
  && ok "Kill-Switch Default = false" || fail "Kill-Switch Default != false"
grep -q "isMatAgentAktiv" src/app/api/material-bedarf/berechnen/route.ts \
  && ok "Berechnen-Route prüft Kill-Switch" || fail "Kill-Switch-Prüfung fehlt in Berechnen-Route"
grep -q "503" src/app/api/material-bedarf/berechnen/route.ts \
  && ok "Kill-Switch liefert 503" || fail "kein 503 bei deaktiviertem Agent"

echo "== NEVER #23: Zod an allen LLM/JSON-Grenzen =="
for f in \
  src/lib/material/zod-schemas.ts \
  src/lib/material/llm-fallback.ts \
  src/lib/material/aus-angebot.ts \
  src/lib/material/berechnen.ts; do
  grep -q "safeParse\|parseLlmJson\|safeParseJson\|\.parse(" "$f" && ok "Zod in $(basename "$f")" || fail "kein Zod in $f"
done

echo "== Kein roher JSON.parse auf LLM-Antworten =="
# Erlaubt: zod-schemas.ts (parseLlmJson Safe-Wrapper).
TREFFER=$(grep -rn "JSON.parse" src/lib/material 2>/dev/null \
  | grep -v "src/lib/material/zod-schemas.ts" \
  | grep -v "// " || true)
if [ -z "$TREFFER" ]; then ok "kein ungesicherter JSON.parse in Material-Code"; else fail "ungesicherter JSON.parse:"; echo "$TREFFER"; fi

echo "== Keine unsicheren Casts =="
TREFFER=$(grep -rn "as any" src/lib/material src/app/api/material-bedarf 2>/dev/null | grep -v "\.test\.ts" || true)
if [ -z "$TREFFER" ]; then ok "kein 'as any'"; else fail "'as any' gefunden:"; echo "$TREFFER"; fi

echo "== NEVER #24: Mengen deterministisch (kein LLM für Standard) =="
grep -q "quelle: \"FORMEL\"" src/lib/material/berechnen.ts \
  && ok "Standard-Mengen quelle=FORMEL" || fail "Standard-Mengen nicht deterministisch"
grep -q "unbekannteBaumarten" src/lib/material/berechnen.ts \
  && ok "LLM-Fallback nur für Unbekanntes" || fail "LLM-Fallback-Gate fehlt"

echo "== Reforest-Rechner: kein DB/LLM-Import =="
TREFFER=$(grep -n "prisma\|Anthropic\|fetch(" src/lib/material/reforest-rechner.ts || true)
if [ -z "$TREFFER" ]; then ok "Reforest-Rechner rein (kein DB/LLM)"; else fail "Reforest-Rechner hat Seiteneffekte:"; echo "$TREFFER"; fi

echo "== PII-Pseudonymisierung vor LLM =="
grep -q "pseudonymizePrompt" src/lib/material/llm-fallback.ts \
  && ok "Pseudonymisierung in llm-fallback.ts" || fail "keine Pseudonymisierung vor LLM"

echo "== NEVER #22: LLM-Kosten getrackt =="
grep -q "logAiCall" src/lib/material/llm-fallback.ts \
  && ok "LLM-Aufruf wird auditiert (logAiCall)" || fail "kein Audit-Log für LLM-Aufruf"
grep -q "kostenCent" src/lib/material/llm-fallback.ts \
  && ok "LLM-Kosten erfasst (kostenCent)" || fail "keine Kostenerfassung"

echo "== Human-in-the-Loop: kein Auto-Bestellen =="
grep -q "VORSCHLAG" src/lib/material/bestellvorschlag.ts \
  && ok "Bestellvorschläge starten als VORSCHLAG" || fail "Bestellvorschläge nicht im Vorschlag-Status"
grep -q "isAdminOrGF" src/app/api/material-bedarf/[id]/bestellen/route.ts \
  && ok "Bestellen verlangt Admin/GF-Rolle" || fail "Bestellen ohne Rollenprüfung"

echo "== Brand-Boundary: kein Feldhub in KA-Material =="
TREFFER=$(grep -rni "feldhub\|appfabrik" src/lib/material src/app/api/material-bedarf "src/app/(dashboard)/material-bedarf" 2>/dev/null || true)
if [ -z "$TREFFER" ]; then ok "kein Feldhub/AppFabrik-Branding"; else fail "Fremd-Branding gefunden:"; echo "$TREFFER"; fi

echo "== Modell-Konstante claude-opus-4-8 =="
grep -q "claude-opus-4-8" src/lib/material/config.ts \
  && ok "Default-Modell claude-opus-4-8" || fail "Default-Modell nicht claude-opus-4-8"

echo ""
if [ "$FEHLER" -gt 0 ]; then
  echo "❌ $FEHLER Boundary-Verstoß/Verstöße"
  exit 1
fi
echo "✅ Alle A2-Boundaries gehalten"
