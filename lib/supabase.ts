// Supabase — optional cloud sync
// JARVIS works fully without Supabase (localStorage fallback)

let supabaseClient: any = null;

function getSupabase() {
  if (supabaseClient) return supabaseClient;
  if (typeof window === 'undefined') return null;
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return null;
  } catch { return null; }
}

export const supabase = getSupabase();

export function isSupabaseEnabled(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function syncMessageToCloud(message: {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
  sessionId?: string;
}): Promise<boolean> {
  const entry = {
    ...message,
    timestamp: message.timestamp || Date.now(),
    id: 'msg_' + Date.now(),
  };
  if (!supabase) {
    try {
      const key = 'jarvis_cloud_messages';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push(entry);
      localStorage.setItem(key, JSON.stringify(existing.slice(-500)));
      return true;
    } catch { return false; }
  }
  try {
    await (supabase as any).from('messages').insert(entry);
    return true;
  } catch { return false; }
}

export async function getCloudMessages(limit = 50): Promise<any[]> {
  if (!supabase) {
    try {
      const msgs = JSON.parse(localStorage.getItem('jarvis_cloud_messages') || '[]');
      return msgs.slice(-limit);
    } catch { return []; }
  }
  try {
    const { data } = await (supabase as any).from('messages').select('*')
      .order('timestamp', { ascending: false }).limit(limit);
    return data || [];
  } catch { return []; }
}

export async function saveToCloud(table: string, data: any): Promise<boolean> {
  if (!supabase) {
    try {
      const existing = JSON.parse(localStorage.getItem('jarvis_cloud_' + table) || '[]');
      existing.push({ ...data, id: Date.now(), created_at: new Date().toISOString() });
      localStorage.setItem('jarvis_cloud_' + table, JSON.stringify(existing.slice(-100)));
      return true;
    } catch { return false; }
  }
  try {
    await (supabase as any).from(table).insert(data);
    return true;
  } catch { return false; }
}

export async function getFromCloud(table: string): Promise<any[]> {
  if (!supabase) {
    try { return JSON.parse(localStorage.getItem('jarvis_cloud_' + table) || '[]'); }
    catch { return []; }
  }
  try {
    const { data } = await (supabase as any).from(table).select('*')
      .order('created_at', { ascending: false }).limit(100);
    return data || [];
  } catch { return []; }
}
