import { NextResponse } from 'next/server';

export async function GET() {
  // ── Source 1: GoldPrice.org (no key, most reliable free source) ──
  try {
    const r = await fetch(
      'https://data-asg.goldprice.org/GetData/INR-XAU/1',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Origin': 'https://goldprice.org',
        },
        signal: AbortSignal.timeout(6000),
      }
    );
    if (r.ok) {
      const text = await r.text();
      // Response: "1,val1,val2..." or JSON
      const parts = text.split(',');
      const goldPerOzInr = parseFloat(parts[1] || '0');
      if (goldPerOzInr > 50000) {
        const gold24k = Math.round(goldPerOzInr / 31.1035);
        return NextResponse.json({
          gold24k,
          gold22k: Math.round(gold24k * 22 / 24),
          gold18k: Math.round(gold24k * 18 / 24),
          silver: 0, // fetch separately
          change: parseFloat(parts[2] || '0'),
          changeDir: parseFloat(parts[2] || '0') >= 0 ? 'up' : 'down',
          source: 'goldprice.org',
          unit: 'INR/gram',
        });
      }
    }
  } catch {}

  // ── Source 2: metals-api via USD spot + live forex ──
  try {
    // Get gold spot in USD/oz from metals.live
    const [metalR, fxR] = await Promise.allSettled([
      fetch('https://api.metals.live/v1/spot', { signal: AbortSignal.timeout(5000) }),
      fetch('https://api.frankfurter.app/latest?from=USD&to=INR', { signal: AbortSignal.timeout(4000) }),
    ]);

    let goldUsdOz = 0;
    let silverUsdOz = 0;
    let usdInr = 83.5;

    if (metalR.status === 'fulfilled' && metalR.value.ok) {
      const metals = await metalR.value.json();
      // metals.live returns array: [{gold: price}, {silver: price}, ...]
      if (Array.isArray(metals)) {
        const goldEntry = metals.find((m: any) => m.gold);
        const silverEntry = metals.find((m: any) => m.silver);
        goldUsdOz = goldEntry?.gold || 0;
        silverUsdOz = silverEntry?.silver || 0;
      } else if (metals.gold) {
        goldUsdOz = metals.gold;
        silverUsdOz = metals.silver || 0;
      }
    }

    if (fxR.status === 'fulfilled' && fxR.value.ok) {
      const fx = await fxR.value.json();
      usdInr = fx.rates?.INR || 83.5;
    }

    if (goldUsdOz > 2000) {
      const gold24k = Math.round((goldUsdOz * usdInr) / 31.1035);
      const silverGram = silverUsdOz > 10 ? Math.round((silverUsdOz * usdInr) / 31.1035) : 0;
      return NextResponse.json({
        gold24k,
        gold22k: Math.round(gold24k * 22 / 24),
        gold18k: Math.round(gold24k * 18 / 24),
        silver: silverGram,
        change: 0,
        changeDir: 'up',
        source: 'metals.live + frankfurter',
        unit: 'INR/gram',
        usdInr: usdInr.toFixed(2),
        goldUsdOz: goldUsdOz.toFixed(2),
      });
    }
  } catch {}

  // ── Source 3: Open Exchange Rates + metals ──
  try {
    const r = await fetch(
      'https://open.er-api.com/v6/latest/XAU',
      { signal: AbortSignal.timeout(6000) }
    );
    if (r.ok) {
      const d = await r.json();
      const inrPerOz = d.rates?.INR || 0;
      if (inrPerOz > 50000) {
        const gold24k = Math.round(inrPerOz / 31.1035);
        return NextResponse.json({
          gold24k,
          gold22k: Math.round(gold24k * 22 / 24),
          gold18k: Math.round(gold24k * 18 / 24),
          silver: 0,
          change: 0,
          changeDir: 'up',
          source: 'open.er-api.com',
          unit: 'INR/gram',
        });
      }
    }
  } catch {}

  return NextResponse.json(
    { error: 'All gold APIs unavailable', tip: 'Try again in a few minutes' },
    { status: 503 }
  );
}
