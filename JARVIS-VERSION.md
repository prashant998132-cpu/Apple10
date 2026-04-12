# JARVIS v49.0.0

Released: April 2026

## v49 — AI Memory + NEET Upgrade

### 🧠 AI-Powered Memory (Auto-save from conversations)
- **NEW**: `/api/extract-memory` — LLM extracts personal facts from every conversation
- Every message ke baad background mein AI run karta hai
- Groq llama-3.1-8b (fast) → Gemini fallback
- Auto-saves: naam, age, location, goals, hobbies, exam, preferences
- No extra wait — non-blocking background call

### 🎓 NEET 2026 Page — Complete Rewrite
- **Full chapter tracker**: Physics (12) + Chemistry (12) + Biology (12)
- **Revision counter**: +Rev button for each chapter
- **Study Timer**: 25min Pomodoro + 50min Deep Study mode
- **Stats tab**: Per-subject progress bars + revision history
- **Target tab**: Score predictor, gap analysis, daily chapters needed, strategy

### 🔧 Infrastructure
- `vercel.json`: extract-memory route added (20s limit)
- Version: 49.0.0
