'use client';

// ══════════════════════════════════════════════════════
// JARVIS Power Intents V3
// NASA · Movies · Stocks · Countries · ISS
// ══════════════════════════════════════════════════════

export interface IntentResult {
  handled: boolean;
  response?: string;
  widget?: string;
  data?: any;
}

export async function handlePowerIntentV3(msg: string): Promise<IntentResult> {
  const m = msg.toLowerCase().trim();

  // ── NASA / Space ─────────────────────────────────
  if (m.includes('nasa') || m.includes('space photo') || m.includes('aaj ka space') ||
      m.includes('astronomy') || m.includes('apod')) {
    try {
      const r = await fetch('/api/nasa?type=apod');
      const d = await r.json();
      if (d.title) {
        return {
          handled: true,
          response: `🌌 **NASA APOD — ${d.date}**\n\n**${d.title}**\n\n${d.explanation}\n\n[Image dekhne ke liye →](${d.url})\n\n_© ${d.copyright}_`,
          widget: 'nasa_apod',
          data: d,
        };
      }
    } catch {}
    return { handled: true, response: '🌌 NASA server se connect nahi ho pa raha. Baad mein try karo.' };
  }

  // ── ISS Location ─────────────────────────────────
  if (m.includes('iss') || m.includes('space station') || m.includes('antariksha') ||
      m.includes('international space') || m.includes('iss kahan')) {
    try {
      const r = await fetch('/api/nasa?type=iss');
      const d = await r.json();
      if (d.lat) {
        return {
          handled: true,
          response: `🛸 **ISS — International Space Station**\n\n📍 Location: **${d.location}**\n🌐 Coordinates: ${d.lat}°, ${d.lon}°\n⚡ Speed: ${d.speed}\n🚀 Altitude: ${d.altitude}\n\nISS abhi puri duniya ke upar se guzar raha hai!`,
          data: d,
        };
      }
    } catch {}
    return { handled: true, response: '🛸 ISS ki location abhi available nahi hai.' };
  }

  // ── Movies / Bollywood ────────────────────────────
  if (m.includes('movie') || m.includes('film') || m.includes('bollywood') ||
      m.includes('koi movie batao') || m.includes('dekhne ke liye')) {
    const isSearch = m.includes('search') || m.includes('dhundo') || m.includes('find');
    const isBollywood = m.includes('bollywood') || m.includes('hindi film') || m.includes('hindi movie');

    let url = '/api/movies?type=trending';
    if (isBollywood) url = '/api/movies?type=bollywood';

    // Extract movie name for search
    const searchMatch = m.match(/(?:search|dhundo|find|dekhna hai)\s+(.+)/);
    if (searchMatch) url = `/api/movies?type=search&q=${encodeURIComponent(searchMatch[1])}`;

    try {
      const r = await fetch(url);
      const d = await r.json();
      if (d.movies?.length > 0) {
        const list = d.movies.map((mv: any) =>
          `🎬 **${mv.title}** (${mv.year || '?'}) — ⭐ ${mv.rating || '?'}/10\n   ${mv.overview || ''}`
        ).join('\n\n');
        return {
          handled: true,
          response: `🎥 **${isBollywood ? 'Top Bollywood' : 'Trending'} Movies:**\n\n${list}`,
          data: d,
        };
      }
    } catch {}
    return { handled: true, response: '🎬 Movies data abhi available nahi.' };
  }

  // ── Stocks / Share Market ─────────────────────────
  if (m.includes('stock') || m.includes('share') || m.includes('nifty') ||
      m.includes('sensex') || m.includes('market') || m.includes('reliance') ||
      m.includes('tcs ') || m.includes('infosys')) {

    // Extract stock symbol
    const symbolMatch = m.match(/\b(reliance|tcs|infosys|infy|wipro|hdfc|sbi|tatamotors|bajfinance|itc|hdfcbank)\b/i);
    const symbol = symbolMatch?.[1]?.toUpperCase() || 'RELIANCE';
    const symbolMap: Record<string, string> = { INFY: 'INFOSYS', HDFC: 'HDFCBANK' };
    const finalSymbol = symbolMap[symbol] || symbol;

    try {
      const r = await fetch(`/api/stocks?symbol=${finalSymbol}`);
      const d = await r.json();
      if (d.price && !d.error) {
        const chgIcon = parseFloat(d.change) >= 0 ? '📈' : '📉';
        return {
          handled: true,
          response: `${chgIcon} **${d.name || finalSymbol}** (NSE)\n\n💰 Price: **₹${d.price}**\n${parseFloat(d.change) >= 0 ? '↑' : '↓'} Change: ${d.changeAmt} (${d.change}%)\n📊 High: ₹${d.high} | Low: ₹${d.low}\n📦 Volume: ${d.volume || 'N/A'}\n\n_${d.source}_`,
          data: d,
        };
      }
      if (d.tip) return { handled: true, response: `📊 ${d.tip}` };
    } catch {}
    return { handled: true, response: '📊 Share market data fetch karna nahi ho pa raha abhi.' };
  }

  // ── Country Info ──────────────────────────────────
  if (m.includes('country') || m.includes('desh') || m.includes('capital') ||
      m.includes('currency') || m.includes('flag')) {
    const countryMatch = m.match(/(?:about|ke baare mein|ki jankari|info)\s+(.+)/i);
    const country = countryMatch?.[1] || 'India';
    try {
      const r = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(country)}?fields=name,capital,currencies,languages,population,flags,region`, {
        signal: AbortSignal.timeout(5000),
      });
      if (r.ok) {
        const [c] = await r.json();
        const curr = Object.values(c.currencies || {})[0] as any;
        const lang = Object.values(c.languages || {})[0] as string;
        return {
          handled: true,
          response: `${c.flags?.emoji || '🌍'} **${c.name?.common}**\n\n🏙️ Capital: ${c.capital?.[0]}\n👥 Population: ${(c.population / 1000000).toFixed(1)}M\n💰 Currency: ${curr?.name} (${curr?.symbol})\n🗣️ Language: ${lang}\n🌐 Region: ${c.region}`,
          data: c,
        };
      }
    } catch {}
    return { handled: true, response: `🌍 ${country} ki info abhi nahi mili.` };
  }

  return { handled: false };
}
