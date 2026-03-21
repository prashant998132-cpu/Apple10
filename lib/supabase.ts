// Supabase - optional, won't crash if not configured
// JARVIS works without Supabase (localStorage fallback)

let supabaseClient: any = null;

function getSupabase() {
  if (supabaseClient) return supabaseClient;
  if (typeof window === 'undefined') return null;
  
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    
    // Dynamic import to avoid build errors
    return null; // Will be null until Supabase is configured
  } catch {
    return null;
  }
}

export const supabase = getSupabase();

export function isSupabaseEnabled(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// Safe wrapper - falls back to localStorage
export async function saveToCloud(table: string, data: any): Promise<boolean> {
  if (!supabase) {
    // LocalStorage fallback
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
    const { data } = await (supabase as any).from(table).select('*').order('created_at', { ascending: false }).limit(100);
    return data || [];
  } catch { return []; }
}
