'use client';

export type PersonalityMode = 'default' | 'fun' | 'serious' | 'motivational' | 'sarcastic' | 'roast' | 'philosopher' | 'teacher' | 'study' | 'code';

function buildPrompts(n: string): Record<PersonalityMode, string> {
  return {
    default:      'Tu JARVIS hai — ' + n + ' ka personal AI. Hinglish mein baat kar. Helpful, smart, thoda witty.',
    fun:          'Tu JARVIS hai — full entertainment mode! Emojis use kar, jokes maar, masti kar. ' + n + ' ke saath party mode mein hai.',
    serious:      'Tu JARVIS hai — professional mode. Clean, concise, no emojis. Facts aur solutions sirf.',
    motivational: 'Tu JARVIS hai — motivational guru mode! Iron Man + bhai ki tarah inspire kar. ' + n + ' ko charge kar!',
    sarcastic:    'Tu JARVIS hai — witty sarcasm mode. Sarcastically helpful — but actually helpful bhi.',
    roast:        'Tu JARVIS hai — roast mode! Friendly roast kar ' + n + ' ko. Lovingly savage.',
    philosopher:  'Tu JARVIS hai — philosopher mode. Deep questions, Hindi quotes. Stoic + Indian wisdom.',
    teacher:      'Tu JARVIS hai — teacher mode. Explain with examples, step-by-step.',
    study:        'Tu JARVIS hai — ' + n + ' ka dedicated study companion. Concepts clearly samjhao, memory tricks do, MCQ practice karo. NEET/JEE/Board exams ke liye optimized. Diagrams text se banao. Formulas bold karo. Short tricks aur mnemonics dete raho.',
    code:         'Tu JARVIS hai — senior developer mode. ' + n + ' ke code review, debug, aur architecture decisions mein help karo. TypeScript/React/Next.js/Python expert. Hamesha code blocks use karo. Best practices batao, edge cases highlight karo, performance tips do.',
  };
}

export function detectEmotion(text: string): string {
  const t = text.toLowerCase();
  if (t.match(/sad|dukhi|udaas|rona|cry|depressed|bura lag|hurt|lonely/)) return 'sad';
  if (t.match(/angry|gussa|frustrated|pareshan|irritated/)) return 'frustrated';
  if (t.match(/excited|khush|happy|amazing|great|excellent|mast/)) return 'happy';
  if (t.match(/scared|darr|nervous|anxious|tension|worried|chinta/)) return 'anxious';
  if (t.match(/bored|boring|kuch nahi|timepass/)) return 'bored';
  if (t.match(/love|pyaar|romance|cute|sweet|crush/)) return 'romantic';
  if (t.match(/stress|pressure|deadline|exam|test|interview/)) return 'stressed';
  return 'neutral';
}

export function detectConversationMode(text: string): string {
  const t = text.toLowerCase();
  if (t.match(/code|function|error|debug|programming|javascript|python|react|typescript|nextjs/)) return 'technical';
  if (t.match(/feel|sad|happy|anxious|love|miss|hurt|lonely/)) return 'emotional';
  if (t.match(/news|current|latest|today|abhi|update|kya hua/)) return 'news';
  if (t.match(/weather|mausam|temperature|rain|barish/)) return 'weather';
  if (t.match(/music|song|gaana|play|spotify|youtube/)) return 'entertainment';
  if (t.match(/neet|jee|board|physics|chemistry|biology|math|exam|mcq|question/)) return 'study';
  return 'general';
}

export function detectThinkMode(text: string, current: string): string {
  if (current !== 'auto') return current;
  const t = text.toLowerCase();
  if (t.match(/why|explain|analyze|compare|difference|kyu|kyun|samjhao/)) return 'think';
  if (t.match(/research|deep dive|comprehensive|elaborate|sab kuch batao/)) return 'deep';
  if (t.match(/quick|fast|jaldi|brief|short|ek line/)) return 'flash';
  return 'auto';
}

export function generateSessionTitle(messages: Array<{role:string;content:string}>): string {
  const first = messages.find(m => m.role === 'user')?.content || '';
  return first.slice(0, 40) + (first.length > 40 ? '...' : '') || 'Naya Chat';
}

export function quickTitle(text: string): string {
  return text.slice(0, 35) + (text.length > 35 ? '...' : '');
}

export function getSystemPrompt(
  personality: PersonalityMode | string,
  profile: any,
  memories: string[],
  emotion: string,
  hour: number,
  toolResults?: string[]
): string {
  const name = profile?.name || 'Bhai';
  const dynPrompts = buildPrompts(name);
  const p = dynPrompts[personality as PersonalityMode] || dynPrompts.default;
  const timeCtx = hour < 12 ? 'Subah' : hour < 17 ? 'Dopahar' : hour < 21 ? 'Shaam' : 'Raat';

  const emotionCtx: Record<string, string> = {
    sad:        'User thoda sad lag raha hai — extra supportive aur empathetic reh.',
    frustrated: 'User frustrated hai — calm, solution-focused reh.',
    happy:      'User khush hai — match their energy!',
    anxious:    'User nervous/anxious hai — reassuring aur grounding reh.',
    stressed:   'User stressed hai — practical help aur reassurance de.',
    bored:      'User bored hai — engaging, interesting content de.',
  };

  const locationStr = profile?.location ? `, ${profile.location}` : '';
  const goalStr = profile?.goal ? ` | Goal: ${profile.goal}` : '';
  let sys = p + '\n\nUser: ' + name + '. Time: ' + timeCtx + ' IST' + locationStr + goalStr + '.';

  if (emotion !== 'neutral' && emotionCtx[emotion]) {
    sys += '\n\nContext: ' + emotionCtx[emotion];
  }

  if (profile?.customInstructions) {
    sys += '\n\nUser ki custom instructions: ' + profile.customInstructions;
  }

  if (memories.length > 0) {
    sys += '\n\n**User ke baare mein yaad hai:**\n' + memories.slice(0, 12).map(m => '- ' + m).join('\n');
  }

  if (toolResults && toolResults.length > 0) {
    sys += '\n\n**Real-time Data (tools se mila):**\n' + toolResults.join('\n\n');
    sys += '\n\nYeh tool data use karke answer de. Data ko natural conversation mein weave kar.';
  }

  sys += '\n\nRules:\n- Hinglish preferred (English + Hindi mix)\n- Concise but complete\n- Never say "As an AI..." — tu JARVIS hai\n- Tool data agar hai toh use it, fabricate mat kar\n- Markdown formatting use kar (bold, bullets, code blocks)';

  return sys;
}

export function keywordFallback(query: string): string {
  const q = query.toLowerCase();
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Subah' : hour < 17 ? 'Dopahar' : hour < 21 ? 'Shaam' : 'Raat';
  if (q.match(/hello|hi|hey|namaste|hii/)) return greet + ' Bhai! Main JARVIS hoon — kya help chahiye?';
  if (q.match(/how are|kaise ho|kaisa/)) return 'Main ekdum mast hoon Bhai! Tum batao — kya chal raha hai?';
  if (q.match(/time|kitne baje/)) {
    return 'Abhi ' + new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) + ' ho rahi hai (IST)';
  }
  if (q.match(/thanks|shukriya|dhanyawad/)) return 'Koi baat nahi Bhai! Sada tumhari seva mein 🙏';
  if (q.match(/bye|alvida|baad mein/)) return 'Alvida Bhai! Agar kuch chahiye toh bulana 👋';
  return 'Main samjha nahi bhai. Thoda aur detail mein batao?';
}
