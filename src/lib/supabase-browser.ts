import { createBrowserClient } from '@supabase/ssr';

/**
 * Client-side Supabase client — dùng trong React components (CSR).
 * Tự động refresh session khi token hết hạn.
 */
export function createBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
