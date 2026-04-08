'use client';
import { useState, useEffect, useCallback } from 'react';

interface CryptoItem { id: string; symbol: string; name: string; icon: string; price: number; change: number; }
interface GoldData { gold24k: number; gold22k: number; silver: number; changeDir: 'up'|'down'; }
interface SIPResult { invested: number; maturity: number; gain: number; }

const CRYPTOS = [
  { id:'bitcoin',    symbol:'BTC', name:'Bitcoin',  icon:'₿'  },
  { id:'ethereum',   symbol:'ETH', name:'Ethereum', icon:'Ξ'  },
  { id:'solana',     symbol:'SOL', name:'Solana',   icon:'◎'  },
  { id:'binancecoin',symbol:'BNB', name:'BNB',      icon:'🔶' },
  { id:'dogecoin',   symbol:'DOGE',name:'Dogecoin', icon:'🐕' },
  { id:'ripple',     symbol:'XRP', name:'XRP',      icon:'◈'  },
];

const S = {
  page: { minHeight:'100vh', background:'#070810', color:'#e2e8f0', fontFamily:'-apple-system,sans-serif', paddingBottom:80 },
  header: { display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'#0a0c14', borderBottom:'1px solid rgba(255,255,255,0.07)', position:'sticky' as const, top:0, zIndex:50 },
  backBtn: { background:'rgba(255,255,255,0.07)', border:'none', borderRadius:8, color:'#e2e8f0', padding:'7px 12px', cursor:'pointer', fontSize:14 },
  title: { fontSize:17, fontWeight:800, color:'#f59e0b', letterSpacing:'-0.4px' },
  section: { padding:'0 14px', marginTop:16 },
  sLabel: { fontSize:10, fontWeight:800, color:'#374151', textTransform:'uppercase' as const, letterSpacing:'0.08em', marginBottom:10 },
  card: { background:'#0d1117', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'14px' },
  row: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' },
  label: { fontSize:11, color:'#6b7280', marginTop:4 },
  input: { width:'100%', background:'#070810', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'9px 12px', color:'#e2e8f0', fontSize:13, outline:'none', boxSizing:'border-box' as const, marginTop:6 },
  btn: { background:'#f59e0b', border:'none', borderRadius:10, color:'#0a0a0a', padding:'10px', fontWeight:800, fontSize:13, cursor:'pointer', width:'100%', marginTop:10 },
  tab: (a:boolean) => ({ padding:'9px 16px', border:'none', background:a?'rgba(245,158,11,0.15)':'none', borderRadius:99, color:a?'#f59e0b':'#6b7280', fontWeight:700, fontSize:12, cursor:'pointer', border:a?'1px solid rgba(245,158,11,0.3)':'1px solid transparent' }),
};

function fmt(n:number) {
  if(n>=10000000) return `₹${(n/10000000).toFixed(2)}Cr`;
  if(n>=100000)   return `₹${(n/100000).toFixed(2)}L`;
  if(n>=1000)     return `₹${(n/1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

export default function FinancePage() {
  const [crypto, setCrypto] = useState<CryptoItem[]>([]);
  const [gold, setGold] = useState<GoldData|null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'crypto'|'gold'|'sip'|'emi'>('crypto');
  const [updated, setUpdated] = useState('');

  // SIP Calculator state
  const [sipMonthly, setSipMonthly] = useState('5000');
  const [sipRate, setSipRate] = useState('12');
  const [sipYears, setSipYears] = useState('10');
  const [sipResult, setSipResult] = useState<SIPResult|null>(null);

  // EMI Calculator state
  const [emiLoan, setEmiLoan] = useState('500000');
  const [emiRate, setEmiRate] = useState('8.5');
  const [emiYears, setEmiYears] = useState('5');
  const [emiResult, setEmiResult] = useState<{emi:number;total:number;interest:number}|null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.allSettled([fetchCrypto(), fetchGold()]);
    setLoading(false);
    setUpdated(new Date().toLocaleTimeString('hi-IN',{hour:'2-digit',minute:'2-digit'}));
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 3*60*1000);
    return () => clearInterval(t);
  }, [fetchAll]);

  async function fetchCrypto() {
    try {
      const ids = CRYPTOS.map(c=>c.id).join(',');
      const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=inr&include_24hr_change=true`,{signal:AbortSignal.timeout(8000)});
      if(!r.ok) throw new Error();
      const d = await r.json();
      const items = CRYPTOS.map(c => ({
        ...c,
        price: Math.round(d[c.id]?.inr||0),
        change: Math.round((d[c.id]?.inr_24h_change||0)*100)/100,
      })).filter(c=>c.price>0);
      setCrypto(items);
    } catch {
      // Fallback: use /api/crypto
      try {
        const r = await fetch('/api/crypto',{signal:AbortSignal.timeout(6000)});
        if(r.ok) { const d=await r.json(); if(d.data) setCrypto(d.data); }
      } catch {}
    }
  }

  async function fetchGold() {
    try {
      const r = await fetch('/api/gold',{signal:AbortSignal.timeout(8000)});
      if(r.ok) { const d=await r.json(); if(d.gold24k>5000) setGold(d); }
    } catch {}
  }

  function calcSIP() {
    const P = parseFloat(sipMonthly)||0;
    const r = (parseFloat(sipRate)||0)/12/100;
    const n = (parseFloat(sipYears)||0)*12;
    if(!P||!r||!n) return;
    const maturity = P * ((Math.pow(1+r,n)-1)/r) * (1+r);
    const invested = P*n;
    setSipResult({ invested:Math.round(invested), maturity:Math.round(maturity), gain:Math.round(maturity-invested) });
  }

  function calcEMI() {
    const P = parseFloat(emiLoan)||0;
    const r = (parseFloat(emiRate)||0)/12/100;
    const n = (parseFloat(emiYears)||0)*12;
    if(!P||!r||!n) return;
    const emi = P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
    const total = emi*n;
    setEmiResult({ emi:Math.round(emi), total:Math.round(total), interest:Math.round(total-P) });
  }

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <button style={S.backBtn} onClick={() => window.history.back()}>← Back</button>
        <span style={S.title}>💰 Finance</span>
        {updated && <span style={{fontSize:10,color:'#374151',marginLeft:'auto'}}>Updated {updated}</span>}
        <button onClick={fetchAll} style={{...S.backBtn,marginLeft:'auto',fontSize:12}}>🔄</button>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:8,padding:'12px 14px',overflowX:'auto'}}>
        {(['crypto','gold','sip','emi'] as const).map(t => (
          <button key={t} style={S.tab(tab===t)} onClick={()=>setTab(t)}>
            {t==='crypto'?'₿ Crypto':t==='gold'?'🥇 Gold/Silver':t==='sip'?'📈 SIP Calc':'🏠 EMI Calc'}
          </button>
        ))}
      </div>

      {/* Crypto Tab */}
      {tab==='crypto' && (
        <div style={S.section}>
          <div style={S.sLabel}>Live Prices (INR)</div>
          <div style={S.card}>
            {loading && crypto.length===0 && (
              <div style={{textAlign:'center',padding:20,color:'#374151',fontSize:13}}>Loading... 📡</div>
            )}
            {crypto.map((c,i) => (
              <div key={c.id} style={{...S.row, borderBottom:i<crypto.length-1?S.row.borderBottom:'none'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:20,width:28,textAlign:'center'}}>{c.icon}</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:14}}>{c.name}</div>
                    <div style={S.label}>{c.symbol}</div>
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontWeight:700,fontSize:14}}>{fmt(c.price)}</div>
                  <div style={{fontSize:12,fontWeight:700,color:c.change>=0?'#22c55e':'#ef4444'}}>
                    {c.change>=0?'▲':'▼'} {Math.abs(c.change)}%
                  </div>
                </div>
              </div>
            ))}
            {crypto.length===0&&!loading&&(
              <div style={{textAlign:'center',padding:16,color:'#374151',fontSize:13}}>
                CoinGecko unavailable. Try again! 🔄
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gold Tab */}
      {tab==='gold' && (
        <div style={S.section}>
          <div style={S.sLabel}>Today's Rates (INR/gram)</div>
          <div style={S.card}>
            {!gold&&loading&&<div style={{textAlign:'center',padding:20,color:'#374151',fontSize:13}}>Loading... 📡</div>}
            {gold&&[
              {label:'24K Gold (Pure)',value:gold.gold24k,icon:'🥇',color:'#f59e0b'},
              {label:'22K Gold (Jewellery)',value:gold.gold22k,icon:'💛',color:'#fbbf24'},
              {label:'18K Gold',value:Math.round(gold.gold24k*18/24),icon:'🔶',color:'#d97706'},
              {label:'Silver',value:gold.silver||Math.round(gold.gold24k/70),icon:'🥈',color:'#94a3b8'},
            ].map((r,i,arr)=>(
              <div key={r.label} style={{...S.row,borderBottom:i<arr.length-1?S.row.borderBottom:'none'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:22}}>{r.icon}</span>
                  <span style={{fontSize:13,fontWeight:600}}>{r.label}</span>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontWeight:800,fontSize:15,color:r.color}}>₹{r.value.toLocaleString()}</div>
                  <div style={{fontSize:10,color:'#374151'}}>per gram</div>
                </div>
              </div>
            ))}
            {!gold&&!loading&&<div style={{textAlign:'center',padding:16,color:'#374151',fontSize:13}}>Gold API unavailable 🔄</div>}
          </div>
          {gold&&(
            <div style={{...S.card,marginTop:12,background:'rgba(245,158,11,0.05)',border:'1px solid rgba(245,158,11,0.15)'}}>
              <div style={{fontSize:12,color:'#f59e0b',fontWeight:700,marginBottom:8}}>💡 Making Charges (approx.)</div>
              {[
                {k:'Ring/Bangle', v:0.12},{k:'Necklace', v:0.14},{k:'Coin (10g)', v:0.04}
              ].map(r=>(
                <div key={r.k} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:12}}>
                  <span style={{color:'#9ca3af'}}>{r.k}</span>
                  <span style={{color:'#e2e8f0',fontWeight:600}}>₹{Math.round(gold.gold22k*10*(r.v)).toLocaleString()} (10g)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SIP Calculator Tab */}
      {tab==='sip' && (
        <div style={S.section}>
          <div style={S.sLabel}>SIP Calculator</div>
          <div style={S.card}>
            <div>
              <span style={S.label}>Monthly Investment (₹)</span>
              <input style={S.input} type="number" value={sipMonthly} onChange={e=>setSipMonthly(e.target.value)} placeholder="5000"/>
            </div>
            <div style={{marginTop:10}}>
              <span style={S.label}>Expected Annual Return (%)</span>
              <input style={S.input} type="number" value={sipRate} onChange={e=>setSipRate(e.target.value)} placeholder="12"/>
            </div>
            <div style={{marginTop:10}}>
              <span style={S.label}>Time Period (Years)</span>
              <input style={S.input} type="number" value={sipYears} onChange={e=>setSipYears(e.target.value)} placeholder="10"/>
            </div>
            <button style={S.btn} onClick={calcSIP}>Calculate SIP 📈</button>
          </div>
          {sipResult&&(
            <div style={{...S.card,marginTop:12}}>
              <div style={{fontSize:11,fontWeight:800,color:'#22d3ee',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:12}}>SIP Projection</div>
              {[
                {label:'Total Invested',value:fmt(sipResult.invested),color:'#94a3b8'},
                {label:'Estimated Returns',value:fmt(sipResult.gain),color:'#22c55e'},
                {label:'Maturity Amount',value:fmt(sipResult.maturity),color:'#f59e0b'},
              ].map(r=>(
                <div key={r.label} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                  <span style={{fontSize:12,color:'#9ca3af'}}>{r.label}</span>
                  <span style={{fontSize:14,fontWeight:800,color:r.color}}>{r.value}</span>
                </div>
              ))}
              <div style={{marginTop:12,padding:'10px',background:'rgba(34,197,94,0.08)',borderRadius:10,border:'1px solid rgba(34,197,94,0.15)'}}>
                <div style={{fontSize:11,color:'#22c55e',fontWeight:700}}>
                  📊 Wealth Gain: {Math.round((sipResult.maturity/sipResult.invested-1)*100)}% total returns
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EMI Calculator Tab */}
      {tab==='emi' && (
        <div style={S.section}>
          <div style={S.sLabel}>EMI Calculator</div>
          <div style={S.card}>
            <div>
              <span style={S.label}>Loan Amount (₹)</span>
              <input style={S.input} type="number" value={emiLoan} onChange={e=>setEmiLoan(e.target.value)} placeholder="500000"/>
            </div>
            <div style={{marginTop:10}}>
              <span style={S.label}>Annual Interest Rate (%)</span>
              <input style={S.input} type="number" value={emiRate} onChange={e=>setEmiRate(e.target.value)} placeholder="8.5"/>
            </div>
            <div style={{marginTop:10}}>
              <span style={S.label}>Loan Tenure (Years)</span>
              <input style={S.input} type="number" value={emiYears} onChange={e=>setEmiYears(e.target.value)} placeholder="5"/>
            </div>
            <button style={S.btn} onClick={calcEMI}>Calculate EMI 🏠</button>
          </div>
          {emiResult&&(
            <div style={{...S.card,marginTop:12}}>
              <div style={{fontSize:11,fontWeight:800,color:'#22d3ee',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:12}}>EMI Breakdown</div>
              {[
                {label:'Monthly EMI',value:`₹${emiResult.emi.toLocaleString()}`,color:'#f59e0b'},
                {label:'Total Payment',value:fmt(emiResult.total),color:'#94a3b8'},
                {label:'Total Interest',value:fmt(emiResult.interest),color:'#ef4444'},
                {label:'Principal Amount',value:fmt(parseFloat(emiLoan)||0),color:'#22c55e'},
              ].map(r=>(
                <div key={r.label} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                  <span style={{fontSize:12,color:'#9ca3af'}}>{r.label}</span>
                  <span style={{fontSize:14,fontWeight:800,color:r.color}}>{r.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
