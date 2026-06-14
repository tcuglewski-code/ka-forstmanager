#!/usr/bin/env bash
#
# A8 Rechnungs-Agent — Boundary-Check (REC-020)
#
# Statische Guards (NEVER #21/#22/#23):
#  1. Kill-Switch: /generieren MUSS istAgentAktiv() prüfen.
#  2. Kein `as`-Cast auf JSON-/Engine-Outputs in src/lib/rechnungen (Zod statt Cast).
#  3. Kein direkter LLM-/OpenAI-Call im Rechnungs-Agent (deterministisch, NEVER #22).
#  4. Nummernkreis nur innerhalb $transaction (naechsteNummer(tx)).
#
# Exit 0 = sauber, !=0 = Verletzung gefunden.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LIB="$ROOT/src/lib/rechnungen"
API="$ROOT/src/app/api/rechnungen"
fail=0

note() { printf '  %s\n' "$1"; }
err()  { printf '  ❌ %s\n' "$1"; fail=1; }
ok()   { printf '  ✅ %s\n' "$1"; }

echo "A8 Boundary-Check"

# 1. Kill-Switch im Generieren-Endpoint
if grep -q "istAgentAktiv" "$API/generieren/route.ts" 2>/dev/null; then
  ok "Kill-Switch (istAgentAktiv) im /generieren-Endpoint vorhanden"
else
  err "Kill-Switch fehlt in /generieren-Endpoint (NEVER #21)"
fi

# 2. Kein `as any` / unsicherer Cast in der Engine-Lib
if grep -rnE "\bas any\b" "$LIB" 2>/dev/null; then
  err "Unsicherer 'as any'-Cast in src/lib/rechnungen gefunden (NEVER #23)"
else
  ok "Kein 'as any'-Cast in src/lib/rechnungen"
fi

# 3. Kein LLM-/OpenAI-Call im Agent (deterministisch)
if grep -rniE "openai|anthropic|\.chat\.completions|gpt-" "$LIB" 2>/dev/null; then
  err "LLM-Aufruf im Rechnungs-Agent gefunden — muss deterministisch sein (NEVER #22)"
else
  ok "Kein LLM-Aufruf in src/lib/rechnungen (deterministisch)"
fi

# 4. Engine-Outputs Zod-validiert (Schema-Parse vorhanden)
if grep -q "EngineExtraktSchema.safeParse" "$LIB/aus-auftrag.ts" 2>/dev/null; then
  ok "Engine-Extrakt wird Zod-validiert (NEVER #23)"
else
  err "Engine-Extrakt nicht Zod-validiert in aus-auftrag.ts (NEVER #23)"
fi

# 5. naechsteNummer nur mit tx (innerhalb Transaktion)
if grep -rn "naechsteNummer(" "$API" 2>/dev/null | grep -vqE "naechsteNummer\(tx"; then
  err "naechsteNummer() ohne tx-Parameter aufgerufen — Race-/Lücken-Risiko (REC-002)"
else
  ok "naechsteNummer() nur innerhalb Transaktion (tx) verwendet"
fi

if [ "$fail" -eq 0 ]; then
  echo "✅ A8 Boundaries sauber"
else
  echo "❌ A8 Boundary-Verletzung(en) gefunden"
fi
exit "$fail"
