# Task 0 spike results (2026-10-27, free account)

| Check | Result |
|---|---|
| CORS ElevenLabs | ✅ `access-control-allow-origin: *`, `allow-headers: *` |
| CORS Gemini | ✅ echoes origin, allows `x-goog-api-key` |
| CORS Anthropic | ✅ `*`, allows `anthropic-dangerous-direct-browser-access` |
| `eleven_v4` TTS, free key, stability 0.5 + speed 1.0 | ✅ HTTP 200 (`scratch-spike/v4.mp3`) |
| `eleven_v3` TTS, free key | ✅ HTTP 200 |
| `eleven_flash_v2_5` TTS, free key | ✅ HTTP 200 |
| Credit cost per char | ⚠️ not measurable: `character_count` stayed 1107 right after 3 calls (counter lags). Use docs: v4 = 1, Flash = 0.5. App refreshes subscription after each generation. |
| Invalid key error | 401 `{"detail":{"type":"authentication_error","code":"unauthorized","message":"Invalid API key","status":"invalid_api_key"}}` |
| Adam `pNInz6obpgDQGcFmaJgB` | "Adam - Dominant, Firm", category `premade` |
| Gemini model | `gemini-flash-latest` (alias, free key lists it; latest concrete: `gemini-3.8-flash`) |
| Audio tags in Vietnamese | ⏳ waiting for user to listen to v4.mp3 |
