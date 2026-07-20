export interface Article {
  id: string;
  title: string;
  summary: string | null;
  content?: string | null;
  content_preview?: string | null;
  original_title?: string | null;
  original_summary?: string | null;
  key_takeaway?: string | null;
  takeaway_model?: string | null;
  takeaway_generated_at?: string | null;
  link: string;
  image_url: string | null;
  image_thumb?: string | null;
  pub_date: string;
  fetched_at?: string;
  hot_score: number;
  is_crawled?: boolean;
  is_read?: boolean;
  is_hot?: boolean;
  language?: string;
  category?: Category | null;
  category_id?: string | null;
  category_slug?: string | null;
  category_name?: string | null;
  source?: Source | null;
  source_id?: string | null;
  source_name?: string | null;
  source_country?: 'vn' | 'intl' | null;
  created_at: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  article_count?: number;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  rss_url?: string;
  feed_url?: string;
  logo_url?: string | null;
  favicon_url?: string | null;
  country: 'vn' | 'intl';
  source_type?: 'news' | 'blog' | 'gov' | 'forum';
  is_active?: boolean;
  article_count?: number;
}

export interface HotKeyword {
  id: string;
  keyword: string;
  weight: number;
  is_active: boolean;
  last_seen: string;
}

export interface CrawlLog {
  id: string;
  source_id: string;
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
