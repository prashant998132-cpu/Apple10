'use client';

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
    name: 'Bhai',
    location: '',
    goal: '',
    age: '',
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
    english: 'Speak in English. Keep it conversational and friendly.',
  };
  const lang = langMap[profile.language] || langMap.hinglish;
  const name = profile.name || 'Bhai';
  let sys = `Tu JARVIS hai — ${name} ka personal AI assistant. ${lang}`;
  if (profile.goal) sys += ` ${name} ka goal hai: ${profile.goal}.`;
  if (profile.location) sys += ` ${name} ${profile.location} mein rehta hai.`;
  if (profile.customInstructions) sys += `\n\nCustom instructions: ${profile.customInstructions}`;
  return sys;
}
