#!/usr/bin/env bash
# ANG-040: A1 Boundary-Check — statische Verifikation der Sicherheits-Invarianten.
# Lauf: bash scripts/check-a1-boundaries.sh   (Exit 0 = alle Invarianten gehalten)
set -uo pipefail
cd "$(dirname "$0")/.."

FEHLER=0
ok()   { echo "  ✅ $1"; }
fail() { echo "  ❌ $1"; FEHLER=$((FEHLER + 1)); }

echo "== NEVER #21: Kill-Switch (Default false) =="
grep -q 'ang_agent_aktiv.*"false"\|\[CONFIG_KEYS.agentAktiv\]: "false"' src/lib/angebote/config.ts \
  && ok "Kill-Switch Default = false" || fail "Kill-Switch Default != false"
grep -q "isAgentAktiv" src/app/api/angebote/generieren/route.ts \
  && ok "Generieren-Route prüft Kill-Switch" || fail "Kill-Switch-Prüfung fehlt in Generieren-Route"
grep -q "503" src/app/api/angebote/generieren/route.ts \
  && ok "Kill-Switch liefert 503" || fail "kein 503 bei deaktiviertem Agent"

echo "== NEVER #23: Zod an allen LLM/JSON-Grenzen =="
# generieren.ts ist reiner Orchestrator: validiert Daten via parseAnfrage/kalkuliereAngebot (beide Zod-gesichert).
for f in \
  src/lib/angebote/parsing/anfrage-parser.ts \
  src/lib/angebote/varianten/text-generator.ts \
  src/lib/angebote/versand/followup.ts \
  src/lib/angebote/kalkulation/rechner.ts \
  src/lib/angebote/rag/historische-auftraege.ts; do
  grep -q "safeParse\|parseLlmJson\|safeParseJson\|\.parse(" "$f" && ok "Zod in $(basename "$f")" || fail "kein Zod in $f"
done

echo "== Kein roher JSON.parse auf LLM-Antworten =="
# Erlaubt: zod-schemas.ts (parseLlmJson Safe-Wrapper), anfrage-parser.ts (wizardToText: Wizard-Input, kein LLM, try/catch).
TREFFER=$(grep -rn "JSON.parse" src/lib/angebote 2>/dev/null \
  | grep -v "src/lib/angebote/zod-schemas.ts" \
  | grep -v "src/lib/angebote/parsing/anfrage-parser.ts" \
  | grep -v "// " || true)
if [ -z "$TREFFER" ]; then ok "kein ungesicherter JSON.parse in Angebote-Code"; else fail "ungesicherter JSON.parse:"; echo "$TREFFER"; fi

echo "== Keine unsicheren Casts =="
TREFFER=$(grep -rn "as any" src/lib/angebote src/app/api/angebote 2>/dev/null | grep -v "\.test\.ts" || true)
if [ -z "$TREFFER" ]; then ok "kein 'as any'"; else fail "'as any' gefunden:"; echo "$TREFFER"; fi

echo "== DSGVO: keine Klartext-IP im Tracking =="
grep -q "createHash(\"sha256\")\|sha256" src/app/api/angebote/track/*/route.ts \
  && ok "Tracking-Pixel hasht IP (SHA-256)" || fail "Tracking-Pixel speichert evtl. Klartext-IP"
grep -q "createHash(\"sha256\")\|sha256" src/app/api/angebote/portal/*/route.ts \
  && ok "Portal hasht IP (SHA-256)" || fail "Portal speichert evtl. Klartext-IP"

echo "== PII-Pseudonymisierung vor LLM =="
for f in src/lib/angebote/parsing/anfrage-parser.ts src/lib/angebote/varianten/text-generator.ts src/lib/angebote/versand/followup.ts; do
  grep -q "pseudonymizePrompt" "$f" && ok "Pseudonymisierung in $(basename "$f")" || fail "keine Pseudonymisierung in $f"
done

echo "== Mensch-im-Loop: Versand nur nach Freigabe =="
grep -q 'status !== "freigegeben"\|status === "freigegeben"' src/lib/angebote/versand/email-versand.ts \
  && ok "Versand erfordert Freigabe" || fail "Versand ohne Freigabe-Prüfung"

echo "== Worker-Auth: Follow-up-Cron =="
grep -q "CRON_SECRET" src/app/api/cron/angebote-followup/route.ts \
  && ok "Follow-up-Cron verlangt CRON_SECRET" || fail "Follow-up-Cron ohne CRON_SECRET"

echo "== Brand-Boundary: kein Feldhub in KA-Angeboten =="
TREFFER=$(grep -rni "feldhub\|appfabrik" src/lib/angebote src/app/api/angebote "src/app/(dashboard)/angebote" "src/app/angebot" 2>/dev/null || true)
if [ -z "$TREFFER" ]; then ok "kein Feldhub/AppFabrik-Branding"; else fail "Fremd-Branding gefunden:"; echo "$TREFFER"; fi

echo "== Modell-Konstante claude-opus-4-8 =="
grep -q "claude-opus-4-8" src/lib/angebote/config.ts \
  && ok "Default-Modell claude-opus-4-8" || fail "Default-Modell nicht claude-opus-4-8"

echo ""
if [ "$FEHLER" -gt 0 ]; then
  echo "❌ $FEHLER Boundary-Verstoß/Verstöße"
  exit 1
fi
echo "✅ Alle A1-Boundaries gehalten"
