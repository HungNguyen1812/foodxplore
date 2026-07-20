import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { CategorySidebar } from '@/components/CategorySidebar';
import { ArticleCard } from '@/components/ArticleCard';
import { SidebarRight } from '@/components/SidebarRight';

export const revalidate = 300;

const VALID_CATEGORIES = [
  'kinh-doanh',
  'an-toan-thuc-pham',
  'gia-ca',
  'cong-nghe',
  'quy-dinh',
  'suc-khoe',
  'nong-nghiep',
];

const CAT_ICONS: Record<string, string> = {
  'kinh-doanh': '💼',
  'an-toan-thuc-pham': '🛡️',
  'gia-ca': '📊',
  'cong-nghe': '⚡',
  'quy-dinh': '📜',
  'suc-khoe': '🥗',
  'nong-nghiep': '🌾',
};

async function getCategoryData(slug: string) {
  const supabase = await createServerSupabaseClient();

  const [
    categoryRes,
    articlesRes,
    categoriesRes,
    sourcesRes,
    trendsRes,
  ] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single(),

    // Đọc trực tiếp bảng articles, không dùng view giới hạn 20 bài
    supabase
      .from('articles')
      .select('*')
      .eq('category_slug', slug)
      .eq('is_archived', false)
      .order('pub_date', { ascending: false })
      .limit(100),

    supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true }),

    supabase
      .from('v_source_stats')
      .select('*')
      .gt('article_count', 0)
      .order('article_count', { ascending: false })
      .limit(7),

    supabase
      .from('hot_keywords')
      .select('*')
      .eq('is_active', true)
      .order('weight', { ascending: false })
      .limit(9),
  ]);

  const articles = (articlesRes.data ?? []).map((article) => ({
    ...article,

    category: {
      id: article.category_id,
      slug: article.category_slug,
      name: article.category_name,
    },

    source: {
      id: article.source_id,
      name: article.source_name,
      country: article.source_country,
    },
  }));

  return {
    category: categoryRes.data,
    articles,
    categories: categoriesRes.data ?? [],
    sources: sourcesRes.data ?? [],
    trends: trendsRes.data ?? [],
  };
}

export async function generateStaticParams() {
  return VALID_CATEGORIES.map((slug) => ({
    category: slug,
  }));
}

interface Props {
  params: {
    category: string;
  };
}

export default async function CategoryPage({
  params,
}: Props) {
  const slug = params.category;

  if (!VALID_CATEGORIES.includes(slug)) {
    notFound();
  }

  const {
    category,
    articles,
    categories,
    sources,
    trends,
  } = await getCategoryData(slug);

  const counts: Record<string, number> = {};

  for (const item of categories) {
    counts[item.slug] = item.article_count ?? 0;
  }

  const icon = CAT_ICONS[slug] ?? '📋';
  const categoryName = category?.name ?? slug;

  return (
    <div className="layout container">
      <CategorySidebar counts={counts} />

      <main className="main-content">
        <p className="section-label">
          {icon} {categoryName} ({articles.length})
        </p>

        <div className="article-list">
          {articles.length > 0 ? (
            articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
              />
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                📭
              </div>

              <div className="empty-state-text">
                Chưa có tin nào trong danh mục này.
              </div>
            </div>
          )}
        </div>
      </main>

      <SidebarRight
        sources={sources}
        trends={trends}
        categories={categories}
      />
    </div>
  );
}