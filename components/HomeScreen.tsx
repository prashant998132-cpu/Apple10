'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Props { name: string; onSend: (text: string) => void; }

const SUGGESTIONS = [
  { icon: '🌤️', text: 'Aaj ka mausam kaisa hai?' },
  { icon: '💰', text: 'Bitcoin aur gold ka aaj ka rate batao' },
  { icon: '📰', text: 'Aaj ki top news kya hai?' },
  { icon: '💪', text: 'Mujhe aaj ke liye motivate karo' },
  { icon: '🤖', text: 'Kya kar sakta hai tu?' },
  { icon: '🧠', text: 'Kuch naya sikhao aaj' },
];

const QUICK_NAV = [
  { icon:'💰', label:'Finance',    path:'/finance'    },
  { icon:'✅', label:'To-Do',      path:'/todo'       },
  { icon:'🧮', label:'Calculator', path:'/calculator' },
  { icon:'🎓', label:'NEET',       path:'/neet'       },
  { icon:'📊', label:'Dashboard',  path:'/dashboard'  },
  { icon:'🎨', label:'Image',      path:'/image'      },
  { icon:'📝', label:'Notes',      path:'/notes'      },
  { icon:'⚙️', label:'Settings',   path:'/settings'   },
];

function getAQIInfo(a:number):[string,string,string]{
  if(a<=50)  return ['Good','#22c55e','🟢'];
  if(a<=100) return ['Moderate','#f59e0b','🟡'];
  if(a<=150) return ['Unhlthy*','#f97316','🟠'];
  if(a<=200) return ['Unhealthy','#ef4444','🔴'];
  if(a<=300) return ['V.Unhlthy','#a855f7','🟣'];
  return ['Hazardous','#dc2626','⚫'];
}

function getGreet(){
  const h=new Date().getHours();
  if(h<5) return {text:'Raat ki Salaam',emoji:'🌙'};
  if(h<12)return{text:'Subah ki Salaam',emoji:'🌅'};
  if(h<17)return{text:'Dopahar ki Salaam',emoji:'☀️'};
  if(h<21)return{text:'Shaam ki Salaam',emoji:'🌆'};
  return{text:'Raat ki Salaam',emoji:'🌙'};
}
const fmt=()=>new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true});
const fmtDate=()=>new Date().toLocaleDateString('hi-IN',{weekday:'long',day:'numeric',month:'long'});

export default function HomeScreen({ name, onSend }: Props) {
  const router = useRouter();
  const [time,setTime]=useState(fmt());
  const [weather,setWeather]=useState<{temp:number;icon:string;city:string}|null>(null);
  const [aqi,setAqi]=useState<{val:number;label:string;color:string;emoji:string}|null>(null);
  const [streak,setStreak]=useState(0);
  const [xp,setXp]=useState(0);
  const [neetDays,setNeetDays]=useState<number|null>(null);
  const greet=getGreet();

  useEffect(()=>{const id=setInterval(()=>setTime(fmt()),1000);return()=>clearInterval(id);},[]);

  useEffect(()=>{
    try{
      const p=JSON.parse(localStorage.getItem('jarvis_profile')||localStorage.getItem('jarvis-db-profile')||'{}');
      setStreak(p?.streak||0); setXp(p?.xp||0);
    }catch{}
    try{
      const nd=new Date('2026-05-03T00:00:00+05:30');
      const diff=nd.getTime()-Date.now();
      if(diff>0) setNeetDays(Math.ceil(diff/86400000));
    }catch{}
    const loc=(()=>{try{return JSON.parse(localStorage.getItem('jarvis_location')||'{}');}catch{return{};}})();
    const lat=loc.lat||24.53,lon=loc.lon||81.3,city=loc.city||name?.split(' ')[0]||'Shehar';
    // Weather
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&timezone=auto`)
      .then(r=>r.json()).then(d=>{
        const wc=d.current.weathercode;
        const WMO:Record<number,[string,string]>={0:['☀️','Clear'],1:['🌤️','MC'],2:['⛅','PC'],3:['☁️','OC'],45:['🌫️','Fog'],61:['🌧️','Rain'],80:['🌦️','Shower'],95:['⛈️','Storm']};
        const [icon]=WMO[wc]||['🌡️','?'];
        setWeather({temp:Math.round(d.current.temperature_2m),icon,city});
      }).catch(()=>{});
    // AQI
    fetch(`/api/airquality?lat=${lat}&lon=${lon}&city=${encodeURIComponent(city)}`)
      .then(r=>r.json()).then(d=>{
        if(d.aqi){const[label,color,emoji]=getAQIInfo(d.aqi);setAqi({val:d.aqi,label,color,emoji});}
      }).catch(()=>{});
  },[]);

  const level=Math.floor(xp/100)+1;
  const xpPct=xp%100;

  return(
    <div style={{padding:'0 14px 80px',maxWidth:480,margin:'0 auto'}}>
      {/* Greeting */}
      <div style={{textAlign:'center',padding:'18px 0 12px'}}>
        <div style={{fontSize:11,color:'#60a5fa',fontWeight:600,marginBottom:3}}>{greet.text} {greet.emoji}</div>
        <div style={{fontSize:26,fontWeight:900,color:'#f1f5f9',letterSpacing:'-0.5px'}}>{name} 👋</div>
      </div>

      {/* Time + Weather + AQI */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:10}}>
        <div style={{background:'rgba(15,23,42,0.9)',border:'1px solid rgba(99,102,241,0.25)',borderRadius:14,padding:'12px 10px'}}>
          <div style={{fontSize:19,fontWeight:900,color:'#60a5fa',lineHeight:1.1}}>{time}</div>
          <div style={{fontSize:8,color:'#475569',marginTop:3}}>{fmtDate()}</div>
        </div>
        <div style={{background:'rgba(15,23,42,0.9)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'12px 10px',display:'flex',alignItems:'center',gap:6}}>
          {weather?(<><span style={{fontSize:22}}>{weather.icon}</span><div><div style={{fontSize:18,fontWeight:900,color:'#f1f5f9'}}>{weather.temp}°</div><div style={{fontSize:8,color:'#475569'}}>{weather.city}</div></div></>):<div style={{fontSize:10,color:'#374151'}}>☁️...</div>}
        </div>
        <div style={{background:'rgba(15,23,42,0.9)',border:`1px solid ${aqi?.color||'rgba(255,255,255,0.07)'}33`,borderRadius:14,padding:'12px 10px'}}>
          <div style={{fontSize:8,color:'#475569',marginBottom:1}}>AQI</div>
          {aqi?(<><div style={{fontSize:18,fontWeight:900,color:aqi.color,lineHeight:1}}>{aqi.val}</div><div style={{fontSize:8,color:aqi.color,marginTop:2}}>{aqi.emoji} {aqi.label}</div></>):<div style={{fontSize:10,color:'#374151'}}>--</div>}
        </div>
      </div>

      {/* NEET Countdown */}
      {neetDays!==null&&(
        <div style={{background:'linear-gradient(135deg,rgba(239,68,68,0.1),rgba(99,102,241,0.1))',border:'1px solid rgba(239,68,68,0.3)',borderRadius:14,padding:'10px 14px',marginBottom:10,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:11,color:'#f87171',fontWeight:700,marginBottom:1}}>🎯 NEET 2026</div>
            <div style={{fontSize:9,color:'#475569'}}>Har din count karta hai!</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:26,fontWeight:900,color:'#f87171',lineHeight:1}}>{neetDays}</div>
            <div style={{fontSize:9,color:'#6b7280'}}>days left</div>
          </div>
        </div>
      )}

      {/* XP + Streak */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
        <div style={{background:'rgba(15,23,42,0.9)',border:'1px solid rgba(255,215,0,0.15)',borderRadius:14,padding:'10px 12px'}}>
          <div style={{fontSize:10,color:'#fbbf24',fontWeight:600,marginBottom:3}}>⚡ Level {level}</div>
          <div style={{height:4,background:'rgba(255,255,255,0.07)',borderRadius:99,overflow:'hidden',marginBottom:3}}>
            <div style={{height:'100%',width:xpPct+'%',background:'linear-gradient(90deg,#fbbf24,#f59e0b)',borderRadius:99,transition:'width 0.5s'}}/>
          </div>
          <div style={{fontSize:10,color:'#475569'}}>{xp} XP</div>
        </div>
        <div style={{background:'rgba(15,23,42,0.9)',border:'1px solid rgba(34,197,94,0.15)',borderRadius:14,padding:'10px 12px',display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:22}}>🔥</span>
          <div><div style={{fontSize:20,fontWeight:900,color:'#22c55e'}}>{streak}</div><div style={{fontSize:10,color:'#475569'}}>day streak</div></div>
        </div>
      </div>

      {/* Quick Nav */}
      <div style={{fontSize:10,fontWeight:800,color:'#374151',textTransform:'uppercase' as const,letterSpacing:'0.08em',marginBottom:7}}>Quick Nav</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:14}}>
        {QUICK_NAV.map(n=>(
          <button key={n.path} onClick={()=>router.push(n.path)}
            style={{background:'rgba(15,23,42,0.9)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:'10px 4px',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
            <span style={{fontSize:20}}>{n.icon}</span>
            <span style={{fontSize:8,fontWeight:700,color:'#6b7280',textTransform:'uppercase' as const}}>{n.label}</span>
          </button>
        ))}
      </div>

      {/* Ask JARVIS */}
      <div style={{fontSize:10,fontWeight:800,color:'#374151',textTransform:'uppercase' as const,letterSpacing:'0.08em',marginBottom:7}}>Ask JARVIS</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}>
        {SUGGESTIONS.map((s,i)=>(
          <button key={i} onClick={()=>onSend(s.text)}
            style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:'12px',textAlign:'left',cursor:'pointer',color:'#e2e8f0'}}
            onTouchStart={e=>(e.currentTarget.style.background='rgba(99,102,241,0.15)')}
            onTouchEnd={e=>(e.currentTarget.style.background='rgba(15,23,42,0.8)')}>
            <div style={{fontSize:18,marginBottom:4}}>{s.icon}</div>
            <div style={{fontSize:11,color:'#94a3b8',lineHeight:1.3}}>{s.text}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
