'use client';
// ══════════════════════════════════════════════════════════════
// JARVIS POWER INTENTS v2 — v30
// Detects from chat: code run, cricket, grammar check,
//                    habit track, budget, train status
// + all v29 intents (translate, youtube, url, math, unit)
// ══════════════════════════════════════════════════════════════

import { detectPowerIntent as detectV29, handlePowerIntent as handleV29, type PowerIntent as PowerIntentV29 } from './powerIntents';

export type PowerIntent = PowerIntentV29 | {
  type: 'code_run' | 'cricket' | 'grammar_check' | 'grammar_fix' | 'writing_enhance' | 'habit' | 'budget';
  data: Record<string, string>;
};

// Extract code block from message
function extractCodeBlock(text: string): { code: string; lang: string } | null {
  // Markdown code block
  const blockMatch = text.match(/```(\w+)?\n?([\s\S]+?)```/);
  if (blockMatch) {
    return { lang: blockMatch[1] || 'python', code: blockMatch[2].trim() };
  }
  // Inline code
  const inlineMatch = text.match(/`([^`]+)`/);
  if (inlineMatch && inlineMatch[1].includes('\n')) {
    return { lang: 'python', code: inlineMatch[1] };
  }
  return null;
}

function detectLangFromMessage(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('python') || t.includes('py ')) return 'python';
  if (t.includes('javascript') || t.includes('js ') || t.includes('node')) return 'javascript';
  if (t.includes('java ') && !t.includes('javascript')) return 'java';
  if (t.includes('c++ ') || t.includes('cpp')) return 'cpp';
  if (t.includes('go ') || t.includes('golang')) return 'go';
  if (t.includes('rust')) return 'rust';
  if (t.includes('ruby')) return 'ruby';
  if (t.includes('php')) return 'php';
  if (t.includes('swift')) return 'swift';
  if (t.includes('bash') || t.includes('shell')) return 'bash';
  return 'python';
}

export function detectPowerIntentV2(text: string): PowerIntent | null {
  const t = text.trim();
  const tl = t.toLowerCase();

  // ── CODE RUN ─────────────────────────────────────────────────
  // Has a code block? Try to run it
  const codeBlock = extractCodeBlock(t);
  if (codeBlock && (
    tl.includes('run') || tl.includes('chala') || tl.includes('execute') ||
    tl.includes('output') || tl.includes('result') || tl.includes('kya output')
  )) {
    return { type: 'code_run', data: { code: codeBlock.code, lang: codeBlock.lang } };
  }

  // "Run this Python: print('hello')"
  const runMatch = t.match(/(?:run|execute|chala|compile)\s+(?:this\s+)?(\w+)?\s*[:\-]?\s*(.+)/is);
  if (runMatch && (runMatch[2]?.includes('\n') || runMatch[2]?.length > 20)) {
    const lang = runMatch[1] ? detectLangFromMessage(runMatch[1]) : detectLangFromMessage(t);
    return { type: 'code_run', data: { code: runMatch[2].trim(), lang } };
  }

  // ── CRICKET SCORES ───────────────────────────────────────────
  if (tl.match(/cricket|ipl|match.*score|india.*vs|score.*india|live.*match|csk|mi\b|rcb|kkr|srh|dc\b|pbks|gt\b|lsg/i)) {
    return { type: 'cricket', data: { query: t } };
  }

  // ── GRAMMAR CHECK ────────────────────────────────────────────
  // "Check grammar: ..." or "grammar check karo"
  const grammarMatch = t.match(/(?:grammar|spelling|check|correct|proofread)\s+(?:check|karo|karna|my|this|yeh)?\s*[:\-]?\s*(.+)/is)
    || t.match(/(.+)\s+(?:mein|ki)\s+(?:grammar|spelling)\s+(?:check|sahi)/is);
  if (grammarMatch && grammarMatch[1] && grammarMatch[1].length > 10) {
    return { type: 'grammar_check', data: { text: grammarMatch[1].trim() } };
  }

  // "Fix grammar: ..." 
  const fixMatch = t.match(/(?:fix|correct|theek karo|sudhar)\s+(?:grammar|spelling|this|yeh|writing)\s*[:\-]?\s*(.+)/is);
  if (fixMatch && fixMatch[1]) {
    return { type: 'grammar_fix', data: { text: fixMatch[1].trim() } };
  }

  // ── WRITING TONE ENHANCE ─────────────────────────────────────
  const tonePatterns: Record<string, string[]> = {
    formal: ['formal', 'professional', 'office', 'formal karo', 'formal banao'],
    casual: ['casual', 'friendly', 'simple', 'casual karo'],
    email: ['email mein', 'email format', 'email banao', 'as email'],
    whatsapp: ['whatsapp mein', 'whatsapp message', 'wa message'],
    hinglish: ['hinglish mein', 'hinglish karo', 'hindi english mix'],
    persuasive: ['persuasive', 'convincing', 'compelling', 'manao'],
    concise: ['concise', 'short karo', 'chhota karo', 'summary'],
  };

  for (const [tone, patterns] of Object.entries(tonePatterns)) {
    if (patterns.some(p => tl.includes(p))) {
      // Extract the text to enhance
      const enhanceMatch = t.match(/[:\-]\s*(.+)/s) || t.match(/(?:likho|banao|karo)\s+(.+)/s);
      if (enhanceMatch && enhanceMatch[1]?.length > 10) {
        return { type: 'writing_enhance', data: { text: enhanceMatch[1].trim(), tone } };
      }
    }
  }

  // ── HABIT TRACKER ─────────────────────────────────────────────
  // "Gym kiya aaj" / "paani piya 2 glass" / "habit track karo"
  const habitDoneMatch = t.match(/(?:kiya|ki|done|complete|finish|kar liya)\s+(.+?)\s+(?:aaj|today|ho gaya)?$/i)
    || t.match(/(.+?)\s+(?:kiya|ki|done|complete)\s+(?:aaj|today)?$/i);

  if (habitDoneMatch && tl.match(/gym|yoga|meditation|paani|water|reading|padhai|walk|run|exercise|sleep|so gaya|medicine|dawai/)) {
    return { type: 'habit', data: { action: 'done', habit: habitDoneMatch[1]?.trim() || t } };
  }

  // "Meri habits dikhao" / "habit streak"
  if (tl.match(/habit.*dikhao|habit.*show|streak.*dikhao|meri.*habit|progress.*dikhao/)) {
    return { type: 'habit', data: { action: 'show' } };
  }

  // "Gym habit add karo daily" 
  const habitAddMatch = t.match(/(.+?)\s+(?:habit|daily|routine)\s+(?:add|track|yaad dilao)/i);
  if (habitAddMatch) {
    return { type: 'habit', data: { action: 'add', habit: habitAddMatch[1].trim() } };
  }

  // ── BUDGET TRACKER ────────────────────────────────────────────
  // "200 rupee grocery pe spend kiya" / "5000 salary aaya"
  const budgetSpendMatch = t.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:rs|rs\.|rupee|rupees|₹|inr|rupe)?\s+(.+?)\s+(?:pe|par|on|mein|ke liye)?\s+(?:spend|kharch|diya|gaya|liya|pay|paid)/i);
  const budgetIncomeMatch = t.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:rs|rupee|₹)?\s+(.+?)\s+(?:aaya|mila|received|income|salary|earn)/i);

  if (budgetSpendMatch) {
    return { type: 'budget', data: { action: 'expense', amount: budgetSpendMatch[1].replace(',', ''), category: budgetSpendMatch[2] } };
  }
  if (budgetIncomeMatch) {
    return { type: 'budget', data: { action: 'income', amount: budgetIncomeMatch[1].replace(',', ''), source: budgetIncomeMatch[2] } };
  }

  if (tl.match(/budget.*dikhao|kharch.*dikhao|expense.*show|kitna.*kharch|month.*spend/)) {
    return { type: 'budget', data: { action: 'show' } };
  }

  // ── Fall through to v29 intents ──────────────────────────────
  return detectV29(text);
}

// ── Handlers ──────────────────────────────────────────────────
export async function handlePowerIntentV2(intent: PowerIntent): Promise<string> {
  switch (intent.type) {

    case 'code_run': {
      const { code, lang } = intent.data;
      try {
        const r = await fetch('/api/code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, language: lang }),
        });
        const d = await r.json();
        const langEmoji: Record<string, string> = { python: '🐍', javascript: '⚡', java: '☕', cpp: '⚙️', go: '🐹', rust: '🦀', ruby: '💎', php: '🐘' };
        const emoji = langEmoji[lang] || '💻';
        let result = `${emoji} **${lang.toUpperCase()} Output** *(${d.provider})*\n\n`;
        if (d.output) result += `\`\`\`\n${d.output.slice(0, 1000)}\n\`\`\``;
        if (d.error) result += `\n\n❌ **Error:**\n\`\`\`\n${d.error.slice(0, 500)}\n\`\`\``;
        if (!d.output && !d.error) result += '_(no output)_';
        if (d.elapsed) result += `\n\n⏱️ ${d.elapsed}ms`;
        return result;
      } catch {
        return '❌ Code execution fail ho gaya.';
      }
    }

    case 'cricket': {
      try {
        const r = await fetch('/api/cricket');
        const d = await r.json();
        return d.result || '🏏 Cricket data unavailable.';
      } catch {
        return '🏏 Cricket data fetch nahi ho paya.';
      }
    }

    case 'grammar_check':
    case 'grammar_fix': {
      const { text } = intent.data;
      const mode = intent.type === 'grammar_fix' ? 'fix' : 'check';
      try {
        const r = await fetch('/api/grammar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, mode }),
        });
        const d = await r.json();
        let result = `📝 **Grammar Check** *(${d.provider})*\n\n${d.summary}`;
        if (d.issues?.length > 0) {
          result += '\n\n**Issues:**\n';
          result += d.issues.slice(0, 5).map((iss: any) =>
            `${iss.index}. ${iss.message}${iss.suggestion ? ` → \`${iss.suggestion}\`` : ''}`
          ).join('\n');
        }
        if (mode === 'fix' && d.fixed && d.fixed !== text) {
          result += `\n\n✅ **Fixed:**\n${d.fixed}`;
        }
        return result;
      } catch {
        return '❌ Grammar check fail ho gaya.';
      }
    }

    case 'writing_enhance': {
      const { text, tone } = intent.data;
      try {
        const r = await fetch('/api/grammar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, tone, mode: 'enhance' }),
        });
        const d = await r.json();
        const toneEmoji: Record<string, string> = { formal: '👔', casual: '😊', email: '📧', whatsapp: '💬', hinglish: '🇮🇳', persuasive: '🎯', concise: '✂️' };
        return `${toneEmoji[tone] || '✍️'} **Enhanced (${tone}):**\n\n${d.enhanced || text}`;
      } catch {
        return '❌ Writing enhance fail ho gaya.';
      }
    }

    case 'habit': {
      const { action, habit } = intent.data;
      try {
        const today = new Date().toISOString().slice(0, 10);
        const stored = JSON.parse(localStorage.getItem('jarvis_habits') || '{}');

        if (action === 'done' && habit) {
          const key = habit.toLowerCase().trim();
          if (!stored[key]) stored[key] = { streak: 0, lastDone: '', totalDone: 0, name: habit };
          const entry = stored[key];
          if (entry.lastDone !== today) {
            const wasYesterday = entry.lastDone === new Date(Date.now() - 86400000).toISOString().slice(0, 10);
            entry.streak = wasYesterday ? entry.streak + 1 : 1;
            entry.lastDone = today;
            entry.totalDone = (entry.totalDone || 0) + 1;
          }
          localStorage.setItem('jarvis_habits', JSON.stringify(stored));
          const fire = entry.streak >= 7 ? '🔥' : entry.streak >= 3 ? '✨' : '✅';
          return `${fire} **${habit}** done mark ho gaya!\n\n🔥 Streak: **${entry.streak} din** | Total: ${entry.totalDone} baar`;
        }

        if (action === 'show') {
          const habits = Object.values(stored) as any[];
          if (!habits.length) return '📊 Abhi koi habit track nahi hai.\n\n_"gym kiya aaj" likho — main track karunga!_';
          const list = habits.map((h: any) => {
            const doneTday = h.lastDone === today;
            const fire = h.streak >= 7 ? '🔥' : h.streak >= 3 ? '⚡' : '📌';
            return `${doneTday ? '✅' : '⬜'} ${fire} **${h.name}** — ${h.streak} day streak`;
          }).join('\n');
          return `📊 **Aaj ki Habits:**\n\n${list}`;
        }

        if (action === 'add' && habit) {
          const key = habit.toLowerCase().trim();
          if (!stored[key]) {
            stored[key] = { streak: 0, lastDone: '', totalDone: 0, name: habit };
            localStorage.setItem('jarvis_habits', JSON.stringify(stored));
            return `✅ **${habit}** habit add ho gaya! Aaj se track ho raha hai.`;
          }
          return `📌 **${habit}** pehle se track ho raha hai.`;
        }
      } catch (e) {
        return '❌ Habit tracker available nahi (storage issue).';
      }
      return '❓ Habit command samajh nahi aaya.';
    }

    case 'budget': {
      const { action, amount, category, source } = intent.data;
      try {
        const month = new Date().toISOString().slice(0, 7);
        const key = `jarvis_budget_${month}`;
        const data = JSON.parse(localStorage.getItem(key) || '{"expenses":[],"incomes":[]}');

        if (action === 'expense') {
          data.expenses.push({ amount: parseFloat(amount), category, date: new Date().toISOString().slice(0, 10) });
          localStorage.setItem(key, JSON.stringify(data));
          const total = data.expenses.reduce((s: number, e: any) => s + e.amount, 0);
          return `💸 **₹${amount}** ${category} pe kharch hua!\n\n📊 Is mahine ka total: **₹${total.toLocaleString('en-IN')}**`;
        }

        if (action === 'income') {
          data.incomes.push({ amount: parseFloat(amount), source, date: new Date().toISOString().slice(0, 10) });
          localStorage.setItem(key, JSON.stringify(data));
          const total = data.incomes.reduce((s: number, e: any) => s + e.amount, 0);
          return `💰 **₹${amount}** ${source} se aaya!\n\n📊 Is mahine ki total income: **₹${total.toLocaleString('en-IN')}**`;
        }

        if (action === 'show') {
          const totalExpense = data.expenses.reduce((s: number, e: any) => s + e.amount, 0);
          const totalIncome = data.incomes.reduce((s: number, e: any) => s + e.amount, 0);
          const balance = totalIncome - totalExpense;

          // Group by category
          const catMap: Record<string, number> = {};
          data.expenses.forEach((e: any) => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
          const topCats = Object.entries(catMap).sort(([, a], [, b]) => b - a).slice(0, 5);

          let report = `💰 **Budget — ${month}**\n\n`;
          report += `Income: **₹${totalIncome.toLocaleString('en-IN')}**\n`;
          report += `Expense: **₹${totalExpense.toLocaleString('en-IN')}**\n`;
          report += `Balance: **₹${balance.toLocaleString('en-IN')}** ${balance >= 0 ? '✅' : '❌'}\n`;
          if (topCats.length) {
            report += `\n**Top kharch:**\n`;
            report += topCats.map(([cat, amt]) => `• ${cat}: ₹${amt.toLocaleString('en-IN')}`).join('\n');
          }
          return report;
        }
      } catch {
        return '❌ Budget tracker storage unavailable.';
      }
      return '❓ Budget command samajh nahi aaya.';
    }

    default:
      return handleV29(intent as PowerIntentV29);
  }
}
