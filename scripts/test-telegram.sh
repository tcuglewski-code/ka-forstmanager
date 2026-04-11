#!/bin/bash
# Test-Script für ForstManager Telegram-Benachrichtigungen
# Sendet eine Test-Nachricht an den KA Telegram Bot
#
# Benötigte ENV-Vars (in Vercel setzen):
#   TELEGRAM_BOT_TOKEN_KA  — Bot-Token (Fallback: hardcoded im Code)
#   TELEGRAM_CHAT_ID_KA    — Chat-ID von Tomek (FEHLT NOCH!)
#
# Usage: ./scripts/test-telegram.sh [chat_id]

BOT_TOKEN="${TELEGRAM_BOT_TOKEN_KA:-8788038095:AAF2h8l8U02HeaPvjvVl6HJ3gPfxM9ldNuY}"
CHAT_ID="${1:-${TELEGRAM_CHAT_ID_KA}}"

if [ -z "$CHAT_ID" ]; then
  echo "ERROR: TELEGRAM_CHAT_ID_KA nicht gesetzt!"
  echo ""
  echo "So findest du deine Chat-ID:"
  echo "  1. Sende /start an @ka_forstmanager_bot (oder deinen Bot)"
  echo "  2. Öffne: https://api.telegram.org/bot${BOT_TOKEN}/getUpdates"
  echo "  3. Suche 'chat':{'id': DEINE_ID}"
  echo ""
  echo "Dann: TELEGRAM_CHAT_ID_KA=DEINE_ID ./scripts/test-telegram.sh"
  exit 1
fi

echo "Sende Test-Nachricht an Chat $CHAT_ID..."

# Test-Event: auftrag_erstellt
MSG="🧪 *TEST* — ForstManager Telegram\n\n🌲 *Neuer Auftrag*\n📋 Test-Aufforstung Südhessen\n👤 Max Mustermann\n📅 $(date +%d.%m.%Y)\n\n_Dieses ist eine Test-Nachricht_"

RESULT=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{\"chat_id\": \"${CHAT_ID}\", \"text\": \"${MSG}\", \"parse_mode\": \"Markdown\"}")

OK=$(echo "$RESULT" | python3 -c "import json,sys; print(json.load(sys.stdin).get('ok', False))" 2>/dev/null)

if [ "$OK" = "True" ]; then
  echo "✅ Test-Nachricht erfolgreich gesendet!"
else
  echo "❌ Fehler beim Senden:"
  echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
fi

echo ""
echo "=== Telegram Dispatcher Status ==="
echo "Event-Typen implementiert:"
echo "  ✅ auftrag_erstellt     — aufgerufen in: /api/auftraege (POST)"
echo "  ✅ rechnung_erstellt    — aufgerufen in: /api/rechnungen (POST)"
echo "  ⚠️  auftrag_abgeschlossen — definiert, NICHT aufgerufen"
echo "  ⚠️  zahlung_eingegangen   — definiert, NICHT aufgerufen"
echo "  ⚠️  mitarbeiter_eingestempelt — definiert, NICHT aufgerufen"
echo "  ⚠️  protokoll_eingereicht     — definiert, NICHT aufgerufen"
echo ""
echo "=== Tomek TODO ==="
echo "1. TELEGRAM_CHAT_ID_KA in Vercel ENV setzen"
echo "2. Optional: TELEGRAM_BOT_TOKEN_KA in Vercel ENV setzen (hat Fallback)"
