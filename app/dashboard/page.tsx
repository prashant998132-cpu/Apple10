'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface GoldData { gold24k: number; gold22k: number; silver: number; change: number; }
interface CryptoData { name: string; symbol: string; price: number; change: number; icon: string; }
interface NewsItem { title: string; source: string; url: string; time: string; }

export default function DashboardPage() {
  const router = useRouter();
  const [gold, setGold] = useState<GoldData|null>(null);
  const [crypto, setCrypto] = useState<CryptoData[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    fetchAll();
    const refresh = setInterval(fetchAll, 5 * 60 * 1000);
    return () => { clearInterval(t); clearInterval(refresh); };
  }, []);

  async function fetchAll() {
    setLoading(true);
    await Promise.allSettled([fetchCrypto(), fetchNews(), fetchGold()]);
    setLoading(false);
  }

  async function fetchGold() {
    try {
      // Use free API
      const r = await fetch('https://api.metalpriceapi.com/v1/latest?api_key=demo&base=INR&currencies=XAU,XAG', { signal: AbortSignal.timeout(5000) });
      if (r.ok) {
        const d = await r.json();
        // Calculate per gram (troy oz = 31.1g)
        const goldPerOz = 1 / (d.rates?.XAU || 0.00036);
        const silverPerOz = 1 / (d.rates?.XAG || 0.012);
        const gold24k = Math.round(goldPerOz / 31.1);
        setGold({ gold24k, gold22k: Math.round(gold24k * 22/24), silver: Math.round(silverPerOz / 31.1), change: 0.5 });
        return;
      }
    } catch {}
    // Fallback static (approximate)
    setGold({ gold24k: 8977, gold22k: 8229, silver: 108, change: 0.3 });
  }

  async function fetchCrypto() {
    try {
      const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=inr&include_24hr_change=true', { signal: AbortSignal.timeout(6000) });
      if (r.ok) {
        const d = await r.json();
        const coins = [
          { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', icon: '₿' },
          { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', icon: 'Ξ' },
          { id: 'solana', name: 'Solana', symbol: 'SOL', icon: '◎' },
        ];
        setCrypto(coins.map(c => ({
          name: c.name, symbol: c.symbol, icon: c.icon,
          price: Math.round(d[c.id]?.inr || 0),
          change: Math.round((d[c.id]?.inr_24h_change || 0) * 100) / 100,
        })));
      }
    } catch {}
  }

  async function fetchNews() {
    try {
      const r = await fetch('https://gnews.io/api/v4/top-headlines?category=general&lang=hi&country=in&max=5&apikey=demo', { signal: AbortSignal.timeout(5000) });
      if (r.ok) {
        const d = await r.json();
        setNews((d.articles || []).slice(0, 5).map((a: any) => ({
          title: a.title || '', source: a.source?.name || 'News',
          url: a.url || '#', time: a.publishedAt ? new Date(a.publishedAt).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }) : '',
        })));
        return;
      }
    } catch {}
    // Google RSS fallback
    try {
      const r = await fetch('https://news.google.com/rss/search?q=india&hl=hi&gl=IN&ceid=IN:hi', { signal: AbortSignal.timeout(5000) });
      if (r.ok) {
        const xml = await r.text();
        const items = xml.match(/<item>[\s\S]*?<\/item>/g)?.slice(0, 5) || [];
        setNews(items.map(item => ({
          title: item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || '',
          source: item.match(/<source.*?>(.*?)<\/source>/)?.[1] || 'Google News',
          url: item.match(/<link>(.*?)<\/link>/)?.[1] || '#',
          time: '',
        })));
      }
    } catch {}
  }

  const fmt = (n: number) => n.toLocaleString('en-IN');
  const chg = (n: number) => (
    <span style={{ color: n >= 0 ? '#22c55e' : '#f87171', fontSize: 11 }}>
      {n >= 0 ? '↑' : '↓'} {Math.abs(n).toFixed(2)}%
    </span>
  );

  return (
    <div style={{ background: '#070810', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'sans-serif', paddingBottom: 70 }}>
      {/* Header */}
      <div style={{ background: '#0a0c14', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#22d3ee' }}>📊 Dashboard</div>
          <div style={{ fontSize: 10, color: '#374151' }}>
            {time.toLocaleTimeString('hi-IN')} · {time.toLocaleDateString('hi-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </div>
        </div>
        <button onClick={() => fetchAll()} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, color: '#6b7280', padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}>
          {loading ? '⏳' : '🔄'}
        </button>
      </div>

      <div style={{ padding: 14 }}>

        {/* Gold & Silver */}
        <div style={{ background: '#0d1117', border: '1px solid rgba(255,215,0,0.15)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>🥇 Gold & Silver · Per Gram (INR)</div>
          {gold ? (
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { label: 'Gold 24K', value: gold.gold24k, icon: '🥇' },
                { label: 'Gold 22K', value: gold.gold22k, icon: '💛' },
                { label: 'Silver', value: gold.silver, icon: '🥈' },
              ].map(item => (
                <div key={item.label} style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 9, padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18 }}>{item.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#fbbf24', marginTop: 4 }}>₹{fmt(item.value)}</div>
                  <div style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 9, color: '#374151', marginTop: 1 }}>10g = ₹{fmt(item.value * 10)}</div>
                  {chg(gold.change)}
                </div>
              ))}
            </div>
          ) : <div style={{ color: '#374151', fontSize: 12, textAlign: 'center', padding: 12 }}>Loading...</div>}
        </div>

        {/* Crypto */}
        <div style={{ background: '#0d1117', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>₿ Crypto · INR</div>
          {crypto.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {crypto.map(c => (
                <div key={c.symbol} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{c.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: '#475569' }}>{c.symbol}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>₹{fmt(c.price)}</div>
                    <div style={{ fontSize: 10 }}>{chg(c.change)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : <div style={{ color: '#374151', fontSize: 12, textAlign: 'center', padding: 12 }}>Loading...</div>}
        </div>

        {/* News */}
        <div style={{ background: '#0d1117', border: '1px solid rgba(34,197,94,0.1)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#86efac', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>📰 Latest News · India</div>
          {news.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {news.map((n, i) => (
                <a key={i} href={n.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'block', padding: '9px 0', borderBottom: i < news.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ fontSize: 12, color: '#e2e8f0', lineHeight: 1.5, marginBottom: 3 }}>{n.title}</div>
                  <div style={{ fontSize: 10, color: '#475569' }}>{n.source}{n.time ? ' · ' + n.time : ''}</div>
                </a>
              ))}
            </div>
          ) : <div style={{ color: '#374151', fontSize: 12, textAlign: 'center', padding: 12 }}>News load ho rahi hai...</div>}
        </div>

        {/* WhatsApp Quick Share */}
        <div style={{ background: '#0d1117', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#25d366', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>💬 JARVIS via WhatsApp</div>
          <p style={{ fontSize: 11, color: '#475569', marginBottom: 10, lineHeight: 1.7 }}>
            JARVIS ko WhatsApp pe bhi use karo. Telegram bot se messages aayenge.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="https://t.me/BotFather" target="_blank" rel="noreferrer"
              style={{ flex: 1, textAlign: 'center', padding: '10px', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', borderRadius: 9, color: '#25d366', textDecoration: 'none', fontSize: 11, fontWeight: 700 }}>
              📱 Telegram Bot Setup
            </a>
            <a href="https://wa.me/?text=Hey JARVIS" target="_blank" rel="noreferrer"
              style={{ flex: 1, textAlign: 'center', padding: '10px', background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 9, color: '#6b7280', textDecoration: 'none', fontSize: 11, fontWeight: 700 }}>
              💬 WhatsApp Share
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
