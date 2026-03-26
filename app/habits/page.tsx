'use client';
import { useState, useEffect } from 'react';

interface Habit { id:string; name:string; emoji:string; streak:number; lastDone:string; history:string[]; color:string; }

const COLORS = ['#6366f1','#22d3ee','#4ade80','#f59e0b','#f87171','#a78bfa'];
const DEFAULT_HABITS: Habit[] = [
  {id:'gym',name:'Gym / Exercise',emoji:'💪',streak:0,lastDone:'',history:[],color:'#6366f1'},
  {id:'water',name:'Paani 2L Piya',emoji:'💧',streak:0,lastDone:'',history:[],color:'#22d3ee'},
  {id:'study',name:'Study / Padhai',emoji:'📚',streak:0,lastDone:'',history:[],color:'#4ade80'},
  {id:'sleep',name:'Time pe Soya',emoji:'😴',streak:0,lastDone:'',history:[],color:'#a78bfa'},
  {id:'read',name:'Book Padhi',emoji:'📖',streak:0,lastDone:'',history:[],color:'#f59e0b'},
  {id:'meditate',name:'Meditation',emoji:'🧘',streak:0,lastDone:'',history:[],color:'#f87171'},
];

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('⭐');
  const today = new Date().toISOString().slice(0,10);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('jarvis_habits');
      if(saved) setHabits(JSON.parse(saved));
    } catch {}
  },[]);

  const save = (h: Habit[]) => {
    setHabits(h);
    try { localStorage.setItem('jarvis_habits',JSON.stringify(h)); } catch {}
  };

  const markDone = (id: string) => {
    const updated = habits.map(h => {
      if(h.id!==id) return h;
      const alreadyDone = h.lastDone===today;
      if(alreadyDone) return h;
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
      const yStr = yesterday.toISOString().slice(0,10);
      const newStreak = h.lastDone===yStr ? h.streak+1 : 1;
      return {...h,lastDone:today,streak:newStreak,history:[...h.history.slice(-29),today]};
    });
    save(updated);
    if(navigator.vibrate) navigator.vibrate(50);
  };

  const addHabit = () => {
    if(!newName.trim()) return;
    const h: Habit = {id:`h_${Date.now()}`,name:newName.trim(),emoji:newEmoji,streak:0,lastDone:'',history:[],color:COLORS[habits.length%COLORS.length]};
    save([...habits,h]);
    setNewName(''); setAdding(false);
  };

  const removeHabit = (id: string) => save(habits.filter(h=>h.id!==id));

  const totalDoneToday = habits.filter(h=>h.lastDone===today).length;

  // Last 7 days for mini chart
  const last7 = Array.from({length:7},(_,i)=>{
    const d=new Date(); d.setDate(d.getDate()-6+i);
    return d.toISOString().slice(0,10);
  });

  return (
    <div style={{background:'#080a12',minHeight:'100dvh',color:'#e2e8f0',fontFamily:'sans-serif',paddingBottom:80}}>
      <div style={{background:'#0a0c14',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'14px 16px'}}>
        <div style={{fontSize:18,fontWeight:900,color:'#4ade80'}}>🔥 Habit Tracker</div>
        <div style={{fontSize:11,color:'#6b7280',marginTop:2}}>Aaj: {totalDoneToday}/{habits.length} complete · {today}</div>
      </div>

      {/* Progress bar */}
      <div style={{padding:'12px 16px 0'}}>
        <div style={{height:6,background:'rgba(255,255,255,0.05)',borderRadius:3,overflow:'hidden'}}>
          <div style={{height:'100%',background:'linear-gradient(90deg,#4ade80,#22d3ee)',borderRadius:3,transition:'width 0.5s ease',width:`${habits.length?Math.round(totalDoneToday/habits.length*100):0}%`}}/>
        </div>
        <div style={{fontSize:10,color:'#6b7280',marginTop:4,textAlign:'right'}}>{habits.length?Math.round(totalDoneToday/habits.length*100):0}% done today</div>
      </div>

      <div style={{padding:'12px 16px'}}>
        {habits.map(h=>{
          const doneToday = h.lastDone===today;
          return (
            <div key={h.id} style={{background:'#0e1120',border:`1px solid ${doneToday?h.color+'40':'rgba(255,255,255,0.06)'}`,borderRadius:14,padding:14,marginBottom:10,transition:'all 0.2s'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:24}}>{h.emoji}</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:doneToday?'#fff':'#9ca3af'}}>{h.name}</div>
                    <div style={{fontSize:10,color:h.color,marginTop:1}}>🔥 {h.streak} day streak</div>
                  </div>
                </div>
                <button onClick={()=>markDone(h.id)} disabled={doneToday}
                  style={{width:40,height:40,borderRadius:12,border:`2px solid ${doneToday?h.color:'rgba(255,255,255,0.15)'}`,background:doneToday?h.color+'20':'transparent',fontSize:doneToday?18:20,cursor:doneToday?'default':'pointer',transition:'all 0.2s',display:'flex',alignItems:'center',justifyContent:'center',color:doneToday?h.color:'#4b5563'}}>
                  {doneToday?'✅':'○'}
                </button>
              </div>
              {/* Mini 7-day chart */}
              <div style={{display:'flex',gap:3,marginTop:10}}>
                {last7.map(d=>(
                  <div key={d} style={{flex:1,height:4,borderRadius:2,background:h.history.includes(d)?h.color:'rgba(255,255,255,0.05)',transition:'background 0.3s'}}/>
                ))}
              </div>
            </div>
          );
        })}

        {adding ? (
          <div style={{background:'#0e1120',border:'1px solid rgba(99,102,241,0.3)',borderRadius:14,padding:14,marginBottom:10}}>
            <div style={{display:'flex',gap:8,marginBottom:10}}>
              <input value={newEmoji} onChange={e=>setNewEmoji(e.target.value)} style={{width:48,background:'#070810',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'8px',color:'#e2e8f0',fontSize:18,textAlign:'center',outline:'none'}} placeholder="😊"/>
              <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Habit ka naam..." style={{flex:1,background:'#070810',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'8px 12px',color:'#e2e8f0',fontSize:13,outline:'none'}} onKeyDown={e=>e.key==='Enter'&&addHabit()}/>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={addHabit} style={{flex:1,padding:'10px',borderRadius:10,background:'#6366f1',border:'none',color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer'}}>Add Habit</button>
              <button onClick={()=>{setAdding(false);setNewName('');}} style={{flex:1,padding:'10px',borderRadius:10,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#9ca3af',fontSize:13,cursor:'pointer'}}>Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={()=>setAdding(true)} style={{width:'100%',padding:'12px',borderRadius:14,background:'rgba(99,102,241,0.08)',border:'1px dashed rgba(99,102,241,0.3)',color:'#818cf8',fontSize:13,cursor:'pointer',fontWeight:600}}>+ Naya Habit Add Karo</button>
        )}
      </div>
    </div>
  );
}