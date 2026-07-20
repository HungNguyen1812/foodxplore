'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Image from 'next/image';
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
    const saved = localStorage.getItem('foodpluse-theme') as 'light' | 'dark' | null;
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
    localStorage.setItem('foodpluse-theme', next);
  }

  const activeSlug = pathname === '/' ? 'tong-hop'
    : categories.find(c => pathname.startsWith(`/${c.slug}`))?.slug ?? 'tong-hop';

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          {/* Brand */}
          <Link href="/" className="brand-wrap" aria-label="foodpluse - Trang chủ">
            <span className="brand-image">
              <Image
                src="/foodpluse-logo.png"
                alt="foodpluse - Industry at a glance"
                fill
                priority
                sizes="300px"
              />
            </span>
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
