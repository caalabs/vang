#!/usr/bin/env bash
# Task 0 spike: verify v4/flash on a free key, credit cost, error shape, Gemini model.
# Usage: put ELEVEN_KEY and GEMINI_API_KEY in .env.local, then: bash scripts/spike.sh
set -uo pipefail
cd "$(dirname "$0")/.."
set -a; source .env.local; set +a
ELEVEN_KEY=${ELEVEN_KEY:-$ELEVENLABS_API_KEY}
API=https://api.elevenlabs.io/v1
VOICE=pNInz6obpgDQGcFmaJgB
OUT=scratch-spike; mkdir -p "$OUT"

used() { curl -s "$API/user/subscription" -H "xi-api-key: $ELEVEN_KEY" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("character_count"),d.get("character_limit"),d.get("status"),d.get("next_character_count_reset_unix"))'; }

tts() { # model text outfile
  local code
  code=$(curl -s -o "$3" -w '%{http_code}' -X POST "$API/text-to-speech/$VOICE?output_format=mp3_44100_128" \
    -H "xi-api-key: $ELEVEN_KEY" -H 'content-type: application/json' \
    -d "{\"text\":\"$2\",\"model_id\":\"$1\",\"voice_settings\":{\"stability\":0.5,\"speed\":1.0}}")
  echo "HTTP $code"; [ "$code" = 200 ] || cat "$3"; echo
}

V4_TEXT='[excited] Xin chào các bạn! [whispers] Hôm nay mình kể một bí mật.'
FLASH_TEXT='Xin chào các bạn! Hôm nay mình kể một bí mật.'

echo "== subscription (used limit status reset)"; used
echo "== eleven_v4 (${#V4_TEXT} chars)"; tts eleven_v4 "$V4_TEXT" "$OUT/v4.mp3"; used
echo "== eleven_v3 (${#V4_TEXT} chars)"; tts eleven_v3 "$V4_TEXT" "$OUT/v3.mp3"; used
echo "== eleven_flash_v2_5 (${#FLASH_TEXT} chars)"; tts eleven_flash_v2_5 "$FLASH_TEXT" "$OUT/flash.mp3"; used
echo "== invalid key error"; curl -s -X POST "$API/text-to-speech/$VOICE" -H 'xi-api-key: invalid' -H 'content-type: application/json' -d '{"text":"a","model_id":"eleven_flash_v2_5"}' -w '\nHTTP %{http_code}\n'
echo "== Adam voice"; curl -s "$API/voices/$VOICE" -H "xi-api-key: $ELEVEN_KEY" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("name"),d.get("category"))'
echo "== Gemini flash models"; curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY&pageSize=200" | python3 -c 'import sys,json;[print(m["name"]) for m in json.load(sys.stdin).get("models",[]) if "flash" in m["name"] and "generateContent" in m.get("supportedGenerationMethods",[])]'
echo "== audio files in $OUT/"; ls -la "$OUT"
