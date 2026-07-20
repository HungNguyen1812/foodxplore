# FoodXplore Crawler

Script tự động fetch tin tức từ 33 nguồn RSS, phân loại, và ghi vào Supabase.

## Cách chạy

### 1. Cài đặt

```bash
cd crawler
npm install
```

### 2. Cấu hình

Tạo file `.env` trong thư mục `crawler/`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 3. Chạy thử

```bash
npm run dev     # development (watch mode)
npm run start   # production
```

## Cơ chế hoạt động

```
1. Load nguồn đang active từ Supabase
2. Với mỗi nguồn:
   a. Fetch RSS feed (rss-parser)
   b. Parse items: title, link, summary, image, pub_date
   c. Kiểm tra trùng lặp (link UNIQUE)
   d. Auto-classify vào category (keyword matching)
   e. Tính hot_score
   f. Insert vào Supabase
   g. Delay 2 giây (tránh rate limit)
3. Ghi crawl_logs
4. Cập nhật article_count cho categories
5. Cleanup: archive articles > 30 ngày
```

## Hot Score Formula

```
hot_score = (source_credibility × 5) + time_decay + keyword_boost

Trong đó:
- source_credibility: 1-10 (từ bảng sources)
- time_decay: 50 - (giờ_tuổi / 2), tối đa 50
- keyword_boost: tổng trọng số hot_keywords matching, tối đa 20
```

## Tự động hóa

### Cách 1: Vercel Cron

Tạo file `vercel.json` ở root:

```json
{
  "crons": [{
    "path": "/api/crawl",
    "schedule": "0 23,5 * * *"   # 6:00 AM và 12:00 PM giờ VN
  }]
}
```

Tạo API route `src/app/api/crawl/route.ts`:

```typescript
import { NextResponse } from 'next/server';
export async function GET() {
  // Gọi crawler logic ở đây
  return NextResponse.json({ ok: true });
}
```

### Cách 2: GitHub Actions (Khuyến nghị)

File `.github/workflows/crawl.yml` đã được cấu hình:

```yaml
schedule:
  - cron: '0 6,12 * * *'   # 6:00 AM và 12:00 PM mỗi ngày (UTC)
```

Lưu ý: GitHub Actions dùng giờ UTC, nên `0 23,5` tương đương **6:00 và 12:00 giờ Việt Nam** (UTC+7).

### Cách 3: Railway

1. Push code lên GitHub
2. Vào [railway.app](https://railway.app) → **New Project** → Deploy from GitHub
3. Thêm Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Set start command: `npm run start`
5. Enable **Periodic Tasks** → chạy vào lúc **6:00 AM và 12:00 PM**

## Monitoring

Kiểm tra logs trong Supabase Dashboard → **Table Editor** → `crawl_logs`:
- `status = 'success'`: OK
- `status = 'failed'`: Kiểm tra `error_message`
- `articles_fetched` vs `articles_new`: tỷ lệ save thành công

## Tối ưu

- **Rate limit**: đã delay 2s giữa mỗi nguồn
- **Deduplication**: check link UNIQUE trước khi insert
- **Batch insert**: có thể batch nhiều articles cùng lúc để tăng tốc
- **Selective crawl**: chỉ crawl nguồn chưa được fetch trong 30 phút
