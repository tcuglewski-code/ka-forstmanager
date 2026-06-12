#!/usr/bin/env bash
# DOK-035-040: komplette A3-Test-Suite.
# Unit + Security laufen ohne DB; E2E braucht DATABASE_URL (ForstManagerKADB).
set -euo pipefail
cd "$(dirname "$0")/../.."

echo "=== A3 Unit-Tests ==="
npx tsx tests/a3/unit.test.ts

echo ""
echo "=== A3 Security-Tests ==="
npx tsx tests/a3/security.test.ts

echo ""
echo "=== Modul-Tests (Sprint 1+2) ==="
npx tsx src/lib/dokumente/typ-erkennung.test.ts
npx tsx src/lib/dokumente/konfidenz-routing.test.ts
npx tsx src/lib/dokumente/parser/xrechnung.test.ts
npx tsx src/lib/dokumente/matching/artikel-matcher.test.ts
npx tsx src/lib/dokumente/matching/bestell-abgleich.test.ts

if [ -n "${DATABASE_URL:-}" ]; then
  echo ""
  echo "=== A3 E2E-Tests (DB) ==="
  npx tsx tests/a3/e2e.test.ts
  npx tsx src/lib/dokumente/doppelbuchung.test.ts
else
  echo ""
  echo "⚠ DATABASE_URL nicht gesetzt — E2E-Tests übersprungen"
fi

echo ""
echo "✅ A3-Test-Suite komplett grün"
