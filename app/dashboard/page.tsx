\'use client\';
import { useState, useEffect, useCallback } from \'react\';

interface GoldData {
  gold24k: number; gold22k: number; gold18k?: number;
  silver: number; change: number; changeDir: \'up\'|\'down\';
  source?: string; usdInr?: string;
}
interface CryptoData { name: string; symbol: string; price: number; change: number; icon: string; }
interface NewsItem { title: string; source: string; url: string; }

export default function DashboardPage() {
  const [gold, setGold] = useState<GoldData|null>(null);
  const [goldError, setGoldError] = useState(\'\');
  const [crypto, setCrypto] = useState<CryptoData[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [lastUpdate, setLastUpdate] = useState(\'\');

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    fetchAll();
    const r = setInterval(fetchAll, 5 * 60 * 1000);
    return () => { clearInterval(t); clearInterval(r); };
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.allSettled([fetchGold(), fetchCrypto(), fetchNews()]);
    setLoading(false);
    setLastUpdate(new Date().toLocaleTimeString(\'hi-IN\', { hour: \'2-digit\', minute: \'2-digit\' }));
  }, []);

  async function fetchGold() {
    setGoldError(\'\');
    try {
      const r = await fetch(\'/api/gold\', { signal: AbortSignal.timeout(10000) });
      const d = await r.json();
      if (d.gold24k && d.gold24k > 1000) {
        setGold(d);
      } else {
        setGoldError(d.error || \'API se data nahi mila\');
      }
    } catch (e: any) {
      setGoldError(\'Network error: \' + e.message);
    }
  }

  async function fetchCrypto() {
    try {
      const r = await fetch(
        \'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=inr&include_24hr_change=true\',
        { signal: AbortSignal.timeout(8000) }
      );
      if (r.ok) {
        const d = await r.json();
        setCrypto([
          { name: \'Bitcoin\', symbol: \'BTC\', icon: \'₿\', price: Math.round(d.bitcoin?.inr||0), change: Math.round((d.bitcoin?.inr_24h_change||0)*100)/100 },
          { name: \'Ethereum\', symbol: \'ETH\', icon: \'Ξ\', price: Math.round(d.ethereum?.inr||0), change: Math.round((d.ethereum?.inr_24h_change||0)*100)/100 },
          { name: \'Solana\', symbol: \'SOL\', icon: \'◎\', price: Math.round(d.solana?.inr||0), change: Math.round((d.solana?.inr_24h_change||0)*100)/100 },
        ]);
      }
    } catch {}
  }

  async function fetchNews() {
    try {
      const r = await fetch(\'https://api.gdeltproject.org/api/v2/doc/doc?query=India&mode=artlist&maxrecords=5&format=json\', { signal: AbortSignal.timeout(6000) });
      if (r.ok) {
        const d = await r.json();
        if (d.articles?.length > 0) { setNews(d.articles.slice(0,5).map((a:any)=>({ title: a.title||\'\', source: a.domain||\'News\', url: a.url||\'#\' }))); return; }
      }
    } catch {}
    try {
      const r = await fetch(\'https://news.google.com/rss/headlines/section/geo/IN?hl=hi&gl=IN&ceid=IN:hi\', { signal: AbortSignal.timeout(5000) });
      if (r.ok) {
        const xml = await r.text();
        const items = xml.match(/<item>[\s\S]*?<\/item>/g)?.slice(0,5)||[];
        setNews(items.map(item=>({ title: (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]||\'No title\').replace(/&amp;/g,\'&\'), source: item.match(/<source.*?>(.*?)<\/source>/)?.[1]||\'Google News\', url: item.match(/<link>(.*?)<\/link>/)?.[1]||\'#\' })));
      }
    } catch {}
  }

  const fmt = (n: number) => n.toLocaleString(\'en-IN\');

  return (
    <div style={{ background: \'#070810\', minHeight: \'100dvh\', color: \'#e2e8f0\', fontFamily: \'sans-serif\', paddingBottom: 70 }}>
      <div style={{ background: \'#0a0c14\', borderBottom: \'1px solid rgba(255,255,255,0.06)\', padding: \'12px 16px\', display: \'flex\', alignItems: \'center\', justifyContent: \'space-between\' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: \'#22d3ee\' }}>📊 Dashboard</div>
          <div style={{ fontSize: 10, color: \'#374151\' }}>{time.toLocaleTimeString(\'hi-IN\')} · {time.toLocaleDateString(\'hi-IN\', { weekday: \'short\', day: \'numeric\', month: \'short\' })}{lastUpdate && \' · \'+lastUpdate}</div>
        </div>
        <button onClick={fetchAll} style={{ background: \'rgba(255,255,255,0.05)\', border: \'none\', borderRadius: 8, color: \'#6b7280\', padding: \'6px 12px\', cursor: \'pointer\', fontSize: 13 }}>{loading ? \'⏳\' : \'🔄\'}</button>
      </div>

      <div style={{ padding: 14 }}>

        {/* GOLD */}
        <div style={{ background: \'#0d1117\', border: \'1px solid rgba(255,215,0,0.15)\', borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: \'#fbbf24\', textTransform: \'uppercase\', letterSpacing: \'0.07em\', marginBottom: 10 }}>
            🥇 GOLD & SILVER · Per Gram (INR)
            {gold?.source && <span style={{ fontWeight: 400, textTransform: \'none\', marginLeft: 6, color: \'#374151\' }}>via {gold.source}</span>}
          </div>
          {goldError ? (
            <div style={{ color: \'#f87171\', fontSize: 11, padding: \'8px 0\' }}>❌ {goldError} <button onClick={fetchGold} style={{ background: \'none\', border: \'1px solid #f87171\', borderRadius: 6, color: \'#f87171\', padding: \'3px 8px\', cursor: \'pointer\', fontSize: 10, marginLeft: 8 }}>Retry</button></div>
          ) : gold ? (
            <div style={{ display: \'flex\', gap: 8 }}>
              {[
                { label: \'Gold 24K\', value: gold.gold24k, icon: \'🥇\' },
                { label: \'Gold 22K\', value: gold.gold22k, icon: \'💛\' },
                { label: \'Silver\', value: gold.silver || 0, icon: \'🥈\', isSilver: true },
              ].map(item => (
                <div key={item.label} style={{ flex: 1, background: \'rgba(255,215,0,0.04)\', border: \'1px solid rgba(255,215,0,0.1)\', borderRadius: 10, padding: \'10px 6px\', textAlign: \'center\' }}>
                  <div style={{ fontSize: 20 }}>{item.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: \'#fbbf24\', marginTop: 4 }}>
                    {item.value > 0 ? \'₹\'+fmt(item.value) : \'--\'}
                  </div>
                  <div style={{ fontSize: 9, color: \'#6b7280\', marginTop: 2 }}>{item.label}</div>
                  {item.value > 0 && <div style={{ fontSize: 9, color: \'#374151\', marginTop: 1 }}>10g=₹{fmt(item.value*10)}</div>}
                  <div style={{ marginTop: 3, fontSize: 11, color: gold.changeDir === \'up\' ? \'#22c55e\' : \'#f87171\' }}>
                    {gold.change > 0 ? (gold.changeDir === \'up\' ? \'↑\' : \'↓\')+\' \'+gold.change.toFixed(2)+\'%\' : \'\'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: \'#374151\', fontSize: 12, textAlign: \'center\', padding: 16 }}>⏳ Live rate fetch ho raha hai...</div>
          )}
        </div>

        {/* CRYPTO */}
        <div style={{ background: \'#0d1117\', border: \'1px solid rgba(99,102,241,0.15)\', borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: \'#818cf8\', textTransform: \'uppercase\', letterSpacing: \'0.07em\', marginBottom: 10 }}>₿ CRYPTO · INR (24h)</div>
          {crypto.length > 0 ? crypto.map(c => (
            <div key={c.symbol} style={{ display: \'flex\', alignItems: \'center\', justifyContent: \'space-between\', padding: \'9px 0\', borderBottom: \'1px solid rgba(255,255,255,0.04)\' }}>
              <div style={{ display: \'flex\', alignItems: \'center\', gap: 10 }}>
                <span style={{ fontSize: 20, width: 30, textAlign: \'center\' }}>{c.icon}</span>
                <div><div style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</div><div style={{ fontSize: 10, color: \'#475569\' }}>{c.symbol}</div></div>
              </div>
              <div style={{ textAlign: \'right\' }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>₹{fmt(c.price)}</div>
                <span style={{ color: c.change >= 0 ? \'#22c55e\' : \'#f87171\', fontSize: 11 }}>{c.change >= 0 ? \'↑\' : \'↓\'} {Math.abs(c.change).toFixed(2)}%</span>
              </div>
            </div>
          )) : <div style={{ color: \'#374151\', fontSize: 12, textAlign: \'center\', padding: 12 }}>{loading ? \'⏳\' : \'Unavailable\'}</div>}
        </div>

        {/* NEWS */}
        <div style={{ background: \'#0d1117\', border: \'1px solid rgba(34,197,94,0.1)\', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: \'#86efac\', textTransform: \'uppercase\', letterSpacing: \'0.07em\', marginBottom: 10 }}>📰 LATEST NEWS · INDIA</div>
          {news.length > 0 ? news.map((n,i) => (
            <a key={i} href={n.url} target="_blank" rel="noreferrer" style={{ textDecoration: \'none\', display: \'block\', padding: \'8px 0\', borderBottom: i<news.length-1?\'1px solid rgba(255,255,255,0.04)\':\'\' }}>
              <div style={{ fontSize: 12, color: \'#e2e8f0\', lineHeight: 1.5, marginBottom: 2 }}>{n.title}</div>
              <div style={{ fontSize: 10, color: \'#475569\' }}>{n.source}</div>
            </a>
          )) : <div style={{ color: \'#374151\', fontSize: 12, textAlign: \'center\', padding: 12 }}>{loading ? \'⏳\' : \'Unavailable\'}</div>}
        </div>

      </div>
    </div>
  );
}
