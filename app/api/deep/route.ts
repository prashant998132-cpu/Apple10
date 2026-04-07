import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Gemini function calling — Deep mode tools (v45: expanded)
const TOOL_DECLARATIONS = [
  { name: 'get_weather', description: 'Get weather forecast for user location', parameters: { type: 'OBJECT', properties: { lat: { type: 'NUMBER' }, lon: { type: 'NUMBER' } }, required: [] }},
  { name: 'get_crypto', description: 'Get live crypto prices (BTC, ETH, SOL, DOGE in INR/USD)', parameters: { type: 'OBJECT', properties: {}, required: [] }},
  { name: 'get_news', description: 'Get latest India news headlines', parameters: { type: 'OBJECT', properties: {}, required: [] }},
  { name: 'search_wikipedia', description: 'Search Wikipedia for any topic', parameters: { type: 'OBJECT', properties: { query: { type: 'STRING', description: 'Search query' } }, required: ['query'] }},
  { name: 'generate_image', description: 'Generate AI image from text description', parameters: { type: 'OBJECT', properties: { prompt: { type: 'STRING', description: 'Image description' } }, required: ['prompt'] }},
  { name: 'get_meaning', description: 'Get word meaning and definition', parameters: { type: 'OBJECT', properties: { word: { type: 'STRING', description: 'Word to define' } }, required: ['word'] }},
  { name: 'get_joke', description: 'Get a funny joke', parameters: { type: 'OBJECT', properties: {}, required: [] }},
  { name: 'get_quote', description: 'Get motivational quote', parameters: { type: 'OBJECT', properties: {}, required: [] }},
  { name: 'calculate', description: 'Perform math calculation', parameters: { type: 'OBJECT', properties: { expr: { type: 'STRING', description: 'Math expression like 2+2 or sqrt(16)' } }, required: ['expr'] }},
  { name: 'get_nasa', description: 'Get NASA astronomy picture of the day', parameters: { type: 'OBJECT', properties: {}, required: [] }},
  { name: 'get_holidays', description: 'Get upcoming India public holidays', parameters: { type: 'OBJECT', properties: {}, required: [] }},
  { name: 'search_books', description: 'Search for books by title or author', parameters: { type: 'OBJECT', properties: { query: { type: 'STRING', description: 'Book title or author' } }, required: ['query'] }},
  { name: 'get_exchange', description: 'Get live currency exchange rates (USD, INR, EUR, GBP)', parameters: { type: 'OBJECT', properties: {}, required: [] }},
  { name: 'get_iss', description: 'Get real-time ISS space station location', parameters: { type: 'OBJECT', properties: {}, required: [] }},
  { name: 'get_recipe', description: 'Get recipe for a dish', parameters: { type: 'OBJECT', properties: { query: { type: 'STRING', description: 'Dish name' } }, required: ['query'] }},
  { name: 'lookup_pincode', description: 'Get location info for Indian pincode', parameters: { type: 'OBJECT', properties: { pincode: { type: 'STRING', description: '6-digit Indian pincode' } }, required: ['pincode'] }},
  { name: 'get_gold_price', description: 'Get live gold and silver prices in India (per gram/10g)', parameters: { type: 'OBJECT', properties: {}, required: [] }},
  { name: 'get_fuel_price', description: 'Get petrol and diesel prices in major Indian cities', parameters: { type: 'OBJECT', properties: { city: { type: 'STRING', description: 'City name like Delhi, Mumbai, Bangalore' } }, required: [] }},
  { name: 'get_random_fact', description: 'Get an interesting random fact', parameters: { type: 'OBJECT', properties: {}, required: [] }},
  { name: 'get_sunrise', description: 'Get sunrise and sunset time for location', parameters: { type: 'OBJECT', properties: { lat: { type: 'NUMBER' }, lon: { type: 'NUMBER' } }, required: [] }},
  { name: 'calc_bmi', description: 'Calculate BMI from height and weight', parameters: { type: 'OBJECT', properties: { weight: { type: 'NUMBER', description: 'Weight in kg' }, height: { type: 'NUMBER', description: 'Height in cm' } }, required: ['weight', 'height'] }},
  { name: 'calc_sip', description: 'Calculate SIP mutual fund returns', parameters: { type: 'OBJECT', properties: { monthly: { type: 'NUMBER' }, rate: { type: 'NUMBER' }, years: { type: 'NUMBER' } }, required: ['monthly', 'rate', 'years'] }},
  { name: 'calc_emi', description: 'Calculate loan EMI', parameters: { type: 'OBJECT', properties: { principal: { type: 'NUMBER' }, rate: { type: 'NUMBER' }, years: { type: 'NUMBER' } }, required: ['principal', 'rate', 'years'] }},
  { name: 'word_of_day', description: 'Get word of the day with meaning', parameters: { type: 'OBJECT', properties: {}, required: [] }},
];

async function callTool(name: string, args: any): Promise<string> {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : (process.env.NEXT_PUBLIC_APP_URL || 'https://apple10.vercel.app');
    const r = await fetch(`${baseUrl}/api/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: name, params: args }),
      signal: AbortSignal.timeout(10000),
    });
    const d = await r.json();
    if (d.error) return `Tool error: ${d.error}`;
    if (typeof d.result === 'object') return JSON.stringify(d.result, null, 2);
    return String(d.result);
  } catch (e: any) {
    return `Tool error: ${e.message}`;
  }
}

export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: 'No Gemini key' }, { status: 400 });

  const { messages, system } = await req.json();

  const geminiMsgs = messages
    .filter((m: any) => m.content)
    .map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || ' ' }],
    }));

  if (!geminiMsgs.length) {
    return NextResponse.json({ error: 'No messages' }, { status: 400 });
  }

  // Use Gemini 2.5 Pro for deep mode (upgraded from 2.5 Flash)
  const model = 'gemini-2.5-pro-preview-06-05';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  // First call — let Gemini decide which tools to call
  let res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: (system || '') + '\n\nTu real-time tools use kar sakta hai. Jab needed ho toh tools call karo. Multiple tools ek saath use kar sakta hai.' }] },
      contents: geminiMsgs,
      tools: [{ function_declarations: TOOL_DECLARATIONS }],
      tool_config: { function_calling_config: { mode: 'AUTO' } },
      generationConfig: { maxOutputTokens: 4000, temperature: 0.7 },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    // Fallback to flash if pro unavailable
    const flashUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    res = await fetch(flashUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system || '' }] },
        contents: geminiMsgs,
        tools: [{ function_declarations: TOOL_DECLARATIONS }],
        tool_config: { function_calling_config: { mode: 'AUTO' } },
        generationConfig: { maxOutputTokens: 3000 },
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Gemini error: ${res.status}` }, { status: res.status });
    }
  }

  let data = await res.json();
  const candidate = data.candidates?.[0];
  if (!candidate) return NextResponse.json({ error: 'No candidates' }, { status: 500 });

  const parts = candidate.content?.parts || [];
  const functionCalls = parts.filter((p: any) => p.functionCall);
  const textParts = parts.filter((p: any) => p.text);

  // If no tool calls, return direct response
  if (!functionCalls.length) {
    const text = textParts.map((p: any) => p.text).join('\n') || 'Koi response nahi mila.';
    return NextResponse.json({ result: text });
  }

  // Execute all tool calls in parallel
  const toolResults = await Promise.all(
    functionCalls.map(async (fc: any) => ({
      name: fc.functionCall.name,
      result: await callTool(fc.functionCall.name, fc.functionCall.args || {}),
    }))
  );

  // Second call with tool results
  const updatedContents = [
    ...geminiMsgs,
    { role: 'model', parts: functionCalls.map((fc: any) => ({ functionCall: fc.functionCall })) },
    {
      role: 'user',
      parts: toolResults.map(tr => ({
        functionResponse: { name: tr.name, response: { result: tr.result } },
      })),
    },
  ];

  const res2 = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system || '' }] },
      contents: updatedContents,
      generationConfig: { maxOutputTokens: 4000 },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res2.ok) {
    return NextResponse.json({ error: `Gemini final error: ${res2.status}` }, { status: res2.status });
  }

  const data2 = await res2.json();
  const finalText = data2.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('\n') || 'Deep analysis complete.';

  return NextResponse.json({
    result: finalText,
    toolsUsed: toolResults.map(tr => tr.name),
  });
}
