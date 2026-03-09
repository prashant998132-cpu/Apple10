'use client';
import React, { Component, useEffect, useState } from 'react';
import ChatInterface from '@/components/chat/ChatInterface';

// Matrix boot animation
function MatrixBoot({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const canvas = document.getElementById('matrix-canvas') as HTMLCanvasElement;
    if (!canvas) { onDone(); return; }
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const chars = 'JARVIS01アイウエオカキクケコ∑∆∇∂∫';
    const fontSize = 12;
    const cols = Math.floor(canvas.width / fontSize);
    const drops = Array(cols).fill(1);
    let frame = 0;
    const messages = ['INITIALIZING JARVIS...', 'LOADING AI MODELS...', 'READY ✓'];
    let msgIdx = 0;
    const interval = setInterval(() => {
      ctx.fillStyle = 'rgba(10,11,15,0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#3b82f6';
      ctx.font = `${fontSize}px monospace`;
      drops.forEach((y, i) => {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, y * fontSize);
        if (y * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
      if (frame % 30 === 0 && msgIdx < messages.length) {
        ctx.fillStyle = 'rgba(10,11,15,0.8)';
        ctx.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(messages[msgIdx], canvas.width / 2, canvas.height / 2);
        msgIdx++;
      }
      frame++;
      if (frame > 90) { clearInterval(interval); onDone(); }
    }, 33);
    return () => clearInterval(interval);
  }, []);
  return <canvas id="matrix-canvas" style={{ display: 'block', width: '100%', height: '100%' }} />;
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Kuch galat ho gaya</div>
        <button onClick={() => window.location.reload()} style={{ padding: '8px 20px', background: '#2563eb', borderRadius: 12, border: 'none', color: 'white', fontSize: 14, cursor: 'pointer' }}>Reload karo</button>
      </div>
    );
    return this.props.children;
  }
}

export default function Home() {
  const [booted, setBooted] = useState(false);

  return (
    // Full height, no extra header at all
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {!booted && <MatrixBoot onDone={() => setBooted(true)} />}
      {booted && (
        <ErrorBoundary>
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            <ChatInterface />
          </div>
        </ErrorBoundary>
      )}
    </div>
  );
}
