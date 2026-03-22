'use client';
import { handlePowerIntentV3 } from './powerIntentsV3';

export async function handlePowerIntentV4(msg: string): Promise<{handled:boolean;response?:string;data?:any}> {
  const m = msg.toLowerCase().trim();

  // ── Web Search (Tavily→Exa→Brave→DDG→Wiki→GDELT) ──
  const searchTriggers = ['search', 'dhundo', 'batao', 'kya hai', 'kab hai', 'kaun hai',
    'latest', 'news', 'aaj ka', 'abhi ka', 'recent', 'find', 'google karo'];
  const isSearch = searchTriggers.some(t => m.includes(t)) && !m.includes('weather') && !m.includes('cricket');

  if (isSearch) {
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(msg)}`);
      const d = await r.json();
      if (d.answer || d.results?.length > 0) {
        let resp = '';
        if (d.answer) resp += `🔍 **${d.answer}**\n\n`;
        if (d.results?.length > 0) {
          resp += d.results.slice(0, 3).map((r: any) =>
            `• **${r.title}**\n  ${r.snippet || ''}\n  [${r.url?.substring(0, 50)}...]`
          ).join('\n\n');
        }
        resp += `\n\n_Source: ${d.source}_`;
        return { handled: true, response: resp, data: d };
      }
    } catch {}
    return { handled: true, response: '🔍 Search temporarily unavailable.' };
  }

  // ── Archive / Free Movies ──
  if (m.includes('archive') || m.includes('free movie') || m.includes('old movie') ||
      m.includes('classic film') || m.includes('documentary')) {
    const q = msg.replace(/archive|free movie|old movie|classic|film|dikhao|play|dekho/gi, '').trim() || 'classic';
    try {
      const r = await fetch(`/api/archive?q=${encodeURIComponent(q)}`);
      const d = await r.json();
      if (d.items?.length > 0) {
        const list = d.items.slice(0, 3).map((item: any) =>
          `🎬 **${item.title}** (${item.year || '?'})\n  📥 ${item.downloads?.toLocaleString()} downloads\n  [Watch →](${item.page})`
        ).join('\n\n');
        return { handled: true, response: `🎭 **Internet Archive — Free Legal Movies:**\n\n${list}`, data: d };
      }
    } catch {}
  }

  // ── Photos / Images ──
  if (m.includes('photo') || m.includes('image') || m.includes('tasveer') ||
      m.includes('wallpaper') || m.includes('picture')) {
    const q = msg.replace(/photo|image|tasveer|wallpaper|picture|dikhao|show/gi, '').trim() || 'india nature';
    try {
      const r = await fetch(`/api/pexels?q=${encodeURIComponent(q)}&type=photos`);
      const d = await r.json();
      if (d.items?.length > 0) {
        const item = d.items[0];
        return {
          handled: true,
          response: `📸 **${q} — HD Photo by ${item.photographer}**\n\n![${item.alt || q}](${item.url})\n\n[More photos →](https://pexels.com)`,
          data: d,
        };
      }
      if (d.fallback) {
        return { handled: true, response: `📸 ![${q}](${d.fallback})`, data: d };
      }
    } catch {}
  }

  // Fall through to V3
  return handlePowerIntentV3(msg);
}
