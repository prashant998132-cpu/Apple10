'use client';
import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from './ChatInterface';
import InlineWidget from './InlineWidget';

interface Props {
  message: Message; onLike: (liked: boolean) => void;
  onSpeak: () => void; onCopy: () => void; onPin: () => void;
  onRegenerate?: () => void;
}

const MODE_COLORS: Record<string,string> = {think:'#a78bfa',deep:'#34d399',auto:'#60a5fa',flash:'#facc15'};
const MODE_ICONS: Record<string,string>  = {think:'🧠',deep:'🔬',auto:'🤖',flash:'⚡'};
const REACTIONS = ['❤️','🔥','😂','👏','😮','💯'];

export default function MessageBubble({message:msg,onLike,onSpeak,onCopy,onPin,onRegenerate}:Props) {
  const [showActions,setShowActions] = useState(false);
  const [copied,setCopied] = useState(false);
  const [reaction,setReaction] = useState('');
  const [showReactions,setShowReactions] = useState(false);
  const touchStartX = useRef(0);
  const [swipeX,setSwipeX] = useState(0);
  const isUser = msg.role==='user';

  const onTS = (e:React.TouchEvent) => { touchStartX.current=e.touches[0].clientX; };
  const onTM = (e:React.TouchEvent) => { const dx=e.touches[0].clientX-touchStartX.current; if(Math.abs(dx)<60) setSwipeX(dx*0.18); };
  const onTE = (e:React.TouchEvent) => { const dx=e.changedTouches[0].clientX-touchStartX.current; setSwipeX(0); if(dx>60) onLike(true); else if(dx<-60) handleCopy(); };

  const handleCopy = () => { navigator.clipboard.writeText(msg.content).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),1800); onCopy(); };

  const shareWhatsApp = () => {
    const text = msg.role==='user' ? msg.content : `JARVIS:\n${msg.content}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,'_blank');
  };

  const modeColor = MODE_COLORS[msg.mode||'flash']||'#60a5fa';
  const modeIcon  = MODE_ICONS[msg.mode||'flash']||'⚡';
  const timeStr   = new Date(msg.ts).toLocaleTimeString('hi-IN',{hour:'2-digit',minute:'2-digit'});

  return (
    <div className={`relative w-full ${isUser?'flex justify-end':''}`}
      style={{transform:`translateX(${swipeX}px)`,transition:swipeX===0?'transform 0.15s':'none'}}
      onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}>

      {/* Reaction popup */}
      {showReactions && (
        <div style={{position:'absolute',bottom:'100%',right:0,zIndex:50,background:'#13161f',border:'1px solid rgba(255,255,255,0.1)',borderRadius:24,padding:'6px 10px',display:'flex',gap:6,boxShadow:'0 8px 24px rgba(0,0,0,0.5)',marginBottom:4}}>
          {REACTIONS.map(r=>(
            <button key={r} onClick={e=>{e.stopPropagation();setReaction(r===reaction?'':r);setShowReactions(false);}}
              style={{fontSize:20,background:'none',border:'none',cursor:'pointer',padding:2,borderRadius:8,transform:reaction===r?'scale(1.3)':'scale(1)',transition:'transform 0.15s'}}>
              {r}
            </button>
          ))}
        </div>
      )}

      {isUser ? (
        <div className="max-w-[80%] cursor-pointer select-text"
          style={{background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.18)',borderRadius:'14px 14px 3px 14px',padding:'7px 11px 5px'}}
          onClick={()=>setShowActions(s=>!s)}>
          <p style={{fontSize:13,lineHeight:1.45,color:'#bfdbfe',margin:0,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{msg.content}</p>
          <div style={{display:'flex',justifyContent:'flex-end',alignItems:'center',gap:6,marginTop:2}}>
            <span style={{fontSize:9,color:'rgba(147,197,253,0.35)'}}>{timeStr}</span>
            {showActions && (
              <div style={{display:'flex',gap:4}}>
                <button onClick={e=>{e.stopPropagation();handleCopy();setShowActions(false);}}
                  style={{fontSize:9,padding:'1px 6px',borderRadius:8,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',color:copied?'#4ade80':'#9ca3af',cursor:'pointer'}}>
                  {copied?'✅':'📋'}
                </button>
                <button onClick={e=>{e.stopPropagation();shareWhatsApp();}}
                  style={{fontSize:9,padding:'1px 6px',borderRadius:8,background:'rgba(37,211,102,0.1)',border:'1px solid rgba(37,211,102,0.3)',color:'#25d366',cursor:'pointer'}}>
                  WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full cursor-pointer" onClick={()=>setShowActions(s=>!s)} onContextMenu={e=>{e.preventDefault();setShowReactions(true);}}>
          <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:3}}>
            <span style={{fontSize:8.5,fontWeight:800,letterSpacing:'0.06em',textTransform:'uppercase',color:modeColor}}>{modeIcon} {(msg.mode||'flash').toUpperCase()}</span>
            {msg.pinned&&<span style={{fontSize:8.5,color:'#fbbf24'}}>📌</span>}
            {reaction&&<span style={{fontSize:14}}>{reaction}</span>}
          </div>

          {msg.type==='image'&&msg.imageUrl&&(
            <div style={{marginBottom:6}}>
              <img src={msg.imageUrl} alt="" style={{maxWidth:'100%',maxHeight:260,borderRadius:12,objectFit:'cover',cursor:'pointer'}} onClick={e=>{e.stopPropagation();window.open(msg.imageUrl,'_blank');}} loading="lazy"/>
            </div>
          )}
          {msg.widget&&<InlineWidget type={msg.widget.type} data={msg.widget.data}/>}

          {msg.content&&(
            <div style={{fontSize:13.5,lineHeight:1.55,color:'#e2e8f0'}} className="jarvis-msg">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                p:({children})=><p style={{margin:'0 0 4px',fontSize:13.5,lineHeight:1.55,color:'#e2e8f0'}}>{children}</p>,
                code({node,inline,className,children,...props}:any){
                  if(inline) return <code style={{background:'rgba(255,255,255,0.08)',padding:'1px 5px',borderRadius:4,fontFamily:'monospace',fontSize:12}}>{children}</code>;
                  return <pre style={{background:'#0d0f18',border:'1px solid rgba(255,255,255,0.07)',borderRadius:8,padding:'8px 10px',overflowX:'auto',margin:'4px 0'}}><code style={{fontFamily:'monospace',fontSize:11.5,color:'#a5f3fc'}}>{children}</code></pre>;
                },
                ul:({children})=><ul style={{paddingLeft:14,margin:'2px 0'}}>{children}</ul>,
                ol:({children})=><ol style={{paddingLeft:14,margin:'2px 0'}}>{children}</ol>,
                li:({children})=><li style={{fontSize:13,marginBottom:2,color:'#cbd5e1'}}>{children}</li>,
                h1:({children})=><h1 style={{fontSize:15,fontWeight:800,color:'#fff',margin:'4px 0 2px'}}>{children}</h1>,
                h2:({children})=><h2 style={{fontSize:14,fontWeight:700,color:'#f1f5f9',margin:'4px 0 2px'}}>{children}</h2>,
                h3:({children})=><h3 style={{fontSize:13.5,fontWeight:700,color:'#e2e8f0',margin:'3px 0 1px'}}>{children}</h3>,
                strong:({children})=><strong style={{color:'#fff',fontWeight:700}}>{children}</strong>,
                blockquote:({children})=><blockquote style={{borderLeft:'2px solid rgba(99,102,241,0.5)',paddingLeft:8,margin:'4px 0',color:'#94a3b8',fontStyle:'italic'}}>{children}</blockquote>,
                a:({href,children})=><a href={href} target="_blank" rel="noopener noreferrer" style={{color:'#60a5fa',textDecoration:'underline'}}>{children}</a>,
                hr:()=><hr style={{border:'none',borderTop:'1px solid rgba(255,255,255,0.07)',margin:'6px 0'}}/>,
              }}>{msg.content}</ReactMarkdown>
            </div>
          )}

          {msg.thinking&&(
            <details style={{marginTop:4}}>
              <summary style={{fontSize:10,color:'#6366f1',cursor:'pointer',userSelect:'none',listStyle:'none'}}>💭 Thought process</summary>
              <div style={{fontSize:11,color:'#6b7280',lineHeight:1.4,marginTop:4,padding:'6px 8px',background:'rgba(99,102,241,0.05)',borderRadius:6}}>{msg.thinking}</div>
            </details>
          )}

          {msg.toolsUsed&&msg.toolsUsed.length>0&&(
            <div style={{marginTop:3,display:'flex',flexWrap:'wrap',gap:3}}>
              {msg.toolsUsed.map(t=><span key={t} style={{fontSize:9,padding:'1px 5px',background:'rgba(99,102,241,0.12)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:4,color:'#818cf8'}}>🔧 {t}</span>)}
            </div>
          )}

          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:5}}>
            <span style={{fontSize:9,color:'rgba(148,163,184,0.3)'}}>{timeStr}</span>
            <div style={{display:'flex',gap:4,alignItems:'center'}}>
              <button onClick={e=>{e.stopPropagation();handleCopy();}}
                style={{fontSize:11,padding:'2px 8px',borderRadius:6,background:copied?'rgba(74,222,128,0.12)':'rgba(255,255,255,0.05)',border:`1px solid ${copied?'rgba(74,222,128,0.3)':'rgba(255,255,255,0.08)'}`,cursor:'pointer',color:copied?'#4ade80':'#6b7280',transition:'all 0.2s'}}>
                {copied?'✅':'📋'}
              </button>
              {onRegenerate&&(
                <button onClick={e=>{e.stopPropagation();onRegenerate();}}
                  style={{fontSize:11,padding:'2px 8px',borderRadius:6,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer',color:'#6b7280'}}>
                  🔄
                </button>
              )}
              <button onClick={e=>{e.stopPropagation();shareWhatsApp();}}
                style={{fontSize:11,padding:'2px 8px',borderRadius:6,background:'rgba(37,211,102,0.08)',border:'1px solid rgba(37,211,102,0.2)',cursor:'pointer',color:'#25d366'}}>
                📤
              </button>
              <button onClick={e=>{e.stopPropagation();setShowReactions(s=>!s);setShowActions(false);}}
                style={{fontSize:11,padding:'2px 6px',borderRadius:6,background:reaction?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer',color:'#9ca3af'}}>
                {reaction||'😊'}
              </button>
              {showActions&&(
                <>
                  <button onClick={e=>{e.stopPropagation();onSpeak();setShowActions(false);}} style={{fontSize:11,padding:'2px 6px',borderRadius:6,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer'}}>🔊</button>
                  <button onClick={e=>{e.stopPropagation();onLike(true);setShowActions(false);}} style={{fontSize:11,padding:'2px 6px',borderRadius:6,background:msg.liked===true?'rgba(74,222,128,0.1)':'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer'}}>{msg.liked===true?'💙':'👍'}</button>
                  <button onClick={e=>{e.stopPropagation();onPin();setShowActions(false);}} style={{fontSize:11,padding:'2px 6px',borderRadius:6,background:msg.pinned?'rgba(251,191,36,0.1)':'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer'}}>{msg.pinned?'📌':'📍'}</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}