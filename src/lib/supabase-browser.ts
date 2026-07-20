import {
  createBrowserClient as createSupabaseBrowserClient,
} from '@supabase/ssr';

/**
 * Client-side Supabase client — dùng trong React components (CSR).
 * Tự động refresh session khi token hết hạn.
 */
export function createBrowserClient() {
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}