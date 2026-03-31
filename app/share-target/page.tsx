'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ShareHandler() {
  const router  = useRouter();
  const params  = useSearchParams();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const title    = params.get('title') || '';
    const text     = params.get('text')  || '';
    const url      = params.get('url')   || '';
    const combined = [title, text, url].filter(Boolean).join(' — ');
    if (combined) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('jarvis_shared_content', combined);
      }
      setStatus('JARVIS mein bhej raha hoon...');
      setTimeout(() => router.push('/?shared=1'), 600);
    } else {
      setStatus('Kuch nahi mila — home pe jao');
      setTimeout(() => router.push('/'), 1500);
    }
  }, [params, router]);

  return (
    <div style={{ minHeight: '100vh', background: '#070810', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 40 }}>{'⚡'}</div>
      <div style={{ color: '#22d3ee', fontWeight: 800, fontSize: 15 }}>JARVIS</div>
      <div style={{ color: '#6b7280', fontSize: 12 }}>{status}</div>
    </div>
  );
}

export default function ShareTargetPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', background:'#070810', display:'flex', alignItems:'center', justifyContent:'center', color:'#22d3ee' }}>{'⚡'} Loading...</div>}>
      <ShareHandler />
    </Suspense>
  );
}
