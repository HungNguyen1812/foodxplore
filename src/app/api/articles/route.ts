import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = req.nextUrl;

  const category = searchParams.get('category');
  const source = searchParams.get('source');
  const keyword = searchParams.get('keyword');
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '15', 10), 50);
  const sort = searchParams.get('sort') ?? 'hot';
  const offset = (page - 1) * limit;

  let query = supabase
    .from('v_hot_articles')
    .select('*', { count: 'exact' });

  if (category && category !== 'tong-hop') {
    query = query.eq('category_slug', category);
  }
  if (source) {
    query = query.eq('source_id', parseInt(source, 10));
  }
  if (keyword) {
    query = query.or(`title.ilike.%${keyword}%,summary.ilike.%${keyword}%`);
  }

  if (sort === 'newest') {
    query = query.order('pub_date', { ascending: false });
  } else {
    query = query.order('hot_score', { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
}


