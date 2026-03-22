import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get('symbol') || 'RELIANCE').toUpperCase();
  const market = searchParams.get('market') || 'NSE';

  // Indian stocks via Alpha Vantage (BSE/NSE)
  const avKey = process.env.ALPHA_VANTAGE_KEY || 'demo';
  const finnhubKey = process.env.FINNHUB_KEY || '';

  // Try NSE India free API first (no key)
  try {
    const nseSymbol = `${symbol}.NS`;
    const r = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${nseSymbol}?interval=1d&range=1d`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (r.ok) {
      const d = await r.json();
      const meta = d.chart?.result?.[0]?.meta;
      if (meta) {
        const price = meta.regularMarketPrice || 0;
        const prev = meta.chartPreviousClose || meta.previousClose || 0;
        const change = prev ? ((price - prev) / prev * 100) : 0;
        return NextResponse.json({
          symbol, market: 'NSE',
          price: price.toFixed(2),
          currency: 'INR',
          change: change.toFixed(2),
          changeAmt: (price - prev).toFixed(2),
          high: meta.regularMarketDayHigh?.toFixed(2),
          low: meta.regularMarketDayLow?.toFixed(2),
          volume: meta.regularMarketVolume?.toLocaleString('en-IN'),
          name: meta.longName || meta.shortName || symbol,
          source: 'Yahoo Finance',
        });
      }
    }
  } catch {}

  // Try Finnhub
  if (finnhubKey) {
    try {
      const r = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhubKey}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (r.ok) {
        const d = await r.json();
        if (d.c) {
          return NextResponse.json({
            symbol, price: d.c.toFixed(2),
            change: d.dp?.toFixed(2), changeAmt: d.d?.toFixed(2),
            high: d.h?.toFixed(2), low: d.l?.toFixed(2),
            source: 'Finnhub',
          });
        }
      }
    } catch {}
  }

  // Popular Indian stocks info (fallback)
  const stockInfo: Record<string, string> = {
    RELIANCE: 'Reliance Industries', TCS: 'Tata Consultancy Services',
    INFY: 'Infosys', HDFCBANK: 'HDFC Bank', ITC: 'ITC Limited',
    WIPRO: 'Wipro', TATAMOTORS: 'Tata Motors', BAJFINANCE: 'Bajaj Finance',
  };
  return NextResponse.json({
    symbol,
    name: stockInfo[symbol] || symbol,
    error: 'Live data unavailable — Yahoo Finance timeout',
    tip: `${symbol} ka price Google mein search karo ya ALPHA_VANTAGE_KEY set karo`,
  });
}
