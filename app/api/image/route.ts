// ══════════════════════════════════════════════════════════════
// JARVIS IMAGE API — v28 Multi-Model
// FREE image generation — multiple providers, best quality
//
// Chain:
// 1. Pollinations FLUX (no key, instant)
// 2. Pollinations FLUX-Realism (better quality)
// 3. Pollinations Turbo (fastest)
// 4. HuggingFace SDXL (free)
// 5. Direct Pollinations URL (fallback)
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';

// Model list for Pollinations
const POLLINATIONS_MODELS = [
  { id: 'flux', label: 'FLUX' },
  { id: 'flux-realism', label: 'FLUX Realism' },
  { id: 'flux-anime', label: 'FLUX Anime' },
  { id: 'flux-3d', label: 'FLUX 3D' },
  { id: 'turbo', label: 'Turbo' },
];

// Get best model based on prompt content
function selectModel(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.match(/anime|cartoon|manga|chibi|waifu/)) return 'flux-anime';
  if (p.match(/3d|render|blender|cgi|realistic.*3d/)) return 'flux-3d';
  if (p.match(/photo|realistic|real|person|face|portrait/)) return 'flux-realism';
  if (p.match(/fast|quick|simple|sketch/)) return 'turbo';
  return 'flux';
}

// Enhance prompt for better results
function enhancePrompt(prompt: string): string {
  const p = prompt.trim();
  // Don't enhance if already detailed
  if (p.length > 100) return p;
  
  const additions: string[] = [];
  if (!p.match(/quality|hd|4k|detailed/i)) additions.push('high quality');
  if (!p.match(/lighting|light/i)) additions.push('beautiful lighting');
  
  return additions.length > 0 ? `${p}, ${additions.join(', ')}` : p;
}

// Provider 1: Pollinations (text API → image URL)
async function pollinationsImage(prompt: string, model: string): Promise<string | null> {
  try {
    const encoded = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${encoded}?model=${model}&width=512&height=512&nologo=true&enhance=true&seed=${Math.floor(Math.random() * 1000000)}`;
    
    // Verify URL works with HEAD request
    const check = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
    if (check.ok) return url;
    return null;
  } catch {
    return null;
  }
}

// Provider 2: HuggingFace SDXL (free inference API)
async function huggingFaceImage(prompt: string, hfKey?: string): Promise<string | null> {
  if (!hfKey) return null;
  try {
    const r = await fetch(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${hfKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: prompt, parameters: { guidance_scale: 7.5, num_inference_steps: 25 } }),
        signal: AbortSignal.timeout(30000),
      }
    );
    if (!r.ok) return null;
    const blob = await r.blob();
    // Convert to base64 data URL
    const buffer = await blob.arrayBuffer();
    const b64 = Buffer.from(buffer).toString('base64');
    return `data:image/jpeg;base64,${b64}`;
  } catch {
    return null;
  }
}

// Provider 3: Pollinations via POST API
async function pollinationsPost(prompt: string): Promise<string | null> {
  try {
    const r = await fetch('https://image.pollinations.ai/prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model: 'flux', width: 512, height: 512, nologo: true }),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d.url || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, model: requestedModel } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 });

    const enhanced = enhancePrompt(prompt);
    const model = requestedModel || selectModel(prompt);
    const hfKey = process.env.HUGGINGFACE_API_KEY;

    // Try providers in order
    const attempts = [
      () => pollinationsImage(enhanced, model),
      () => pollinationsImage(enhanced, 'flux'),
      () => pollinationsImage(enhanced, 'turbo'),
      () => huggingFaceImage(enhanced, hfKey),
      () => pollinationsPost(enhanced),
    ];

    for (const attempt of attempts) {
      const url = await attempt();
      if (url) {
        return NextResponse.json({
          url,
          prompt: enhanced,
          model,
          source: url.startsWith('data:') ? 'HuggingFace SDXL' : `Pollinations ${model.toUpperCase()}`,
        });
      }
    }

    // Ultimate fallback — direct URL (always works)
    const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true`;
    return NextResponse.json({ url: fallbackUrl, prompt, model: 'flux', source: 'Pollinations' });

  } catch (e) {
    return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
  }
}

// GET — quick image by query param (for direct embedding)
export async function GET(req: NextRequest) {
  const prompt = req.nextUrl.searchParams.get('prompt') || 'beautiful India';
  const model = req.nextUrl.searchParams.get('model') || 'flux';
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=${model}&width=512&height=512&nologo=true`;
  return NextResponse.redirect(url);
}
