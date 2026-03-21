'use client';

// JARVIS Smart Profile — AI knows who you are
export interface JARVISProfile {
  name: string;
  location: string;
  goal: string;
  age: string;
  customInstructions: string;
  language: string;
  responseLength: string;
  temperature: number;
}

export function loadProfile(): JARVISProfile {
  if (typeof window === 'undefined') return getDefaultProfile();
  try {
    const saved = localStorage.getItem('jarvis_profile');
    if (saved) return { ...getDefaultProfile(), ...JSON.parse(saved) };
  } catch {}
  return getDefaultProfile();
}

function getDefaultProfile(): JARVISProfile {
  return {
    name: 'Prashant',
    location: 'Maihar, Madhya Pradesh',
    goal: 'NEET',
    age: '22',
    customInstructions: '',
    language: 'hinglish',
    responseLength: 'balanced',
    temperature: 0.7,
  };
}

export function buildSystemPrompt(profile: JARVISProfile): string {
  const langMap: Record<string, string> = {
    hinglish: 'Hinglish (Hindi + English mix) mein baat karo. Friendly aur casual raho.',
    hindi: 'Sirf Hindi mein baat karo. Formal nahi, dost jaisa.',
    english: 'Speak in English. Be casual and friendly.',
  };

  const lengthMap: Record<string, string> = {
    brief: 'Bahut short jawab do — 1-3 sentences. Sirf zaroorat ki baat.',
    balanced: 'Medium length jawab do — na bahut lamba, na bahut chhota.',
    detailed: 'Detailed jawab do. Explain karo, examples do.',
  };

  const timeNow = new Date();
  const hour = timeNow.getHours();
  const greeting = hour < 12 ? 'subah' : hour < 17 ? 'dopahar' : hour < 21 ? 'shaam' : 'raat';

  return `Tu JARVIS hai — ${profile.name} ka personal AI assistant. Abhi ${greeting} hai.

USER INFO:
- Naam: ${profile.name}
- Location: ${profile.location}  
- Goal: ${profile.goal}
- Umar: ${profile.age} saal

BAAT KARNE KA STYLE:
${langMap[profile.language] || langMap['hinglish']}
${lengthMap[profile.responseLength] || lengthMap['balanced']}

JARVIS KE RULES:
- ${profile.name} ko "bhai" ya name se bulao
- Proactive raho — suggestions do
- India-relevant info do (INR, Hindi dates, India context)
- Kabhi boring mat bano
- Goal (${profile.goal}) ke liye helpful raho
- Emojis thode use karo — har sentence mein nahi

${profile.customInstructions ? `SPECIAL INSTRUCTIONS:\n${profile.customInstructions}` : ''}

Aaj bhi full energy se ready hai JARVIS! 🤖`;
}

export function getTemperature(): number {
  try {
    const saved = localStorage.getItem('jarvis_profile');
    if (saved) return JSON.parse(saved).temperature || 0.7;
  } catch {}
  return 0.7;
}
