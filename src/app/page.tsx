import { Suspense } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { CategorySidebar } from '@/components/CategorySidebar';
import { ArticleCard } from '@/components/ArticleCard';
import { HotBanner } from '@/components/HotBanner';
import { SidebarRight } from '@/components/SidebarRight';

// ISR: cập nhật lại dữ liệu sau mỗi 15 phút
export const revalidate = 900;

interface HomePageProps {
  searchParams?: {
    q?: string;
  };
}

async function getHomeData(keyword = '') {
  const supabase = await createServerSupabaseClient();

  let articlesQuery = supabase
    .from('articles')
    .select('*')
    .eq('is_archived', false)
    .order('hot_score', { ascending: false });

  // Loại bỏ các ký tự có thể làm sai cú pháp truy vấn PostgREST
  const safeKeyword = keyword
    .replace(/[%,()]/g, ' ')
    .trim();

  if (safeKeyword) {
    articlesQuery = articlesQuery.or(
      `title.ilike.%${safeKeyword}%,summary.ilike.%${safeKeyword}%`
    );
  }

  const [
    articlesRes,
    categoriesRes,
    articleCountsRes,
    sourcesRes,
    trendsRes,
  ] = await Promise.all([
    // Supabase mặc định giới hạn kết quả. Lấy trực tiếp đủ bài đang hoạt động.
    articlesQuery.limit(500),

    supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true }),

    supabase
      .from('articles')
      .select('category_slug')
      .eq('is_archived', false)
      .limit(1000),

    supabase
      .from('v_source_stats')
      .select('*')
      .order('article_count', { ascending: false })
      .limit(7),

    supabase
      .from('hot_keywords')
      .select('*')
      .eq('is_active', true)
      .order('weight', { ascending: false })
      .limit(9),
  ]);

  return {
    articles: articlesRes.data ?? [],
    categories: categoriesRes.data ?? [],
    articleCountRows: articleCountsRes.data ?? [],
    sources: sourcesRes.data ?? [],
    trends: trendsRes.data ?? [],
  };
}

export default async function HomePage({
  searchParams,
}: HomePageProps) {
  const searchQuery =
    typeof searchParams?.q === 'string'
      ? searchParams.q.trim()
      : '';

  const {
    articles,
    categories,
    articleCountRows,
    sources,
    trends,
  } = await getHomeData(searchQuery);

  const counts: Record<string, number> = {};

  counts['tong-hop'] = articleCountRows.length;

  for (const row of articleCountRows) {
    const slug = row.category_slug;

    if (slug && slug !== 'tong-hop') {
      counts[slug] = (counts[slug] ?? 0) + 1;
    }
  }

  // Khi tìm kiếm, hiển thị tất cả kết quả dưới dạng danh sách.
  // Khi không tìm kiếm, bài đầu tiên được dùng làm bài nổi bật.
  const featured = searchQuery ? undefined : articles[0];
  const articleList = searchQuery
    ? articles
    : articles.slice(1);

  return (
    <div className="layout container">
      <CategorySidebar counts={counts} />

      <main className="main-content">
        {featured && (
          <>
            <HotBanner article={featured} />

            <p className="section-label">
              🔥 Nổi bật
            </p>

            <ArticleCard
              article={featured}
              variant="featured"
            />
          </>
        )}

        <p className="section-label">
          {searchQuery
            ? `🔍 Kết quả tìm kiếm cho “${searchQuery}” (${articles.length})`
            : '📋 Tin mới nhất'}
        </p>

        <Suspense
          fallback={
            <div className="article-list">
              <ArticleSkeleton />
            </div>
          }
        >
          <div className="article-list">
            {articleList.length > 0 ? (
              articleList.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                />
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  🔎
                </div>

                <div className="empty-state-text">
                  {searchQuery
                    ? `Không tìm thấy bài viết phù hợp với “${searchQuery}”.`
                    : 'Chưa có bài viết nào.'}
                </div>
              </div>
            )}
          </div>
        </Suspense>
      </main>

      <SidebarRight
        sources={sources}
        trends={trends}
        categories={categories}
      />
    </div>
  );
}

function ArticleSkeleton() {
  return (
    <>
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="article-card"
          style={{
            minHeight: 100,
            opacity: 0.4,
          }}
        />
      ))}
    </>
  );
}
