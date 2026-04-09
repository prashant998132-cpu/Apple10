# JARVIS v47.0.0

Released: April 2026

## v47 — Bug Fixes + Features from Reference App

### 🐛 Critical Fixes
- **FIX**: Chat screen black/blank — `position:fixed` + `100dvh` layout fix
- **FIX**: Scroll nahi ho raha — `min-height:0` + `chat-scroll-area` CSS fix
- **FIX**: `$H$` LaTeX raw text — Math renderer added (inline + block)
- **FIX**: `#__next` height cascade fixed in globals.css

### ✨ New Features (from apple-v20.vercel.app)
- **NEW**: LaTeX Math Rendering — `$inline$` → italic blue, `$$block$$` → centered card
- **NEW**: Force Provider Lock 🔒 — Input bar mein provider pin karo (Groq/Gemini/Claude/Mistral)
- **NEW**: Dynamic FollowUp Chips — Time-based (subah/dopahar/shaam/raat) + context-aware
- **NEW**: Finance/Health/Cooking/NEET categories in follow-up chips
- **UPGRADE**: Stream API now supports `forcedProvider` parameter

### 🎨 UI Improvements
- Math blocks: centered, indigo border, serif font, fraction rendering
- Provider badge in InputBar: 🔒 locked (amber) / 🤖 auto (indigo)
- Follow-up chips: 4 chips shown, touch-friendly, time-aware on first message

---

# Previous: JARVIS v46.0.0 (Finance + Todo + Calculator + AQI + Themes)
