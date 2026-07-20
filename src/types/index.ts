export interface Article {
  id: number;
  title: string;
  summary: string | null;
  content: string | null;
  link: string;
  image_url: string | null;
  pub_date: string;
  hot_score: number;
  is_crawled: boolean;
  is_read: boolean;
  category: Category;
  category_id: number;
  source: Source;
  source_id: number;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
  article_count?: number;
}

export interface Source {
  id: number;
  name: string;
  url: string;
  rss_url: string;
  logo_url: string | null;
  country: 'vn' | 'intl';
  source_type: 'news' | 'blog' | 'gov' | 'forum';
  is_active: boolean;
  article_count?: number;
}

export interface HotKeyword {
  id: number;
  keyword: string;
  weight: number;
  is_active: boolean;
  last_seen: string;
}

export interface CrawlLog {
  id: number;
  source_id: number;
  status: 'success' | 'partial' | 'failed';
  articles_found: number;
  articles_saved: number;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
}

export interface ArticleFilters {
  category?: string;
  source?: string;
  keyword?: string;
  page?: number;
  limit?: number;
  sort?: 'hot' | 'newest';
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
