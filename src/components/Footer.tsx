import Link from 'next/link';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span style={{ color: 'var(--color-forest-mid)' }}>●</span>
          Food<span className="x">Xplore</span>
        </div>
        <div className="footer-meta">
          Tổng hợp tin tức ngành thực phẩm từ 50+ nguồn trong nước và quốc tế.{' '}
          <Link href="#">Giới thiệu</Link> · <Link href="#">Liên hệ</Link>
        </div>
      </div>
    </footer>
  );
}
