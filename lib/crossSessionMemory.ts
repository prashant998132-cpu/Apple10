// ══════════════════════════════════════════════════════════════
// CROSS-SESSION MEMORY — JARVIS learns about you over time
// Stores: facts, preferences, patterns, topics, goals
// All local (IndexedDB + localStorage) — no server needed
// ══════════════════════════════════════════════════════════════
'use client';

export interface MemoryFact {
  id: string;
  type: 'fact' | 'preference' | 'goal' | 'pattern' | 'correction';
  text: string;           // "User ka naam Prashant hai"
  confidence: number;     // 0-1
  mentions: number;       // kitni baar confirm hua
  lastSeen: number;       // timestamp
  tags: string[];         // ['name', 'personal'] etc
}

const KEY = 'jarvis_cross_memory';
const MAX_FACTS = 80;

// ── Load / Save ───────────────────────────────────────────────
export function loadMemoryFacts(): MemoryFact[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

function saveFacts(facts: MemoryFact[]) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(KEY, JSON.stringify(facts.slice(-MAX_FACTS))); } catch {}
}

// ── Extract facts from a conversation exchange ────────────────
export function extractAndStoreFacts(userMsg: string, aiResponse: string) {
  const facts = loadMemoryFacts();
  const u = userMsg.toLowerCase();
  const timestamp = Date.now();

  // 1. Name detection
  const nameMatch = userMsg.match(/(?:mera naam|my name is|main|I am|I'm)\s+([A-Z][a-z]+)/i);
  if (nameMatch) upsertFact(facts, { type: 'fact', text: `User ka naam ${nameMatch[1]} hai`, confidence: 0.9, tags: ['name', 'personal'] });

  // 2. Location
  const locMatch = userMsg.match(/(?:main|I|mujhe)\s+(?:rahta|rehta|stay|live|from)\s+(?:hoon|hun|in|at)?\s*([A-Za-z]+(?:\s[A-Za-z]+)?)/i);
  if (locMatch) upsertFact(facts, { type: 'fact', text: `User ${locMatch[1]} mein rehta hai`, confidence: 0.85, tags: ['location', 'personal'] });

  // 3. Study/Exam patterns
  const examMatch = u.match(/(neet|jee|upsc|gate|cat|board|12th|10th|clat|ssc|ias)/);
  if (examMatch) upsertFact(facts, { type: 'goal', text: `User ${examMatch[1].toUpperCase()} exam prepare kar raha hai`, confidence: 0.85, tags: ['exam', 'goal', 'study'] });

  // 4. Job/Work
  if (u.match(/job|naukri|salary|office|company|kaam karta|work/)) {
    const jobMatch = userMsg.match(/(?:at|in|mein)\s+([A-Z][a-z]+ ?(?:[A-Z][a-z]+)?)/);
    const txt = jobMatch ? `User ${jobMatch[1]} mein kaam karta hai` : 'User kisi job mein hai';
    upsertFact(facts, { type: 'fact', text: txt, confidence: 0.7, tags: ['work', 'personal'] });
  }

  // 5. Coding/Tech interest
  if (u.match(/coding|programming|developer|software|app bana|website|python|javascript|react/))
    upsertFact(facts, { type: 'pattern', text: 'User coding/tech mein deeply interested hai', confidence: 0.85, tags: ['tech', 'interest'] });

  // 6. Preferences (food, entertainment, etc.)
  const likeMatch = userMsg.match(/(?:mujhe|I|mera)\s+(?:pasand|like|love|achha lagta)\s+(?:hai|is|are)?\s*(.{5,40})/i);
  if (likeMatch) upsertFact(facts, { type: 'preference', text: `User ko pasand hai: ${likeMatch[1].trim()}`, confidence: 0.75, tags: ['preference', 'interest'] });

  // 7. Dislikes
  const dislikeMatch = userMsg.match(/(?:mujhe|I)\s+(?:nahi pasand|don't like|hate|dislike)\s+(.{5,40})/i);
  if (dislikeMatch) upsertFact(facts, { type: 'preference', text: `User ko nahi pasand: ${dislikeMatch[1].trim()}`, confidence: 0.75, tags: ['preference', 'dislike'] });

  // 8. Goals
  const goalMatch = u.match(/(?:mujhe|main|I)\s+(?:banana chahta|banna chahta|want to become|want to be|banna chahti)\s+(.{3,40})/i);
  if (goalMatch) upsertFact(facts, { type: 'goal', text: `User ka goal: ${goalMatch[1].trim()}`, confidence: 0.8, tags: ['goal', 'aspiration'] });

  // 9. Age/DOB
  const ageMatch = userMsg.match(/(?:meri umar|my age|main)\s+(\d{1,2})\s*(?:saal|years?|yo)/i);
  if (ageMatch) upsertFact(facts, { type: 'fact', text: `User ki umar ${ageMatch[1]} saal hai`, confidence: 0.9, tags: ['age', 'personal'] });

  // 10. Language preference
  if (u.match(/karo|karna|hai|hain|bhai|yaar|matlab|kal|aaj/))
    upsertFact(facts, { type: 'preference', text: 'User Hinglish mein baat karna prefer karta hai', confidence: 0.9, tags: ['language', 'preference'] });

  // 11. Time pattern
  const hour = new Date().getHours();
  if (hour >= 23 || hour <= 4)
    upsertFact(facts, { type: 'pattern', text: 'User raat ko zyada active rehta hai (late night)', confidence: 0.7, tags: ['pattern', 'time'] });
  else if (hour >= 5 && hour <= 8)
    upsertFact(facts, { type: 'pattern', text: 'User subah jaldi uthta hai', confidence: 0.65, tags: ['pattern', 'time'] });

  // 12. Health/Fitness
  if (u.match(/gym|workout|exercise|diet|weight|fitness|calories|running|yoga/))
    upsertFact(facts, { type: 'pattern', text: 'User health/fitness mein interested hai', confidence: 0.75, tags: ['health', 'interest'] });

  // 13. Finance interest
  if (u.match(/invest|stock|mutual fund|sip|crypto|bitcoin|share market|trading/))
    upsertFact(facts, { type: 'pattern', text: 'User finance/investment mein interested hai', confidence: 0.8, tags: ['finance', 'interest'] });

  // 14. Family mentions
  const familyMatch = u.match(/(bhai|sister|maa|papa|dad|mom|wife|husband|beta|beti|ghar mein)/);
  if (familyMatch) upsertFact(facts, { type: 'fact', text: `User ne family mention ki: ${familyMatch[1]}`, confidence: 0.6, tags: ['family', 'personal'] });

  // 15. Current project/task
  if (u.match(/jarvis|project|app|banaya|build|develop|kaam chal raha/))
    upsertFact(facts, { type: 'pattern', text: 'User apna JARVIS AI app build kar raha hai', confidence: 0.95, tags: ['project', 'tech', 'jarvis'] });

  // 16. Mood tracking
  if (u.match(/stressed|pareshan|tension|anxious|worried|ghabra/))
    upsertFact(facts, { type: 'pattern', text: 'User kabhi kabhi stressed/anxious rehta hai', confidence: 0.6, tags: ['mood', 'mental'] });

  // 17. AI response topics — what user asks about most
  const topicKeywords: Record<string, string> = {
    weather: 'mausam/weather', crypto: 'crypto/finance', news: 'news/khabar',
    coding: 'coding help', study: 'study/padhai', food: 'khana/recipes',
  };
  for (const [kw, topic] of Object.entries(topicKeywords)) {
    if (u.includes(kw)) upsertFact(facts, { type: 'pattern', text: `User aksar ${topic} ke baare mein poochta hai`, confidence: 0.55, tags: ['topic', 'pattern'] });
  }

  saveFacts(facts);
}

function upsertFact(facts: MemoryFact[], input: Omit<MemoryFact, 'id' | 'mentions' | 'lastSeen'>) {
  // Check if similar fact already exists
  const existing = facts.find(f =>
    f.type === input.type &&
    f.tags.some(t => input.tags.includes(t)) &&
    similarity(f.text, input.text) > 0.6
  );
  if (existing) {
    existing.mentions++;
    existing.confidence = Math.min(1, existing.confidence + 0.05);
    existing.lastSeen = Date.now();
  } else {
    facts.push({
      ...input,
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      mentions: 1,
      lastSeen: Date.now(),
    });
  }
}

// Simple word overlap similarity
function similarity(a: string, b: string): number {
  const wa = new Set(a.toLowerCase().split(/\s+/));
  const wb = new Set(b.toLowerCase().split(/\s+/));
  let overlap = 0;
  wa.forEach(w => { if (wb.has(w)) overlap++; });
  return overlap / Math.max(wa.size, wb.size);
}

// ── Get relevant memories for a query ─────────────────────────
export function getRelevantMemories(query: string, limit = 6): string[] {
  const facts = loadMemoryFacts();
  if (!facts.length) return [];

  const q = query.toLowerCase().split(/\s+/);
  return facts
    .filter(f => f.confidence >= 0.5)
    .map(f => ({
      ...f,
      score: q.filter(w => f.text.toLowerCase().includes(w)).length * f.confidence * (f.mentions * 0.1 + 1)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(f => f.text);
}

// ── Proactive suggestions based on patterns ───────────────────
export function getProactiveSuggestion(): string | null {
  const facts = loadMemoryFacts();
  const hour = new Date().getHours();
  const patterns = facts.filter(f => f.type === 'pattern');

  // Morning study reminder
  if (hour >= 7 && hour <= 9 && patterns.some(p => p.text.includes('exam'))) {
    return '📚 Subah hai — aaj ka study session shuru karein? Topics ya schedule chahiye?';
  }
  // Night owl
  if ((hour >= 23 || hour <= 2) && patterns.some(p => p.text.includes('raat'))) {
    return '🌙 Raat ko active ho — kya kaam chal raha hai? Koi help chahiye?';
  }
  return null;
}

// ── Summary of what JARVIS knows ──────────────────────────────
export function getMemorySummary(): string {
  const facts = loadMemoryFacts();
  if (!facts.length) return 'Abhi koi memory nahi — baat karte raho toh seekhta jaaunga!';
  const top = facts
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 8)
    .map(f => `• ${f.text} (${Math.round(f.confidence * 100)}%)`)
    .join('\n');
  return `🧠 **Mujhe yaad hai:**\n${top}`;
}
