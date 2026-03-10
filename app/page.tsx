'use client';
import React, { Component } from 'react';
import ChatInterface from '@/components/chat/ChatInterface';

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', alignItems:'center', justifyContent:'center', gap:16, padding:32, textAlign:'center' }}>
        <div style={{ fontSize:40 }}>⚠️</div>
        <div style={{ fontSize:18, fontWeight:700 }}>Kuch galat ho gaya</div>
        <button onClick={() => window.location.reload()} style={{ padding:'8px 20px', background:'#2563eb', borderRadius:12, border:'none', color:'white', fontSize:14, cursor:'pointer' }}>
          Reload karo
        </button>
      </div>
    );
    return this.props.children;
  }
}

export default function Home() {
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <ErrorBoundary>
        <div style={{ flex:1, overflow:'hidden', position:'relative' }}>
          <ChatInterface />
        </div>
      </ErrorBoundary>
    </div>
  );
}
