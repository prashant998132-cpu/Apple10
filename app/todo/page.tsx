'use client';
import { useState, useEffect } from 'react';

interface Todo {
  id: string;
  text: string;
  done: boolean;
  priority: 'high'|'medium'|'low';
  tag: string;
  ts: number;
  due?: string;
}

const TAGS = ['Work','Study','Health','Personal','NEET','Coding','Home'];
const PRIORITY_COLORS = { high:'#ef4444', medium:'#f59e0b', low:'#22c55e' };
const PRIORITY_ICONS = { high:'🔴', medium:'🟡', low:'🟢' };

const S = {
  page: { minHeight:'100vh', background:'#070810', color:'#e2e8f0', fontFamily:'-apple-system,sans-serif', paddingBottom:80 },
  header: { display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'#0a0c14', borderBottom:'1px solid rgba(255,255,255,0.07)', position:'sticky' as const, top:0, zIndex:50 },
  backBtn: { background:'rgba(255,255,255,0.07)', border:'none', borderRadius:8, color:'#e2e8f0', padding:'7px 12px', cursor:'pointer', fontSize:14 },
  title: { fontSize:17, fontWeight:800, color:'#a78bfa', letterSpacing:'-0.4px' },
  content: { padding:'14px' },
  addCard: { background:'#0d1117', border:'1px solid rgba(167,139,250,0.2)', borderRadius:14, padding:14, marginBottom:16 },
  input: { width:'100%', background:'#070810', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 12px', color:'#e2e8f0', fontSize:14, outline:'none', boxSizing:'border-box' as const },
  btn: (c:string) => ({ background:c, border:'none', borderRadius:10, color:c==='#6b7280'?'#e2e8f0':'#0a0a0a', padding:'9px 16px', fontWeight:700, fontSize:12, cursor:'pointer' }),
  todoItem: (done:boolean) => ({ background:done?'rgba(255,255,255,0.02)':'#0d1117', border:`1px solid ${done?'rgba(255,255,255,0.04)':'rgba(255,255,255,0.07)'}`, borderRadius:12, padding:'12px 14px', marginBottom:8, display:'flex', alignItems:'flex-start', gap:12, opacity:done?0.6:1, transition:'all 0.2s' }),
};

function load<T>(key:string, def:T):T {
  if(typeof window==='undefined') return def;
  try { const v=localStorage.getItem(key); return v?JSON.parse(v):def; } catch { return def; }
}
function save(key:string,val:any){
  if(typeof window==='undefined') return;
  try { localStorage.setItem(key,JSON.stringify(val)); } catch {}
}

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<'high'|'medium'|'low'>('medium');
  const [tag, setTag] = useState('Personal');
  const [due, setDue] = useState('');
  const [filter, setFilter] = useState<'all'|'active'|'done'>('all');
  const [filterTag, setFilterTag] = useState('all');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    setTodos(load('jarvis_todos', []));
  }, []);

  function saveTodos(updated: Todo[]) {
    setTodos(updated);
    save('jarvis_todos', updated);
  }

  function addTodo() {
    if(!text.trim()) return;
    const t: Todo = {
      id: Date.now().toString(),
      text: text.trim(),
      done: false,
      priority,
      tag,
      ts: Date.now(),
      due: due||undefined,
    };
    saveTodos([t, ...todos]);
    setText(''); setDue(''); setShowAdd(false);
  }

  function toggle(id:string) {
    saveTodos(todos.map(t => t.id===id ? {...t, done:!t.done} : t));
  }

  function remove(id:string) {
    saveTodos(todos.filter(t => t.id!==id));
  }

  function clearDone() {
    saveTodos(todos.filter(t => !t.done));
  }

  const filtered = todos
    .filter(t => filter==='all' ? true : filter==='active' ? !t.done : t.done)
    .filter(t => filterTag==='all' ? true : t.tag===filterTag)
    .sort((a,b) => {
      if(a.done!==b.done) return a.done?1:-1;
      const p = {high:0,medium:1,low:2};
      return p[a.priority]-p[b.priority];
    });

  const stats = { total:todos.length, done:todos.filter(t=>t.done).length, high:todos.filter(t=>!t.done&&t.priority==='high').length };

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <button style={S.backBtn} onClick={() => window.history.back()}>← Back</button>
        <span style={S.title}>✅ To-Do</span>
        <button onClick={()=>setShowAdd(!showAdd)}
          style={{marginLeft:'auto',background:'rgba(167,139,250,0.15)',border:'1px solid rgba(167,139,250,0.3)',borderRadius:8,color:'#a78bfa',padding:'7px 12px',cursor:'pointer',fontSize:13,fontWeight:700}}>
          + Add
        </button>
      </div>

      <div style={S.content}>
        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
          {[
            {label:'Total',value:stats.total,color:'#22d3ee'},
            {label:'Done',value:stats.done,color:'#22c55e'},
            {label:'Urgent',value:stats.high,color:'#ef4444'},
          ].map(s=>(
            <div key={s.label} style={{background:'#0d1117',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'12px 8px',textAlign:'center'}}>
              <div style={{fontSize:22,fontWeight:800,color:s.color}}>{s.value}</div>
              <div style={{fontSize:10,color:'#374151',fontWeight:700,textTransform:'uppercase',marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {stats.total>0&&(
          <div style={{background:'rgba(255,255,255,0.05)',borderRadius:99,height:4,marginBottom:14,overflow:'hidden'}}>
            <div style={{width:`${Math.round(stats.done/stats.total*100)}%`,height:'100%',background:'linear-gradient(90deg,#a78bfa,#22c55e)',borderRadius:99,transition:'width 0.4s'}}/>
          </div>
        )}

        {/* Add Todo Form */}
        {showAdd&&(
          <div style={S.addCard}>
            <input style={S.input} placeholder="Kya karna hai? Task likho..." value={text} onChange={e=>setText(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&addTodo()} autoFocus/>
            <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap' as const}}>
              {(['high','medium','low'] as const).map(p=>(
                <button key={p} onClick={()=>setPriority(p)}
                  style={{...S.btn(priority===p?PRIORITY_COLORS[p]:'rgba(255,255,255,0.07)'),padding:'6px 12px',fontSize:11}}>
                  {PRIORITY_ICONS[p]} {p}
                </button>
              ))}
            </div>
            <div style={{display:'flex',gap:6,marginTop:8,overflowX:'auto'}}>
              {TAGS.map(tg=>(
                <button key={tg} onClick={()=>setTag(tg)}
                  style={{background:tag===tg?'rgba(167,139,250,0.2)':'rgba(255,255,255,0.04)',border:`1px solid ${tag===tg?'rgba(167,139,250,0.4)':'rgba(255,255,255,0.07)'}`,borderRadius:99,color:tag===tg?'#a78bfa':'#6b7280',padding:'5px 10px',fontSize:11,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}}>
                  {tg}
                </button>
              ))}
            </div>
            <input type="date" style={{...S.input,marginTop:8}} value={due} onChange={e=>setDue(e.target.value)}/>
            <div style={{display:'flex',gap:8,marginTop:10}}>
              <button style={{...S.btn('#a78bfa'),flex:1}} onClick={addTodo}>Add Task ✅</button>
              <button style={{...S.btn('rgba(255,255,255,0.07)'),padding:'9px 16px'}} onClick={()=>setShowAdd(false)}>✕</button>
            </div>
          </div>
        )}

        {/* Filter Row */}
        <div style={{display:'flex',gap:6,marginBottom:10,overflowX:'auto'}}>
          {(['all','active','done'] as const).map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              style={{background:filter===f?'rgba(167,139,250,0.15)':'none',border:`1px solid ${filter===f?'rgba(167,139,250,0.3)':'rgba(255,255,255,0.07)'}`,borderRadius:99,color:filter===f?'#a78bfa':'#6b7280',padding:'6px 14px',fontSize:12,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>
              {f==='all'?'All':f==='active'?'Active':'Done ✓'}
            </button>
          ))}
          {stats.done>0&&(
            <button onClick={clearDone}
              style={{background:'none',border:'1px solid rgba(239,68,68,0.2)',borderRadius:99,color:'#ef4444',padding:'6px 12px',fontSize:11,cursor:'pointer',marginLeft:'auto',whiteSpace:'nowrap'}}>
              Clear Done
            </button>
          )}
        </div>

        {/* Tag filter */}
        <div style={{display:'flex',gap:6,marginBottom:12,overflowX:'auto'}}>
          <button onClick={()=>setFilterTag('all')}
            style={{background:filterTag==='all'?'rgba(255,255,255,0.08)':'none',border:'1px solid rgba(255,255,255,0.07)',borderRadius:99,color:filterTag==='all'?'#e2e8f0':'#6b7280',padding:'4px 10px',fontSize:10,cursor:'pointer',whiteSpace:'nowrap'}}>
            All Tags
          </button>
          {TAGS.map(tg=>(
            <button key={tg} onClick={()=>setFilterTag(filterTag===tg?'all':tg)}
              style={{background:filterTag===tg?'rgba(255,255,255,0.08)':'none',border:'1px solid rgba(255,255,255,0.07)',borderRadius:99,color:filterTag===tg?'#e2e8f0':'#6b7280',padding:'4px 10px',fontSize:10,cursor:'pointer',whiteSpace:'nowrap'}}>
              {tg}
            </button>
          ))}
        </div>

        {/* Todo List */}
        {filtered.length===0&&(
          <div style={{textAlign:'center',padding:'40px 0',color:'#374151'}}>
            <div style={{fontSize:40}}>📋</div>
            <div style={{fontSize:13,marginTop:8}}>
              {todos.length===0?'Koi task nahi hai. Add karo! ✏️':'No tasks match filter'}
            </div>
          </div>
        )}

        {filtered.map(t=>(
          <div key={t.id} style={S.todoItem(t.done)}>
            {/* Checkbox */}
            <button onClick={()=>toggle(t.id)}
              style={{minWidth:22,height:22,borderRadius:6,border:`2px solid ${t.done?'#22c55e':PRIORITY_COLORS[t.priority]}`,background:t.done?'#22c55e':'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',marginTop:1}}>
              {t.done&&<span style={{fontSize:12,color:'#0a0a0a',fontWeight:900}}>✓</span>}
            </button>

            {/* Content */}
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:600,color:t.done?'#4b5563':'#e2e8f0',textDecoration:t.done?'line-through':'none',wordBreak:'break-word'}}>
                {t.text}
              </div>
              <div style={{display:'flex',gap:6,marginTop:5,flexWrap:'wrap' as const,alignItems:'center'}}>
                <span style={{fontSize:10,background:PRIORITY_COLORS[t.priority]+'22',color:PRIORITY_COLORS[t.priority],padding:'2px 8px',borderRadius:99,fontWeight:700}}>
                  {PRIORITY_ICONS[t.priority]} {t.priority}
                </span>
                <span style={{fontSize:10,background:'rgba(255,255,255,0.05)',color:'#9ca3af',padding:'2px 8px',borderRadius:99}}>
                  {t.tag}
                </span>
                {t.due&&(
                  <span style={{fontSize:10,color:'#f59e0b'}}>
                    📅 {t.due}
                  </span>
                )}
              </div>
            </div>

            {/* Delete */}
            <button onClick={()=>remove(t.id)}
              style={{background:'none',border:'none',color:'#374151',fontSize:16,cursor:'pointer',padding:'0 4px',lineHeight:1}}>
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
