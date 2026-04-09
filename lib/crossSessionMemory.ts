'use client';

export interface MemoryFact {
  id: string;
  type: 'fact' | 'preference' | 'goal' | 'pattern' | 'correction' | 'important';
  text: string;
  confidence: number;
  mentions: number;
  lastSeen: number;
  tags: string[];
  source?: 'auto' | 'manual';
}

const KEY = 'jarvis_cross_memory';
const MANUAL_KEY = 'jarvis_manual_memories';
const MAX_FACTS = 300;

export function loadMemoryFacts(): MemoryFact[] {
  if (typeof window === 'undefined') return [];
  try {
    const auto = JSON.parse(localStorage.getItem(KEY) || '[]');
    const manual = JSON.parse(localStorage.getItem(MANUAL_KEY) || '[]');
    return [...manual, ...auto];
  } catch { return []; }
}

function saveAutoFacts(facts: MemoryFact[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(facts.slice(-MAX_FACTS)));
    saveToIDB(facts.slice(-MAX_FACTS)).catch(() => {});
  } catch {}
}

export function saveManualMemory(text: string) {
  if (typeof window === 'undefined') return;
  try {
    const list = JSON.parse(localStorage.getItem(MANUAL_KEY) || '[]');
    list.unshift({
      id: `manual_${Date.now()}`,
      type: 'important',
      text,
      confidence: 1.0,
      mentions: 1,
      lastSeen: Date.now(),
      tags: ['manual'],
      source: 'manual',
    });
    localStorage.setItem(MANUAL_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {}
}

export function deleteMemory(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const auto = JSON.parse(localStorage.getItem(KEY) || '[]').filter((f: MemoryFact) => f.id !== id);
    const manual = JSON.parse(localStorage.getItem(MANUAL_KEY) || '[]').filter((f: MemoryFact) => f.id !== id);
    localStorage.setItem(KEY, JSON.stringify(auto));
    localStorage.setItem(MANUAL_KEY, JSON.stringify(manual));
  } catch {}
}

export function clearAllMemory() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
  localStorage.removeItem(MANUAL_KEY);
}

async function saveToIDB(facts: MemoryFact[]) {
  return new Promise<void>((resolve, reject) => {
    const req = indexedDB.open('JarvisDB', 3);
    req.onupgradeneeded = e => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('memory')) db.createObjectStore('memory');
    };
    req.onsuccess = e => {
      const db = (e.target as IDBOpenDBRequest).result;
      const tx = db.transaction('memory', 'readwrite');
      tx.objectStore('memory').put(facts, 'facts');
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => reject();
    };
    req.onerror = () => reject();
  });
}

export async function loadFromIDB(): Promise<MemoryFact[]> {
  return new Promise(resolve => {
    const req = indexedDB.open('JarvisDB', 3);
    req.onsuccess = e => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('memory')) { db.close(); resolve([]); return; }
      const tx = db.transaction('memory', 'readonly');
      const gr = tx.objectStore('memory').get('facts');
      gr.onsuccess = () => { db.close(); resolve(gr.result || []); };
      gr.onerror = () => { db.close(); resolve([]); };
    };
    req.onerror = () => resolve([]);
  });
}

// ── Auto-extract important facts from conversations ──────────────
export function extractAndStoreFacts(userMsg: string, aiResponse: string) {
  const facts = JSON.parse((typeof window !== 'undefined' ? localStorage.getItem(KEY) : null) || '[]') as MemoryFact[];
  const u = userMsg.toLowerCase();

  // Personal info
  const nameMatch = userMsg.match(/(?:mera naam|my name is|main|I am|I'm)\s+([A-Z][a-z]+)/i);
  if (nameMatch) upsertFact(facts, { type:'fact', text:`User ka naam ${nameMatch[1]} hai`, confidence:0.9, tags:['name','personal'], source:'auto' });

  const locMatch = userMsg.match(/(?:main|I|mujhe)\s+(?:rahta|rehta|stay|live|from)\s+(?:hoon|hun|in|at)?\s*([A-Za-z]+(?:\s[A-Za-z]+)?)/i);
  if (locMatch) upsertFact(facts, { type:'fact', text:`User ${locMatch[1]} mein rehta hai`, confidence:0.85, tags:['location','personal'], source:'auto' });

  // Age
  const ageMatch = userMsg.match(/(?:meri age|my age|main)\s+(\d{1,2})\s*(?:saal|year|ka|ki)/i);
  if (ageMatch) upsertFact(facts, { type:'fact', text:`User ki age ${ageMatch[1]} saal hai`, confidence:0.9, tags:['age','personal'], source:'auto' });

  // Exams / Education
  const examMatch = u.match(/(neet|jee|upsc|gate|cat|board|12th|10th|clat|ssc|ias|mba|btech|mbbs)/);
  if (examMatch) upsertFact(facts, { type:'goal', text:`User ${examMatch[1].toUpperCase()} exam prepare kar raha hai`, confidence:0.85, tags:['exam','goal'], source:'auto' });

  // Hobbies
  const hobbyMatch = u.match(/(cricket|football|gaming|music|drawing|photography|cooking|gym|yoga|running|coding|reading|chess|badminton)/);
  if (hobbyMatch) upsertFact(facts, { type:'preference', text:`User ko ${hobbyMatch[1]} pasand hai`, confidence:0.7, tags:['hobby','interest'], source:'auto' });

  // Goal statement
  const goalMatch = userMsg.match(/(?:mera goal|my goal|chahta hoon|want to become|banna chahta)\s+(.{5,50})/i);
  if (goalMatch) upsertFact(facts, { type:'goal', text:`User ka goal: ${goalMatch[1].trim()}`, confidence:0.8, tags:['goal','personal'], source:'auto' });

  // Project tracking
  if (u.match(/jarvis|apple10|vercel|deploy|push|github/))
    upsertFact(facts, { type:'pattern', text:'User JARVIS AI app build kar raha hai (apple10.vercel.app)', confidence:0.95, tags:['project','tech'], source:'auto' });

  // Tech stack
  const techMatch = u.match(/(javascript|python|react|nextjs|typescript|flutter|android|ios|tailwind|vercel|supabase|firebase)/i);
  if (techMatch) upsertFact(facts, { type:'preference', text:`User ${techMatch[1]} use karta hai`, confidence:0.8, tags:['tech'], source:'auto' });

  // Auto-save important AI-mentioned things from AI response
  const importantPatterns = [
    /remember that ([^.!?\n]{10,80})/i,
    /important(?:ly)?: ([^.!?\n]{10,80})/i,
    /note that ([^.!?\n]{10,80})/i,
    /yaad raho? ([^.!?\n]{10,80})/i,
  ];
  for (const pat of importantPatterns) {
    const m = aiResponse.match(pat);
    if (m) upsertFact(facts, { type:'important', text:`AI ne kaha: ${m[1].trim()}`, confidence:0.7, tags:['ai-note'], source:'auto' });
  }

  // Food preferences
  const foodMatch = u.match(/(veg|vegetarian|non-veg|chicken|paneer|dal|biryani|healthy food)/i);
  if (foodMatch) upsertFact(facts, { type:'preference', text:`User ko ${foodMatch[1]} pasand hai`, confidence:0.7, tags:['food'], source:'auto' });

  // Sleep patterns
  if (u.match(/neend nahi|insomnia|raat ko|late night|2 baje|3 baje/))
    upsertFact(facts, { type:'pattern', text:'User ka sleep pattern irregular hai — late night active', confidence:0.65, tags:['health','sleep'], source:'auto' });

  // Mood tracking
  const moodMatch = u.match(/(bahut khush|very happy|depressed|stressed|anxious|motivated|confident)/i);
  if (moodMatch) upsertFact(facts, { type:'pattern', text:`User ka recent mood: ${moodMatch[1]}`, confidence:0.6, tags:['mood'], source:'auto' });

  // Language preference
  if (userMsg.match(/[\u0900-\u097F]/))
    upsertFact(facts, { type:'preference', text:'User Hindi/Hinglish mein baat karta hai', confidence:0.9, tags:['language'], source:'auto' });

  saveAutoFacts(facts);
}

function upsertFact(facts: MemoryFact[], input: Omit<MemoryFact, 'id'|'mentions'|'lastSeen'>) {
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
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      mentions: 1,
      lastSeen: Date.now(),
    });
  }
}

function similarity(a: string, b: string): number {
  const wa = new Set(a.toLowerCase().split(/\s+/));
  const wb = new Set(b.toLowerCase().split(/\s+/));
  let overlap = 0;
  wa.forEach(w => { if (wb.has(w)) overlap++; });
  return overlap / Math.max(wa.size, wb.size);
}

export function getRelevantMemories(query: string, limit = 8): string[] {
  const facts = loadMemoryFacts();
  if (!facts.length) return [];
  const q = query.toLowerCase().split(/\s+/);
  return facts
    .filter(f => f.confidence >= 0.5)
    .map(f => ({ ...f, score: q.filter(w => f.text.toLowerCase().includes(w)).length * f.confidence * (f.mentions * 0.1 + 1) + (f.source === 'manual' ? 2 : 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(f => f.text);
}

export function getProactiveSuggestion(): string | null {
  const facts = loadMemoryFacts();
  const hour = new Date().getHours();
  const patterns = facts.filter(f => f.type === 'pattern');
  if (hour >= 7 && hour <= 9 && patterns.some(p => p.text.includes('exam')))
    return '📚 Subah hai — aaj ka study session shuru karein?';
  if ((hour >= 23 || hour <= 2) && patterns.some(p => p.text.includes('raat')))
    return '🌙 Raat ko active ho — kya kaam chal raha hai?';
  return null;
}

export function getMemorySummary(): string {
  const facts = loadMemoryFacts();
  if (!facts.length) return 'Abhi koi memory nahi — baat karte raho toh seekhta jaaunga!';
  const manual = facts.filter(f => f.source === 'manual');
  const auto = facts.filter(f => f.source !== 'manual');
  let out = '🧠 **Mujhe yaad hai:**\n\n';
  if (manual.length) out += `📌 **Manually saved (${manual.length}):**\n` + manual.slice(0,5).map(f=>`• ${f.text}`).join('\n') + '\n\n';
  if (auto.length) out += `🤖 **Auto-learned (${auto.length}):**\n` + auto.sort((a,b)=>b.mentions-a.mentions).slice(0,8).map(f=>`• ${f.text} (${Math.round(f.confidence*100)}%)`).join('\n');
  return out;
}
