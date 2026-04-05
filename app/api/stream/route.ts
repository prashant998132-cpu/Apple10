// JARVIS AI STREAM v43 — Parallel Race + Error Messages + Stability
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

function sse(t: string) { return `data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n\n`; }
function done() { return 'data: [DONE]\n\n'; }

function cleanChunk(text: string): string {
  return text
    .replace(/<\|[^|>]*\|>/g, '')
    .replace(/---\s*\n?Support Pollinations\.AI:[\s\S]*?accessible for everyone\./gi, '')
    .replace(/Support Pollinations\.AI:[\s\S]*?accessible for everyone\./gi, '')
    .replace(/🌸\s*Ad\s*🌸[\s\S]*?accessible for everyone\./gi, '')
    .replace(/Pollinations\.AI free text APIs\./gi, '')
    .replace(/\[\s*Pollinations[^\]]*\]/gi, '');
}

class AdFilter {
  buffer = ''; adDetected = false;
  filter(chunk: string): string {
    if (this.adDetected) return '';
    this.buffer += chunk;
    const adStart = this.buffer.search(/---\s*\n?Support Pollinations|Support Pollinations\.AI:|🌸\s*Ad\s*🌸/i);
    if (adStart !== -1) { this.adDetected = true; const clean = this.buffer.slice(0, adStart); this.buffer = ''; return cleanChunk(clean); }
    const safeEnd = Math.max(0, this.buffer.length - 50);
    const safe = this.buffer.slice(0, safeEnd); this.buffer = this.buffer.slice(safeEnd);
    return cleanChunk(safe);
  }
  flush(): string { if (this.adDetected) return ''; const r = cleanChunk(this.buffer); this.buffer = ''; return r; }
}

// ── Streaming helpers ────────────────────────────────────────────
async function* streamSSE(r: Response): AsyncGenerator<string> {
  if (!r.body) throw new Error('No body');
  const reader = r.body.getReader(); const dec = new TextDecoder(); let buf = '';
  while (true) {
    const { done: d, value } = await reader.read(); if (d) break;
    buf += dec.decode(value); const lines = buf.split('\n'); buf = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6); if (data === '[DONE]') return;
      try { const t = JSON.parse(data)?.choices?.[0]?.delta?.content; if (t) yield t; } catch {}
    }
  }
}

async function* streamGroq(messages: any[], model: string, key: string): AsyncGenerator<string> {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, stream: true, max_tokens: 1500, temperature: 0.7 }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`Groq ${r.status}`);
  yield* streamSSE(r);
}

async function* streamGemini(messages: any[], system: string, key: string): AsyncGenerator<string> {
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content || ' ' }] }));
  if (!contents.length) throw new Error('No contents');
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${key}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents, systemInstruction: { parts: [{ text: system }] }, generationConfig: { maxOutputTokens: 1500 } }),
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error(`Gemini ${r.status}`);
  const reader = r.body!.getReader(); const dec = new TextDecoder(); let buf = '';
  while (true) {
    const { done: d, value } = await reader.read(); if (d) break;
    buf += dec.decode(value); const lines = buf.split('\n'); buf = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try { const t = JSON.parse(line.slice(6))?.candidates?.[0]?.content?.parts?.[0]?.text; if (t) yield t; } catch {}
    }
  }
}

async function* streamClaude(messages: any[], system: string, key: string): AsyncGenerator<string> {
  const msgs = messages.filter(m => m.role !== 'system' && m.content).map(m => ({ role: m.role, content: m.content }));
  if (!msgs.length) throw new Error('No messages');
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 3000, system: system || 'You are JARVIS.', messages: msgs, stream: true }),
    signal: AbortSignal.timeout(25000),
  });
  if (!r.ok) throw new Error(`Claude ${r.status}`);
  const reader = r.body!.getReader(); const dec = new TextDecoder(); let buf = '';
  while (true) {
    const { done: d, value } = await reader.read(); if (d) break;
    buf += dec.decode(value); const lines = buf.split('\n'); buf = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try { const j = JSON.parse(line.slice(6)); if (j.type === 'content_block_delta' && j.delta?.text) yield j.delta.text; } catch {}
    }
  }
}

async function* streamCerebras(messages: any[], key: string): AsyncGenerator<string> {
  const r = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'llama3.1-70b', messages, stream: true, max_tokens: 2048, temperature: 0.7 }),
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) throw new Error(`Cerebras ${r.status}`);
  yield* streamSSE(r);
}

async function* streamOpenRouter(messages: any[], key: string, model: string): AsyncGenerator<string> {
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'HTTP-Referer': 'https://apple10.vercel.app' },
    body: JSON.stringify({ model, messages, stream: true, max_tokens: 1500 }),
    signal: AbortSignal.timeout(25000),
  });
  if (!r.ok) throw new Error(`OR ${r.status}`);
  yield* streamSSE(r);
}

async function* streamTogether(messages: any[], key: string): AsyncGenerator<string> {
  const r = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free', messages, stream: true, max_tokens: 1500 }),
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error(`Together ${r.status}`);
  yield* streamSSE(r);
}

async function* streamDeepSeek(messages: any[], key: string): AsyncGenerator<string> {
  const r = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'deepseek-chat', messages, stream: true, max_tokens: 1500 }),
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error(`DeepSeek ${r.status}`);
  yield* streamSSE(r);
}


async function* streamMistral(messages: any[], key: string): AsyncGenerator<string> {
  const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'mistral-small-latest', messages, stream: true, max_tokens: 1500, temperature: 0.7 }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`Mistral ${r.status}`);
  yield* streamSSE(r);
}

async function* streamPollinations(messages: any[]): AsyncGenerator<string> {
  const urls = ['https://text.pollinations.ai/openai', 'https://api.pollinations.ai/v1/chat/completions'];
  for (const url of urls) {
    try {
      const r = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'openai', messages, stream: true, max_tokens: 1200 }),
        signal: AbortSignal.timeout(25000),
      });
      if (!r.ok) continue;
      const filter = new AdFilter();
      const reader = r.body!.getReader(); const dec = new TextDecoder(); let buf = '';
      while (true) {
        const { done: d, value } = await reader.read(); if (d) break;
        buf += dec.decode(value); const lines = buf.split('\n'); buf = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6); if (data === '[DONE]') { const r2 = filter.flush(); if (r2) yield r2; return; }
          try { const t = JSON.parse(data)?.choices?.[0]?.delta?.content; if (t) { const clean = filter.filter(t); if (clean) yield clean; } } catch {}
        }
      }
      const rem = filter.flush(); if (rem) yield rem; return;
    } catch {}
  }
  throw new Error('Pollinations failed');
}

// ── Parallel race — first provider to respond wins ───────────────
async function raceProviders(
  providers: Array<{ name: string; gen: () => AsyncGenerator<string> }>,
  onChunk: (chunk: string) => void,
  onProvider: (name: string) => void
): Promise<boolean> {
  // Try first 3 providers in parallel, use fastest
  const fast = providers.slice(0, 3);
  const rest = providers.slice(3);

  let won = false;
  let winnerAbort: AbortController | null = null;

  const race = fast.map(async (p) => {
    const chunks: string[] = [];
    try {
      for await (const chunk of p.gen()) {
        if (won && !chunks.length) return; // another won first
        chunks.push(chunk);
        if (chunks.length === 1 && !won) {
          won = true;
          onProvider(p.name);
          for (const c of chunks) onChunk(c);
        } else if (won && chunks.length > 1) {
          onChunk(chunk);
        }
      }
      return chunks.length > 0;
    } catch (e: any) {
      console.warn('[' + p.name + '] failed:', e.message?.slice(0, 60));
      return false;
    }
  });

  await Promise.allSettled(race);
  if (won) return true;

  // Fallback: try rest sequentially
  for (const p of rest) {
    try {
      let hasOutput = false;
      onProvider(p.name);
      for await (const chunk of p.gen()) {
        onChunk(chunk); hasOutput = true;
      }
      if (hasOutput) return true;
    } catch (e: any) {
      console.warn('[' + p.name + '] failed:', e.message?.slice(0, 60));
    }
  }
  return false;
}

// ── Main handler ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { messages = [], system = '', mode = 'auto' } = body;

    if (!messages.length) {
      return new Response(
        `data: ${JSON.stringify({ choices: [{ delta: { content: 'Koi message nahi mila. Phir se try karo.' } }] })}\n\ndata: [DONE]\n\n`,
        { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } }
      );
    }

    const groqKey     = process.env.GROQ_API_KEY || '';
    const geminiKey   = process.env.GEMINI_API_KEY || '';
    const cerebrasKey = process.env.CEREBRAS_API_KEY || '';
    const orKey       = process.env.OPENROUTER_API_KEY || '';
    const togetherKey = process.env.TOGETHER_API_KEY || '';
    const deepseekKey = process.env.DEEPSEEK_API_KEY || '';
    const claudeKey   = process.env.ANTHROPIC_API_KEY || '';
    const mistralKey  = process.env.MISTRAL_API_KEY || '';
    const allMsgs = system ? [{ role: 'system', content: system }, ...messages] : messages;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let closed = false;
        const send = (chunk: string) => {
          if (closed) return;
          try { controller.enqueue(encoder.encode(chunk)); } catch {}
        };
        const close = () => {
          if (closed) return;
          closed = true;
          try { controller.close(); } catch {}
        };

        // Build providers based on mode
        const providers: Array<{ name: string; gen: () => AsyncGenerator<string> }> = [];

        if (mode === 'think') {
          if (claudeKey)   providers.push({ name: 'Claude', gen: () => streamClaude(messages, system, claudeKey) });
          if (groqKey)     providers.push({ name: 'Groq-R1', gen: () => streamGroq(allMsgs, 'deepseek-r1-distill-llama-70b', groqKey) });
          if (deepseekKey) providers.push({ name: 'DeepSeek', gen: () => streamDeepSeek(allMsgs, deepseekKey) });
          if (geminiKey)   providers.push({ name: 'Gemini', gen: () => streamGemini(messages, system, geminiKey) });
        } else if (mode === 'deep') {
          if (claudeKey)   providers.push({ name: 'Claude', gen: () => streamClaude(messages, system, claudeKey) });
          if (geminiKey)   providers.push({ name: 'Gemini', gen: () => streamGemini(messages, system, geminiKey) });
          if (togetherKey) providers.push({ name: 'Together', gen: () => streamTogether(allMsgs, togetherKey) });
          if (deepseekKey) providers.push({ name: 'DeepSeek', gen: () => streamDeepSeek(allMsgs, deepseekKey) });
        } else {
          // Flash/auto — parallel race: Groq vs Cerebras vs Gemini
          if (groqKey)     providers.push({ name: 'Groq', gen: () => streamGroq(allMsgs, 'llama-3.3-70b-versatile', groqKey) });
          if (cerebrasKey) providers.push({ name: 'Cerebras', gen: () => streamCerebras(allMsgs, cerebrasKey) });
          if (geminiKey)   providers.push({ name: 'Gemini', gen: () => streamGemini(messages, system, geminiKey) });
          if (claudeKey)   providers.push({ name: 'Claude', gen: () => streamClaude(messages, system, claudeKey) });
          if (mistralKey) providers.push({ name: 'Mistral', gen: () => streamMistral(allMsgs, mistralKey) });
        }

        // Always add fallbacks
        if (togetherKey && mode === 'auto') providers.push({ name: 'Together', gen: () => streamTogether(allMsgs, togetherKey) });
        if (orKey)       providers.push({ name: 'Kimi', gen: () => streamOpenRouter(allMsgs, orKey, 'moonshotai/kimi-k2-instruct:free') });
        if (orKey)       providers.push({ name: 'Gemma', gen: () => streamOpenRouter(allMsgs, orKey, 'google/gemma-3-27b-it:free') });
        providers.push({ name: 'Pollinations', gen: () => streamPollinations(allMsgs) });

        let activeProvider = '';
        const success = await raceProviders(
          providers,
          (chunk) => send(sse(chunk)),
          (name) => { activeProvider = name; }
        );

        if (!success) {
          send(sse('Sab AI providers busy hain abhi 📶 Thodi der mein try karo.'));
        }

        send(done());
        close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
        'Connection': 'keep-alive',
      },
    });
  } catch (e: any) {
    console.error('[stream] crash:', e.message);
    return new Response(
      `data: ${JSON.stringify({ choices: [{ delta: { content: 'Server error. Dobara try karo.' } }] })}\n\ndata: [DONE]\n\n`,
      { status: 200, headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } }
    );
  }
}
