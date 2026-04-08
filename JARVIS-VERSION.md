# JARVIS v46.0.0

Released: April 2026

## v46 — Massive Upgrade (15 Files)

### 💰 New Pages
- **NEW**: `/finance` — Full Finance Hub (Crypto live prices, Gold/Silver rates, SIP Calculator, EMI Calculator)
- **NEW**: `/todo` — Smart To-Do with priority (high/medium/low), tags, due dates, progress bar
- **NEW**: `/calculator` — 4-in-1 Calculator (Basic, Scientific, Unit Converter, % Tools)

### 🌍 New APIs
- **NEW**: `/api/crypto` — CoinGecko + CoinPaprika fallback, 8 coins in INR+USD
- **NEW**: `/api/airquality` — Open-Meteo AQI (free, no key) + WAQI fallback
- **NEW**: `/api/fuel` — Indian city fuel/diesel/CNG prices (20 cities)

### 🎨 Theme System
- **NEW**: `lib/themeEngine.ts` — 5 themes: Dark, Midnight, Ocean, Forest, Sunset
- **NEW**: `components/ThemeSelector.tsx` — Theme picker UI with color swatches
- **NEW**: Theme tab added in Settings page

### 🏠 HomeScreen Upgrade
- **NEW**: AQI card alongside Time + Weather (3-column row)
- **NEW**: Quick Nav tiles — Finance, To-Do, Calculator, NEET, Dashboard, Image, Notes, Settings
- **UPGRADE**: Better layout, smaller spacing, more info density

### 🧭 BottomNav Upgrade
- **UPGRADE**: Finance + To-Do added to main nav bar (replaced Image + Entertainment)
- **UPGRADE**: Battery level shown in More drawer
- **UPGRADE**: Cleaner icons and labels

### 🔧 Tool Engine Upgrades
- **NEW**: `get_air_quality` tool — AQI for any location
- **NEW**: `get_fuel_price` tool — petrol/diesel prices for Indian cities
- **NEW**: `get_crypto_price` tool — live crypto rates in INR
- **UPGRADE**: 3 new intent keywords: aqi, petrol, diesel, fuel, crypto

### 📦 Package
- version: 46.0.0
- All previous v45 features retained

---

# JARVIS v45.0.0

Released: April 2026

## v45 — Massive Upgrade (15 Files)

### 🤖 AI Model Upgrades
- **UPGRADE**: Claude upgraded `haiku-4-5` → `claude-sonnet-4-6`
- **NEW**: xAI Grok added (OpenRouter `x-ai/grok-3-mini-beta:free`)
- **NEW**: Cohere Command R+ fallback
- **UPGRADE**: Deep mode → Gemini 2.5 Pro
- **UPGRADE**: Token limits increased (1500→2000 flash, 3000→5000 think, 4000→6000 deep)

### 🛠️ New Tools (8)
- `get_gold_price`, `get_fuel_price`, `get_random_fact`, `get_ip_info`
- `get_dadjoke`, `get_trivia`, `get_country`, `get_lucky`

### 🧠 Intelligence
- 6 new personality modes: debate, creative, fitness, chef, career, therapist
- Better emotion detection: proud, confused, romantic
- `suggestPersonality()` — auto mode suggestion
- Memory slice: 12 → 15
