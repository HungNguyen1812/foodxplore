'use client';

import { useState } from 'react';

interface Props {
  title: string;
  className?: string;
}

export function ShareButton({ title, className }: Props) {
  const [copied, setCopied] = useState(false);

  async function shareArticle() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }

      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Người dùng đóng hộp thoại chia sẻ: không cần hiển thị lỗi.
    }
  }

  return (
    <button type="button" className={className} onClick={shareArticle}>
      {copied ? '✓ Đã sao chép' : '🔗 Chia sẻ'}
    </button>
  );
}
