'use client';
import { useState } from 'react';

type CalcTab = 'basic'|'scientific'|'unit'|'percentage';

const S = {
  page: { minHeight:'100vh', background:'#070810', color:'#e2e8f0', fontFamily:'-apple-system,sans-serif', paddingBottom:80 },
  header: { display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'#0a0c14', borderBottom:'1px solid rgba(255,255,255,0.07)', position:'sticky' as const, top:0, zIndex:50 },
  backBtn: { background:'rgba(255,255,255,0.07)', border:'none', borderRadius:8, color:'#e2e8f0', padding:'7px 12px', cursor:'pointer', fontSize:14 },
};

const UNIT_CATEGORIES = {
  Length: {
    units: ['cm','m','km','inch','feet','yard','mile'],
    toBase: { cm:0.01, m:1, km:1000, inch:0.0254, feet:0.3048, yard:0.9144, mile:1609.344 },
  },
  Weight: {
    units: ['g','kg','lb','oz','ton','mg'],
    toBase: { g:0.001, kg:1, lb:0.453592, oz:0.0283495, ton:1000, mg:0.000001 },
  },
  Temperature: {
    units: ['°C','°F','K'],
    toBase: {} as any,
  },
  Speed: {
    units: ['km/h','m/s','mph','knot'],
    toBase: { 'km/h':1, 'm/s':3.6, mph:1.60934, knot:1.852 },
  },
  Area: {
    units: ['cm²','m²','km²','acre','hectare','ft²'],
    toBase: { 'cm²':0.0001, 'm²':1, 'km²':1000000, acre:4046.86, hectare:10000, 'ft²':0.092903 },
  },
  Data: {
    units: ['B','KB','MB','GB','TB'],
    toBase: { B:1, KB:1024, MB:1048576, GB:1073741824, TB:1099511627776 },
  },
};

function convertTemp(val:number, from:string, to:string): number {
  let celsius = from==='°C'?val:from==='°F'?(val-32)*5/9:val-273.15;
  return to==='°C'?celsius:to==='°F'?celsius*9/5+32:celsius+273.15;
}

export default function CalculatorPage() {
  const [tab, setTab] = useState<CalcTab>('basic');
  const [display, setDisplay] = useState('0');
  const [history, setHistory] = useState<string[]>([]);
  const [prevVal, setPrevVal] = useState('');
  const [op, setOp] = useState('');
  const [newInput, setNewInput] = useState(true);

  // Scientific
  const [sciExpr, setSciExpr] = useState('');
  const [sciResult, setSciResult] = useState('');

  // Unit converter
  const [unitCat, setUnitCat] = useState<keyof typeof UNIT_CATEGORIES>('Length');
  const [unitFrom, setUnitFrom] = useState('m');
  const [unitTo, setUnitTo] = useState('km');
  const [unitVal, setUnitVal] = useState('1');
  const [unitResult, setUnitResult] = useState('');

  // Percentage
  const [pctA, setPctA] = useState('');
  const [pctB, setPctB] = useState('');

  // ── Basic Calc ─────────────────────────────────
  function pressNum(n:string) {
    if(newInput) { setDisplay(n==='.'?'0.':n); setNewInput(false); }
    else { if(n==='.'&&display.includes('.')) return; setDisplay(d=>d==='0'&&n!='.'?n:d+n); }
  }
  function pressOp(o:string) {
    setPrevVal(display); setOp(o); setNewInput(true);
  }
  function pressEq() {
    if(!prevVal||!op) return;
    const a=parseFloat(prevVal), b=parseFloat(display);
    let r=0;
    if(op==='+') r=a+b; else if(op==='-') r=a-b; else if(op==='×') r=a*b;
    else if(op==='÷') r=b!==0?a/b:0;
    const res=parseFloat(r.toFixed(10)).toString();
    setHistory(h=>[`${prevVal} ${op} ${display} = ${res}`,...h.slice(0,4)]);
    setDisplay(res); setPrevVal(''); setOp(''); setNewInput(true);
  }
  function pressSpecial(k:string) {
    const n=parseFloat(display);
    if(k==='%') { setDisplay((n/100).toString()); setNewInput(true); }
    if(k==='+/-') { setDisplay((n*-1).toString()); }
    if(k==='C') { setDisplay('0'); setPrevVal(''); setOp(''); setNewInput(true); }
    if(k==='⌫') { setDisplay(d=>d.length>1?d.slice(0,-1):'0'); }
  }

  const BASIC_BTNS = [
    ['C','⌫','%','÷'],
    ['7','8','9','×'],
    ['4','5','6','-'],
    ['1','2','3','+'],
    ['+/-','0','.','='],
  ];

  // ── Scientific Calc ─────────────────────────────
  function calcSci() {
    try {
      let expr = sciExpr
        .replace(/sin\(/g,'Math.sin(').replace(/cos\(/g,'Math.cos(').replace(/tan\(/g,'Math.tan(')
        .replace(/log\(/g,'Math.log10(').replace(/ln\(/g,'Math.log(').replace(/sqrt\(/g,'Math.sqrt(')
        .replace(/π/g,'Math.PI').replace(/e(?!\d)/g,'Math.E').replace(/\^/g,'**')
        .replace(/abs\(/g,'Math.abs(').replace(/ceil\(/g,'Math.ceil(').replace(/floor\(/g,'Math.floor(');
      // eslint-disable-next-line no-eval
      const r = eval(expr);
      const res = parseFloat(r.toFixed(10)).toString();
      setSciResult(res);
      setHistory(h=>[`${sciExpr} = ${res}`,...h.slice(0,4)]);
    } catch { setSciResult('Error ❌'); }
  }

  // ── Unit Converter ──────────────────────────────
  function doConvert() {
    const val=parseFloat(unitVal)||0;
    const cat=UNIT_CATEGORIES[unitCat];
    let res:number;
    if(unitCat==='Temperature') {
      res=convertTemp(val,unitFrom,unitTo);
    } else {
      const base=val*(cat.toBase as any)[unitFrom];
      res=base/(cat.toBase as any)[unitTo];
    }
    setUnitResult(parseFloat(res.toFixed(8)).toString());
  }

  // ── Percentage helpers ──────────────────────────
  const pA=parseFloat(pctA)||0, pB=parseFloat(pctB)||0;
  const pctResults = pA&&pB ? [
    {label:`${pA}% of ${pB}`, value:(pA*pB/100).toFixed(2)},
    {label:`${pA} is what % of ${pB}`, value:`${(pA/pB*100).toFixed(2)}%`},
    {label:`${pB} increased by ${pA}%`, value:(pB*(1+pA/100)).toFixed(2)},
    {label:`${pB} decreased by ${pA}%`, value:(pB*(1-pA/100)).toFixed(2)},
    {label:`Profit/Loss on ₹${pB} → ₹${pA}`, value:`${((pA-pB)/pB*100).toFixed(2)}%`},
  ] : [];

  const tabStyle=(t:CalcTab)=>({padding:'8px 16px',border:'none',background:tab===t?'rgba(99,102,241,0.15)':'none',borderRadius:99,color:tab===t?'#a78bfa':'#6b7280',fontWeight:700,fontSize:12,cursor:'pointer',border:tab===t?'1px solid rgba(99,102,241,0.3)':'1px solid transparent'} as const);

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button style={S.backBtn} onClick={()=>window.history.back()}>← Back</button>
        <span style={{fontSize:17,fontWeight:800,color:'#a78bfa',letterSpacing:'-0.4px'}}>🧮 Calculator</span>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:6,padding:'10px 12px',overflowX:'auto'}}>
        {(['basic','scientific','unit','percentage'] as CalcTab[]).map(t=>(
          <button key={t} style={tabStyle(t)} onClick={()=>setTab(t)}>
            {t==='basic'?'Basic':t==='scientific'?'Scientific':t==='unit'?'Unit Conv':'% Tools'}
          </button>
        ))}
      </div>

      {/* Basic */}
      {tab==='basic'&&(
        <div style={{padding:'0 14px'}}>
          <div style={{background:'#0d1117',border:'1px solid rgba(255,255,255,0.07)',borderRadius:16,padding:'16px 16px 8px',marginBottom:10}}>
            {op&&<div style={{textAlign:'right',fontSize:12,color:'#374151',marginBottom:2}}>{prevVal} {op}</div>}
            <div style={{textAlign:'right',fontSize:36,fontWeight:700,color:'#e2e8f0',letterSpacing:'-1px',wordBreak:'break-all'}}>{display}</div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
            {BASIC_BTNS.flat().map((k,i)=>{
              const isOp=['÷','×','-','+'].includes(k);
              const isEq=k==='=';
              const isSpec=['C','⌫','%','+/-'].includes(k);
              return (
                <button key={i}
                  onClick={()=>isSpec?pressSpecial(k):isOp?pressOp(k):k==='='?pressEq():pressNum(k)}
                  style={{height:60,borderRadius:14,border:'none',fontSize:isOp||isEq?22:18,fontWeight:700,cursor:'pointer',
                    background:isEq?'#6366f1':isOp?'rgba(99,102,241,0.2)':isSpec?'rgba(255,255,255,0.08)':'rgba(255,255,255,0.05)',
                    color:isEq?'#fff':isOp?'#a78bfa':isSpec?'#f59e0b':'#e2e8f0',
                    transition:'all 0.1s'}}>
                  {k}
                </button>
              );
            })}
          </div>
          {history.length>0&&(
            <div style={{marginTop:12,background:'#0d1117',border:'1px solid rgba(255,255,255,0.05)',borderRadius:12,padding:10}}>
              <div style={{fontSize:10,color:'#374151',fontWeight:700,marginBottom:6,textTransform:'uppercase'}}>History</div>
              {history.map((h,i)=><div key={i} style={{fontSize:12,color:'#6b7280',padding:'2px 0'}}>{h}</div>)}
            </div>
          )}
        </div>
      )}

      {/* Scientific */}
      {tab==='scientific'&&(
        <div style={{padding:'0 14px'}}>
          <div style={{background:'#0d1117',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:14,marginBottom:10}}>
            <div style={{fontSize:11,color:'#374151',marginBottom:6}}>Expression (use sin/cos/tan/log/ln/sqrt/π/e/^)</div>
            <input value={sciExpr} onChange={e=>setSciExpr(e.target.value)}
              style={{width:'100%',background:'#070810',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'10px 12px',color:'#e2e8f0',fontSize:15,outline:'none',boxSizing:'border-box' as const,fontFamily:'monospace'}}
              placeholder="e.g. sin(45*Math.PI/180) + sqrt(16)"/>
            {sciResult&&<div style={{marginTop:10,fontSize:20,fontWeight:800,color:'#22d3ee',textAlign:'right'}}>{sciResult}</div>}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>
            {['sin(','cos(','tan(','log(','ln(','sqrt(','π','e','^','abs(','(',')',
              '7','8','9','÷','4','5','6','×','1','2','3','-','0','.','=','+'].map((k,i)=>(
              <button key={i} onClick={()=>{
                if(k==='=') calcSci();
                else if(k==='⌫') setSciExpr(e=>e.slice(0,-1));
                else setSciExpr(e=>e+k);
              }} style={{height:48,borderRadius:10,border:'none',fontSize:13,fontWeight:700,cursor:'pointer',
                background:['sin(','cos(','tan(','log(','ln(','sqrt(','abs(','(',')','^'].includes(k)?'rgba(34,211,238,0.1)':
                k==='='?'#6366f1':['÷','×','-','+'].includes(k)?'rgba(99,102,241,0.2)':
                ['π','e'].includes(k)?'rgba(245,158,11,0.1)':'rgba(255,255,255,0.05)',
                color:['sin(','cos(','tan(','log(','ln(','sqrt(','abs(','(',')','^'].includes(k)?'#22d3ee':
                k==='='?'#fff':['÷','×','-','+'].includes(k)?'#a78bfa':
                ['π','e'].includes(k)?'#f59e0b':'#e2e8f0'}}>
                {k}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Unit Converter */}
      {tab==='unit'&&(
        <div style={{padding:'0 14px'}}>
          <div style={{background:'#0d1117',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:14}}>
            <div style={{display:'flex',gap:6,marginBottom:12,overflowX:'auto'}}>
              {(Object.keys(UNIT_CATEGORIES) as (keyof typeof UNIT_CATEGORIES)[]).map(c=>(
                <button key={c} onClick={()=>{setUnitCat(c);const u=UNIT_CATEGORIES[c].units;setUnitFrom(u[0]);setUnitTo(u[1]);setUnitResult('');}}
                  style={{padding:'5px 12px',borderRadius:99,border:'none',background:unitCat===c?'rgba(99,102,241,0.2)':'rgba(255,255,255,0.05)',color:unitCat===c?'#a78bfa':'#6b7280',fontSize:11,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>
                  {c}
                </button>
              ))}
            </div>
            <input type="number" value={unitVal} onChange={e=>setUnitVal(e.target.value)}
              style={{width:'100%',background:'#070810',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'10px 12px',color:'#e2e8f0',fontSize:15,outline:'none',boxSizing:'border-box' as const,marginBottom:10}}
              placeholder="Value daalo..."/>
            <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:8,alignItems:'center',marginBottom:10}}>
              <select value={unitFrom} onChange={e=>setUnitFrom(e.target.value)}
                style={{background:'#070810',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'8px',color:'#e2e8f0',fontSize:13,outline:'none'}}>
                {UNIT_CATEGORIES[unitCat].units.map(u=><option key={u}>{u}</option>)}
              </select>
              <span style={{textAlign:'center',color:'#6366f1',fontWeight:800,fontSize:18}}>→</span>
              <select value={unitTo} onChange={e=>setUnitTo(e.target.value)}
                style={{background:'#070810',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'8px',color:'#e2e8f0',fontSize:13,outline:'none'}}>
                {UNIT_CATEGORIES[unitCat].units.map(u=><option key={u}>{u}</option>)}
              </select>
            </div>
            <button onClick={doConvert}
              style={{width:'100%',background:'#6366f1',border:'none',borderRadius:10,color:'#fff',padding:10,fontWeight:700,fontSize:13,cursor:'pointer'}}>
              Convert 🔄
            </button>
            {unitResult&&(
              <div style={{marginTop:12,textAlign:'center',background:'rgba(99,102,241,0.08)',borderRadius:10,padding:'12px',border:'1px solid rgba(99,102,241,0.15)'}}>
                <div style={{fontSize:24,fontWeight:800,color:'#a78bfa'}}>{unitResult} {unitTo}</div>
                <div style={{fontSize:12,color:'#6b7280',marginTop:4}}>{unitVal} {unitFrom} = {unitResult} {unitTo}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Percentage */}
      {tab==='percentage'&&(
        <div style={{padding:'0 14px'}}>
          <div style={{background:'#0d1117',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:14}}>
            <div style={{fontSize:11,color:'#374151',marginBottom:8}}>Two numbers daalo — saari % calculations milegi</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
              <div>
                <div style={{fontSize:10,color:'#374151',marginBottom:4}}>Number A</div>
                <input type="number" value={pctA} onChange={e=>setPctA(e.target.value)}
                  style={{width:'100%',background:'#070810',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'9px',color:'#e2e8f0',fontSize:14,outline:'none',boxSizing:'border-box' as const}}/>
              </div>
              <div>
                <div style={{fontSize:10,color:'#374151',marginBottom:4}}>Number B</div>
                <input type="number" value={pctB} onChange={e=>setPctB(e.target.value)}
                  style={{width:'100%',background:'#070810',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'9px',color:'#e2e8f0',fontSize:14,outline:'none',boxSizing:'border-box' as const}}/>
              </div>
            </div>
            {pctResults.map((r,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <span style={{fontSize:12,color:'#9ca3af',flex:1}}>{r.label}</span>
                <span style={{fontSize:14,fontWeight:800,color:'#22d3ee',marginLeft:8}}>{r.value}</span>
              </div>
            ))}
            {!pctResults.length&&<div style={{textAlign:'center',padding:20,color:'#374151',fontSize:13}}>Dono numbers daalo 👆</div>}
          </div>
        </div>
      )}
    </div>
  );
}
