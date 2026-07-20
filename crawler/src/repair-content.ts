#!/usr/bin/env tsx

import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Thiếu cấu hình Supabase');
  process.exit(1);
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

interface Article {
  id: string;
  title: string;
  summary: string | null;
  link: string;
  image_url: string | null;
  source_country: string | null;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function looksEnglish(text: string): boolean {
  if (!text) {
    return false;
  }

  const englishWords =
    /\b(the|and|of|to|for|with|from|as|because|health|food|market|research|recall|industry)\b/i;

  const vietnameseCharacters =
    /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;

  return (
    englishWords.test(text) &&
    !vietnameseCharacters.test(text)
  );
}

async function findArticleImage(
  articleUrl: string
): Promise<string | null> {
  try {
    const response = await fetch(articleUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 foodpluseBot/1.0',
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const candidate =
      $('meta[property="og:image"]').attr('content') ??
      $('meta[name="twitter:image"]').attr('content') ??
      $('meta[property="twitter:image"]').attr('content') ??
      $('article img').first().attr('src') ??
      $('img').first().attr('src');

    if (!candidate) {
      return null;
    }

    try {
      return new URL(
        candidate,
        articleUrl
      ).toString();
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

async function translateToVietnamese(
  title: string,
  summary: string
): Promise<{
  title: string;
  summary: string;
} | null> {
  if (!GEMINI_API_KEY) {
    return null;
  }

  try {
    const endpoint =
      'https://generativelanguage.googleapis.com/' +
      'v1beta/models/gemini-2.5-flash-lite:' +
      `generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `
Dịch tiêu đề và phần tóm tắt tin tức ngành thực phẩm sau sang tiếng Việt.

Yêu cầu:
- Dịch chính xác, tự nhiên và chuyên nghiệp.
- Giữ nguyên tên riêng, tên doanh nghiệp và số liệu.
- Không thêm nhận xét hoặc thông tin mới.
- Chỉ trả về JSON hợp lệ với hai trường "title" và "summary".

Tiêu đề:
${title}

Tóm tắt:
${summary}
`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      console.warn(
        `Gemini trả về HTTP ${response.status}`
      );

      return null;
    }

    const data = await response.json();

    const output =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!output) {
      return null;
    }

    const parsed = JSON.parse(output);

    if (
      typeof parsed.title !== 'string' ||
      typeof parsed.summary !== 'string'
    ) {
      return null;
    }

    return {
      title: parsed.title.trim(),
      summary: parsed.summary.trim(),
    };
  } catch (error) {
    console.warn(
      'Không dịch được bài:',
      error instanceof Error
        ? error.message
        : error
    );

    return null;
  }
}

async function main(): Promise<void> {
  console.log('Bắt đầu bổ sung ảnh và dịch nội dung');

  const { data, error } = await supabase
    .from('articles')
    .select(
      'id, title, summary, link, image_url, source_country'
    )
    .eq('is_archived', false)
    .order('fetched_at', { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  const articles = (data ?? []) as Article[];

  let imagesAdded = 0;
  let articlesTranslated = 0;

  for (const article of articles) {
    const updates: Record<string, unknown> = {};

    if (!article.image_url) {
      const imageUrl = await findArticleImage(
        article.link
      );

      if (imageUrl) {
        updates.image_url = imageUrl;
        imagesAdded += 1;
      }
    }

    const combinedText =
      `${article.title} ${article.summary ?? ''}`;

    if (
      article.source_country === 'intl' &&
      looksEnglish(combinedText)
    ) {
      const translated = await translateToVietnamese(
        article.title,
        article.summary ?? ''
      );

      if (translated) {
        updates.title = translated.title;
        updates.summary = translated.summary;
        updates.language = 'vi';
        articlesTranslated += 1;
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('articles')
        .update(updates)
        .eq('id', article.id);

      if (updateError) {
        console.error(
          `Không cập nhật được ${article.id}:`,
          updateError.message
        );
      }
    }

    await wait(400);
  }

  console.log(`Đã bổ sung ${imagesAdded} ảnh`);
  console.log(
    `Đã dịch ${articlesTranslated} bài sang tiếng Việt`
  );
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : error
  );

  process.exit(1);
});
