import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

const COINS = [
  { id:'bitcoin',   symbol:'BTC', name:'Bitcoin',  icon:'₿'  },
  { id:'ethereum',  symbol:'ETH', name:'Ethereum', icon:'Ξ'  },
  { id:'solana',    symbol:'SOL', name:'Solana',   icon:'◎'  },
  { id:'binancecoin',symbol:'BNB',name:'BNB',      icon:'🔶' },
  { id:'dogecoin',  symbol:'DOGE',name:'Dogecoin', icon:'🐕' },
  { id:'ripple',    symbol:'XRP', name:'XRP',      icon:'◈'  },
  { id:'cardano',   symbol:'ADA', name:'Cardano',  icon:'◇'  },
  { id:'polkadot',  symbol:'DOT', name:'Polkadot', icon:'●'  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol')?.toUpperCase();
  const coins = symbol ? COINS.filter(c=>c.symbol===symbol) : COINS;
  const ids = coins.map(c=>c.id).join(',');

  // Source 1: CoinGecko free (no key needed)
  try {
    const r = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=inr,usd&include_24hr_change=true&include_market_cap=true`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) }
    );
    if (r.ok) {
      const d = await r.json();
      const data = coins.map(c => ({
        ...c,
        priceInr: Math.round(d[c.id]?.inr || 0),
        priceUsd: Math.round((d[c.id]?.usd || 0) * 100) / 100,
        change24h: Math.round((d[c.id]?.inr_24h_change || 0) * 100) / 100,
        marketCapInr: d[c.id]?.inr_market_cap || 0,
      })).filter(c => c.priceInr > 0);
      if (data.length > 0) {
        return NextResponse.json({ data, source: 'coingecko', ts: Date.now() });
      }
    }
  } catch {}

  // Source 2: CoinPaprika (no key)
  try {
    const promises = coins.slice(0,4).map(async c => {
      const r = await fetch(`https://api.coinpaprika.com/v1/tickers/${c.id}-${c.symbol.toLowerCase()}`,
        { signal: AbortSignal.timeout(6000) });
      if (!r.ok) return null;
      const d = await r.json();
      const usdPrice = d.quotes?.USD?.price || 0;
      return {
        ...c,
        priceInr: Math.round(usdPrice * 83.5),
        priceUsd: Math.round(usdPrice * 100) / 100,
        change24h: Math.round((d.quotes?.USD?.percent_change_24h || 0) * 100) / 100,
        marketCapInr: 0,
      };
    });
    const results = (await Promise.all(promises)).filter(Boolean);
    if (results.length > 0) {
      return NextResponse.json({ data: results, source: 'coinpaprika', ts: Date.now() });
    }
  } catch {}

  return NextResponse.json({ error: 'All crypto APIs unavailable', data: [] }, { status: 503 });
}
