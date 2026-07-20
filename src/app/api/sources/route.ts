import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('v_source_stats')
    .select('*')
    .order('article_count', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}


