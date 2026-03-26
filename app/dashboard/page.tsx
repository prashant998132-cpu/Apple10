'use client';
import { useState, useEffect, useCallback } from 'react';

interface GoldData { gold24k:number; gold22k:number; silver:number; change:number; changeDir:'up'|'down'; source?:string; }
interface CryptoData { name:string; symbol:string; price:number; change:number; icon:string; }
interface NewsItem { title:string; source:string; url:string; }
interface StockData { symbol:string; price:string; change:string; changeAmt:string; name:string; }
interface CricketMatch { name:string; status:string; score:string; teams:string; }

export default function DashboardPage() {
  const [gold, setGold] = useState<GoldData|null>(null);
  const [goldErr, setGoldErr] = useState('');
  const [crypto, setCrypto] = useState<CryptoData[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [cricket, setCricket] = useState<CricketMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [updated, setUpdated] = useState('');
  const [activeTab, setActiveTab] = useState<'finance'|'cricket'|'news'>('finance');

  useEffect(() => {
    const t = setInterval(()=>setTime(new Date()),1000);
    fetchAll();
    const r = setInterval(fetchAll, 5*60*1000);
    return ()=>{ clearInterval(t); clearInterval(r); };
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.allSettled([fetchGold(),fetchCrypto(),fetchNews(),fetchStocks(),fetchCricket()]);
    setLoading(false);
    setUpdated(new Date().toLocaleTimeString('hi-IN',{hour:'2-digit',minute:'2-digit'}));
  },[]);

  async function fetchGold() {
    try {
      const r = await fetch('/api/gold',{signal:AbortSignal.timeout(10000)});
      const d = await r.json();
      if(d.gold24k&&d.gold24k>5000) setGold(d);
      else setGoldErr(d.error||'Live data nahi mili');
    } catch { setGoldErr('Network error'); }
  }

  async function fetchCrypto() {
    try {
      const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=inr&include_24hr_change=true',{signal:AbortSignal.timeout(8000)});
      if(r.ok){
        const d=await r.json();
        setCrypto([
          {name:'Bitcoin',symbol:'BTC',icon:'₿',price:Math.round(d.bitcoin?.inr||0),change:Math.round((d.bitcoin?.inr_24h_change||0)*100)/100},
          {name:'Ethereum',symbol:'ETH',icon:'Ξ',price:Math.round(d.ethereum?.inr||0),change:Math.round((d.ethereum?.inr_24h_change||0)*100)/100},
          {name:'Solana',symbol:'SOL',icon:'◎',price:Math.round(d.solana?.inr||0),change:Math.round((d.solana?.inr_24h_change||0)*100)/100},
        ]);
      }
    } catch {}
  }

  async function fetchStocks() {
    const symbols = ['RELIANCE','TCS','INFY'];
    const results: StockData[] = [];
    for(const sym of symbols){
      try {
        const r = await fetch(`/api/stocks?symbol=${sym}&market=NSE`,{signal:AbortSignal.timeout(8000)});
        if(r.ok){ const d=await r.json(); results.push(d); }
      } catch {}
    }
    setStocks(results);
  }

  async function fetchCricket() {
    try {
      const r = await fetch('/api/cricket',{signal:AbortSignal.timeout(8000)});
      if(r.ok){
        const d=await r.json();
        if(d.matches?.length>0) setCricket(d.matches.slice(0,4));
      }
    } catch {}
  }

  async function fetchNews() {
    try {
      const r = await fetch('https://api.gdeltproject.org/api/v2/doc/doc?query=India&mode=artlist&maxrecords=5&format=json',{signal:AbortSignal.timeout(6000)});
      if(r.ok){ const d=await r.json(); if(d.articles?.length>0) setNews(d.articles.slice(0,5).map((a:any)=>({title:a.title||'',source:a.domain||'News',url:a.url||'#'}))); }
    } catch {}
  }

  const fmt = (n:number) => n.toLocaleString('en-IN');
  const S = {card:{background:'#0d1117',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:14,marginBottom:12},row:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'},label:{fontSize:10,fontWeight:800,color:'#374151',textTransform:'uppercase' as const,letterSpacing:'0.07em',marginBottom:10}};

  return (
    <div style={{background:'#070810',minHeight:'100dvh',color:'#e2e8f0',fontFamily:'sans-serif',paddingBottom:70}}>
      <div style={{background:'#0a0c14',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:16,fontWeight:900,color:'#22d3ee'}}>📊 Dashboard</div>
          <div style={{fontSize:10,color:'#374151'}}>{time.toLocaleTimeString('hi-IN')} · {time.toLocaleDateString('hi-IN',{weekday:'short',day:'numeric',month:'short'})}{updated&&' · Updated '+updated}</div>
        </div>
        <button onClick={fetchAll} style={{background:'rgba(255,255,255,0.05)',border:'none',borderRadius:8,color:'#6b7280',padding:'6px 12px',cursor:'pointer',fontSize:13}}>{loading?'⏳':'🔄'}</button>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,0.06)',background:'#0a0c14',padding:'0 12px'}}>
        {(['finance','cricket','news'] as const).map(tab=>(
          <button key={tab} onClick={()=>setActiveTab(tab)}
            style={{padding:'10px 14px',border:'none',background:'none',cursor:'pointer',fontSize:12,fontWeight:700,color:activeTab===tab?'#22d3ee':'#374151',borderBottom:activeTab===tab?'2px solid #22d3ee':'2px solid transparent',transition:'all 0.15s',textTransform:'capitalize'}}>
            {tab==='finance'?'💰 Finance':tab==='cricket'?'🏏 Cricket':'📰 News'}
          </button>
        ))}
      </div>

      <div style={{padding:14}}>
        {activeTab==='finance'&&(
          <>
            {/* Gold */}
            <div style={S.card}>
              <div style={S.label}>🥇 Gold & Silver · Per Gram (INR)</div>
              {goldErr ? <div style={{color:'#f87171',fontSize:11}}>❌ {goldErr}</div> : gold ? (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                  {[{label:'Gold 24K',value:gold.gold24k,icon:'🥇'},{label:'Gold 22K',value:gold.gold22k,icon:'🔶'},{label:'Silver',value:gold.silver,icon:'🥈'}].map(g=>(
                    <div key={g.label} style={{background:'rgba(255,215,0,0.05)',borderRadius:10,padding:'10px 8px',textAlign:'center'}}>
                      <div style={{fontSize:16}}>{g.icon}</div>
                      <div style={{fontSize:10,color:'#9ca3af',marginTop:2}}>{g.label}</div>
                      <div style={{fontSize:13,fontWeight:800,color:'#fbbf24',marginTop:3}}>₹{fmt(g.value)}</div>
                    </div>
                  ))}
                </div>
              ) : <div style={{color:'#6b7280',fontSize:11}}>⏳ Loading...</div>}
            </div>

            {/* Stocks */}
            <div style={S.card}>
              <div style={S.label}>📈 NSE Stocks (Live)</div>
              {stocks.length===0 ? <div style={{color:'#6b7280',fontSize:11}}>⏳ Loading stocks...</div> :
                stocks.map(s=>(
                  <div key={s.symbol} style={{...S.row,':last-child':{borderBottom:'none'}}}>
                    <div>
                      <div style={{fontSize:12,fontWeight:700,color:'#e2e8f0'}}>{s.name||s.symbol}</div>
                      <div style={{fontSize:10,color:'#6b7280'}}>{s.symbol} · NSE</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:13,fontWeight:800,color:'#e2e8f0'}}>₹{s.price}</div>
                      <div style={{fontSize:10,fontWeight:700,color:parseFloat(s.change)>=0?'#4ade80':'#f87171'}}>{parseFloat(s.change)>=0?'▲':'▼'} {Math.abs(parseFloat(s.change)).toFixed(2)}%</div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Crypto */}
            <div style={S.card}>
              <div style={S.label}>💎 Crypto · INR</div>
              {crypto.map(c=>(
                <div key={c.symbol} style={S.row}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:18,width:28,textAlign:'center'}}>{c.icon}</span>
                    <div><div style={{fontSize:12,fontWeight:700}}>{c.name}</div><div style={{fontSize:10,color:'#6b7280'}}>{c.symbol}</div></div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:13,fontWeight:800}}>₹{fmt(c.price)}</div>
                    <div style={{fontSize:10,fontWeight:700,color:c.change>=0?'#4ade80':'#f87171'}}>{c.change>=0?'▲':'▼'} {Math.abs(c.change).toFixed(2)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab==='cricket'&&(
          <div style={S.card}>
            <div style={S.label}>🏏 Live Cricket Matches</div>
            {cricket.length===0 ? (
              <div style={{textAlign:'center',padding:'20px 0',color:'#6b7280'}}>
                <div style={{fontSize:32,marginBottom:8}}>🏏</div>
                <div style={{fontSize:12}}>Abhi koi live match nahi hai</div>
                <div style={{fontSize:10,color:'#374151',marginTop:4}}>Dobara check karo jab match ho</div>
              </div>
            ) : cricket.map((m,i)=>(
              <div key={i} style={{background:'rgba(255,255,255,0.03)',borderRadius:10,padding:12,marginBottom:8,border:'1px solid rgba(255,255,255,0.06)'}}>
                <div style={{fontSize:12,fontWeight:700,color:'#22d3ee',marginBottom:4}}>{m.teams||m.name}</div>
                {m.score&&<div style={{fontSize:11,color:'#e2e8f0',marginBottom:4}}>🏏 {m.score}</div>}
                <div style={{fontSize:10,color:m.status?.includes('won')?'#4ade80':'#fbbf24'}}>{m.status}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab==='news'&&(
          <div style={S.card}>
            <div style={S.label}>📰 Latest India News</div>
            {news.length===0 ? <div style={{color:'#6b7280',fontSize:11}}>⏳ Loading news...</div> :
              news.map((n,i)=>(
                <a key={i} href={n.url} target="_blank" rel="noopener noreferrer"
                  style={{display:'block',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.04)',textDecoration:'none'}}>
                  <div style={{fontSize:12,color:'#e2e8f0',lineHeight:1.4,marginBottom:3}}>{n.title}</div>
                  <div style={{fontSize:10,color:'#6b7280'}}>{n.source} ↗</div>
                </a>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}