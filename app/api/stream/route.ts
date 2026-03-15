import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 60;

// ══════════════════════════════════════════════════════════════
// AI MODEL ROUTER v21
// 1. Groq        llama-3.3-70b-versatile  (Flash  — fastest)
// 2. Cerebras    llama3.1-70b             (NEW — ultra fast free)
// 3. Groq        deepseek-r1-distill-*    (Think  — reasoning)
// 4. Gemini      gemini-2.5-flash         (Deep) ← UPGRADED from 2.0
// 5. Mistral     mistral-small-latest     (fallback)
// 6. OpenRouter  gemma-3-27b              (fallback)
// 7. Pollinations                         (always works, no key)
// ══════════════════════════════════════════════════════════════

function sse(text: string) { return `data: ${JSON.stringify({ text })}\n\n`; }
function done() { return `data: [DONE]\n\n`; }

async function* streamGroq(messages: any[], model: string, apiKey: string) {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(9000),
    body: JSON.stringify({ model, messages, stream: true, max_tokens: 2048, temperature: 0.7 }),
  });
  if (!r.ok) throw new Error(`Groq ${r.status}`);
  const reader = r.body!.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { done: d, value } = await reader.read();
    if (d) break;
    buf += dec.decode(value);
    const lines = buf.split('\n'); buf = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') return;
      try { const t = JSON.parse(data)?.choices?.[0]?.delta?.content; if (t) yield t; } catch {}
    }
  }
}

async function* streamCerebras(messages: any[], apiKey: string) {
  const r = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(8000),
    body: JSON.stringify({ model: 'llama3.1-70b', messages, stream: true, max_tokens: 2048, temperature: 0.7 }),
  });
  if (!r.ok) throw new Error(`Cerebras ${r.status}`);
  const reader = r.body!.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { done: d, value } = await reader.read();
    if (d) break;
    buf += dec.decode(value);
    const lines = buf.split('\n'); buf = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') return;
      try { const t = JSON.parse(data)?.choices?.[0]?.delta?.content; if (t) yield t; } catch {}
    }
  }
}

async function* streamGemini(messages: any[], system: string, apiKey: string) {
  const contents = messages.map((m: any) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
      }),
    }
  );
  if (!r.ok) throw new Error(`Gemini ${r.status}`);
  const reader = r.body!.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { done: d, value } = await reader.read();
    if (d) break;
    buf += dec.decode(value);
    const lines = buf.split('\n'); buf = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try { const t = JSON.parse(line.slice(6))?.candidates?.[0]?.content?.parts?.[0]?.text; if (t) yield t; } catch {}
    }
  }
}

async function* streamMistral(messages: any[], apiKey: string) {
  const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'mistral-small-latest', messages, stream: true, max_tokens: 1500 }),
  });
  if (!r.ok) throw new Error(`Mistral ${r.status}`);
  const reader = r.body!.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { done: d, value } = await reader.read();
    if (d) break;
    buf += dec.decode(value);
    const lines = buf.split('\n'); buf = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') return;
      try { const t = JSON.parse(data)?.choices?.[0]?.delta?.content; if (t) yield t; } catch {}
    }
  }
}

async function* streamOpenRouter(messages: any[], apiKey: string) {
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json',
      'HTTP-Referer': 'https://apple10.vercel.app', 'X-Title': 'JARVIS',
    },
    body: JSON.stringify({ model: 'google/gemma-3-27b-it:free', messages, stream: true, max_tokens: 1500 }),
  });
  if (!r.ok) throw new Error(`OpenRouter ${r.status}`);
  const reader = r.body!.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { done: d, value } = await reader.read();
    if (d) break;
    buf += dec.decode(value);
    const lines = buf.split('\n'); buf = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') return;
      try { const t = JSON.parse(data)?.choices?.[0]?.delta?.content; if (t) yield t; } catch {}
    }
  }
}

async function* streamPollinations(messages: any[]) {
  // Try primary URL first, then backup
  const urls = [
    'https://text.pollinations.ai/openai',
    'https://api.pollinations.ai/v1/chat/completions',
  ];
  
  for (const url of urls) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({ model: 'openai', messages, stream: true, max_tokens: 1200 }),
      });
      if (!r.ok) continue;
      const reader = r.body!.getReader();
      const dec = new TextDecoder();
      let buf = '';
      while (true) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += dec.decode(value);
        const lines = buf.split('\n'); buf = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') return;
          try { const t = JSON.parse(data)?.choices?.[0]?.delta?.content; if (t) yield t; } catch {}
        }
      }
      return; // success
    } catch {}
  }
  throw new Error('Pollinations all URLs failed');
}
}

export async function POST(req: NextRequest) {
  const { messages, system = '', mode = 'auto' } = await req.json();

  const groqKey     = process.env.GROQ_API_KEY;
  const geminiKey   = process.env.GEMINI_API_KEY;
  const mistralKey  = process.env.MISTRAL_API_KEY;
  const orKey       = process.env.OPENROUTER_API_KEY;
  const cerebrasKey = process.env.CEREBRAS_API_KEY;

  const sysMsg = system ? [{ role: 'system', content: system }] : [];
  const allMsgs = [...sysMsg, ...messages];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: string) => controller.enqueue(encoder.encode(chunk));

      const providers: Array<{ name: string; gen: () => AsyncGenerator<string> }> = [];

      if (mode === 'think' && groqKey) {
        providers.push({ name: 'Groq-DeepSeek', gen: () => streamGroq(allMsgs, 'deepseek-r1-distill-llama-70b', groqKey) });
        if (geminiKey) providers.push({ name: 'Gemini-2.5', gen: () => streamGemini(messages, system, geminiKey) });
      } else if (mode === 'flash') {
        if (groqKey) providers.push({ name: 'Groq-Flash', gen: () => streamGroq(allMsgs, 'llama-3.3-70b-versatile', groqKey) });
        if (cerebrasKey) providers.push({ name: 'Cerebras', gen: () => streamCerebras(allMsgs, cerebrasKey) });
      } else {
        if (groqKey) providers.push({ name: 'Groq', gen: () => streamGroq(allMsgs, 'llama-3.3-70b-versatile', groqKey) });
        if (cerebrasKey) providers.push({ name: 'Cerebras', gen: () => streamCerebras(allMsgs, cerebrasKey) });
        if (geminiKey) providers.push({ name: 'Gemini-2.5', gen: () => streamGemini(messages, system, geminiKey) });
      }

      if (mistralKey) providers.push({ name: 'Mistral', gen: () => streamMistral(allMsgs, mistralKey) });
      if (orKey) providers.push({ name: 'OpenRouter', gen: () => streamOpenRouter(allMsgs, orKey) });
      providers.push({ name: 'Pollinations', gen: () => streamPollinations(allMsgs) });

      for (const p of providers) {
        try {
          let hasOutput = false;
          for await (const chunk of p.gen()) {
            send(sse(chunk));
            hasOutput = true;
          }
          if (hasOutput) { send(done()); controller.close(); return; }
        } catch (e) {
          console.warn(`[${p.name}] failed:`, (e as Error).message);
        }
      }

      send(sse('Thodi connectivity issue hai. Dobara try karo ya WiFi check karo 📶'));
      send(done());
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Jarvis-Mode': mode || 'auto',
    },
  });
}
