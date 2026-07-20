#!/usr/bin/env tsx
/**
 * FoodXplore RSS Crawler
 * 
 * Chức năng:
 *  1. Fetch RSS từ tất cả nguồn đang active
 *  2. Parse articles, trích xuất title, summary, image, pub_date
 *  3. Auto-classify vào categories dựa trên keyword matching
 *  4. Tính hot_score
 *  5. Deduplicate (check link tồn tại)
 *  6. Ghi vào Supabase
 *  7. Log crawl results
 * 
 * Chạy: npm run crawl
 */

import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { formatDistanceToNow, parseISO } from 'date-fns';

// ─── Config ────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded'],
      ['description', 'description'],
    ],
  },
  timeout: 15000,
  headers: {
    'User-Agent': 'FoodXplore-Crawler/1.0 (+https://foodxplore.vercel.app)',
  },
});

// ─── Category keywords ────────────────────────────────
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'an-toan-thuc-pham': [
    'an toàn thực phẩm', 'attp', 'food safety', 'recall', 'thu hồi',
    'cấm', 'banned', 'vi phạm', 'kiểm nghiệm', 'chất cấm', 'độc hại',
    'hàng giả', 'hàng kém chất lượng', 'hóa chất', 'trứng', 'thịt',
    'gà', 'heo', 'bò', 'drug', 'contaminat', 'outbreak', 'e. coli',
    'salmonella', 'listeria', 'inspection', 'fda warning', 'efsa',
  ],
  'kinh-doanh': [
    'kinh doanh', 'doanh nghiệp', 'm&a', 'sáp nhập', 'mua lại',
    'ipo', 'cổ phiếu', 'lợi nhuận', 'doanh thu', 'thị phần',
    'thương mại', 'đầu tư', 'tập đoàn', 'công ty', 'startup',
    'merger', 'acquisition', 'revenue', 'profit', 'valuation',
    'expansion', 'subsidiary', 'venture', 'funding', 'deal',
  ],
  'gia-ca': [
    'giá', 'xuất khẩu', 'nhập khẩu', 'biến động', 'tăng giá',
    'giảm giá', 'thị trường', 'commodity', 'hàng hóa', 'lúa',
    'gạo', 'cà phê', 'cao su', 'thủy sản', 'thịt', 'thanh long',
    'tiêu', 'điều', 'lạm phát', 'inflation', 'price', 'export',
    'import', 'tonnage', 'usda', 'fao', 'vfa', 'production',
  ],
  'cong-nghe': [
    'công nghệ', 'tech', 'ai', 'tự động', 'robot', 'máy móc',
    'đổi mới', 'sáng tạo', 'startup', 'app', 'ứng dụng', 'phần mềm',
    'digital', 'automation', 'blockchain', 'sensors', 'packaging',
    'processing', 'manufacturing', 'innovation', 'product launch',
    'research', 'development', 'patent', 'technology',
  ],
  'quy-dinh': [
    'quy định', 'chính sách', 'luật', 'thông tư', 'nghị định',
    'bộ y tế', 'fda', 'efsa', 'who', 'codex', 'tiêu chuẩn',
    'chứng nhận', 'giấy phép', 'regulation', 'policy', 'law',
    'approval', 'mandate', 'compliance', 'standard', 'certification',
  ],
  'suc-khoe': [
    'sức khỏe', 'dinh dưỡng', 'protein', 'vitamin', 'khoáng chất',
    'chế độ ăn', 'giảm cân', 'béo phì', 'tiểu đường', 'tim mạch',
    'thực phẩm chức năng', 'supplement', 'organic', 'hữu cơ',
    'plant-based', 'vegan', 'vegetarian', 'gluten-free', 'health',
    'nutrition', 'obesity', 'diabetes', 'heart', 'gut', 'microbiome',
  ],
  'nong-nghiep': [
    'nông nghiệp', 'vùng nguyên liệu', 'trang trại', 'cây trồng',
    'chăn nuôi', 'thủy sản', 'nuôi trồng', 'thu hoạch', 'mùa vụ',
    'agriculture', 'farm', 'livestock', 'aquaculture', 'seafood',
    'harvest', 'crop', 'yield', 'soil', 'fertilizer', 'pesticide',
    'seed', 'drought', 'flood', 'climate', 'vietnam', 'region',
  ],
};

// ─── Type definitions ────────────────────────────────
interface FeedSource {
  id: string;
  name: string;
  feed_url: string;
  country: string;
  credibility_score: number;
  category_slug: string;
}

interface ParsedArticle {
  title: string;
  link: string;
  summary: string;
  imageUrl: string | null;
  pubDate: string;
  sourceId: string;
  sourceName: string;
  sourceCountry: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  hotScore: number;
  isHot: boolean;
}

interface CrawlResult {
  source: string;
  status: 'success' | 'partial' | 'failed';
  articlesFound: number;
  articlesSaved: number;
  duplicates: number;
  durationMs: number;
  error?: string;
}

// ─── Helpers ─────────────────────────────────────────
function normalizeText(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

function extractImage(item: Record<string, unknown>): string | null {
  // media:content
  const mc = item.mediaContent as Array<Record<string, unknown>> | undefined;
  if (mc?.length) {
    const img = mc.find((m: Record<string, unknown>) => String(m['$'] ?? '').includes('image') || (m['url'] as string)?.match(/\.(jpg|jpeg|png|webp)/i));
    if (img?.url) return img.url as string;
  }
  // media:thumbnail
  const mt = item.mediaThumbnail as Array<Record<string, unknown>> | undefined;
  if (mt?.length && mt[0]?.url) return mt[0].url as string;
  // enclosure
  const enc = item.enclosure as Record<string, unknown> | undefined;
  if (enc?.url && String(enc.type ?? '').startsWith('image/')) return enc.url as string;
  // Try parse content
  const content = normalizeText((item.contentEncoded as string) ?? (item['content'] as string) ?? '');
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];
  return null;
}

function parseDate(dateStr: string | undefined): string {
  if (!dateStr) return new Date().toISOString();
  try {
    const d = parseISO(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch {}
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch {}
  return new Date().toISOString();
}

function classifyCategory(title: string, summary: string): { id: string; slug: string; name: string } {
  const text = `${title} ${summary}`.toLowerCase();

  let bestMatch = { slug: '', score: 0, name: '' };
  for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) score++;
    }
    if (score > bestMatch.score) {
      const nameMap: Record<string, string> = {
        'an-toan-thuc-pham': 'An toàn thực phẩm',
        'kinh-doanh': 'Kinh doanh',
        'gia-ca': 'Giá cả',
        'cong-nghe': 'Công nghệ',
        'quy-dinh': 'Quy định',
        'suc-khoe': 'Sức khỏe',
        'nong-nghiep': 'Nông nghiệp',
      };
      bestMatch = { slug, score, name: nameMap[slug] ?? slug };
    }
  }

  if (bestMatch.score === 0) {
    return { id: '', slug: 'tong-hop', name: 'Tổng hợp' };
  }

  return { id: '', slug: bestMatch.slug, name: bestMatch.name };
}

async function getCategories() {
  const { data } = await supabase.from('categories').select('id, name, slug');
  return data ?? [];
}

async function getActiveSources() {
  const { data } = await supabase
    .from('sources')
    .select('id, name, feed_url, country, credibility_score')
    .eq('is_active', true)
    .not('feed_url', 'is', null);
  return (data ?? []) as FeedSource[];
}

async function getHotKeywords(): Promise<Array<{ keyword: string; weight: number }>> {
  const { data } = await supabase
    .from('hot_keywords')
    .select('keyword, weight')
    .eq('is_active', true);
  return data ?? [];
}

async function articleExists(link: string): Promise<boolean> {
  const { count } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('link', link);
  return (count ?? 0) > 0;
}

async function calculateHotScore(
  sourceCred: number,
  pubDate: string,
  title: string,
  summary: string,
  hotKeywords: Array<{ keyword: string; weight: number }>
): Promise<number> {
  // 1. Source score (0-50)
  const sourceScore = (sourceCred ?? 5) * 5;

  // 2. Time decay (0-50) — giảm 1 điểm mỗi 2 giờ
  const ageHours = (Date.now() - new Date(pubDate).getTime()) / (1000 * 60 * 60);
  const timeDecay = Math.max(0, 50 - ageHours / 2);

  // 3. Keyword boost (0-20)
  const text = `${title} ${summary}`.toLowerCase();
  let keywordScore = 0;
  for (const kw of hotKeywords) {
    if (text.includes(kw.keyword.toLowerCase())) {
      keywordScore += kw.weight * 1.5;
    }
  }
  keywordScore = Math.min(keywordScore, 20);

  return Math.round((sourceScore + timeDecay + keywordScore) * 100) / 100;
}

// ─── Main crawl function ──────────────────────────────
async function crawlSource(
  source: FeedSource,
  categories: Array<{ id: string; name: string; slug: string }>,
  hotKeywords: Array<{ keyword: string; weight: number }>
): Promise<CrawlResult> {
  const start = Date.now();
  let articlesFound = 0;
  let articlesSaved = 0;
  let duplicates = 0;

  try {
    console.log(`  📡 Fetching: ${source.name}`);
    const feed = await parser.parseURL(source.feed_url);

    for (const item of feed.items ?? []) {
      const title = normalizeText(item.title);
      const link = item.link ?? '';

      if (!title || !link) continue;
      articlesFound++;

      // Skip already existing
      if (await articleExists(link)) {
        duplicates++;
        continue;
      }

      const summary = normalizeText(item.contentSnippet ?? item.summary ?? item.content ?? '');
      const imageUrl = extractImage(item as unknown as Record<string, unknown>);
      const pubDate = parseDate(item.pubDate ?? item.isoDate);

      // Auto-classify
      const catResult = classifyCategory(title, summary);
      const matchedCat = categories.find(c => c.slug === catResult.slug);
      const categoryId = matchedCat?.id ?? '';
      const categoryName = matchedCat?.name ?? catResult.name;

      // Calculate hot score
      const hotScore = await calculateHotScore(
        source.credibility_score ?? 5,
        pubDate,
        title,
        summary,
        hotKeywords
      );

      // Check if hot (top 5% — score > 75)
      const isHot = hotScore >= 75;

      const article: Omit<ParsedArticle, 'isHot'> = {
        title,
        link,
        summary: summary.slice(0, 300),
        imageUrl,
        pubDate,
        sourceId: source.id,
        sourceName: source.name,
        sourceCountry: source.country,
        categoryId,
        categorySlug: catResult.slug,
        categoryName,
        hotScore,
      };

      const { error } = await supabase.from('articles').insert({
        title: article.title,
        link: article.link,
        summary: article.summary,
        image_url: article.imageUrl,
        pub_date: article.pubDate,
        source_id: article.sourceId,
        source_name: article.sourceName,
        source_country: article.sourceCountry,
        category_id: article.categoryId || null,
        category_slug: article.categorySlug,
        category_name: article.categoryName,
        hot_score: article.hotScore,
        is_hot: article.isHot,
        is_crawled: true,
        is_processed: true,
      });

      if (error) {
        if (error.code === '23505') {
          duplicates++;
        } else {
          console.error(`    ⚠️ Insert error: ${error.message}`);
        }
      } else {
        articlesSaved++;
      }
    }

    const durationMs = Date.now() - start;
    console.log(
      `  ✅ ${source.name}: found=${articlesFound} saved=${articlesSaved} dup=${duplicates} (${durationMs}ms)`
    );

    // Update last_fetched
    await supabase
      .from('sources')
      .update({ last_fetched: new Date().toISOString() })
      .eq('id', source.id);

    return {
      source: source.name,
      status: 'success',
      articlesFound,
      articlesSaved,
      duplicates,
      durationMs,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`  ❌ ${source.name}: ${errorMsg}`);
    return {
      source: source.name,
      status: 'failed',
      articlesFound,
      articlesSaved,
      duplicates,
      durationMs: Date.now() - start,
      error: errorMsg,
    };
  }
}

async function logCrawlResults(results: CrawlResult[]) {
  for (const r of results) {
    const source = await supabase
      .from('sources')
      .select('id, name')
      .eq('name', r.source)
      .single();

    if (!source.data) continue;

    await supabase.from('crawl_logs').insert({
      feed_id: source.data.id,
      feed_name: r.source,
      status: r.status,
      articles_fetched: r.articlesFound,
      articles_new: r.articlesSaved,
      articles_duplicates: r.duplicates,
      completed_at: new Date().toISOString(),
      duration_ms: r.durationMs,
      error_message: r.error ?? null,
    });
  }
}

async function updateCategoryCounts() {
  const { data: cats } = await supabase.from('categories').select('id');
  if (!cats) return;
  for (const cat of cats) {
    const { count } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', cat.id)
      .eq('is_archived', false);
    await supabase
      .from('categories')
      .update({ article_count: count ?? 0 })
      .eq('id', cat.id);
  }
}

// ─── Entry point ──────────────────────────────────────
async function main() {
  console.log('\n🚀 FoodXplore Crawler — Starting\n');
  console.log(`⏰ Started at: ${new Date().toLocaleString('vi-VN')}`);

  const startTotal = Date.now();

  // Load metadata
  const [categories, sources, hotKeywords] = await Promise.all([
    getCategories(),
    getActiveSources(),
    getHotKeywords(),
  ]);

  console.log(`📊 ${sources.length} active sources | ${hotKeywords.length} hot keywords | ${categories.length} categories\n`);

  // Crawl all sources sequentially (tránh rate limit)
  const results: CrawlResult[] = [];
  for (const source of sources) {
    const result = await crawlSource(source, categories, hotKeywords);
    results.push(result);
    // Delay giữa các request để tránh bị block
    await new Promise(r => setTimeout(r, 2000));
  }

  // Log results
  await logCrawlResults(results);

  // Update category counts
  await updateCategoryCounts();

  const totalDuration = Date.now() - startTotal;
  const totalSaved = results.reduce((s, r) => s + r.articlesSaved, 0);
  const totalFound = results.reduce((s, r) => s + r.articlesFound, 0);
  const totalDup = results.reduce((s, r) => s + r.duplicates, 0);
  const failedCount = results.filter(r => r.status === 'failed').length;

  console.log('\n─────────────────────────────────────');
  console.log(`📋 SUMMARY:`);
  console.log(`   Total found:   ${totalFound}`);
  console.log(`   Total saved:   ${totalSaved}`);
  console.log(`   Duplicates:    ${totalDup}`);
  console.log(`   Failed:       ${failedCount}/${sources.length}`);
  console.log(`   Total time:   ${Math.round(totalDuration / 1000)}s`);
  console.log('─────────────────────────────────────\n');

  // Cleanup old articles (archive > 30 days, delete > 90 days)
  const { count: archived } = await supabase
    .from('articles')
    .update({ is_archived: true })
    .eq('is_archived', false)
    .lt('pub_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (archived) console.log(`🗑️ Archived ${archived} old articles`);
}

main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
