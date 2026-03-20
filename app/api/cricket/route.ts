// ══════════════════════════════════════════════════════════════
// JARVIS CRICKET API — v30
// Research: CricAPI (100K/hour free!), ESPNCricinfo RSS (no key),
//           cricapi.com (free tier), Cricbuzz via RapidAPI
//
// Chain: CricAPI (best free) → ESPNCricinfo RSS → cricbuzz RSS
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';

const CRICAPI_KEY = process.env.CRICAPI_KEY; // cricapi.com — free signup

// Provider 1: CricAPI.com (100,000 hits/hour FREE!)
async function cricapiMatches(): Promise<any[] | null> {
  if (!CRICAPI_KEY) return null;
  try {
    const r = await fetch(
      `https://api.cricapi.com/v1/currentMatches?apikey=${CRICAPI_KEY}&offset=0`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!r.ok) return null;
    const d = await r.json();
    return d.status === 'success' ? d.data : null;
  } catch { return null; }
}

async function cricapiScore(matchId: string): Promise<any | null> {
  if (!CRICAPI_KEY) return null;
  try {
    const r = await fetch(
      `https://api.cricapi.com/v1/match_info?apikey=${CRICAPI_KEY}&id=${matchId}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!r.ok) return null;
    const d = await r.json();
    return d.status === 'success' ? d.data : null;
  } catch { return null; }
}

// Provider 2: ESPN Cricinfo RSS feed (no key, always works)
async function espnCricinfoRSS(): Promise<string | null> {
  try {
    const r = await fetch(
      'https://www.espncricinfo.com/rss/content/story/feeds/0.xml',
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!r.ok) return null;
    const xml = await r.text();
    const titles = [...xml.matchAll(/<title><!\[CDATA\[(.+?)\]\]><\/title>/g)].slice(1, 6);
    if (!titles.length) return null;
    return titles.map((m, i) => `${i + 1}. ${m[1]}`).join('\n');
  } catch { return null; }
}

// Provider 3: CricketData.org (free API)
async function cricketDataOrg(): Promise<any | null> {
  try {
    const r = await fetch(
      'https://cricketdata.org/api/matches/live',
      { signal: AbortSignal.timeout(6000) }
    );
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

// Format match data nicely
function formatMatch(match: any): string {
  const status = match.status || match.matchStatus || '';
  const name = match.name || match.matchName || 'Cricket Match';
  const venue = match.venue || '';
  const score = match.score || [];

  let scoreStr = '';
  if (Array.isArray(score) && score.length > 0) {
    scoreStr = score.map((s: any) =>
      `${s.inning?.replace(' Inning 1', '')?.replace(' Inning 2', ' (2nd)')}: **${s.r}/${s.w}** (${s.o} ov)`
    ).join('\n');
  } else if (typeof score === 'string') {
    scoreStr = score;
  }

  return [
    `🏏 **${name}**`,
    venue ? `📍 ${venue}` : '',
    scoreStr,
    `📊 ${status}`,
  ].filter(Boolean).join('\n');
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') || 'live';

  // Get live matches
  const matches = await cricapiMatches();

  if (matches && matches.length > 0) {
    // Filter live matches
    const live = matches.filter((m: any) =>
      m.matchStarted && !m.matchEnded
    ).slice(0, 3);

    const upcoming = matches.filter((m: any) =>
      !m.matchStarted
    ).slice(0, 3);

    let response = '';

    if (live.length > 0) {
      response += `🔴 **LIVE MATCHES:**\n\n`;
      response += live.map(formatMatch).join('\n\n---\n\n');
    } else {
      response += '📡 Abhi koi live match nahi chal raha.\n\n';
    }

    if (upcoming.length > 0) {
      response += `\n\n📅 **UPCOMING:**\n`;
      response += upcoming.map((m: any) =>
        `• ${m.name} — ${new Date(m.dateTimeGMT || m.date).toLocaleDateString('hi-IN')}`
      ).join('\n');
    }

    return NextResponse.json({ result: response, provider: 'CricAPI', count: matches.length });
  }

  // Fallback to ESPN RSS
  const espnNews = await espnCricinfoRSS();
  if (espnNews) {
    return NextResponse.json({
      result: `🏏 **Cricket News (ESPN Cricinfo):**\n\n${espnNews}`,
      provider: 'ESPN Cricinfo RSS',
    });
  }

  return NextResponse.json({
    result: '🏏 Cricket data abhi available nahi. CRICAPI_KEY env var set karo cricapi.com se (100K free/hour!).',
    provider: 'none',
  });
}

export async function POST(req: NextRequest) {
  const { matchId } = await req.json();
  if (!matchId) return NextResponse.json({ error: 'matchId required' }, { status: 400 });

  const score = await cricapiScore(matchId);
  if (score) {
    return NextResponse.json({ result: formatMatch(score), provider: 'CricAPI' });
  }
  return NextResponse.json({ error: 'Score not found' }, { status: 404 });
}
