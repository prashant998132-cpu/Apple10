# JARVIS v45.0.0

Released: April 2026

## v45 — Massive Upgrade (15 Files)

### 🤖 AI Model Upgrades
- **UPGRADE**: Claude upgraded from `haiku-4-5` → `claude-sonnet-4-6` (smarter, better reasoning)
- **NEW**: xAI **Grok** added as provider (via OpenRouter `x-ai/grok-3-mini-beta:free`)
- **NEW**: Cohere Command R+ added as fallback provider
- **UPGRADE**: Deep mode now uses **Gemini 2.5 Pro** (was 2.5 Flash)
- **UPGRADE**: Think mode uses Claude Sonnet + Gemini Pro + Grok
- **UPGRADE**: All token limits increased (1500→2000 flash, 3000→5000 think, 4000→6000 deep)

### 🛠️ New Tools (8 Added)
- `get_gold_price` — Live gold & silver prices in INR (metals.live API)
- `get_fuel_price` — Petrol/diesel prices for 10 Indian cities
- `get_random_fact` — Random interesting facts (uselessfacts API)
- `get_ip_info` — IP address geolocation lookup
- `get_dadjoke` — Dad jokes (icanhazdadjoke API)
- `get_trivia` — Trivia questions with hidden answers (opentdb API)
- `get_country` — Country info (capital, population, currency, language)
- `get_lucky` — Lucky numbers + colors + affirmations

### 🧠 Intelligence Upgrades
- **6 new personality modes**: `debate`, `creative`, `fitness`, `chef`, `career`, `therapist`
- Better emotion detection: added `proud`, `confused`, `romantic` states
- `suggestPersonality()` — auto-suggests best mode based on query
- Time context upgraded: now shows `Raat (late)` for midnight-6am
- User age now included in system prompt if set in profile
- Memory slice increased: 12 → 15 memories shown to AI

### 🔧 Infrastructure
- Deep mode: 24 tool declarations (was 12), parallel tool execution
- `next.config.js`: HSTS header, DNS prefetch, better CSP, image remote patterns
- `vercel.json`: 12 function configs (was 5)
- `package.json`: v45.0.0, sharp added for image optimization, all deps updated
- `health` API: response time, memory usage, grade A-D, 10 providers, 10 tools tracked

### 📦 Package Updates
- react: 18.2.0 → 18.3.1
- lucide-react: 0.460 → 0.511
- framer-motion: 11.0 → 11.18
- fuse.js: 7.0 → 7.1
- Added: sharp 0.33.5

---

# JARVIS v44.0.0

Released: March 2026

## v44 Changes
- NEW: Web Fetch/URL Reader API — koi bhi URL do, JARVIS summarize karega
- FIX: BottomNav — Habits, Reader, NEET properly added to More grid
- FIX: Stream 500 error handling improved
- UPGRADE: 10 features from screenshots — Web Fetch, Memory, ARIA EQ, Code Run, Voice, Clipboard, URL Reader
