import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'JARVIS AI',
    short_name: 'JARVIS',
    description: 'Your Personal AI — Groq + Gemini + Full Phone Access',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#6366f1',
    background_color: '#0a0b0f',
    lang: 'hi-IN',
    categories: ['productivity', 'utilities', 'lifestyle'],
    icons: [
      { src: '/icons/icon-72.png',      sizes: '72x72',   type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-96.png',      sizes: '96x96',   type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-128.png',     sizes: '128x128', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-144.png',     sizes: '144x144', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-152.png',     sizes: '152x152', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-192.png',     sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-384.png',     sizes: '384x384', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png',     sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Naya Chat',  short_name: 'Chat',    url: '/?new=1',      icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }] },
      { name: 'Mausam',     short_name: 'Weather', url: '/?q=weather',  icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }] },
      { name: 'Cricket',    short_name: 'Cricket', url: '/?q=cricket',  icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }] },
    ],
    screenshots: [
      { src: '/screenshots/screen1.png', sizes: '540x960', type: 'image/png', label: 'JARVIS Chat Interface' } as any,
    ],
    prefer_related_applications: false,
    id: 'jarvis-ai-prashant-maihar',
  };
}
