'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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

export function Topbar() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [dateStr, setDateStr] = useState('');
  const pathname = usePathname();
const router = useRouter();
const [searchQuery, setSearchQuery] = useState('');

function handleSearch(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  const keyword = searchQuery.trim();

  if (keyword) {
    router.push(`/?q=${encodeURIComponent(keyword)}`);
  } else {
    router.push('/');
  }
}

  useEffect(() => {
    // Init theme
    const saved = localStorage.getItem('fx-theme') as 'light' | 'dark' | null;
    const preferred = saved ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);

    // Init date
    setDateStr(
      new Date().toLocaleDateString('vi-VN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    );
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('fx-theme', next);
  }

  const activeSlug = pathname === '/' ? 'tong-hop'
    : categories.find(c => pathname.startsWith(`/${c.slug}`))?.slug ?? 'tong-hop';

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          {/* Brand */}
          <Link href="/" className="brand-wrap">
            <div className="brand-logo">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 4 L3 20 L5.5 20 L5.5 13.5 L10 13.5 L10 11.2 L5.5 11.2 L5.5 6.3 L11.5 6.3 L11.5 4 Z" fill="#0a0a0a"/>
                <path d="M11 4 L13.8 4 L16.5 8 L19.2 4 L22 4 L17.7 10.2 L21.5 16.5 L18.7 16.5 L16.2 12.7 L13.5 16.5 L10.7 16.5 L14.6 10.2 Z" fill="#0a0a0a"/>
                <path d="M14.5 4 L20 4 L20 9.5" stroke="#0a0a0a" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
                <path d="M14.5 4 L20 4 L20 9.5 L21.5 8 L19.5 11 Z" fill="#0a0a0a"/>
              </svg>
            </div>
            <div className="brand-text">
              <span className="brand-name">Food<span className="x">Xplore</span></span>
              <span className="brand-tagline">Discover what shapes food</span>
            </div>
          </Link>

          {/* Date */}
          <div className="topbar-center">
            <span className="topbar-date">{dateStr}</span>
          </div>

          {/* Right actions */}
          <div className="topbar-right">
            <form className="search-bar" onSubmit={handleSearch}>
  <button
    type="submit"
    aria-label="Tìm kiếm"
    style={{
      background: 'none',
      border: 0,
      padding: 0,
      cursor: 'pointer',
      fontSize: '0.82rem',
    }}
  >
    🔍
  </button>

  <input
    type="search"
    placeholder="Tìm tin..."
    aria-label="Tìm kiếm"
    value={searchQuery}
    onChange={(event) => setSearchQuery(event.target.value)}
  />
</form>
            <button className="icon-btn" onClick={toggleTheme} aria-label="Đổi giao diện">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile category bar */}
      <div className="mobile-cat-bar" style={{ display: 'none' }}>
        <div className="mobile-scroll">
          {categories.map(cat => (
            <Link
              key={cat.slug}
              href={cat.slug === 'tong-hop' ? '/' : `/${cat.slug}`}
              className={`mobile-cat-btn ${activeSlug === cat.slug ? 'active' : ''}`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
