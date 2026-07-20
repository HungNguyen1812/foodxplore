import Link from 'next/link';
import type { Article } from '@/types';

interface Props {
  article: Article;
}

export function HotBanner({ article }: Props) {
  return (
    <div className="breaking-banner">
      <div className="breaking-badge">
        <span>🔥</span> Nóng
      </div>
      <p className="breaking-text">
        <Link href={article.link} target="_blank" rel="noopener noreferrer">
          {article.title}
        </Link>
        <span style={{ opacity: 0.6 }}> · {article.source?.name}</span>
      </p>
    </div>
  );
}
