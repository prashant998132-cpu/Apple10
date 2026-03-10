'use client';
import { Message } from './ChatInterface';

const CHIPS: Record<string, string[]> = {
  weather:     ['Kal ka forecast?', 'Is hafte rain aayegi?', 'Humidity kitni hai?'],
  crypto:      ['Bitcoin trend?', 'Buy karna chahiye?', 'Ethereum kya chal raha?'],
  image:       ['Alag style mein banao', 'Dark version?', 'Realistic banana hai'],
  code:        ['Explain karo line by line', 'Optimize kar sakte ho?', 'Test cases likhdo'],
  news:        ['Aur khabar?', 'Is issue ka background batao', 'India pe kya impact?'],
  study:       ['Quiz lo mujhe', 'Summary do', 'Example do real life ka'],
  motivation:  ['Ek aur quote do', 'Daily routine suggest karo', 'Action plan banao'],
  default:     ['Aur detail mein batao', 'Example do', 'Alag angle se explain karo', 'Summary do'],
};

function detectCategory(content: string): string {
  const t = content.toLowerCase();
  if (t.match(/°c|mausam|humidity|forecast|rain|temperature/)) return 'weather';
  if (t.match(/btc|eth|sol|crypto|bitcoin|ethereum|price.*inr/)) return 'crypto';
  if (t.match(/image\.|png|jpg|generate|pollinations|dall-e/)) return 'image';
  if (t.match(/```|function|const|def |class |import |error:|bug/)) return 'code';
  if (t.match(/news|khabar|headline|report/)) return 'news';
  if (t.match(/study|topic|concept|learn|explain|formula/)) return 'study';
  if (t.match(/motivat|inspire|goal|dream|kar sakte|believe/)) return 'motivation';
  return 'default';
}

interface Props { lastMessage: Message; onSelect: (text: string) => void; }

export default function FollowUpChips({ lastMessage, onSelect }: Props) {
  if (lastMessage.role !== 'assistant' || !lastMessage.content || lastMessage.content.length < 20) return null;
  const chips = CHIPS[detectCategory(lastMessage.content)] || CHIPS.default;

  return (
    <div className="flex gap-2 flex-wrap pb-1 fade-in">
      {chips.slice(0, 3).map(chip => (
        <button key={chip} onClick={() => onSelect(chip)}
          className="text-xs px-3 py-1.5 rounded-full transition-all whitespace-nowrap"
          style={{
            border: '1px solid rgba(59,130,246,0.25)',
            color: '#93c5fd',
            background: 'rgba(59,130,246,0.06)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.15)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.06)')}>
          {chip}
        </button>
      ))}
    </div>
  );
}
