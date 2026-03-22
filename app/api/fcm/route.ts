import { NextResponse } from 'next/server';

// Firebase Cloud Messaging - Free push notifications
export async function POST(req: Request) {
  const body = await req.json();
  const { token, title, message, data = {} } = body;

  const fcmKey = process.env.FCM_SERVER_KEY || '';
  const fcmUrl = process.env.FCM_PROJECT_ID
    ? `https://fcm.googleapis.com/v1/projects/${process.env.FCM_PROJECT_ID}/messages:send`
    : 'https://fcm.googleapis.com/fcm/send';

  if (!fcmKey) {
    return NextResponse.json({
      error: 'FCM not configured',
      tip: 'Firebase console → Project Settings → Cloud Messaging → Server Key',
    });
  }

  // Legacy FCM API (simplest, no oauth needed)
  try {
    const r = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${fcmKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        notification: { title: title || 'JARVIS', body: message, icon: '/icons/icon-192.png' },
        data: { ...data, url: '/' },
        priority: 'high',
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (r.ok) {
      const d = await r.json();
      return NextResponse.json({ success: true, messageId: d.message_id });
    }
  } catch {}
  return NextResponse.json({ error: 'FCM send failed' }, { status: 503 });
}

// Subscribe device token
export async function PUT(req: Request) {
  const { token } = await req.json();
  // Store token (in production, save to DB)
  return NextResponse.json({ success: true, token, message: 'Token registered' });
}
