import Link from 'next/link';
import Image from 'next/image';
import { formatRelativeTime, getHotClass, cn } from '@/lib/utils';
import type { Article } from '@/types';

interface Props {
  article: Article;
  variant?: 'featured' | 'card';
}

export function ArticleCard({ article, variant = 'card' }: Props) {
  if (variant === 'featured') {
    return (
      <article className="article-featured card">
        {article.image_url && (
          <div className="article-img">
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        )}
        <div className="article-body">
          <div>
            <div className="article-meta-top">
              <span className={cn('category-tag', article.category?.slug)}>
                {article.category?.name ?? article.category?.slug}
              </span>
              {article.hot_score >= 55 && (
                <span className="hot-indicator">
                  <span>🔥</span>
                  <HotMeter score={article.hot_score} />
                  <span className="mono" style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                    {article.hot_score.toFixed(1)}
                  </span>
                </span>
              )}
            </div>
            <h2 className="article-title">
              <Link href={article.link} target="_blank" rel="noopener noreferrer">
                {article.title}
              </Link>
            </h2>
            {article.summary && (
              <p className="article-summary">{article.summary}</p>
            )}
          </div>
          <div className="article-footer">
            <div className="article-source">
              <span className="source-dot" style={{ background: article.source?.country === 'vn' ? '#dc2626' : '#2563eb' }} />
              {article.source?.name}
            </div>
            <span className="article-time">{formatRelativeTime(article.pub_date)}</span>
            <Link href={article.link} target="_blank" rel="noopener noreferrer" className="read-btn">
              Đọc →
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="article-card card">
      {article.image_url && (
        <div className="card-thumb">
          <Image
            src={article.image_url}
            alt={article.title}
            fill
            style={{ objectFit: 'cover' }}
            sizes="100px"
          />
        </div>
      )}
      <div className="card-body">
        <div className="card-meta">
          <span className={cn('category-tag', article.category?.slug)}>
            {article.category?.name ?? article.category?.slug}
          </span>
          {article.hot_score >= 70 && (
            <span className="hot-indicator">
              <span>🔥</span>
              <HotMeter score={article.hot_score} />
              <span className="mono" style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                {article.hot_score.toFixed(1)}
              </span>
            </span>
          )}
        </div>
        <h3 className="card-title">
          <Link href={article.link} target="_blank" rel="noopener noreferrer">
            {article.title}
          </Link>
        </h3>
        {article.summary && (
          <p className="card-summary">{article.summary}</p>
        )}
        <div className="card-footer">
          <div className="article-source">
            <span className="source-dot" style={{ background: article.source?.country === 'vn' ? '#dc2626' : '#2563eb' }} />
            {article.source?.name}
          </div>
          <span className="article-time">{formatRelativeTime(article.pub_date)}</span>
        </div>
      </div>
    </article>
  );
}

function HotMeter({ score }: { score: number }) {
  const cls = getHotClass(score);
  return (
    <span className={cn('hot-meter', score >= 55 && 'on', cls)}>
      <span className="bar" />
      <span className="bar" />
      <span className="bar" />
      <span className="bar" />
    </span>
  );
}
