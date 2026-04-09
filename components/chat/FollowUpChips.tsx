'use client';
import { useMemo } from 'react';
import { Message } from './ChatInterface';

// ── Context-aware chips ───────────────────────────────────────
const CHIPS: Record<string, string[]> = {
  weather:    ['Kal ka forecast?', 'Is hafte barish?', 'AQI kitna hai?', 'Humidity?'],
  crypto:     ['Bitcoin buy karna chahiye?', 'Ethereum trend?', 'Gold vs Crypto?', 'Portfolio?'],
  finance:    ['SIP calculator chalao', 'Gold ka rate?', 'EMI calculate karo', 'Best investment?'],
  image:      ['Alag style mein banao', 'Dark version?', 'Realistic karo', '4K version?'],
  code:       ['Line by line explain', 'Optimize karo', 'Test cases likho', 'Bug dhundho'],
  news:       ['Aur khabar?', 'Background batao', 'India pe impact?', 'Source kya hai?'],
  neet:       ['MCQ practice karo', 'Aur explain karo', 'Diagram se samjhao', 'Formula shortcut?'],
  study:      ['Quiz lo mujhe', 'Ek aur example', 'Simple karo', 'Trick batao'],
  motivation: ['Action plan banao', 'Ek aur quote', 'Aaj ka schedule?', 'Goal remind karo'],
  health:     ['Diet tips do', 'Exercise routine?', 'BMI calculate karo', 'Aur tips?'],
  cooking:    ['Ingredients batao', 'Healthy version?', 'Step by step?', 'Aur recipe?'],
  travel:     ['Budget batao', 'Best season?', 'Hotels suggest karo', 'Aur places?'],
  math:       ['Step by step karo', 'Aur example do', 'Formula kya hai?', 'Practice problem?'],
  history:    ['Timeline do', 'Impact kya tha?', 'Aur batao', 'Map explain karo?'],
  default:    ['Aur detail mein', 'Example do', 'Hindi mein batao', 'Ek line summary'],
};

// Time-based suggestions for first message / empty state
const TIME_CHIPS: Record<string, Array<{icon:string; text:string}>> = {
  morning: [
    {icon:'🌤️', text:'Aaj ka mausam kaisa hai?'},
    {icon:'📰', text:'Aaj ki top news kya hai?'},
    {icon:'💪', text:'Morning motivation do'},
    {icon:'📋', text:'Aaj ka plan banao mera'},
  ],
  afternoon: [
    {icon:'💰', text:'Bitcoin aur gold ka rate?'},
    {icon:'🧠', text:'Kuch interesting batao'},
    {icon:'🎯', text:'Productivity tip do'},
    {icon:'⚡', text:'Quick quiz lo mujhse'},
  ],
  evening: [
    {icon:'📰', text:'Shaam ki news kya hai?'},
    {icon:'🍽️', text:'Dinner recipe suggest karo'},
    {icon:'😌', text:'Ek relaxing quote do'},
    {icon:'📊', text:'Aaj ka crypto rate?'},
  ],
  night: [
    {icon:'🌙', text:'Neend aane ke tips do'},
    {icon:'📋', text:'Kal ka plan banao'},
    {icon:'🧘', text:'Relaxation technique batao'},
    {icon:'⭐', text:'Koi interesting fact batao'},
  ],
};

function getTimeSlot(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

function detectCategory(content: string): string {
  const t = content.toLowerCase();
  if (t.match(/°c|mausam|humidity|forecast|rain|temperature|aqi|barish/)) return 'weather';
  if (t.match(/btc|eth|sol|crypto|bitcoin|ethereum|coin|₿/)) return 'crypto';
  if (t.match(/gold|silver|sip|emi|invest|finance|mutual fund|sensex|nifty/)) return 'finance';
  if (t.match(/image\.|png|jpg|generate|pollinations|dall-e|stable diffusion/)) return 'image';
  if (t.match(/```|function|const|def |class |import |error:|bug|code|syntax/)) return 'code';
  if (t.match(/news|khabar|headline|report|breaking/)) return 'news';
  if (t.match(/neet|jee|mcq|physics|chemistry|biology|anatomy|physiology/)) return 'neet';
  if (t.match(/study|topic|concept|learn|explain|formula|theorem|ncert/)) return 'study';
  if (t.match(/motivat|inspire|goal|dream|hustle|success|discipline/)) return 'motivation';
  if (t.match(/bmi|calori|diet|exercise|health|fitness|workout|protein/)) return 'health';
  if (t.match(/recipe|khana|cook|banana|ingredient|dal|sabzi|dish/)) return 'cooking';
  if (t.match(/travel|trip|tour|hotel|flight|visa|tourist|yatra/)) return 'travel';
  if (t.match(/\\|equation|matrix|calculus|integral|derivative|limit|vector/)) return 'math';
  if (t.match(/history|itihas|war|empire|mughal|british|independence|revolution/)) return 'history';
  return 'default';
}

interface Props { lastMessage: Message; onSelect: (text: string) => void; isFirst?: boolean; }

export default function FollowUpChips({ lastMessage, onSelect, isFirst }: Props) {
  const { chips, isTimeChips } = useMemo(() => {
    if (isFirst) {
      return { chips: TIME_CHIPS[getTimeSlot()], isTimeChips: true };
    }
    if (lastMessage.role !== 'assistant' || !lastMessage.content || lastMessage.content.length < 20) {
      return { chips: null, isTimeChips: false };
    }
    const cat = detectCategory(lastMessage.content);
    return { chips: (CHIPS[cat] || CHIPS.default).map(t => ({icon:'', text:t})), isTimeChips: false };
  }, [lastMessage, isFirst]);

  if (!chips) return null;

  return (
    <div style={{ display:'flex', gap:7, flexWrap:'wrap', padding:'2px 0 6px' }} className="fade-in">
      {(chips as Array<{icon:string;text:string}>).slice(0,4).map(chip => (
        <button key={chip.text} onClick={() => onSelect(chip.text)}
          style={{
            fontSize: 12, padding: '6px 13px', borderRadius: 99,
            border: '1px solid rgba(59,130,246,0.25)',
            color: '#93c5fd', background: 'rgba(59,130,246,0.06)',
            cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: chip.icon ? 5 : 0,
          }}
          onTouchStart={e=>(e.currentTarget.style.background='rgba(59,130,246,0.18)')}
          onTouchEnd={e=>(e.currentTarget.style.background='rgba(59,130,246,0.06)')}
          onMouseEnter={e=>(e.currentTarget.style.background='rgba(59,130,246,0.15)')}
          onMouseLeave={e=>(e.currentTarget.style.background='rgba(59,130,246,0.06)')}>
          {chip.icon && <span style={{fontSize:14}}>{chip.icon}</span>}
          {chip.text}
        </button>
      ))}
    </div>
  );
}
