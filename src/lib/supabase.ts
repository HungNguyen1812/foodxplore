/**
 * Supabase client exports
 *
 * Sử dụng:
 *  - Client component:    import { supabase } from './supabase-browser'
 *  - Server component:   import { supabase } from './supabase-server'
 *  - API routes:         import { createAdminClient } from './supabase'
 *  - Crawler:            import { createAdminClient } from './supabase'
 */

// Admin client cho API routes và crawler (service role — bypass RLS)
import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// Re-export các client từ file riêng
export { createBrowserClient as supabase } from './supabase-browser';
export { createServerSupabaseClient } from './supabase-server';
