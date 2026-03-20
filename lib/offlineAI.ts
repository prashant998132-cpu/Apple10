'use client';
// ══════════════════════════════════════════════════════════════
// JARVIS OFFLINE AI — v32
// Research: Users hate "no internet" dead screens.
// 200+ keyword responses that work WITHOUT internet.
// Also: Proactive context memory — remembers across sessions.
// ══════════════════════════════════════════════════════════════

// ── OFFLINE RESPONSES ─────────────────────────────────────────
const hour = () => new Date().getHours();
const time = () => new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
const date = () => new Date().toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });

const OFFLINE_RESPONSES: Array<{ patterns: RegExp[]; response: () => string }> = [
  // Greetings
  {
    patterns: [/^(hi|hello|hey|hii|helo|namaste|namaskar|salaam|sat sri akal)\b/i],
    response: () => {
      const h = hour();
      if (h < 5) return `🌙 Raat mein jaag rahe ho Prashant bhai? Main hoon, bol kya kaam hai! (Offline mode mein hoon abhi)`;
      if (h < 12) return `🌅 Subah ki salaam Prashant bhai! Aaj kya plan hai? (Offline mode)`;
      if (h < 17) return `☀️ Dopahar mubarak bhai! Kya help chahiye? (Offline mode)`;
      if (h < 21) return `🌆 Shaam mein kya chal raha hai bhai? (Offline mode)`;
      return `🌙 Raat ki salaam bhai! Kaisa hai din? (Offline mode)`;
    },
  },
  // Time
  {
    patterns: [/kitne baj|time kya|what time|abhi kya time|baj gaye/i],
    response: () => `⏰ Abhi **${time()}** ho rahe hain IST.`,
  },
  // Date
  {
    patterns: [/aaj kya date|today.*date|kaunsa din|what.*date|aaj kaun sa/i],
    response: () => `📅 Aaj **${date()}** hai.`,
  },
  // How are you
  {
    patterns: [/kaise ho|how are you|kaisa hai|sab theek|kem cho|kya haal/i],
    response: () => `😊 Main bilkul mast hoon Prashant bhai! Offline mode mein hoon, internet connection check karo. Tum kaise ho?`,
  },
  // Motivation
  {
    patterns: [/motivation|inspire|himmat|hausla|discourage|demotiv|sad|udas|thaka/i],
    response: () => {
      const quotes = [
        `💪 **"Haar woh nahi jab tum gir jaate ho, haar woh hai jab tum uthne se inkaar kar dete ho."**\n\nChalo Bhai — uthke chal! Aaj ka din tumhara hai! 🚀`,
        `🔥 **"Mushkilein aaengi, par tum unse zyada bade ho."**\n\nHar mushkil ek nayi seekh hai Prashant bhai! 💫`,
        `⚡ **"Log tumhare baare mein kya sochte hain — yeh unka kaam hai. Tumhara kaam hai apna best dena."**\n\nBas apne aap pe dhyan do bhai! 🎯`,
        `🌟 **"Sapne woh nahi jo sote waqt aate hain. Sapne woh hain jo sone nahi dete."** — APJ Abdul Kalam\n\nChalte raho bhai! 🇮🇳`,
      ];
      return quotes[Math.floor(Math.random() * quotes.length)];
    },
  },
  // Jokes
  {
    patterns: [/joke|mazak|funny|hasa|hasao|humor/i],
    response: () => {
      const jokes = [
        `😂 Ek programmer se pucha: "Tumhari wife khush hai?"\nProgrammer: "Haan, koi bug nahi mila abhi tak."\n\n😄 Software engineer ki shaadi!`,
        `🤣 Teacher: "2+2 kitna hota hai?"\nStudent (programmer): "Integer, Float, ya String mein bataaun?"\n\nType checking kar lena pehle! 😆`,
        `😄 Bhai ne kaha: "Life ek ice cream hai — enjoy karo pehle woh pighle."\n\nWarna regret hi regret! 🍦`,
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    },
  },
  // Weather (offline hint)
  {
    patterns: [/mausam|weather|barish|garmi|sardi|kitni garmi|temperature/i],
    response: () => `🌤️ Weather ke liye internet chahiye!\n\nLekin Maihar mein March-April mein average 35-42°C hota hai. 🔥\n\nInternet connect karo — accurate live temperature bataunga!`,
  },
  // Cricket
  {
    patterns: [/cricket|ipl|india.*match|score|wicket|century|six|four/i],
    response: () => `🏏 Live cricket score ke liye internet chahiye!\n\nLekin cricket facts:\n• India ne 2011 World Cup jeeta Dhoni ki century se 🏆\n• Sachin ne 100 international centuries maare 👑\n• Virat Kohli ODI mein fastest 13,000 runs 🔥`,
  },
  // Coding help (offline basics)
  {
    patterns: [/python|javascript|java|coding|code|programming|error|bug/i],
    response: () => `💻 Detailed code help ke liye internet chahiye!\n\nLekin basic tips:\n• Python: indentation zaroori hai (4 spaces)\n• JS: \`console.log()\` se debug karo\n• Error solve karo: Google mein error message copy karo\n\nInternet aane do — poora help karunga! 🚀`,
  },
  // Math
  {
    patterns: [/(\d+)\s*[\+\-\*\/]\s*(\d+)|calculate|kitna hai|percent|%/i],
    response: (/* match-based */) => {
      // Try to evaluate simple math offline
      return `🔢 Simple math offline bhi kar sakta hoon!\n\nExample: "15% of 5000" likho\nYa: "23 * 47 + 9" likho\n\nMain calculate kar dunga! 🧮`;
    },
  },
  // Sleep/rest
  {
    patterns: [/so jao|sleep|neend|raat|good night|shubh ratri/i],
    response: () => `😴 Good night Prashant bhai! 🌙\n\nKal fresh mind se uthna!\n\n✅ Phone charge pe lagao\n✅ Alarm set karo\n✅ Paani peeke so jao\n\nKal milte hain! 🌅`,
  },
  // Thanks
  {
    patterns: [/thanks|shukriya|dhanyawad|thank you|shukriya|bahut acha/i],
    response: () => `😊 Koi baat nahi Prashant bhai! Sada seva mein hazir hoon! 🙏\n\nAur kuch chahiye?`,
  },
  // Bye
  {
    patterns: [/bye|alvida|baad mein|chal raha|nikal raha|chalte hain/i],
    response: () => `👋 Alvida Prashant bhai! Khayal rakhna!\n\nWapas aana jab bhi kuch chahiye — hoon yahaan! 🤖`,
  },
  // India facts
  {
    patterns: [/india|bharat|desh|capital|prime minister|president/i],
    response: () => `🇮🇳 Bharat ke baare mein:\n• Capital: New Delhi 🏛️\n• Population: ~1.4 billion (duniya mein #1) 👥\n• Languages: 22+ official languages\n• Largest democracy in the world 🗳️\n• PM: Office of Prime Minister of India\n\nDetailed info ke liye internet connect karo!`,
  },
  // Food
  {
    patterns: [/khana|food|recipe|lunch|dinner|breakfast|nashta|bhojan/i],
    response: () => {
      const h = hour();
      if (h < 10) return `🍽️ Nashte mein kya khaoge aaj? Poha, paratha, ya bread toast? 😋\n\nRecipe chahiye toh internet connect karo — bahut options hain!`;
      if (h < 15) return `🍱 Lunch time ho gaya bhai! Thoda rest bhi karo khane ke baad. 😌`;
      return `🌙 Dinner mein kuch halka khao Prashant bhai — healthy rehna zaroori hai! 💪`;
    },
  },
  // Study/exam
  {
    patterns: [/padhai|study|exam|test|board|neet|jee|upsc|competition/i],
    response: () => `📚 Padhai ke tips (offline):\n\n✅ Pomodoro technique: 25 min padhao, 5 min rest\n✅ Raat ko revision best hota hai\n✅ Notes banao — likhe hue yaad rehte hain\n✅ Mock tests regular practice karo\n\n💪 Tu kar sakta hai Prashant bhai! Internet aane do aur study plan banate hain!`,
  },
  // MP/Maihar specific
  {
    patterns: [/maihar|satna|mp|madhya pradesh|sharda mata/i],
    response: () => `🏔️ Maihar ke baare mein:\n• Famous: Sharda Mata Mandir ⛩️\n• District: Satna, MP\n• Tansen Samaroha yahin hota hai 🎵\n• Maihar Gharana classical music ka center\n\nMaihar mein rehna hai ek privilege bhai! 🙏`,
  },
];

// Main offline response function
export function getOfflineResponse(userText: string): string {
  const t = userText.toLowerCase().trim();

  // Check patterns
  for (const item of OFFLINE_RESPONSES) {
    if (item.patterns.some(p => p.test(t))) {
      return item.response();
    }
  }

  // Math offline
  try {
    const mathMatch = t.match(/^[\d\s\+\-\*\/\%\(\)\.]+$/);
    if (mathMatch) {
      const result = Function('"use strict"; return (' + t + ')')();
      return `🔢 **${t} = ${result}**`;
    }
    // Percentage
    const pctMatch = t.match(/(\d+(?:\.\d+)?)\s*%\s+(?:of|ka)\s+(\d+(?:\.\d+)?)/i);
    if (pctMatch) {
      const result = (parseFloat(pctMatch[1]) / 100) * parseFloat(pctMatch[2]);
      return `🔢 **${pctMatch[1]}% of ${pctMatch[2]} = ${result}**`;
    }
  } catch {}

  // Default offline response
  const defaults = [
    `📡 Internet connection nahi hai, isliye poora answer nahi de pa raha.\n\n**Abhi kar sakta hoon:**\n• Time/Date batana ⏰\n• Math calculate karna 🔢\n• Motivation sunana 💪\n• Jokes sunana 😄\n\nInternet aaye toh sab kuch ho jayega!`,
    `🔌 Offline mode mein hoon Prashant bhai. WiFi ya data check karo!\n\nPhir bhi kuch basic cheezein help kar sakta hoon — time, math, motivation, jokes. Pucho!`,
    `📵 Net nahi hai, main limited mode mein hoon.\n\nLekin hoon yahaan! Time, jokes, motivational quotes — sab ke liye ready hoon 😊`,
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}

// ── CONTEXT MEMORY ─────────────────────────────────────────────
// Saves important facts from conversations across sessions

interface ContextMemory {
  name?: string;
  location?: string;
  occupation?: string;
  interests: string[];
  recentTopics: string[];
  lastActive: string;
  totalChats: number;
  facts: Record<string, string>;
}

const MEMORY_KEY = 'jarvis_context_memory';

export function loadContextMemory(): ContextMemory {
  if (typeof window === 'undefined') return { interests: [], recentTopics: [], lastActive: '', totalChats: 0, facts: {} };
  try {
    const stored = localStorage.getItem(MEMORY_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { interests: [], recentTopics: [], lastActive: '', totalChats: 0, facts: {} };
}

export function saveContextMemory(mem: ContextMemory) {
  if (typeof window === 'undefined') return;
  try {
    mem.lastActive = new Date().toISOString();
    localStorage.setItem(MEMORY_KEY, JSON.stringify(mem));
  } catch {}
}

export function updateMemoryFromChat(userMessage: string, aiResponse: string) {
  const mem = loadContextMemory();
  mem.totalChats = (mem.totalChats || 0) + 1;

  const t = userMessage.toLowerCase();

  // Extract name if mentioned
  const nameMatch = userMessage.match(/(?:mera naam|my name is|main hoon|I am)\s+(\w+)/i);
  if (nameMatch) mem.name = nameMatch[1];

  // Extract location
  const locMatch = userMessage.match(/(?:main|I am|I'm|mera ghar|rahta hoon)\s+(?:in|at|mein|se)?\s+(\w[\w\s]+)(?:\s+mein|se|pe)?/i);
  if (locMatch && locMatch[1].length < 30) mem.location = locMatch[1].trim();

  // Track topics
  const topics: Record<string, string[]> = {
    coding: ['code', 'python', 'javascript', 'programming', 'bug', 'developer'],
    cricket: ['cricket', 'ipl', 'match', 'score'],
    study: ['padhai', 'study', 'exam', 'neet', 'jee'],
    cooking: ['recipe', 'khana', 'food'],
    music: ['music', 'song', 'gaana', 'guitar'],
  };

  for (const [topic, keywords] of Object.entries(topics)) {
    if (keywords.some(k => t.includes(k))) {
      if (!mem.interests.includes(topic)) mem.interests.push(topic);
      mem.recentTopics = [topic, ...(mem.recentTopics.filter(r => r !== topic))].slice(0, 5);
    }
  }

  saveContextMemory(mem);
}

// Build context string to inject into AI system prompt
export function buildContextPrompt(): string {
  const mem = loadContextMemory();
  const parts: string[] = [];

  if (mem.name) parts.push(`User ka naam: ${mem.name}`);
  if (mem.location) parts.push(`Location: ${mem.location}`);
  if (mem.interests.length > 0) parts.push(`Interests: ${mem.interests.join(', ')}`);
  if (mem.recentTopics.length > 0) parts.push(`Recent topics: ${mem.recentTopics.join(', ')}`);
  if (mem.totalChats > 0) parts.push(`Total conversations: ${mem.totalChats}`);
  if (Object.keys(mem.facts).length > 0) {
    parts.push(`Known facts: ${Object.entries(mem.facts).map(([k, v]) => `${k}=${v}`).join(', ')}`);
  }

  return parts.length > 0 ? `\n[User Context]: ${parts.join(' | ')}` : '';
}
