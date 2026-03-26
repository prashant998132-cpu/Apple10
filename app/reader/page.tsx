'use client';
import { useState, useCallback } from 'react';

export default function ReaderPage() {
  const [file, setFile] = useState<File|null>(null);
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'summary'|'qa'|'keypoints'>('summary');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const handleFile = async (f: File) => {
    setFile(f); setText(''); setSummary(''); setAnswer('');
    setLoading(true);

    if(f.type==='application/pdf'){
      // PDF — send to AI directly as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        setText(`[PDF loaded: ${f.name} — ${(f.size/1024).toFixed(0)}KB]`);
        await analyzeDoc(base64, f.type, f.name);
      };
      reader.readAsDataURL(f);
    } else {
      // Text file
      const t = await f.text();
      setText(t.slice(0,10000));
      await analyzeDoc(null, 'text', f.name, t.slice(0,8000));
    }
    setLoading(false);
  };

  const analyzeDoc = async (base64:string|null, mimeType:string, name:string, rawText?:string) => {
    try {
      const prompt = mode==='summary' ? `Yeh document ka detailed summary do in Hinglish. Key points, main ideas, important facts sab cover karo.\n\nDocument: ${name}` :
                     mode==='keypoints' ? `Yeh document se 10 most important key points extract karo. Bullet format mein do in Hinglish.\n\nDocument: ${name}` :
                     `Document: ${name}\n\nSummary/overview do briefly in Hinglish.`;

      let body: any;
      if(base64 && mimeType.includes('pdf')){
        body = JSON.stringify({imageBase64:base64, mimeType, prompt});
        const r = await fetch('/api/vision',{method:'POST',headers:{'Content-Type':'application/json'},body,signal:AbortSignal.timeout(30000)});
        const d = await r.json();
        if(d.text) setSummary(d.text);
      } else if(rawText){
        const r = await fetch('/api/stream',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({messages:[{role:'user',content:`${prompt}\n\nContent:\n${rawText}`}],mode:'deep'}),
          signal:AbortSignal.timeout(30000),
        });
        if(r.body){
          const reader2 = r.body.getReader(); const dec = new TextDecoder(); let buf=''; let full='';
          while(true){
            const {done,value}=await reader2.read(); if(done)break;
            buf+=dec.decode(value); const lines=buf.split('\n'); buf=lines.pop()||'';
            for(const line of lines){ if(!line.startsWith('data: '))continue; const d=line.slice(6); if(d==='[DONE]')break; try{const t=JSON.parse(d)?.choices?.[0]?.delta?.content; if(t){full+=t;setSummary(full);}}catch{} }
          }
        }
      }
    } catch(e){ setSummary('Document analyze nahi ho payi. Dobara try karo.'); }
  };

  const askQuestion = async () => {
    if(!question.trim()||!text) return;
    setLoading(true); setAnswer('');
    try {
      const r = await fetch('/api/stream',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({messages:[{role:'user',content:`Document content:\n${text.slice(0,6000)}\n\nSawal: ${question}\n\nIs document ke basis pe Hinglish mein jawab do.`}],mode:'deep'}),
        signal:AbortSignal.timeout(25000),
      });
      if(r.body){
        const reader2=r.body.getReader(); const dec=new TextDecoder(); let buf=''; let full='';
        while(true){
          const {done,value}=await reader2.read(); if(done)break;
          buf+=dec.decode(value); const lines=buf.split('\n'); buf=lines.pop()||'';
          for(const line of lines){ if(!line.startsWith('data: '))continue; const d=line.slice(6); if(d==='[DONE]')break; try{const t=JSON.parse(d)?.choices?.[0]?.delta?.content; if(t){full+=t;setAnswer(full);}}catch{} }
        }
      }
    } catch { setAnswer('Jawab nahi mila. Dobara try karo.'); }
    setLoading(false);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if(f) handleFile(f);
  },[mode]);

  return (
    <div style={{background:'#080a12',minHeight:'100dvh',color:'#e2e8f0',fontFamily:'sans-serif',paddingBottom:80}}>
      <div style={{background:'#0a0c14',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'14px 16px'}}>
        <div style={{fontSize:18,fontWeight:900,color:'#22d3ee'}}>📄 Document Reader</div>
        <div style={{fontSize:11,color:'#6b7280',marginTop:2}}>PDF/TXT upload karo — AI se analyze karwao</div>
      </div>

      <div style={{padding:16}}>
        {/* Mode selector */}
        <div style={{display:'flex',gap:6,marginBottom:14}}>
          {(['summary','keypoints','qa'] as const).map(m=>(
            <button key={m} onClick={()=>setMode(m)}
              style={{flex:1,padding:'8px 4px',borderRadius:10,fontSize:11,fontWeight:700,background:mode===m?'rgba(34,211,238,0.15)':'rgba(255,255,255,0.03)',border:`1px solid ${mode===m?'rgba(34,211,238,0.4)':'rgba(255,255,255,0.07)'}`,color:mode===m?'#22d3ee':'#6b7280',cursor:'pointer'}}>
              {m==='summary'?'📝 Summary':m==='keypoints'?'🎯 Key Points':'❓ Q&A'}
            </button>
          ))}
        </div>

        {/* Drop zone */}
        {!file ? (
          <div onDrop={onDrop} onDragOver={e=>e.preventDefault()}
            style={{background:'#0e1120',border:'2px dashed rgba(34,211,238,0.2)',borderRadius:16,padding:'32px 20px',textAlign:'center',cursor:'pointer'}}
            onClick={()=>document.getElementById('fileInput')?.click()}>
            <div style={{fontSize:40,marginBottom:10}}>📂</div>
            <div style={{fontSize:14,fontWeight:700,color:'#e2e8f0',marginBottom:6}}>File Upload Karo</div>
            <div style={{fontSize:11,color:'#6b7280'}}>PDF, TXT, MD files supported</div>
            <div style={{fontSize:10,color:'#374151',marginTop:4}}>Tap to browse ya drag & drop</div>
            <input id="fileInput" type="file" accept=".pdf,.txt,.md,.doc" className="hidden" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0]; if(f)handleFile(f);}}/>
          </div>
        ) : (
          <div style={{background:'#0e1120',border:'1px solid rgba(34,211,238,0.2)',borderRadius:14,padding:12,marginBottom:12,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:24}}>{file.type.includes('pdf')?'📕':'📄'}</span>
              <div><div style={{fontSize:12,fontWeight:700,color:'#22d3ee'}}>{file.name}</div><div style={{fontSize:10,color:'#6b7280'}}>{(file.size/1024).toFixed(0)}KB</div></div>
            </div>
            <button onClick={()=>{setFile(null);setText('');setSummary('');setAnswer('');}}
              style={{background:'rgba(248,113,113,0.1)',border:'1px solid rgba(248,113,113,0.3)',borderRadius:8,color:'#f87171',padding:'4px 10px',cursor:'pointer',fontSize:12}}>
              ✕ Remove
            </button>
          </div>
        )}

        {/* Summary output */}
        {loading && (
          <div style={{textAlign:'center',padding:'20px',color:'#6366f1'}}>
            <div style={{fontSize:24,marginBottom:8}}>🔍</div>
            <div style={{fontSize:12}}>Document analyze ho raha hai...</div>
          </div>
        )}

        {summary && !loading && (
          <div style={{background:'#0e1120',border:'1px solid rgba(99,102,241,0.2)',borderRadius:14,padding:14,marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:800,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>{mode==='summary'?'📝 Summary':mode==='keypoints'?'🎯 Key Points':'📋 Overview'}</div>
            <div style={{fontSize:13,lineHeight:1.6,color:'#e2e8f0',whiteSpace:'pre-wrap'}}>{summary}</div>
          </div>
        )}

        {/* Q&A */}
        {mode==='qa' && file && (
          <div style={{background:'#0e1120',border:'1px solid rgba(34,211,238,0.15)',borderRadius:14,padding:14}}>
            <div style={{fontSize:11,color:'#9ca3af',marginBottom:8}}>Document ke baare mein kuch bhi pucho:</div>
            <div style={{display:'flex',gap:8,marginBottom:answer?12:0}}>
              <input value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>e.key==='Enter'&&askQuestion()} placeholder="Aapka sawal..." style={{flex:1,background:'#070810',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'9px 12px',color:'#e2e8f0',fontSize:13,outline:'none'}}/>
              <button onClick={askQuestion} disabled={loading||!question.trim()} style={{padding:'9px 16px',borderRadius:8,background:'#22d3ee',border:'none',color:'#000',fontWeight:800,fontSize:13,cursor:'pointer'}}>Ask</button>
            </div>
            {answer && <div style={{fontSize:13,lineHeight:1.6,color:'#e2e8f0',padding:'10px',background:'rgba(34,211,238,0.05)',borderRadius:10,border:'1px solid rgba(34,211,238,0.1)',whiteSpace:'pre-wrap'}}>{answer}</div>}
          </div>
        )}
      </div>
    </div>
  );
}