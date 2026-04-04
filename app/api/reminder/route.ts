import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// In-memory store (resets on cold start — fine for hobby plan)
const reminders: Map<string, any[]> = new Map();

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id') || 'default';
  return NextResponse.json({ reminders: reminders.get(userId) || [] });
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id') || 'default';
  const body = await req.json();
  const existing = reminders.get(userId) || [];

  if (body.action === 'add') {
    const r = { id: `r_${Date.now()}`, ...body.reminder, created: Date.now() };
    reminders.set(userId, [...existing, r]);
    return NextResponse.json({ ok: true, reminder: r });
  }

  if (body.action === 'delete') {
    reminders.set(userId, existing.filter((r: any) => r.id !== body.id));
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'complete') {
    reminders.set(userId, existing.map((r: any) =>
      r.id === body.id ? { ...r, completed: true, completedAt: Date.now() } : r
    ));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
