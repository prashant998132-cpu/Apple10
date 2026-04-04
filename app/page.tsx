'use client';
import React, { useEffect } from 'react';
import ChatInterface from '@/components/chat/ChatInterface';

interface EBState { hasError: boolean; error?: string; }
interface EBProps { children: React.ReactNode; }

class ErrorBoundary extends React.Component<EBProps, EBState> {
  constructor(props: EBProps) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error: Error): EBState { return { hasError: true, error: error.message }; }
  componentDidCatch(error: Error) { console.error('[JARVIS] Crash:', error.message); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%', alignItems:'center', justifyContent:'center', gap:16, padding:32, textAlign:'center', background:'#0a0b0f', color:'#e2e8f0' }}>
          <div style={{ fontSize:48 }}>⚠️</div>
          <div style={{ fontSize:18, fontWeight:700 }}>Kuch toot gaya</div>
          {this.state.error && (
            <div style={{ fontSize:11, color:'#6b7280', fontFamily:'monospace', maxWidth:280, wordBreak:'break-word' }}>{this.state.error}</div>
          )}
          <button onClick={() => { this.setState({ hasError:false }); window.location.reload(); }}
            style={{ padding:'10px 24px', background:'#6366f1', borderRadius:12, border:'none', color:'white', fontSize:14, fontWeight:700, cursor:'pointer' }}>
            🔄 Reload JARVIS
          </button>
          <button onClick={() => {
            try {
              // Clear corrupted state
              ['jarvis_last_chat_date','jarvis_cache_weather','jarvis_cache_crypto'].forEach(k => localStorage.removeItem(k));
            } catch {}
            this.setState({ hasError:false });
            window.location.reload();
          }} style={{ fontSize:11, color:'#374151', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>
            Cache clear karke reload karo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function SharedContentHandler() {
  useEffect(() => {
    // Handle content shared via Web Share Target
    try {
      const shared = localStorage.getItem('jarvis_shared_content');
      const params = new URLSearchParams(window.location.search);
      const sharedParam = params.get('shared');
      if (shared && sharedParam === '1') {
        localStorage.removeItem('jarvis_shared_content');
        // Will be picked up by ChatInterface via URL param
      }
    } catch {}
  }, []);
  return null;
}

export default function Home() {
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <ErrorBoundary>
        <SharedContentHandler />
        <div style={{ flex:1, overflow:'hidden', position:'relative' }}>
          <ChatInterface />
        </div>
      </ErrorBoundary>
    </div>
  );
}
