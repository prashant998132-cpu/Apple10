// ══════════════════════════════════════════════════════════════
// JARVIS AI STREAM — v30.1 HOTFIX
// Fixed: Pollinations ad injection + <|constrain|> token leak
// ══════════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';

function sse(t: string) { return `data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n\n`; }
function done() { return 'data: [DONE]\n\n'; }

// ── Strip Pollinations junk from output ───────────────────────
function cleanChunk(text: string): string {
  return text
    // Remove <|constrain|> and similar special tokens
    .replace(/<\|[^|>]*\|>/g, '')
    // Remove Pollinations ad block
    .replace(/---\s*\n?Support Pollinations\.AI:[\s\S]*?accessible for everyone\./gi, '')
    .replace(/Support Pollinations\.AI:[\s\S]*?accessible for everyone\./gi, '')
    .replace(/🌸\s*Ad\s*🌸[\s\S]*?accessible for everyone\./gi, '')
    .replace(/Powered by Pollinations\.AI[\s\S]*?accessible for everyone\./gi, '')
    .replace(/Support our mission[\s\S]*?accessible for everyone\./gi, '')
    // Remove any leftover Pollinations branding
    .replace(/Pollinations\.AI free text APIs\./gi, '')
    .replace(/\[\s*Pollinations[^\]]*\]/gi, '');
}

// Track accumulated buffer for multi-chunk ad detection
class AdFilter {
  private buffer = '';
  private adDetected = false;

  filter(chunk: string): string {
    if (this.adDetected) return ''; // Drop everything after ad starts

    this.buffer += chunk;

    // Check if ad block started
    const adStart = this.buffer.search(/---\s*\n?Support Pollinations|Support Pollinations\.AI:|🌸\s*Ad\s*🌸/i);
    if (adStart !== -1) {
      this.adDetected = true;
      // Return only what came before the ad
      const clean = this.buffer.slice(0, adStart);
      this.buffer = '';
      return cleanChunk(clean);
    }

    // Safe to emit everything except last 50 chars (might be partial ad keyword)
    const safeEnd = Math.max(0, this.buffer.length - 50);
    const safeToEmit = this.buffer.slice(0, safeEnd);
    this.buffer = this.buffer.slice(safeEnd);

    return cleanChunk(safeToEmit);
  }

  flush(): string {
    if (this.adDetected) return '';
    const result = cleanChunk(this.buffer);
    this.buffer = '';
    return result;
  }
}

// ── Providers ─────────────────────────────────────────────────
async function* streamGroq(messages: any[], model: string, key: string) {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, stream: true, max_tokens: 1500, temperature: 0.7 }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`Groq ${r.status}`);
  yield* streamSSE(r);
}

async function* streamGemini(messages: any[], system: string, key: string) {
  const contents = messages.map((m: any) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, systemInstruction: { parts: [{ text: system }] }, generationConfig: { maxOutputTokens: 1500 } }),
      signal: AbortSignal.timeout(20000),
    }
  );
  if (!r.ok) throw new Error(`Gemini ${r.status}`);
  const reader = r.body!.getReader(); const dec = new TextDecoder(); let buf = '';
  while (true) {
    const { done: d, value } = await reader.read(); if (d) break;
    buf += dec.decode(value);
    const lines = buf.split('\n'); buf = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try { const t = JSON.parse(line.slice(6))?.candidates?.[0]?.content?.parts?.[0]?.text; if (t) yield t; } catch {}
    }
  }
}

async function* streamCerebras(messages: any[], key: string) {
  const r = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'llama3.1-70b', messages, stream: true, max_tokens: 2048, temperature: 0.7 }),
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) throw new Error(`Cerebras ${r.status}`);
  yield* streamSSE(r);
}

async function* streamMistral(messages: any[], key: string) {
  const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'mistral-small-latest', messages, stream: true, max_tokens: 1500 }),
    signal: AbortSignal.timeout(18000),
  });
  if (!r.ok) throw new Error(`Mistral ${r.status}`);
  yield* streamSSE(r);
}

async function* streamOpenRouter(messages: any[], key: string, model = 'google/gemma-3-27b-it:free') {
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'HTTP-Referer': 'https://apple10.vercel.app' },
    body: JSON.stringify({ model, messages, stream: true, max_tokens: 1500 }),
    signal: AbortSignal.timeout(25000),
  });
  if (!r.ok) throw new Error(`OpenRouter ${r.status}`);
  yield* streamSSE(r);
}

async function* streamTogether(messages: any[], key: string) {
  const r = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free', messages, stream: true, max_tokens: 1500 }),
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error(`Together ${r.status}`);
  yield* streamSSE(r);
}

async function* streamDeepSeek(messages: any[], key: string) {
  const r = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'deepseek-chat', messages, stream: true, max_tokens: 1500 }),
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error(`DeepSeek ${r.status}`);
  yield* streamSSE(r);
}

// Pollinations — with strict ad filtering
async function* streamPollinations(messages: any[]) {
  const urls = [
    'https://text.pollinations.ai/openai',
    'https://api.pollinations.ai/v1/chat/completions',
  ];
  for (const url of urls) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'openai', messages, stream: true, max_tokens: 1200 }),
        signal: AbortSignal.timeout(25000),
      });
      if (!r.ok) continue;

      // Use AdFilter for Pollinations specifically
      const filter = new AdFilter();
      const reader = r.body!.getReader(); const dec = new TextDecoder(); let buf = '';
      while (true) {
        const { done: d, value } = await reader.read(); if (d) break;
        buf += dec.decode(value);
        const lines = buf.split('\n'); buf = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6); if (data === '[DONE]') { yield filter.flush(); return; }
          try {
            const t = JSON.parse(data)?.choices?.[0]?.delta?.content;
            if (t) {
              const clean = filter.filter(t);
              if (clean) yield clean;
            }
          } catch {}
        }
      }
      const remaining = filter.flush();
      if (remaining) yield remaining;
      return;
    } catch {}
  }
  throw new Error('Pollinations failed');
}

async function* streamSSE(r: Response) {
  const reader = r.body!.getReader(); const dec = new TextDecoder(); let buf = '';
  while (true) {
    const { done: d, value } = await reader.read(); if (d) break;
    buf += dec.decode(value);
    const lines = buf.split('\n'); buf = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6); if (data === '[DONE]') return;
      try { const t = JSON.parse(data)?.choices?.[0]?.delta?.content; if (t) yield t; } catch {}
    }
  }
}

// ── Main handler ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { messages, system, mode } = await req.json();

  const groqKey     = process.env.GROQ_API_KEY;
  const geminiKey   = process.env.GEMINI_API_KEY;
  const cerebrasKey = process.env.CEREBRAS_API_KEY;
  const mistralKey  = process.env.MISTRAL_API_KEY;
  const orKey       = process.env.OPENROUTER_API_KEY;
  const togetherKey = process.env.TOGETHER_API_KEY;
  const deepseekKey = process.env.DEEPSEEK_API_KEY;

  const allMsgs = system ? [{ role: 'system', content: system }, ...messages] : messages;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: string) => controller.enqueue(encoder.encode(chunk));

      const providers: Array<{ name: string; gen: () => AsyncGenerator<string> }> = [];

      if (mode === 'think') {
        if (groqKey) providers.push({ name: 'Groq-R1', gen: () => streamGroq(allMsgs, 'deepseek-r1-distill-llama-70b', groqKey) });
        if (deepseekKey) providers.push({ name: 'DeepSeek', gen: () => streamDeepSeek(allMsgs, deepseekKey) });
        if (geminiKey) providers.push({ name: 'Gemini', gen: () => streamGemini(messages, system || '', geminiKey) });
      } else if (mode === 'deep') {
        if (geminiKey) providers.push({ name: 'Gemini', gen: () => streamGemini(messages, system || '', geminiKey) });
        if (togetherKey) providers.push({ name: 'Together', gen: () => streamTogether(allMsgs, togetherKey) });
        if (deepseekKey) providers.push({ name: 'DeepSeek', gen: () => streamDeepSeek(allMsgs, deepseekKey) });
      } else {
        if (groqKey) providers.push({ name: 'Groq', gen: () => streamGroq(allMsgs, 'llama-3.3-70b-versatile', groqKey) });
        if (cerebrasKey) providers.push({ name: 'Cerebras', gen: () => streamCerebras(allMsgs, cerebrasKey) });
        if (geminiKey) providers.push({ name: 'Gemini', gen: () => streamGemini(messages, system || '', geminiKey) });
      }

      if (togetherKey) providers.push({ name: 'Together', gen: () => streamTogether(allMsgs, togetherKey) });
      if (mistralKey) providers.push({ name: 'Mistral', gen: () => streamMistral(allMsgs, mistralKey) });
      if (orKey) providers.push({ name: 'OR-Gemma', gen: () => streamOpenRouter(allMsgs, orKey, 'google/gemma-3-27b-it:free') });
      if (orKey) providers.push({ name: 'OR-Kimi', gen: () => streamOpenRouter(allMsgs, orKey, 'moonshotai/kimi-k2-instruct:free') });
      // Pollinations LAST — has ads, use only as final fallback
      providers.push({ name: 'Pollinations', gen: () => streamPollinations(allMsgs) });

      for (const p of providers) {
        try {
          let hasOutput = false;
          for await (const chunk of p.gen()) {
            if (chunk) { send(sse(chunk)); hasOutput = true; }
          }
          if (hasOutput) { send(done()); controller.close(); return; }
        } catch (e) {
          console.warn(`[${p.name}] failed:`, (e as Error).message?.slice(0, 80));
        }
      }

      send(sse('Thodi connectivity issue hai. Dobara try karo 📶'));
      send(done()); controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
