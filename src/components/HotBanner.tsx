import Link from 'next/link';
import type { Article } from '@/types';

interface Props {
  article: Article;
}

export function HotBanner({ article }: Props) {
  const sourceName = article.source?.name ?? article.source_name;

  return (
    <div className="breaking-banner">
      <div className="breaking-badge">
        <span>🔥</span> Nóng
      </div>
      <p className="breaking-text">
        <Link href={`/bai-viet/${article.id}`}>
          {article.title}
        </Link>
        {sourceName && <span style={{ opacity: 0.6 }}> · {sourceName}</span>}
      </p>
    </div>
  );
}
