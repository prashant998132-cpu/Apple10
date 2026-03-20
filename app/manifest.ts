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
      { src: '/icons/icon-72.png',  sizes: '72x72',   type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-96.png',  sizes: '96x96',   type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-128.png', sizes: '128x128', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-144.png', sizes: '144x144', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-152.png', sizes: '152x152', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-384.png', sizes: '384x384', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Naya Chat',
        short_name: 'Chat',
        description: 'Naya conversation shuru karo',
        url: '/?new=1',
        icons: [{ src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' }],
      },
      {
        name: 'Mausam',
        short_name: 'Weather',
        description: 'Aaj ka mausam',
        url: '/?q=weather',
        icons: [{ src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' }],
      },
      {
        name: 'Cricket',
        short_name: 'Cricket',
        description: 'Live cricket scores',
        url: '/?q=cricket',
        icons: [{ src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' }],
      },
    ],
    screenshots: [
      {
        src: '/screenshots/screen1.png',
        sizes: '540x960',
        type: 'image/png',
        // @ts-ignore — form_factor not in MetadataRoute.Manifest yet
        form_factor: 'narrow',
        label: 'JARVIS Chat Interface',
      },
    ],
    prefer_related_applications: false,
    related_applications: [],
    // @ts-ignore — share_target not in MetadataRoute.Manifest yet
    share_target: {
      action: '/share-target',
      method: 'POST',
      enctype: 'multipart/form-data',
      params: { title: 'title', text: 'text', url: 'url' },
    },
    id: 'jarvis-ai-prashant',
    // @ts-ignore
    iarc_rating_id: 'e84b072d-71b3-4d3e-86ae-31a8ce4e53b7',
    display_override: ['standalone', 'minimal-ui'],
    scope_extensions: [{ origin: 'https://apple10.vercel.app' }],
  };
}
