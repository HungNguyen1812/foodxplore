import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { formatRelativeTime } from '@/lib/utils';
import type { Article, Source } from '@/types';
import { ShareButton } from '@/components/ShareButton';
import styles from '@/components/NewsExperience.module.css';

export const revalidate = 300;

interface Props {
  params: {
    id: string;
  };
}

type DetailArticle = Omit<Article, 'source'> & {
  source?: Source | Source[] | null;
};

async function getArticle(id: string): Promise<DetailArticle | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('articles')
    .select(`
      *,
      source:sources (
        id,
        name,
        url,
        country,
        favicon_url
      )
    `)
    .eq('id', id)
    .eq('is_archived', false)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as unknown as DetailArticle;
}

function getSource(article: DetailArticle): Source | null {
  if (Array.isArray(article.source)) {
    return article.source[0] ?? null;
  }

  return article.source ?? null;
}

function normalizeForComparison(value?: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasDistinctTakeaway(
  takeaway?: string | null,
  sourceExcerpt?: string | null
): takeaway is string {
  const normalizedTakeaway = normalizeForComparison(takeaway);
  const normalizedSource = normalizeForComparison(sourceExcerpt);

  if (normalizedTakeaway.length < 40) {
    return false;
  }

  if (!normalizedSource) {
    return true;
  }

  return normalizedTakeaway !== normalizedSource &&
    !normalizedSource.includes(normalizedTakeaway) &&
    !normalizedTakeaway.includes(normalizedSource);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticle(params.id);

  if (!article) {
    return { title: 'Không tìm thấy bài viết | FoodXplore' };
  }

  return {
    title: `${article.title} | FoodXplore`,
    description: article.summary ?? 'Tin tức ngành thực phẩm trên FoodXplore',
    openGraph: {
      title: article.title,
      description: article.summary ?? undefined,
      images: article.image_url ? [article.image_url] : undefined,
      type: 'article',
    },
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const article = await getArticle(params.id);

  if (!article) {
    notFound();
  }

  const source = getSource(article);
  const sourceName = source?.name ?? article.source_name ?? 'Nguồn tin';
  const originalExcerpt =
    article.original_summary ?? article.content_preview ?? article.summary;
  const keyTakeaway = hasDistinctTakeaway(article.key_takeaway, originalExcerpt)
    ? article.key_takeaway
    : null;
  const originalTitle = article.original_title ?? article.title;

  return (
    <main className={styles.detailPage}>
      <div className={styles.detailToolbar}>
        <div className={styles.toolbarLeft}>
          <Link href="/" className={styles.backButton}>← Quay lại</Link>
          <span className={styles.articleKind}>📰 Bài báo</span>
        </div>
        <div className={styles.toolbarRight}>
          <span className={styles.updateLabel}>Cập nhật</span>
          <ShareButton title={article.title} className={styles.shareButton} />
        </div>
      </div>

      <div className={styles.hero}>
        {article.image_url ? (
          <Image
            src={article.image_url}
            alt={article.title}
            fill
            priority
            sizes="100vw"
            className={styles.heroImage}
          />
        ) : (
          <div className={styles.imageFallback}><span>FX</span></div>
        )}
        <div className={styles.heroOverlay} />
      </div>

      <div className={styles.articleShell}>
        <header className={styles.articleHeader}>
          <h1 className={styles.detailTitle}>{article.title}</h1>
          <div className={styles.articleMeta}>
            <span className={styles.sourceMark}>FX</span>
            <strong>{sourceName}</strong>
            <span>·</span>
            <span>{formatRelativeTime(article.pub_date)}</span>
            <span>·</span>
            <span>1 nguồn đưa tin</span>
          </div>
        </header>

        <div className={styles.contentStack}>
          <section className={styles.takeawayBox}>
            <div className={styles.boxLabel}>📖 Ý chính đáng đọc</div>
            {keyTakeaway ? (
              <p className={styles.takeawayText}>{keyTakeaway}</p>
            ) : (
              <p className={styles.takeawayPending}>
                Bản tóm lược độc lập đang được xử lý. FoodXplore không lặp lại
                trích đoạn gốc ở phần này.
              </p>
            )}
          </section>

          <section className={styles.originalBox}>
            <div className={styles.boxLabel}>📄 Trích đoạn nguyên văn (nguồn gốc)</div>
            {originalTitle !== article.title && (
              <p className={styles.takeawayText} style={{ marginBottom: 12 }}>
                {originalTitle}
              </p>
            )}
            <p className={styles.originalText}>
              {originalExcerpt ?? 'Nguồn RSS không cung cấp đoạn trích nguyên bản.'}
            </p>
            <p className={styles.copyrightNote}>
              FoodXplore chỉ hiển thị phần trích dẫn do nguồn cung cấp. Đọc toàn bộ nội dung tại bài báo gốc bên dưới.
            </p>
          </section>

          <section className={styles.sourceSection}>
            <h2 className={styles.sectionHeading}>Nguồn đưa tin · 1 nguồn</h2>
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className={styles.sourceCard}
            >
              <span className={styles.sourceIdentity}>
                <span className={styles.sourceLogo}>
                  {sourceName.slice(0, 2).toUpperCase()}
                </span>
                <span>
                  <span className={styles.sourceName}>{sourceName}</span>
                  <span className={styles.sourceTime}>
                    {formatRelativeTime(article.pub_date)}
                  </span>
                </span>
              </span>
              <span className={styles.openSource}>Mở bài gốc ↗</span>
            </a>

            <div className={styles.sourceStats}>
              <span>Hiển thị tóm tắt, trích đoạn và liên kết về bài gốc.</span>
              <span>Bản quyền thuộc về nguồn phát hành.</span>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
