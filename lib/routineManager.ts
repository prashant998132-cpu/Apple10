'use client';
// ══════════════════════════════════════════════════════════════
// JARVIS ROUTINE MANAGER
// Daily routine, targets with time, alarms — all from chat
// "Subah 6 baje gym karo reminder lagao"
// "Daily routine set karo: 6am gym, 8am breakfast, 10am study"
// "Target: 50 pushups aaj"
// ══════════════════════════════════════════════════════════════

export interface RoutineItem {
  id: string;
  time: string;       // "06:00"
  label: string;
  emoji: string;
  days: number[];     // 0=Sun,1=Mon..6=Sat, empty=daily
  alarm: boolean;
  done: boolean;
  doneDate?: string;  // YYYY-MM-DD
}

export interface DailyTarget {
  id: string;
  title: string;
  emoji: string;
  target: number;
  progress: number;
  unit: string;
  date: string;       // YYYY-MM-DD
  deadline?: string;  // "HH:MM"
}

const ROUTINE_KEY = 'jarvis_routine_v2';
const TARGET_KEY  = 'jarvis_targets_v2';

// ── Storage ───────────────────────────────────────────────────
export function getRoutine(): RoutineItem[] {
  try { return JSON.parse(localStorage.getItem(ROUTINE_KEY) || '[]'); } catch { return []; }
}
export function saveRoutine(items: RoutineItem[]) {
  try { localStorage.setItem(ROUTINE_KEY, JSON.stringify(items)); } catch {}
}
export function getTodayTargets(): DailyTarget[] {
  try {
    const all: DailyTarget[] = JSON.parse(localStorage.getItem(TARGET_KEY) || '[]');
    const today = new Date().toISOString().slice(0, 10);
    return all.filter(t => t.date === today || !t.date);
  } catch { return []; }
}
export function saveTargets(targets: DailyTarget[]) {
  try { localStorage.setItem(TARGET_KEY, JSON.stringify(targets)); } catch {}
}

// ── Emoji guesser ─────────────────────────────────────────────
function guessEmoji(label: string): string {
  const t = label.toLowerCase();
  if (t.match(/gym|exercise|workout|pushup|running|yoga|walk/)) return '💪';
  if (t.match(/breakfast|khaana|lunch|dinner|khana|meal|eat/)) return '🍽️';
  if (t.match(/study|padhai|read|book|class|school|college/)) return '📚';
  if (t.match(/sleep|so ja|so jao|raat|night|neend/)) return '😴';
  if (t.match(/medicine|dawai|tablet|pill/)) return '💊';
  if (t.match(/water|paani|drink/)) return '💧';
  if (t.match(/namaz|prayer|pooja|meditation/)) return '🙏';
  if (t.match(/office|work|job|kaam/)) return '💼';
  if (t.match(/call|phone/)) return '📞';
  if (t.match(/music|gaana/)) return '🎵';
  if (t.match(/bath|shower|nahana/)) return '🚿';
  if (t.match(/news|paper/)) return '📰';
  return '📌';
}

// ── Parse time string to "HH:MM" ─────────────────────────────
export function parseTime(text: string): string | null {
  // "6am", "6 am", "6:30am", "6 baje", "18:00", "6:30 pm"
  const t = text.toLowerCase();
  
  const match12 = t.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|baje)/);
  if (match12) {
    let h = parseInt(match12[1]);
    const m = parseInt(match12[2] || '0');
    const period = match12[3];
    if (period === 'pm' && h < 12) h += 12;
    if (period === 'am' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  
  const match24 = t.match(/(\d{1,2}):(\d{2})/);
  if (match24) {
    return `${String(parseInt(match24[1])).padStart(2, '0')}:${match24[2]}`;
  }
  
  // "6 baje" without am/pm — assume AM for morning hours
  const matchBaje = t.match(/(\d{1,2})\s*baje/);
  if (matchBaje) {
    const h = parseInt(matchBaje[1]);
    return `${String(h < 12 ? h : h).padStart(2, '0')}:00`;
  }
  
  return null;
}

// ── Schedule browser alarm at given time ─────────────────────
export function scheduleAlarm(time: string, label: string): void {
  if (typeof window === 'undefined') return;
  
  const [h, m] = time.split(':').map(Number);
  const now = new Date();
  const alarm = new Date();
  alarm.setHours(h, m, 0, 0);
  if (alarm <= now) alarm.setDate(alarm.getDate() + 1); // tomorrow if past
  
  const ms = alarm.getTime() - now.getTime();
  
  setTimeout(() => {
    // Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`⏰ JARVIS Alarm`, { body: label, icon: '/icons/icon-192.png' });
    }
    // Vibrate
    if ('vibrate' in navigator) navigator.vibrate([500, 200, 500, 200, 500]);
    // Audio beep
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      osc.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.start(); osc.stop(ctx.currentTime + 0.8);
    } catch {}
    // Register for next day
    scheduleAlarm(time, label);
  }, ms);
}

// ── Register all routine alarms ───────────────────────────────
export function registerRoutineAlarms(): void {
  const routine = getRoutine();
  routine.filter(r => r.alarm).forEach(r => scheduleAlarm(r.time, r.label));
}

// ── Natural language → Routine/Target ────────────────────────
export function parseRoutineCommand(text: string): {
  type: 'add_routine' | 'add_target' | 'show_routine' | 'show_targets' | 'mark_done' | 'clear_routine' | null;
  data?: any;
} {
  const t = text.toLowerCase();

  // Show commands
  if (t.match(/routine.*dikhao|dikhao.*routine|aaj.*routine|meri.*routine|daily.*schedule/)) return { type: 'show_routine' };
  if (t.match(/target.*dikhao|dikhao.*target|aaj.*target|progress.*dikhao/)) return { type: 'show_targets' };
  if (t.match(/routine.*hatao|clear.*routine|routine.*delete/)) return { type: 'clear_routine' };

  // Mark done
  const doneMatch = t.match(/(?:done|ho gaya|kar liya|complete|finish)\s+(.+)/i);
  if (doneMatch) return { type: 'mark_done', data: { label: doneMatch[1].trim() } };

  // Add target: "target: 50 pushups aaj" or "aaj 2L paani peenga"
  const targetMatch = t.match(/target[:\s]+(.+?)\s+(\d+)\s*(pushup|glass|litre|km|page|hour|ghanta|minute|min|bar|times|baar)/i)
    || t.match(/aaj\s+(\d+)\s*(pushup|glass|km|page|litre|bar|times|baar)\s*(.+)?/i);
  if (targetMatch || t.match(/^target\s+/i)) {
    const numMatch = t.match(/(\d+)\s*(pushup|glass|litre|km|page|hour|ghanta|min|bar|times|baar)/i);
    const label = t.replace(/target[:\s]*/i, '').replace(/\d+\s*(pushup|glass|litre|km|page|hour|ghanta|min|bar|times|baar)/i, '').trim() || 'Target';
    if (numMatch) {
      return {
        type: 'add_target',
        data: {
          title: label || `${numMatch[2]} goal`,
          target: parseInt(numMatch[1]),
          unit: numMatch[2],
          emoji: guessEmoji(label),
          deadline: parseTime(t) || undefined,
        }
      };
    }
  }

  // Add routine: parse time + label
  const timeInText = parseTime(t);
  if (timeInText && (t.match(/routine|alarm|remind|set karo|lagao|add|daily/i) || t.match(/\d.*baje.*karo|baje.*padhai|baje.*gym/i))) {
    const label = t
      .replace(/(\d{1,2}(?::\d{2})?\s*(?:am|pm|baje))/gi, '')
      .replace(/routine|alarm|remind.*karo|set karo|lagao|add|daily|reminder/gi, '')
      .replace(/\s+/g, ' ').trim() || 'Task';
    
    const withAlarm = t.match(/alarm|baja|ringtone|bajao|wake|uthao/i) ? true : false;
    
    return {
      type: 'add_routine',
      data: { time: timeInText, label, emoji: guessEmoji(label), alarm: withAlarm }
    };
  }

  // Full routine set: "6am gym, 8am breakfast, 10am study"
  const commaItems = text.split(/,|aur|then/i).map(s => s.trim()).filter(s => s.length > 3);
  if (commaItems.length >= 2 && commaItems.filter(s => parseTime(s)).length >= 2) {
    const items = commaItems.map(item => {
      const time = parseTime(item) || '09:00';
      const label = item.replace(/\d{1,2}(?::\d{2})?\s*(?:am|pm|baje)/gi, '').trim() || item;
      return { time, label, emoji: guessEmoji(label), alarm: false };
    }).filter(i => i.label.length > 1);
    if (items.length >= 2) return { type: 'add_routine', data: { bulk: items } };
  }

  return { type: null };
}

// ── Format routine for chat display ──────────────────────────
export function formatRoutineForChat(items: RoutineItem[]): string {
  if (items.length === 0) return '📋 Routine khali hai. Likhो: *"6am gym routine add karo"*';
  
  const today = new Date().toISOString().slice(0, 10);
  const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time));
  
  let msg = `📋 **Aaj ki Routine:**\n\n`;
  sorted.forEach(item => {
    const done = item.done && item.doneDate === today;
    msg += `${done ? '✅' : '⏳'} **${item.time}** — ${item.emoji} ${item.label}${item.alarm ? ' 🔔' : ''}\n`;
  });
  msg += `\n_"done gym" bolke mark kar sakte ho_`;
  return msg;
}

export function formatTargetsForChat(targets: DailyTarget[]): string {
  if (targets.length === 0) return '🎯 Aaj koi target nahi. Likho: *"target: 50 pushups aaj"*';
  
  let msg = `🎯 **Aaj ke Targets:**\n\n`;
  targets.forEach(t => {
    const pct = Math.round((t.progress / t.target) * 100);
    const bar = '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10));
    msg += `${t.emoji} **${t.title}**: ${t.progress}/${t.target} ${t.unit}\n\`${bar}\` ${pct}%\n`;
  });
  return msg;
}
