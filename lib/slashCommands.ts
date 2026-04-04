'use client';
// ══════════════════════════════════════════════════════════════
// JARVIS SLASH COMMANDS — v31
// Research: Slash commands reduce typing 60%, boost power users.
// /weather /translate hi Hello /image sunset /cricket /news
//
// Also: Full-text search + Chat Export (MD/JSON/Share)
// ══════════════════════════════════════════════════════════════

// ── SLASH COMMANDS ────────────────────────────────────────────

export interface SlashCommand {
  cmd: string;
  aliases: string[];
  description: string;
  example: string;
  handler: (args: string) => string; // returns chat message to send
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    cmd: '/weather',
    aliases: ['/mausam', '/w'],
    description: 'Aaj ka mausam',
    example: '/weather',
    handler: () => 'Aaj ka mausam kaisa hai?',
  },
  {
    cmd: '/translate',
    aliases: ['/t', '/tr'],
    description: 'Text translate karo',
    example: '/translate hi Good morning',
    handler: (args) => {
      const parts = args.trim().split(' ');
      const lang = parts[0] || 'hi';
      const text = parts.slice(1).join(' ');
      if (!text) return `Kya translate karna hai? Example: /translate hi Good morning`;
      return `${lang} mein translate karo: ${text}`;
    },
  },
  {
    cmd: '/image',
    aliases: ['/img', '/photo'],
    description: 'AI image banao',
    example: '/image beautiful sunset India',
    handler: (args) => args ? `Ek ${args} ki image banao` : 'Kya image chahiye? Example: /image sunset India',
  },
  {
    cmd: '/cricket',
    aliases: ['/ipl', '/score'],
    description: 'Live cricket score',
    example: '/cricket',
    handler: () => 'Cricket live score dikhao',
  },
  {
    cmd: '/news',
    aliases: ['/khabar', '/n'],
    description: 'Aaj ki news',
    example: '/news',
    handler: () => 'Aaj ki top news kya hai?',
  },
  {
    cmd: '/youtube',
    aliases: ['/yt'],
    description: 'YouTube video summarize',
    example: '/youtube https://youtu.be/xxxxx',
    handler: (args) => args ? `${args} ka summary do` : 'YouTube URL paste karo: /youtube https://youtu.be/xxxxx',
  },
  {
    cmd: '/define',
    aliases: ['/meaning', '/dict'],
    description: 'Word ka meaning',
    example: '/define serendipity',
    handler: (args) => args ? `define ${args}` : 'Kaunsa word? Example: /define serendipity',
  },
  {
    cmd: '/calc',
    aliases: ['/math', '/calculate'],
    description: 'Math calculate',
    example: '/calc 15% of 50000',
    handler: (args) => args ? `calculate ${args}` : 'Kya calculate karna hai?',
  },
  {
    cmd: '/remind',
    aliases: ['/reminder', '/alarm'],
    description: 'Reminder set karo',
    example: '/remind 30m Paani peena',
    handler: (args) => {
      if (!args) return 'Format: /remind 30m Kuch bhi karna';
      const m = args.match(/^(\d+)(m|h)\s+(.+)$/i);
      if (!m) return 'Format: /remind 30m Kuch bhi karna';
      return `30 min mein yaad dilao: ${m[3]}`;
    },
  },
  {
    cmd: '/summarize',
    aliases: ['/sum', '/url'],
    description: 'URL/Article summarize',
    example: '/summarize https://...',
    handler: (args) => args ? `${args} batao` : 'URL paste karo: /summarize https://...',
  },
  {
    cmd: '/code',
    aliases: ['/run'],
    description: 'Code run karo',
    example: '/code python print("Hello")',
    handler: (args) => {
      if (!args) return 'Example: /code python print("Hello")';
      const parts = args.split(' ');
      const lang = parts[0];
      const code = parts.slice(1).join(' ');
      return `\`\`\`${lang}\n${code}\n\`\`\`\nrun karo`;
    },
  },
  {
    cmd: '/grammar',
    aliases: ['/fix', '/check'],
    description: 'Grammar check/fix',
    example: '/grammar I goes to school',
    handler: (args) => args ? `grammar check: ${args}` : 'Kaunsa text check karna?',
  },
  {
    cmd: '/budget',
    aliases: ['/kharch', '/expense'],
    description: 'Budget track',
    example: '/budget 500 grocery',
    handler: (args) => {
      if (!args) return 'budget dikhao';
      const m = args.match(/^(\d+)\s+(.+)$/);
      if (m) return `${m[1]} rs ${m[2]} pe spend kiya`;
      return `budget: ${args}`;
    },
  },
  {
    cmd: '/habits',
    aliases: ['/habit'],
    description: 'Habit tracker',
    example: '/habits show',
    handler: (args) => {
      if (!args || args === 'show') return 'habit dikhao';
      return `${args} kiya aaj`;
    },
  },
];

// Parse slash command from input
export function parseSlashCommand(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return null;

  const parts = trimmed.split(' ');
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');

  for (const sc of SLASH_COMMANDS) {
    if (sc.cmd === cmd || sc.aliases.includes(cmd)) {
      return sc.handler(args);
    }
  }

  return null; // unknown command — let AI handle it
}

// Get autocomplete suggestions for slash
export function getSlashSuggestions(partial: string): SlashCommand[] {
  if (!partial.startsWith('/')) return [];
  const q = partial.toLowerCase();
  return SLASH_COMMANDS.filter(sc =>
    sc.cmd.startsWith(q) || sc.aliases.some(a => a.startsWith(q))
  ).slice(0, 6);
}

// ── FULL-TEXT MESSAGE SEARCH ──────────────────────────────────
// Searches across ALL sessions in IndexedDB

export interface SearchResult {
  sessionId: string;
  messageId: string;
  role: 'user' | 'assistant';
  content: string;
  ts: number;
  highlight: string;
}

export async function searchAllMessages(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];
  if (typeof window === 'undefined') return [];

  try {
    const { getDB } = await import('./db');
    const db = getDB();
    if (!db) return [];

    const q = query.toLowerCase();
    const all = await db.messages.toArray();

    return all
      .filter(m => m.content?.toLowerCase().includes(q))
      .slice(0, 20)
      .map(m => {
        const idx = m.content.toLowerCase().indexOf(q);
        const start = Math.max(0, idx - 40);
        const end = Math.min(m.content.length, idx + query.length + 40);
        const highlight = (start > 0 ? '...' : '') + m.content.slice(start, end) + (end < m.content.length ? '...' : '');

        return {
          sessionId: m.sessionId,
          messageId: m.id,
          role: m.role,
          content: m.content,
          ts: m.ts,
          highlight,
        };
      })
      .sort((a, b) => b.ts - a.ts);
  } catch {
    return [];
  }
}

// ── CHAT EXPORT ───────────────────────────────────────────────

export async function exportChatAsMarkdown(sessionId: string, title?: string): Promise<string> {
  try {
    const { getDB } = await import('./db');
    const db = getDB();
    if (!db) return '';

    const messages = await db.messages.where('sessionId').equals(sessionId).sortBy('ts');
    const chatTitle = title || `JARVIS Chat — ${new Date(messages[0]?.ts || Date.now()).toLocaleDateString('hi-IN')}`;

    let md = `# ${chatTitle}\n\n`;
    md += `_Exported: ${new Date().toLocaleString('hi-IN', { timeZone: 'Asia/Kolkata' })}_\n\n---\n\n`;

    for (const m of messages) {
      const time = new Date(m.ts).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' });
      if (m.role === 'user') {
        md += `**You** (${time}):\n${m.content}\n\n`;
      } else {
        md += `**JARVIS** (${time}):\n${m.content}\n\n`;
      }
      md += '---\n\n';
    }

    return md;
  } catch {
    return '';
  }
}

export async function exportChatAsJSON(sessionId: string): Promise<string> {
  try {
    const { getDB } = await import('./db');
    const db = getDB();
    if (!db) return '[]';

    const messages = await db.messages.where('sessionId').equals(sessionId).sortBy('ts');
    return JSON.stringify(messages.map(m => ({
      role: m.role,
      content: m.content,
      time: new Date(m.ts).toISOString(),
    })), null, 2);
  } catch {
    return '[]';
  }
}

export function downloadText(content: string, filename: string, mimeType = 'text/markdown') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function shareChat(sessionId: string, title?: string) {
  const md = await exportChatAsMarkdown(sessionId, title);
  if (!md) return;

  if (navigator.share) {
    await navigator.share({
      title: title || 'JARVIS Chat',
      text: md.slice(0, 2000) + (md.length > 2000 ? '...' : ''),
    }).catch(() => {});
  } else {
    // Fallback: copy to clipboard
    await navigator.clipboard.writeText(md).catch(() => {});
    alert('Chat clipboard mein copy ho gaya!');
  }
}
