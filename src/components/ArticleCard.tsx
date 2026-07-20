import Image from 'next/image';
import Link from 'next/link';
import { formatRelativeTime, getHotClass, cn } from '@/lib/utils';
import type { Article } from '@/types';
import styles from './NewsExperience.module.css';

interface Props {
  article: Article;
  variant?: 'featured' | 'card';
}

export function ArticleCard({ article, variant = 'card' }: Props) {
  const detailUrl = `/bai-viet/${article.id}`;
  const sourceName = article.source?.name ?? article.source_name ?? 'Nguồn tin';
  const country = article.source?.country ?? article.source_country;
  const categoryName =
    article.category?.name ?? article.category_name ?? article.category_slug ?? 'Tin tức';
  const isFeatured = variant === 'featured';

  return (
    <Link
      href={detailUrl}
      className={cn(styles.cardLink, isFeatured && styles.cardLinkFeatured)}
      aria-label={`Xem bài: ${article.title}`}
    >
      <article className={cn(styles.newsCard, isFeatured && styles.newsCardFeatured)}>
        <div className={styles.cardMedia}>
          {article.image_url ? (
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              priority={isFeatured}
              sizes="(max-width: 900px) 100vw, 820px"
              className={styles.cardImage}
            />
          ) : (
            <div className={styles.imageFallback} aria-hidden="true">
              <span>FX</span>
            </div>
          )}
        </div>

        <div className={styles.cardContent}>
          <div className={styles.cardMeta}>
            <span className={styles.sourceMeta}>
              <span
                className={styles.sourceDot}
                style={{ backgroundColor: country === 'vn' ? '#ef4444' : '#3b82f6' }}
              />
              {sourceName}
            </span>
            <span>·</span>
            <span>{formatRelativeTime(article.pub_date)}</span>
            {article.hot_score >= 75 && (
              <span className={styles.updatedBadge}>⚡ Vừa cập nhật</span>
            )}
          </div>

          <div className={styles.categoryRow}>
            <span className={styles.categoryBadge}>{categoryName}</span>
            {article.hot_score >= 55 && (
              <span className={styles.hotScore}>
                🔥
                <HotMeter score={article.hot_score} />
                {article.hot_score.toFixed(1)}
              </span>
            )}
          </div>

          <h2 className={cn(styles.cardTitle, isFeatured && styles.featuredTitle)}>
            {article.title}
          </h2>

          {(article.key_takeaway || article.summary) && (
            <p className={styles.cardSummary}>{article.key_takeaway || article.summary}</p>
          )}

          <div className={styles.cardBottom}>
            <span className={styles.sourceCount}>📰 1 nguồn đưa tin</span>
            <span className={styles.viewArticle}>Xem tin →</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function HotMeter({ score }: { score: number }) {
  const hotClass = getHotClass(score);

  return (
    <span className={cn(styles.hotMeter, styles[hotClass || 'warm'])} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}
