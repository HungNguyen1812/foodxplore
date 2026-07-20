import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('v_hot_articles')
    .select('*')
    .eq('is_crawled', true)
    .order('hot_score', { ascending: false })
    .limit(1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data?.[0] ?? null });
}
