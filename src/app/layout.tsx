import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Topbar } from '@/components/Topbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'foodpluse — Industry at a glance',
  description: 'Tổng hợp tin tức ngành thực phẩm từ 50+ nguồn trong nước và quốc tế. Cập nhật nhanh, chính xác, miễn phí.',
  keywords: ['tin thực phẩm', 'ngành F&B', 'food news', 'an toàn thực phẩm', 'food industry'],
  openGraph: {
    title: 'foodpluse — Industry at a glance',
    description: 'Tổng hợp tin tức ngành thực phẩm',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        <Topbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
