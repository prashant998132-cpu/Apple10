// ════════════════════════════════════════════════════════════════
// JARVIS AI STREAM — v28 Mega Upgrade
// 10 FREE providers — never fails
//
// CHAIN (priority order):
// 1. Groq llama-3.3-70b        → fastest, 14,400 req/day
// 2. Groq deepseek-r1           → reasoning mode
// 3. Gemini 2.5 Flash           → deep analysis
// 4. Together AI                → free $25 credits
// 5. DeepSeek free              → excellent reasoning, free
// 6. Cerebras llama3.1          → ultra fast
// 7. Mistral small              → reliable fallback
// 8. OpenRouter gemma-3-27b     → free model
// 9. OpenRouter Kimi K2         → 1000/day free, very capable
//10. Pollinations               → always works, no key
// ════════════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';

function sse(t: string) { return `data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n\n`; }
function done() { return 'data: [DONE]\n\n'; }

// ── Provider 1: Groq ─────────────────────────────────────────
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

// ── Provider 2: Gemini ───────────────────────────────────────
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

// ── Provider 3: Together AI (free $25 credits) ───────────────
async function* streamTogether(messages: any[], key: string) {
  if (!key) throw new Error('No Together key');
  const r = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free', messages, stream: true, max_tokens: 1500 }),
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error(`Together ${r.status}`);
  yield* streamSSE(r);
}

// ── Provider 4: DeepSeek (free API) ─────────────────────────
async function* streamDeepSeek(messages: any[], key: string) {
  if (!key) throw new Error('No DeepSeek key');
  const r = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'deepseek-chat', messages, stream: true, max_tokens: 1500 }),
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error(`DeepSeek ${r.status}`);
  yield* streamSSE(r);
}

// ── Provider 5: Cerebras ─────────────────────────────────────
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

// ── Provider 6: Mistral ──────────────────────────────────────
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

// ── Provider 7: OpenRouter (multiple free models) ─────────────
async function* streamOpenRouter(messages: any[], key: string, model = 'google/gemma-3-27b-it:free') {
  if (!key) throw new Error('No OR key');
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'HTTP-Referer': 'https://apple10.vercel.app' },
    body: JSON.stringify({ model, messages, stream: true, max_tokens: 1500 }),
    signal: AbortSignal.timeout(25000),
  });
  if (!r.ok) throw new Error(`OpenRouter ${r.status}`);
  yield* streamSSE(r);
}

// ── Provider 8: Pollinations (ALWAYS works, no key) ──────────
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
      yield* streamSSE(r);
      return;
    } catch {}
  }
  throw new Error('Pollinations all failed');
}

// ── SSE reader helper ────────────────────────────────────────
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

// ── Main handler ─────────────────────────────────────────────
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

      // Build provider chain based on mode
      const providers: Array<{ name: string; gen: () => AsyncGenerator<string> }> = [];

      if (mode === 'think') {
        // Reasoning mode — best reasoning models first
        if (groqKey) providers.push({ name: 'Groq-R1', gen: () => streamGroq(allMsgs, 'deepseek-r1-distill-llama-70b', groqKey) });
        if (deepseekKey) providers.push({ name: 'DeepSeek', gen: () => streamDeepSeek(allMsgs, deepseekKey) });
        if (geminiKey) providers.push({ name: 'Gemini-2.5', gen: () => streamGemini(messages, system || '', geminiKey) });
      } else if (mode === 'deep') {
        // Deep analysis — largest models
        if (geminiKey) providers.push({ name: 'Gemini-2.5', gen: () => streamGemini(messages, system || '', geminiKey) });
        if (orKey) providers.push({ name: 'OR-Kimi', gen: () => streamOpenRouter(allMsgs, orKey, 'moonshotai/kimi-k2-instruct:free') });
        if (togetherKey) providers.push({ name: 'Together', gen: () => streamTogether(allMsgs, togetherKey) });
        if (deepseekKey) providers.push({ name: 'DeepSeek', gen: () => streamDeepSeek(allMsgs, deepseekKey) });
      } else {
        // Flash/Auto — fastest first
        if (groqKey) providers.push({ name: 'Groq', gen: () => streamGroq(allMsgs, 'llama-3.3-70b-versatile', groqKey) });
        if (cerebrasKey) providers.push({ name: 'Cerebras', gen: () => streamCerebras(allMsgs, cerebrasKey) });
        if (geminiKey) providers.push({ name: 'Gemini', gen: () => streamGemini(messages, system || '', geminiKey) });
      }

      // Common fallbacks for all modes
      if (togetherKey) providers.push({ name: 'Together', gen: () => streamTogether(allMsgs, togetherKey) });
      if (mistralKey) providers.push({ name: 'Mistral', gen: () => streamMistral(allMsgs, mistralKey) });
      if (orKey) providers.push({ name: 'OR-Gemma', gen: () => streamOpenRouter(allMsgs, orKey, 'google/gemma-3-27b-it:free') });
      if (orKey) providers.push({ name: 'OR-Kimi', gen: () => streamOpenRouter(allMsgs, orKey, 'moonshotai/kimi-k2-instruct:free') });
      providers.push({ name: 'Pollinations', gen: () => streamPollinations(allMsgs) });

      for (const p of providers) {
        try {
          let hasOutput = false;
          for await (const chunk of p.gen()) {
            if (chunk) {
              send(sse(chunk));
              hasOutput = true;
            }
          }
          if (hasOutput) {
            send(sse(`\n`)); // send provider name
            send(done()); controller.close(); return;
          }
        } catch (e) {
          console.warn(`[${p.name}] failed:`, (e as Error).message?.slice(0, 80));
        }
      }

      // All failed
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
