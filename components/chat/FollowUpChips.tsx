'use client';
import { useMemo } from 'react';
import { Message } from './ChatInterface';

const CHIPS: Record<string, string[]> = {
  weather:    ['Kal ka forecast?', 'Is hafte rain aayegi?', 'AQI kitna hai?'],
  crypto:     ['Bitcoin trend?', 'Buy karna chahiye?', 'Gold vs Crypto?'],
  image:      ['Alag style mein banao', 'Dark version?', 'Realistic banana hai'],
  code:       ['Explain karo line by line', 'Optimize kar sakte ho?', 'Test cases likhdo'],
  news:       ['Aur khabar?', 'Is issue ka background', 'India pe kya impact?'],
  study:      ['Quiz lo mujhe', 'Ek aur example do', 'MCQ practice karein'],
  motivation: ['Ek aur quote do', 'Action plan banao', 'Aaj ka schedule?'],
  finance:    ['SIP calculate karo', 'Gold ka rate?', 'Best investment?'],
  health:     ['Diet tips do', 'Exercise routine?', 'BMI calculate karo'],
  cooking:    ['Ingredients batao', 'Healthy version?', 'Aur recipe?'],
  default:    ['Aur detail mein', 'Example do', 'Hindi mein batao', 'Ek line mein'],
};

// Time-based morning suggestions
const TIME_CHIPS: Record<string, string[]> = {
  morning:   ['Aaj ka mausam?', 'Morning motivation do', 'Aaj ka plan banao'],
  afternoon: ['Kuch interesting batao', 'Productivity tip do', 'Quick quiz?'],
  evening:   ['Aaj kya news hai?', 'Relaxing quote do', 'Dinner recipe?'],
  night:     ['Neend ane ke tips', 'Kal ka plan banao', 'Relaxing story suno'],
};

function getTimeCategory(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

function detectCategory(content: string): string {
  const t = content.toLowerCase();
  if (t.match(/°c|mausam|humidity|forecast|rain|temperature|aqi/)) return 'weather';
  if (t.match(/btc|eth|sol|crypto|bitcoin|ethereum|price.*inr|₹|coin/)) return 'crypto';
  if (t.match(/gold|silver|sip|emi|invest|finance|mutual fund/)) return 'finance';
  if (t.match(/image\.|png|jpg|generate|pollinations|dall-e/)) return 'image';
  if (t.match(/```|function|const|def |class |import |error:|bug|code/)) return 'code';
  if (t.match(/news|khabar|headline|report/)) return 'news';
  if (t.match(/neet|study|topic|concept|learn|explain|formula|mcq|physics|chemistry|biology/)) return 'study';
  if (t.match(/motivat|inspire|goal|dream|kar sakte|believe|hustle/)) return 'motivation';
  if (t.match(/bmi|calori|diet|exercise|health|fitness|workout/)) return 'health';
  if (t.match(/recipe|khana|cook|banana|ingredient|dal|sabzi/)) return 'cooking';
  return 'default';
}

interface Props { lastMessage: Message; onSelect: (text: string) => void; isFirst?: boolean; }

export default function FollowUpChips({ lastMessage, onSelect, isFirst }: Props) {
  const chips = useMemo(() => {
    // If first message / welcome screen - show time-based suggestions
    if (isFirst) {
      return TIME_CHIPS[getTimeCategory()];
    }
    if (lastMessage.role !== 'assistant' || !lastMessage.content || lastMessage.content.length < 20) return null;
    return CHIPS[detectCategory(lastMessage.content)] || CHIPS.default;
  }, [lastMessage, isFirst]);

  if (!chips) return null;

  return (
    <div style={{ display:'flex', gap:7, flexWrap:'wrap', paddingBottom:4, paddingTop:2 }} className="fade-in">
      {chips.slice(0, 4).map(chip => (
        <button key={chip} onClick={() => onSelect(chip)}
          style={{
            fontSize:12, padding:'6px 13px', borderRadius:99,
            border:'1px solid rgba(59,130,246,0.25)',
            color:'#93c5fd', background:'rgba(59,130,246,0.06)',
            cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s',
            fontWeight:500,
          }}
          onTouchStart={e=>(e.currentTarget.style.background='rgba(59,130,246,0.18)')}
          onTouchEnd={e=>(e.currentTarget.style.background='rgba(59,130,246,0.06)')}
          onMouseEnter={e=>(e.currentTarget.style.background='rgba(59,130,246,0.15)')}
          onMouseLeave={e=>(e.currentTarget.style.background='rgba(59,130,246,0.06)')}>
          {chip}
        </button>
      ))}
    </div>
  );
}
