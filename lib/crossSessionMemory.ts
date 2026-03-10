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
  const newFacts: MemoryFact[] = [];
  const u = userMsg.toLowerCase();

  // Pattern: Name detection
  const nameMatch = userMsg.match(/(?:mera naam|my name is|main|I am|I'm)\s+([A-Z][a-z]+)/i);
  if (nameMatch) {
    upsertFact(facts, {
      type: 'fact', text: `User ka naam ${nameMatch[1]} hai`,
      confidence: 0.9, tags: ['name', 'personal']
    });
  }

  // Pattern: Location mentions
  const locMatch = userMsg.match(/(?:main|I|mujhe)\s+(?:rahta|rehta|stay|live|from)\s+(?:hoon|hun|in|at)?\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i);
  if (locMatch) {
    upsertFact(facts, {
      type: 'fact', text: `User ${locMatch[1]} mein rehta hai`,
      confidence: 0.85, tags: ['location', 'personal']
    });
  }

  // Pattern: Study/Work
  if (u.match(/neet|jee|upsc|exam|prepare|study|padh/)) {
    upsertFact(facts, {
      type: 'pattern', text: 'User competitive exams prepare kar raha hai',
      confidence: 0.7, tags: ['study', 'goal']
    });
  }
  if (u.match(/coding|programming|developer|software|app bana/)) {
    upsertFact(facts, {
      type: 'pattern', text: 'User coding/development mein interested hai',
      confidence: 0.8, tags: ['tech', 'interest']
    });
  }

  // Pattern: Preferences
  if (u.match(/pasand|like|love|favourite|best/)) {
    const pref = userMsg.slice(0, 100);
    upsertFact(facts, {
      type: 'preference', text: `User preference: "${pref}"`,
      confidence: 0.6, tags: ['preference']
    });
  }

  // Pattern: Time preferences
  const hour = new Date().getHours();
  if (hour >= 22 || hour <= 4) {
    upsertFact(facts, {
      type: 'pattern', text: 'User raat ko active rehta hai',
      confidence: 0.65, tags: ['pattern', 'time']
    });
  }

  // Pattern: Language — Hinglish detection
  if (u.match(/karo|karna|hai|hain|bhai|yaar|matlab/)) {
    upsertFact(facts, {
      type: 'preference', text: 'User Hinglish mein baat karna prefer karta hai',
      confidence: 0.9, tags: ['language', 'preference']
    });
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
