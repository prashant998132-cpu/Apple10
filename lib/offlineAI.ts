'use client';

const hour = () => new Date().getHours();
const time = () => new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
const date = () => new Date().toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });

// ✅ FIX: naam profile se lo dynamically
function getUserName(): string {
  if (typeof window === 'undefined') return 'Bhai';
  try {
    const p = localStorage.getItem('jarvis_profile');
    if (p) { const parsed = JSON.parse(p); return parsed.name || 'Bhai'; }
  } catch {}
  return 'Bhai';
}

const OFFLINE_RESPONSES: Array<{ patterns: RegExp[]; response: () => string }> = [
  {
    patterns: [/^(hi|hello|hey|hii|helo|namaste|namaskar|salaam|sat sri akal)\b/i],
    response: () => {
      const n = getUserName(); const h = hour();
      if (h < 5) return `🌙 Raat mein jaag rahe ho ${n}? Main hoon, bol kya kaam hai! (Offline mode)`;
      if (h < 12) return `🌅 Subah ki salaam ${n}! Aaj kya plan hai? (Offline mode)`;
      if (h < 17) return `☀️ Dopahar mubarak ${n}! Kya help chahiye? (Offline mode)`;
      if (h < 21) return `🌆 Shaam mein kya chal raha hai ${n}? (Offline mode)`;
      return `🌙 Raat ki salaam ${n}! Kaisa hai din? (Offline mode)`;
    },
  },
  { patterns: [/kitne baj|time kya|what time|abhi kya time|baj gaye/i], response: () => `⏰ Abhi **${time()}** ho rahe hain IST.` },
  { patterns: [/aaj kya date|today.*date|kaunsa din|what.*date|aaj kaun sa/i], response: () => `📅 Aaj **${date()}** hai.` },
  { patterns: [/kaise ho|how are you|kaisa hai|sab theek|kem cho|kya haal/i], response: () => `😊 Main bilkul mast hoon ${getUserName()}! Offline mode mein hoon, internet check karo.` },
  {
    patterns: [/motivation|inspire|himmat|hausla|discourage|demotiv|sad|udas|thaka/i],
    response: () => {
      const n = getUserName();
      const quotes = [
        `💪 **"Haar woh nahi jab tum gir jaate ho, haar woh hai jab tum uthne se inkaar kar dete ho."**\n\nChalo ${n} — uthke chal! 🚀`,
        `🔥 **"Mushkilein aaengi, par tum unse zyada bade ho."**\n\nHar mushkil ek nayi seekh hai ${n}! 💫`,
        `🌟 **"Sapne woh nahi jo sote waqt aate hain. Sapne woh hain jo sone nahi dete."** — APJ Abdul Kalam\n\nChalte raho ${n}! 🇮🇳`,
      ];
      return quotes[Math.floor(Math.random() * quotes.length)];
    },
  },
  { patterns: [/thanks|shukriya|dhanyawad|thank you/i], response: () => `Koi baat nahi ${getUserName()}! Sada tumhari seva mein 🙏` },
  { patterns: [/bye|alvida|baad mein|good night|shubh ratri/i], response: () => `Alvida ${getUserName()}! Agar kuch chahiye toh bulana 👋` },
  { patterns: [/joke|funny|mazak|hasao/i], response: () => `😂 Ek baar ek programmer ne apni girlfriend se kaha: "Main tumse pyaar karta hoon."\nGirlfriend: "Yeh prove karo!"\nProgrammer: "It's true, I have no bugs in my feelings." 🐛❤️` },
  { patterns: [/battery|charge/i], response: () => `🔋 Battery status check karne ke liye internet chahiye. Abhi offline mode mein hoon.` },
  { patterns: [/weather|mausam|barish|garmi/i], response: () => `⛅ Mausam data lene ke liye internet chahiye. Thodi der mein try karo ${getUserName()}!` },
];

export function getOfflineResponse(query: string): string | null {
  const q = query.trim();
  for (const item of OFFLINE_RESPONSES) {
    if (item.patterns.some(p => p.test(q))) return item.response();
  }
  return null;
}

export function isLikelyOffline(): boolean {
  if (typeof navigator === 'undefined') return false;
  return !navigator.onLine;
}
