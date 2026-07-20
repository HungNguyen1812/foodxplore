import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import { CategorySidebar } from '@/components/CategorySidebar';
import { ArticleCard } from '@/components/ArticleCard';
import { SidebarRight } from '@/components/SidebarRight';

export const revalidate = 900;

const VALID_CATEGORIES = [
  'kinh-doanh', 'an-toan-thuc-pham', 'gia-ca',
  'cong-nghe', 'quy-dinh', 'suc-khoe', 'nong-nghiep',
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
  const supabase = createServerClient();

  const [categoryRes, articlesRes, categoriesRes, sourcesRes, trendsRes] = await Promise.all([
    supabase.from('categories').select('*').eq('slug', slug).single(),
    supabase.from('v_hot_articles').select('*').eq('category_slug', slug).limit(20),
    supabase.from('categories').select('*').order('id'),
    supabase.from('v_source_stats').select('*').order('article_count', { ascending: false }).limit(7),
    supabase.from('hot_keywords').select('*').eq('is_active', true).order('weight', { ascending: false }).limit(9),
  ]);

  return {
    category: categoryRes.data,
    articles: articlesRes.data ?? [],
    categories: categoriesRes.data ?? [],
    sources: sourcesRes.data ?? [],
    trends: trendsRes.data ?? [],
  };
}

export async function generateStaticParams() {
  return VALID_CATEGORIES.map(slug => ({ category: slug }));
}

interface Props {
  params: { category: string };
}

export default async function CategoryPage({ params }: Props) {
  const { category: slug } = params;

  if (!VALID_CATEGORIES.includes(slug)) {
    notFound();
  }

  const { category, articles, categories, sources, trends } = await getCategoryData(slug);
  const counts: Record<string, number> = {};
  for (const c of categories) counts[c.slug] = c.article_count ?? 0;

  const icon = CAT_ICONS[slug] ?? '📋';
  const catName = category?.name ?? slug;

  return (
    <div className="layout container">
      <CategorySidebar counts={counts} />

      <main className="main-content">
        <p className="section-label">{icon} {catName} nổi bật</p>
        <div className="article-list">
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
          {articles.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-text">Chưa có tin nào trong danh mục này.</div>
            </div>
          )}
        </div>
      </main>

      <SidebarRight sources={sources} trends={trends} categories={categories} />
    </div>
  );
}
