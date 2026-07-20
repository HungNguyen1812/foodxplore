import { Suspense } from 'react';
import { createServerClient } from '@/lib/supabase';
import { CategorySidebar } from '@/components/CategorySidebar';
import { ArticleCard } from '@/components/ArticleCard';
import { HotBanner } from '@/components/HotBanner';
import { SidebarRight } from '@/components/SidebarRight';

// ISR: revalidate mỗi 15 phút
export const revalidate = 900;

async function getHomeData() {
  const supabase = createServerClient();

  const [articlesRes, categoriesRes, sourcesRes, trendsRes] = await Promise.all([
    supabase
      .from('v_hot_articles')
      .select('*')
      .limit(20),
    supabase.from('categories').select('*').order('id'),
    supabase
      .from('v_source_stats')
      .select('*')
      .order('article_count', { ascending: false })
      .limit(7),
    supabase.from('hot_keywords').select('*').eq('is_active', true).order('weight', { ascending: false }).limit(9),
  ]);

  return {
    articles: articlesRes.data ?? [],
    categories: categoriesRes.data ?? [],
    sources: sourcesRes.data ?? [],
    trends: trendsRes.data ?? [],
  };
}

export default async function HomePage() {
  const { articles, categories, sources, trends } = await getHomeData();

  const counts: Record<string, number> = {};
  for (const cat of categories) {
    counts[cat.slug] = cat.article_count ?? 0;
  }

  const featured = articles[0];
  const rest = articles.slice(1, 14);

  return (
    <div className="layout container">
      <CategorySidebar counts={counts} />

      <main className="main-content">
        {featured && (
          <>
            <HotBanner article={featured} />
            <p className="section-label">🔥 Nổi bật</p>
            <ArticleCard article={featured} variant="featured" />
          </>
        )}

        <p className="section-label">📋 Tin mới nhất</p>
        <Suspense fallback={<div className="article-list"><ArticleSkeleton /></div>}>
          <div className="article-list">
            {rest.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </Suspense>
      </main>

      <SidebarRight sources={sources} trends={trends} categories={categories} />
    </div>
  );
}

function ArticleSkeleton() {
  return (
    <>
      {[1, 2, 3].map(i => (
        <div key={i} className="article-card" style={{ minHeight: 100, opacity: 0.4 }} />
      ))}
    </>
  );
}
