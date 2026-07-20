import type { Source, HotKeyword, Category } from '@/types';

interface Props {
  sources: Source[];
  trends: HotKeyword[];
  categories: Category[];
}

const CAT_COLORS = ['#2563eb', '#dc2626', '#ea580c', '#7c3aed', '#0891b2', '#16a34a', '#c2410c', '#65a30d'];

export function SidebarRight({ sources, trends, categories }: Props) {
  const maxCount = Math.max(...categories.map(c => c.article_count ?? 0), 1);

  return (
    <aside className="sidebar-right">
      {/* Trending keywords */}
      <div className="sidebar-section">
        <h3 className="sidebar-section-title">🔥 Xu hướng</h3>
        <div className="trending-list">
          {trends.map(t => (
            <button key={t.id} className="trend-tag" data-kw={t.keyword}>
              #{t.keyword} <span className="tag-weight">{t.weight}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sources */}
      <div className="sidebar-section">
        <h3 className="sidebar-section-title">📡 Nguồn tin</h3>
        <div>
          {sources.map(s => (
            <div key={s.id} className="source-item">
              <div className="source-info">
                <span className="source-flag">{s.country === 'vn' ? '🇻🇳' : '🌍'}</span>
                <span className="source-name">{s.name}</span>
                <span className={`source-type ${s.country}`}>
                  {s.country === 'vn' ? 'VN' : 'INTL'}
                </span>
              </div>
              <span className="source-count mono">{s.article_count ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="sidebar-section">
        <h3 className="sidebar-section-title">🏷️ Phân bổ</h3>
        <div>
          {categories.map((cat, i) => {
            const count = cat.article_count ?? 0;
            const pct = (count / maxCount) * 100;
            return (
              <div key={cat.id} className="cat-row">
                <span className="cat-row-label">
                  {cat.icon} {cat.name}
                </span>
                <div className="cat-bar">
                  <div
                    className="cat-bar-fill"
                    style={{ width: `${pct}%`, background: CAT_COLORS[i % CAT_COLORS.length] }}
                  />
                </div>
                <span className="cat-count mono">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
