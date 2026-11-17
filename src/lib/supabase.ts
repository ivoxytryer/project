import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

/**
 * Если ключей нет — приложение работает в локальном режиме (localStorage),
 * как раньше. Это удобно для разработки и GitHub Pages без бэкенда.
 */
export const isRemoteEnabled = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isRemoteEnabled
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
