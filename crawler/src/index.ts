#!/usr/bin/env tsx

import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// CẤU HÌNH
// ============================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY'
  );
  process.exit(1);
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const parser: Parser<Record<string, unknown>, Record<string, unknown>> =
  new Parser({
    timeout: 20000,
    headers: {
      'User-Agent':
        'foodpluse RSS Crawler/1.0',
    },
    customFields: {
      item: [
        ['media:content', 'mediaContent'],
        ['media:thumbnail', 'mediaThumbnail'],
        ['content:encoded', 'contentEncoded'],
        ['description', 'description'],
      ],
    },
  });

// ============================================================
// KIỂU DỮ LIỆU
// ============================================================

interface Source {
  id: string;
  name: string;
  feed_url: string;
  country: string;
  credibility_score: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface HotKeyword {
  keyword: string;
  weight: number;
}

interface CrawlResult {
  sourceId: string;
  sourceName: string;
  status: 'success' | 'partial' | 'error';
  articlesFound: number;
  articlesSaved: number;
  duplicates: number;
  skipped: number;
  durationMs: number;
  errorMessage?: string;
}

// ============================================================
// TỪ KHÓA LIÊN QUAN ĐẾN THỰC PHẨM
// ============================================================

const FOOD_KEYWORDS = [
  'thực phẩm',
  'an toàn thực phẩm',
  'đồ ăn',
  'ăn uống',
  'dinh dưỡng',
  'lương thực',
  'nông sản',
  'nông nghiệp',
  'nguyên liệu',
  'phụ gia',
  'chất bảo quản',
  'đồ uống',
  'nước giải khát',
  'sữa',
  'thịt',
  'thủy sản',
  'hải sản',
  'gạo',
  'cà phê',
  'hạt điều',
  'hạt tiêu',
  'rau',
  'trái cây',
  'bánh',
  'rượu',
  'bia',
  'nhà hàng',
  'chế biến',
  'xuất khẩu nông sản',
  'food',
  'food safety',
  'beverage',
  'nutrition',
  'ingredient',
  'additive',
  'dairy',
  'meat',
  'seafood',
  'rice',
  'coffee',
  'agriculture',
  'restaurant',
  'processing',
  'recall',
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'an-toan-thuc-pham': [
    'an toàn thực phẩm',
    'ngộ độc',
    'thu hồi',
    'recall',
    'chất cấm',
    'độc hại',
    'vi phạm',
    'hàng giả',
    'kiểm nghiệm',
    'food safety',
    'salmonella',
    'listeria',
    'e. coli',
  ],

  'kinh-doanh': [
    'kinh doanh',
    'doanh nghiệp',
    'đầu tư',
    'doanh thu',
    'lợi nhuận',
    'm&a',
    'sáp nhập',
    'mua lại',
    'thị phần',
    'công ty',
    'tập đoàn',
    'nhà máy',
    'startup',
    'revenue',
    'profit',
    'investment',
  ],

  'gia-ca': [
    'giá',
    'tăng giá',
    'giảm giá',
    'xuất khẩu',
    'nhập khẩu',
    'thị trường',
    'gạo',
    'cà phê',
    'hạt tiêu',
    'thủy sản',
    'price',
    'export',
    'import',
    'inflation',
  ],

  'cong-nghe': [
    'công nghệ',
    'đổi mới',
    'sáng tạo',
    'tự động hóa',
    'robot',
    'trí tuệ nhân tạo',
    'bao bì',
    'chế biến',
    'food tech',
    'technology',
    'innovation',
    'automation',
    'packaging',
    'processing',
  ],

  'quy-dinh': [
    'quy định',
    'chính sách',
    'nghị định',
    'thông tư',
    'tiêu chuẩn',
    'chứng nhận',
    'bộ y tế',
    'fda',
    'efsa',
    'regulation',
    'policy',
    'standard',
    'certification',
  ],

  'suc-khoe': [
    'sức khỏe',
    'dinh dưỡng',
    'vitamin',
    'protein',
    'chế độ ăn',
    'giảm cân',
    'béo phì',
    'tiểu đường',
    'thực phẩm chức năng',
    'nutrition',
    'health',
    'supplement',
    'organic',
    'plant-based',
  ],

  'nong-nghiep': [
    'nông nghiệp',
    'nông sản',
    'trang trại',
    'chăn nuôi',
    'nuôi trồng',
    'thu hoạch',
    'mùa vụ',
    'vùng nguyên liệu',
    'agriculture',
    'farm',
    'livestock',
    'aquaculture',
    'harvest',
    'crop',
  ],
};

const CATEGORY_NAMES: Record<string, string> = {
  'tong-hop': 'Tổng hợp',
  'kinh-doanh': 'Kinh doanh',
  'an-toan-thuc-pham': 'An toàn thực phẩm',
  'gia-ca': 'Giá cả & Xuất nhập khẩu',
  'cong-nghe': 'Công nghệ & Đổi mới',
  'quy-dinh': 'Quy định & Chính sách',
  'suc-khoe': 'Sức khỏe & Dinh dưỡng',
  'nong-nghiep': 'Nông nghiệp & Chuỗi cung ứng',
};

// ============================================================
// HÀM HỖ TRỢ
// ============================================================

function cleanText(value: unknown): string {
  if (!value) {
    return '';
  }

  const html = String(value);
  const $ = cheerio.load(html);

  return $.text()
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeUrl(value: unknown): string {
  if (!value) {
    return '';
  }

  return String(value)
    .trim()
    .replace(/\s+/g, '');
}

function parseDate(value: unknown): string {
  if (!value) {
    return new Date().toISOString();
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

function getMediaUrl(value: unknown): string | null {
  if (!value) {
    return null;
  }

  const mediaItems = Array.isArray(value)
    ? value
    : [value];

  for (const mediaItem of mediaItems) {
    if (
      typeof mediaItem !== 'object' ||
      mediaItem === null
    ) {
      continue;
    }

    const item = mediaItem as Record<string, unknown>;
    const attributes =
      typeof item.$ === 'object' && item.$ !== null
        ? (item.$ as Record<string, unknown>)
        : item;

    const url =
      attributes.url ??
      attributes.href ??
      item.url;

    if (typeof url === 'string' && url.startsWith('http')) {
      return url;
    }
  }

  return null;
}

function extractImage(
  item: Record<string, unknown>
): string | null {
  const mediaContentUrl = getMediaUrl(
    item.mediaContent
  );

  if (mediaContentUrl) {
    return mediaContentUrl;
  }

  const mediaThumbnailUrl = getMediaUrl(
    item.mediaThumbnail
  );

  if (mediaThumbnailUrl) {
    return mediaThumbnailUrl;
  }

  if (
    typeof item.enclosure === 'object' &&
    item.enclosure !== null
  ) {
    const enclosure =
      item.enclosure as Record<string, unknown>;

    if (
      typeof enclosure.url === 'string' &&
      enclosure.url.startsWith('http')
    ) {
      return enclosure.url;
    }
  }

  const rawContent = String(
    item.contentEncoded ??
    item.content ??
    item.description ??
    item.summary ??
    ''
  );

  const $ = cheerio.load(rawContent);
  const imageUrl =
    $('img').first().attr('src') ??
    $('img').first().attr('data-src') ??
    $('img').first().attr('data-original');

  return imageUrl?.startsWith('http')
    ? imageUrl
    : null;
}

function isFoodRelated(
  title: string,
  summary: string
): boolean {
  const text = `${title} ${summary}`.toLowerCase();

  return FOOD_KEYWORDS.some((keyword) =>
    text.includes(keyword.toLowerCase())
  );
}

function classifyCategory(
  title: string,
  summary: string,
  categories: Category[]
): Category {
  const text = `${title} ${summary}`.toLowerCase();

  let bestSlug = 'tong-hop';
  let bestScore = 0;

  for (const [slug, keywords] of Object.entries(
    CATEGORY_KEYWORDS
  )) {
    let score = 0;

    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestSlug = slug;
    }
  }

  const matchedCategory = categories.find(
    (category) => category.slug === bestSlug
  );

  if (matchedCategory) {
    return matchedCategory;
  }

  const fallbackCategory = categories.find(
    (category) => category.slug === 'tong-hop'
  );

  if (fallbackCategory) {
    return fallbackCategory;
  }

  return {
    id: '',
    slug: bestSlug,
    name: CATEGORY_NAMES[bestSlug] ?? 'Tổng hợp',
  };
}

function calculateHotScore(
  credibilityScore: number,
  pubDate: string,
  title: string,
  summary: string,
  hotKeywords: HotKeyword[]
): number {
  const sourceScore =
    Math.min(Math.max(credibilityScore || 5, 1), 10) * 5;

  const publishedTime = new Date(pubDate).getTime();
  const ageHours = Math.max(
    0,
    (Date.now() - publishedTime) /
      (1000 * 60 * 60)
  );

  const timeScore = Math.max(
    0,
    50 - ageHours / 2
  );

  const text = `${title} ${summary}`.toLowerCase();
  let keywordScore = 0;

  for (const hotKeyword of hotKeywords) {
    if (
      text.includes(
        hotKeyword.keyword.toLowerCase()
      )
    ) {
      keywordScore += hotKeyword.weight;
    }
  }

  keywordScore = Math.min(keywordScore, 20);

  return Number(
    (
      sourceScore +
      timeScore +
      keywordScore
    ).toFixed(2)
  );
}

async function articleExists(
  link: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from('articles')
    .select('id', {
      count: 'exact',
      head: true,
    })
    .eq('link', link);

  if (error) {
    throw new Error(
      `Không kiểm tra được bài trùng: ${error.message}`
    );
  }

  return (count ?? 0) > 0;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

// ============================================================
// ĐỌC DỮ LIỆU CẤU HÌNH
// ============================================================

async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    throw new Error(
      `Không đọc được danh mục: ${error.message}`
    );
  }

  return (data ?? []) as Category[];
}

async function getSources(): Promise<Source[]> {
  const { data, error } = await supabase
    .from('sources')
    .select(
      'id, name, feed_url, country, credibility_score'
    )
    .eq('is_active', true)
    .not('feed_url', 'is', null);

  if (error) {
    throw new Error(
      `Không đọc được nguồn RSS: ${error.message}`
    );
  }

  return (data ?? []) as Source[];
}

async function getHotKeywords(): Promise<HotKeyword[]> {
  const { data, error } = await supabase
    .from('hot_keywords')
    .select('keyword, weight')
    .eq('is_active', true);

  if (error) {
    console.warn(
      `Không đọc được từ khóa nóng: ${error.message}`
    );

    return [];
  }

  return (data ?? []) as HotKeyword[];
}

// ============================================================
// THU THẬP TIN TỪ MỘT NGUỒN
// ============================================================

async function crawlSource(
  source: Source,
  categories: Category[],
  hotKeywords: HotKeyword[]
): Promise<CrawlResult> {
  const startedAt = Date.now();

  let articlesFound = 0;
  let articlesSaved = 0;
  let duplicates = 0;
  let skipped = 0;
  let insertErrors = 0;

  try {
    console.log(`\nĐang đọc: ${source.name}`);
    console.log(`RSS: ${source.feed_url}`);

    const feed = await parser.parseURL(
      source.feed_url
    );

    const items = (feed.items ?? []).slice(0, 40);

    for (const rawItem of items) {
      const item =
        rawItem as Record<string, unknown>;

      const title = cleanText(item.title);
      const link = normalizeUrl(
        item.link ?? item.guid
      );

      if (!title || !link) {
        skipped += 1;
        continue;
      }

      articlesFound += 1;

      const summary = cleanText(
        item.contentSnippet ??
        item.summary ??
        item.description ??
        item.content ??
        item.contentEncoded ??
        ''
      ).slice(0, 500);

      if (!isFoodRelated(title, summary)) {
        skipped += 1;
        continue;
      }

      if (await articleExists(link)) {
        duplicates += 1;
        continue;
      }

      const category = classifyCategory(
        title,
        summary,
        categories
      );

      const pubDate = parseDate(
        item.isoDate ??
        item.pubDate ??
        item.published ??
        item.date
      );

      const imageUrl = extractImage(item);

      const hotScore = calculateHotScore(
        source.credibility_score,
        pubDate,
        title,
        summary,
        hotKeywords
      );

      const isHot = hotScore >= 75;

      const { error } = await supabase
        .from('articles')
        .insert({
          title,
          link,
          summary,
          image_url: imageUrl,
          pub_date: pubDate,

          source_id: source.id,
          source_name: source.name,
          source_country: source.country,

          category_id: category.id || null,
          category_slug: category.slug,
          category_name: category.name,

          hot_score: hotScore,
          is_hot: isHot,

          language: 'vi',
          is_crawled: true,
          is_processed: true,
          is_archived: false,
        });

      if (error) {
        if (error.code === '23505') {
          duplicates += 1;
        } else {
          insertErrors += 1;

          console.error(
            `Không lưu được "${title}": ${error.message}`
          );
        }
      } else {
        articlesSaved += 1;

        console.log(
          `Đã lưu: ${title}`
        );
      }
    }

    await supabase
      .from('sources')
      .update({
        last_fetched: new Date().toISOString(),
      })
      .eq('id', source.id);

    const status: CrawlResult['status'] =
      insertErrors > 0 ? 'partial' : 'success';

    return {
      sourceId: source.id,
      sourceName: source.name,
      status,
      articlesFound,
      articlesSaved,
      duplicates,
      skipped,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    console.error(
      `Nguồn ${source.name} bị lỗi: ${errorMessage}`
    );

    return {
      sourceId: source.id,
      sourceName: source.name,
      status: 'error',
      articlesFound,
      articlesSaved,
      duplicates,
      skipped,
      durationMs: Date.now() - startedAt,
      errorMessage,
    };
  }
}

// ============================================================
// GHI NHẬT KÝ
// ============================================================

async function saveCrawlLog(
  result: CrawlResult
): Promise<void> {
  const { error } = await supabase
    .from('crawl_logs')
    .insert({
      feed_id: result.sourceId,
      feed_name: result.sourceName,
      status: result.status,
      articles_fetched: result.articlesFound,
      articles_new: result.articlesSaved,
      articles_duplicates: result.duplicates,
      completed_at: new Date().toISOString(),
      duration_ms: result.durationMs,
      error_message:
        result.errorMessage ?? null,
    });

  if (error) {
    console.error(
      `Không ghi được crawl log: ${error.message}`
    );
  }
}

// ============================================================
// CẬP NHẬT SỐ LƯỢNG BÀI
// ============================================================

async function updateCounts(): Promise<void> {
  const { data: categories, error } =
    await supabase
      .from('categories')
      .select('id');

  if (error || !categories) {
    return;
  }

  for (const category of categories) {
    const { count } = await supabase
      .from('articles')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('category_id', category.id)
      .eq('is_archived', false);

    await supabase
      .from('categories')
      .update({
        article_count: count ?? 0,
      })
      .eq('id', category.id);
  }

  const { data: sources } = await supabase
    .from('sources')
    .select('id');

  if (!sources) {
    return;
  }

  for (const source of sources) {
    const { count } = await supabase
      .from('articles')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('source_id', source.id)
      .eq('is_archived', false);

    await supabase
      .from('sources')
      .update({
        articles_count: count ?? 0,
      })
      .eq('id', source.id);
  }
}

// ============================================================
// CHẠY CRAWLER
// ============================================================

async function main(): Promise<void> {
  console.log('');
  console.log('foodpluse RSS Crawler bắt đầu');
  console.log(
    `Thời gian: ${new Date().toLocaleString(
      'vi-VN',
      {
        timeZone: 'Asia/Ho_Chi_Minh',
      }
    )}`
  );

  const [
    categories,
    sources,
    hotKeywords,
  ] = await Promise.all([
    getCategories(),
    getSources(),
    getHotKeywords(),
  ]);

  console.log(
    `${sources.length} nguồn RSS, ` +
    `${categories.length} danh mục, ` +
    `${hotKeywords.length} từ khóa nóng`
  );

  if (sources.length === 0) {
    throw new Error(
      'Không có nguồn nào chứa feed_url.'
    );
  }

  const results: CrawlResult[] = [];

  for (const source of sources) {
    const result = await crawlSource(
      source,
      categories,
      hotKeywords
    );

    results.push(result);
    await saveCrawlLog(result);

    // Nghỉ giữa các nguồn để tránh bị chặn
    await wait(1500);
  }

  await updateCounts();

  const totalFound = results.reduce(
    (total, result) =>
      total + result.articlesFound,
    0
  );

  const totalSaved = results.reduce(
    (total, result) =>
      total + result.articlesSaved,
    0
  );

  const totalDuplicates = results.reduce(
    (total, result) =>
      total + result.duplicates,
    0
  );

  const totalSkipped = results.reduce(
    (total, result) =>
      total + result.skipped,
    0
  );

  const totalErrors = results.filter(
    (result) => result.status === 'error'
  ).length;

  console.log('');
  console.log('==============================');
  console.log('KẾT QUẢ CRAWLER');
  console.log(`Tìm thấy: ${totalFound}`);
  console.log(`Đã lưu: ${totalSaved}`);
  console.log(`Bị trùng: ${totalDuplicates}`);
  console.log(`Không liên quan: ${totalSkipped}`);
  console.log(`Nguồn lỗi: ${totalErrors}`);
  console.log('==============================');

  if (totalErrors === sources.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('');
  console.error(
    'Crawler thất bại:',
    error instanceof Error
      ? error.message
      : error
  );

  process.exit(1);
});
