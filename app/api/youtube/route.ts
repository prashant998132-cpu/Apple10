// ══════════════════════════════════════════════════════════════
// JARVIS YOUTUBE SUMMARIZER — v29
// Research: YouTube Transcript API (free, no key needed),
//           Supadata (free tier), kome.ai
//
// Chain: YouTube Transcript (unofficial) → Supadata → AI fallback
// No API key needed for basic transcript extraction
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';

// Extract YouTube video ID from any URL format
function extractVideoId(input: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  return null;
}

// Provider 1: YouTube Transcript via unofficial API (no key)
async function getYouTubeTranscript(videoId: string): Promise<string | null> {
  try {
    // Use a public transcript proxy
    const r = await fetch(
      `https://yt-transcript-api.vercel.app/api/transcript?videoId=${videoId}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (r.ok) {
      const d = await r.json();
      if (Array.isArray(d)) {
        return d.map((item: any) => item.text).join(' ');
      }
    }
    return null;
  } catch { return null; }
}

// Provider 2: Supadata transcript (free tier)
async function getSupadataTranscript(videoId: string): Promise<string | null> {
  try {
    const r = await fetch(
      `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=true`,
      {
        headers: { 'x-api-key': process.env.SUPADATA_API_KEY || '' },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!r.ok) return null;
    const d = await r.json();
    return d.content || d.text || null;
  } catch { return null; }
}

// Provider 3: Get video title and description (always works)
async function getYouTubeMetadata(videoId: string): Promise<{ title: string; description: string } | null> {
  try {
    const r = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!r.ok) return null;
    const d = await r.json();
    return { title: d.title || '', description: '' };
  } catch { return null; }
}

// Summarize transcript using Groq (fast, free)
async function summarizeWithAI(transcript: string, title: string, groqKey?: string): Promise<string> {
  const short = transcript.slice(0, 6000); // Groq context limit friendly

  if (groqKey) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 600,
          messages: [
            {
              role: 'system',
              content: 'You are JARVIS. Summarize YouTube videos in Hinglish (Hindi+English mix). Be concise, use bullet points, max 5 key points.',
            },
            {
              role: 'user',
              content: `Video: "${title}"\n\nTranscript:\n${short}\n\nSummary mein batao: kya hai is video mein? Main points kya hain?`,
            },
          ],
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (r.ok) {
        const d = await r.json();
        return d.choices?.[0]?.message?.content || '';
      }
    } catch {}
  }

  // Fallback: Basic extraction (first 500 chars of transcript)
  const preview = transcript.slice(0, 400).replace(/\s+/g, ' ').trim();
  return `📝 **Video Summary:**\n\n"${preview}..."\n\n_AI summary unavailable — transcript preview above_`;
}

export async function POST(req: NextRequest) {
  try {
    const { url, videoId: vid } = await req.json();
    const input = url || vid || '';

    const videoId = extractVideoId(input);
    if (!videoId) {
      return NextResponse.json({ error: 'Valid YouTube URL ya Video ID chahiye' }, { status: 400 });
    }

    // Get metadata
    const meta = await getYouTubeMetadata(videoId);
    const title = meta?.title || `Video ${videoId}`;

    // Get transcript
    let transcript = await getYouTubeTranscript(videoId);
    if (!transcript) transcript = await getSupadataTranscript(videoId);

    if (!transcript) {
      return NextResponse.json({
        videoId,
        title,
        summary: `❌ Is video ka transcript available nahi hai.\n\n🔗 Directly dekho: https://youtube.com/watch?v=${videoId}`,
        hasTranscript: false,
      });
    }

    const groqKey = process.env.GROQ_API_KEY;
    const summary = await summarizeWithAI(transcript, title, groqKey);

    return NextResponse.json({
      videoId,
      title,
      summary,
      transcriptLength: transcript.length,
      hasTranscript: true,
      watchUrl: `https://youtube.com/watch?v=${videoId}`,
    });
  } catch {
    return NextResponse.json({ error: 'YouTube summarize failed' }, { status: 500 });
  }
}
