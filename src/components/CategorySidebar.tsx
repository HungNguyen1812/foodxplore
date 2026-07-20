'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const categories = [
  { slug: 'tong-hop', name: 'Tổng hợp', icon: '📋' },
  { slug: 'kinh-doanh', name: 'Kinh doanh', icon: '💼' },
  { slug: 'an-toan-thuc-pham', name: 'ATTP', icon: '🛡️' },
  { slug: 'gia-ca', name: 'Giá cả', icon: '📊' },
  { slug: 'cong-nghe', name: 'Công nghệ', icon: '⚡' },
  { slug: 'quy-dinh', name: 'Quy định', icon: '📜' },
  { slug: 'suc-khoe', name: 'Sức khỏe', icon: '🥗' },
  { slug: 'nong-nghiep', name: 'Nông nghiệp', icon: '🌾' },
];

interface Props {
  counts?: Record<string, number>;
}

export function CategorySidebar({ counts = {} }: Props) {
  const pathname = usePathname();

  return (
    <aside className="sidebar-left">
      <div className="sidebar-left-title">Danh mục</div>
      <nav className="category-list">
        {categories.map(cat => {
          const href = cat.slug === 'tong-hop' ? '/' : `/${cat.slug}`;
          const isActive = pathname === href;
          const count = counts[cat.slug] ?? 0;

          return (
            <Link key={cat.slug} href={href} className={cn('cat-tab', isActive && 'active')}>
              <span className="cat-icon">{cat.icon}</span>
              <span className="cat-name">{cat.name}</span>
              {count > 0 && <span className="cat-count">{count}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
