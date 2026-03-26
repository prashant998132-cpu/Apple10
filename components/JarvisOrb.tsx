'use client';

interface JarvisOrbProps {
  loading?: boolean;
  listening?: boolean;
  size?: number;
}

export default function JarvisOrb({ loading = false, listening = false, size = 48 }: JarvisOrbProps) {
  const bg = loading
    ? 'radial-gradient(circle, #6366f1, #4f46e5)'
    : listening
    ? 'radial-gradient(circle, #22d3ee, #0891b2)'
    : 'radial-gradient(circle, #6366f1 0%, #1e1b4b 100%)';

  const shadow = loading
    ? '0 0 20px rgba(99,102,241,0.6)'
    : listening
    ? '0 0 20px rgba(34,211,238,0.6)'
    : '0 0 12px rgba(99,102,241,0.3)';

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, boxShadow: shadow,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, transition: 'all 0.3s ease', flexShrink: 0,
      animation: loading ? 'orbPulse 1.5s ease-in-out infinite' : 'none',
    }}>
      <style>{`@keyframes orbPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}`}</style>
      {listening ? '🎤' : loading ? '⚡' : '🤖'}
    </div>
  );
}
