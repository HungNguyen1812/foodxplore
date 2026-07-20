# KIẾN TRÚC HỆ THỐNG — FoodXplore

> Phiên bản: 2.0 | Ngày: 2026-07-20 | Trạng thái: Đã triển khai
> **Brand**: FoodXplore — "Discover what shapes food"

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1 Mục tiêu
Xây dựng website tổng hợp tin tức ngành thực phẩm tương tự peek.vn — gom tin từ 50 nguồn (Việt Nam + quốc tế), xếp hạng độ "nóng", hiển thị gọn trên một trang.

### 1.2 Mô hình tổng thể

```
╔══════════════════════════════════════════════════════════════╗
║                    NGƯỜI DÙNG                              ║
║         Desktop / Mobile / Tablet                          ║
╚═══════════════╤══════════════════════════════════════════════╝
                │ HTTPS
                ▼
╔══════════════════════════════════════════════════════════════╗
║              FRONTEND — Next.js 14 (Vercel)                 ║
║  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  ║
║  │ Trang chủ   │  │ Lọc & Tìm    │  │ Trang nguồn     │  ║
║  │ (SSG/ISR)   │  │ kiếm (CSR)   │  │ (Static)        │  ║
║  └─────────────┘  └──────────────┘  └──────────────────┘  ║
╚═══════════════╤══════════════════════════════════════════════╝
                │ API Routes (Next.js API)
                ▼
╔══════════════════════════════════════════════════════════════╗
║              DATABASE — Supabase (PostgreSQL)                ║
║  ┌──────────────┐ ┌──────────────┐ ┌───────────────────┐ ║
║  │ articles     │ │ feeds        │ │ hot_keywords      │ ║
║  │ categories  │ │ sources      │ │ crawl_logs        │ ║
║  └──────────────┘ └──────────────┘ └───────────────────┘ ║
╚══════════════════════════════════════════════════════════════╝
                ▲
                │ Background Jobs
╔══════════════════════════════════════════════════════════════╗
║         BACKEND CRAWLER — Node.js / Python (Railway)        ║
║  ┌──────────────┐ ┌──────────────┐ ┌───────────────────┐ ║
║  │ RSS Fetcher  │ │ Web Scraper  │ │ Hot Score Engine  │ ║
║  │ (Axios+Cheerio)│ │ (Puppeteer) │ │ (Scoring Algo)   │ ║
║  └──────────────┘ └──────────────┘ └───────────────────┘ ║
╚══════════════════════════════════════════════════════════════╝
                ▲
                │ Cron Job (mỗi 15–30 phút)
╔══════════════════════════════════════════════════════════════╗
║         SCHEDULER — Vercel Cron / GitHub Actions           ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 2. CHI TIẾT TỪNG THÀNH PHẦN

### 2.1 Frontend — Next.js 14 (App Router)

**Tại sao Next.js:**
- Server-Side Rendering (SSR) → tốt cho SEO (rất quan trọng vì đây là trang tin)
- Incremental Static Regeneration (ISR) → trang chủ tự cập nhật mà không cần build lại
- API Routes → không cần server riêng cho backend nhỏ
- Tương thích tốt với Vercel deployment

**Cấu trúc thư mục:**
```
src/
├── app/
│   ├── page.tsx              # Trang chủ (ISR, revalidate 15ph)
│   ├── [category]/page.tsx  # Trang danh mục
│   ├── search/page.tsx       # Trang tìm kiếm
│   ├── api/
│   │   ├── articles/route.ts    # GET articles (phân trang, lọc)
│   │   ├── hot/route.ts         # GET tin nóng nhất
│   │   └── sources/route.ts     # GET danh sách nguồn
│   └── layout.tsx
├── components/
│   ├── ArticleCard.tsx       # Card bài viết
│   ├── HotBanner.tsx         # Banner tin nóng
│   ├── CategoryTabs.tsx      # Tab lọc danh mục
│   ├── SearchBar.tsx         # Thanh tìm kiếm
│   ├── SourceBadge.tsx       # Badge nguồn báo
│   └── Footer.tsx
└── lib/
    ├── supabase.ts           # Kết nối Supabase client
    └── utils.ts              # Hàm tiện ích
```

**Trang chủ (SSG + ISR):**
- Build tĩnh ban đầu từ Supabase
- Tự động revalidate mỗi 15 phút (ISR)
- Dữ liệu động: hot_score, danh sách articles (đã fetch sẵn)

**Trang danh mục:**
- `/kinh-doanh` — tin kinh doanh, doanh nghiệp
- `/at tp` — an toàn thực phẩm
- `/gia-ca` — giá cả, xuất nhậ khẩu
- `/cong-nghe` — công nghệ, đổi mới
- `/quy-dinh` — quy định, chính sách
- `/suc-khoe` — dinh dưỡng, sức khỏe

**Trang tìm kiếm:**
- Client-side search với debounce 300ms
- Gọi Supabase full-text search

### 2.2 Database — Supabase (PostgreSQL)

**Schema chi tiết (xem file database/schema.sql)**

**Chiến lược indexing:**
- `idx_articles_hot_score` trên `hot_score DESC` — sắp xếp tin nóng
- `idx_articles_pub_date` trên `pub_date DESC` — sắp xếp tin mới
- `idx_articles_category` trên `category_id` — lọc theo danh mục
- `idx_articles_link` trên `link` (UNIQUE) — kiểm tra trùng lặp
- Full-text search index trên `title` + `summary`

**Row Level Security (RLS):**
- SELECT: public (ai đọc cũng được)
- INSERT/UPDATE/DELETE: chỉ service role (backend crawler)

### 2.3 Backend Crawler — Node.js

**Script chính: `crawler/index.js`**

Chạy mỗi 15 phút qua Vercel Cron hoặc GitHub Actions:

```javascript
// Mỗi lần chạy:
async function runCrawl() {
  // 1. Lấy danh sách feeds active
  const feeds = await getActiveFeeds();
  
  // 2. Với mỗi feed:
  for (const feed of feeds) {
    const articles = await fetchFeed(feed.url); // RSS XML → JSON
    
    for (const article of articles) {
      // 3. Kiểm tra trùng lặp (link đã tồn tại?)
      const exists = await checkDuplicate(article.link);
      if (exists) continue;
      
      // 4. Phân loại danh mục (keyword matching)
      const category = classifyCategory(article.title, article.summary);
      
      // 5. Tính hot_score ban đầu
      const hotScore = calculateHotScore(article, feed);
      
      // 6. Lưu vào DB
      await saveArticle({ ...article, category, hotScore });
    }
    
    // 7. Cập nhật last_fetched
    await updateFeedLastFetched(feed.id);
  }
  
  // 8. Recalculate hot_score cho các bài trong 48h qua
  await recalculateAllHotScores();
}
```

**Xử lý nguồn không có RSS (Web Scraping):**
```javascript
async function scrapeWeb(url) {
  const response = await axios.get(url, { timeout: 10000 });
  const $ = cheerio.load(response.data);
  
  // Trích xuất: title, link, summary, pubDate, image
  return {
    title: $('h1').text().trim(),
    link: $('meta[property="og:url"]').attr('content'),
    summary: $('meta[property="og:description"]').attr('content'),
    pubDate: $('time').attr('datetime'),
    image: $('meta[property="og:image"]').attr('content'),
  };
}
```

### 2.4 Thuật toán xếp hạng "Tin Nóng"

```javascript
function calculateHotScore(article, feed) {
  const now = Date.now();
  const ageHours = (now - new Date(article.pubDate).getTime()) / 3600000;
  
  // 1. Điểm nguồn uy tín (cố định theo từng feed)
  const sourceScore = feed.credibility_score || 5; // 1-10
  
  // 2. Điểm thời gian (decay — bài càng mới càng cao)
  // Tính theo: score = base × (1 / (1 + ageHours/12))
  // → Bài 0h: 100%, 12h: 50%, 24h: 33%, 48h: 20%
  const timeDecay = 1 / (1 + ageHours / 12);
  
  // 3. Điểm từ khóa hot (keywords trending)
  const keywordScore = getKeywordScore(article.title + ' ' + article.summary);
  
  // 4. Tần suất (bài viết có nhiều từ khóa trending không)
  const frequencyBoost = countTrendingKeywords(article) * 2;
  
  // Tổng hợp
  const rawScore = (sourceScore * 10) + (timeDecay * 50) + keywordScore + frequencyBoost;
  
  return Math.round(rawScore * 100) / 100;
}

// Hot score mỗi 15 phút recalculate cho các bài trong 72h
// Sau 72h: lock hot_score, không tính lại
```

**Trọng số thành phần:**
| Yếu tố | Trọng số tối đa | Ghi chú |
|---|---|---|
| Điểm nguồn uy tín | 100 | Nguồn uy tín (FoodNavigator, Reuters) = 10/10 |
| Điểm thời gian | 50 | Decay 50% sau 12h |
| Điểm từ khóa hot | 30 | "recall", "banned", "M&A" = cao |
| Điểm tần suất | 20 | Cùng chủ đề xuất hiện nhiều lần |
| **Tổng tối đa** | **200** | |

### 2.5 Phân loại danh mục tự động

```javascript
const CATEGORY_KEYWORDS = {
  'kinh-doanh': ['doanh nghiệp', 'mở rộng', 'lợi nhuận', 'doanh thu', 'cổ phiếu', 'M&A', 'IPO', 'thị phần', 'đối thủ', 'nhà máy', 'nhập khẩu', 'xuất khẩu', 'công ty', 'tập đoàn'],
  'an-toan-thuc-pham': ['an toàn', 'vi phạm', 'thu hồi', 'recall', 'cấm', 'nhiễm', 'kiểm nghiệm', 'chất cấm', 'hóa chất', 'độc hại', 'ngộ độc', 'thực phẩm bẩn'],
  'gia-ca': ['giá', 'lạm phát', 'xu hướng giá', 'tăng giá', 'giảm giá', 'chi phí', 'nguyên liệu', 'lương thực', 'nông sản', 'thức ăn', 'commodity'],
  'cong-nghe': ['công nghệ', 'AI', 'tự động hóa', 'đổi mới', 'startup', 'app', 'ứng dụng', 'nghiên cứu', 'khoa học', 'trí tuệ nhân tạo'],
  'quy-dinh': ['quy định', 'luật', 'chính sách', 'FDA', 'EFSA', 'Bộ Y Tế', 'Bộ Nông nghiệp', 'tiêu chuẩn', 'chứng nhận', 'cấp phép', 'hồ sơ', 'thủ tục'],
  'suc-khoe': ['dinh dưỡng', 'sức khỏe', 'bệnh', 'vitamin', 'protein', 'thực phẩm chức năng', 'chế độ ăn', 'giảm cân', 'béo phì', 'đái tháo đường', 'tim mạch'],
  'nong-nghiep': ['nông nghiệp', 'vụ mùa', 'thu hoạch', 'cây trồng', 'chăn nuôi', 'thủy sản', 'vùng nguyên liệu', 'nông dân', 'đồng ruộng'],
};

// Fallback: nếu không khớp → "tong-hop"
```

---

## 3. API ENDPOINTS

### GET /api/articles
Lấy danh sách bài viết (phân trang)

| Tham số | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| page | number | 1 | Trang |
| limit | number | 20 | Bài/trang (max 50) |
| category | string | all | Lọc danh mục |
| source_country | string | all | `vn` \| `intl` \| `all` |
| sort | string | hot | `hot` \| `new` |

Response:
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Apple announces AI food safety system",
      "link": "https://...",
      "source": "FoodNavigator",
      "source_country": "intl",
      "pub_date": "2026-07-19T10:00:00Z",
      "summary": "...",
      "image_url": "https://...",
      "hot_score": 87.5,
      "category": "cong-nghe",
      "category_label": "Công nghệ"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1542,
    "totalPages": 78
  }
}
```

### GET /api/hot
Lấy tin nóng nhất (top 10)

### GET /api/sources
Lấy danh sách nguồn + số bài viết mỗi nguồn

---

## 4. DEPLOYMENT & INFRASTRUCTURE

### 4.1 Chi phí ước tính hàng tháng

| Dịch vụ | Gói | Chi phí | Ghi chú |
|---|---|---|---|
| Vercel (Frontend) | Hobby | **$0** | Free tier đủ cho dự án này |
| Supabase (Database) | Free | **$0** | 500MB DB, 1GB storage, 50K monthly users |
| Railway (Crawler) | Starter | **$5** | 1GB RAM, cron job 24/7 |
| Domain .vn | Annual | **~800K VND** | ~$32/năm |
| **Tổng** | | **~$5/tháng** | Chỉ tốn khi cần scale |

### 4.2 Monitoring

- **Uptime**: Vercel built-in monitoring
- **Crawler health**: Log vào Supabase `crawl_logs`, check tỷ lệ thành công
- **Error tracking**: Sentry (free tier)
- **Analytics**: Vercel Analytics hoặc Google Analytics 4

### 4.3 Backup & Security

- Supabase tự động backup hàng ngày (free tier)
- RLS (Row Level Security) trên Supabase — chỉ crawler được ghi
- Environment variables cho API keys
- Rate limiting trên API routes

---

## 5. CÁC GIAI ĐOẠN PHÁT TRIỂN

### Giai đoạn 1 — MVP (Tuần 1–2)
- [ ] Setup Supabase, tạo schema
- [ ] Viết crawler RSS đơn giản (10 nguồn đầu tiên)
- [ ] Build frontend Next.js cơ bản (trang chủ + card bài viết)
- [ ] Deploy lên Vercel
- [ ] Kết nối cron job crawler

### Giai đoạn 2 — Hoàn thiện (Tuần 3–4)
- [ ] Mở rộng lên 30 nguồn
- [ ] Thêm Web Scraping cho nguồn không có RSS
- [ ] Phân loại danh mục tự động
- [ ] Thuật toán xếp hạng hot_score
- [ ] Trang danh mục + tìm kiếm

### Giai đoạn 3 — Mở rộng (Tuần 5–8)
- [ ] Đủ 50 nguồn
- [ ] Tối ưu hot_score algorithm
- [ ] Thêm nguồn cấp tài chính (Vietstock, CafeF)
- [ ] Dark/Light mode
- [ ] PWA (Progressive Web App) — đọc tin offline
- [ ] Email digest hàng ngày (tùy chọn)

---

## 6. PHỤ LỤC: SƠ ĐỒ ER (Entity Relationship)

```
┌─────────────────────┐      ┌──────────────────────┐
│     categories      │      │        feeds          │
├─────────────────────┤      ├──────────────────────┤
│ id (PK)             │      │ id (PK)              │
│ name                │      │ name                 │
│ slug                │      │ url (RSS/Web)        │
│ icon                │      │ source_website       │
│ color               │      │ credibility_score    │
│ description         │      │ category_id (FK)    │
│ article_count       │      │ country             │
└─────────────────────┘      │ (vn/intl)            │
         │                   │ last_fetched         │
         │                   │ is_active            │
         │                   └──────────┬───────────┘
         │                              │
         │              ┌───────────────┘
         ▼              ▼
┌─────────────────────────────────────────────────────┐
│                    articles                          │
├─────────────────────────────────────────────────────┤
│ id (PK)              │                              │
│ title               │─────────────────────────────── │
│ link (UNIQUE)       │  feeds.id                    │
│ source              │                              │
│ feed_id (FK)        │─────────────────────────────── │
│ category_id (FK)    │  categories.id               │
│ country             │                              │
│ pub_date            │                              │
│ fetched_at          │                              │
│ summary             │                              │
│ image_url           │                              │
│ hot_score           │                              │
│ is_hot              │                              │
│ keywords            │                              │
│ read_time           │                              │
└─────────────────────────────────────────────────────┘

┌─────────────────────┐      ┌──────────────────────┐
│     crawl_logs      │      │     hot_keywords      │
├─────────────────────┤      ├──────────────────────┤
│ id (PK)             │      │ id (PK)              │
│ feed_id (FK)       │      │ keyword              │
│ status             │      │ weight (1-10)        │
│ articles_fetched   │      │ updated_at           │
│ started_at         │      └──────────────────────┘
│ completed_at       │
│ error_message      │
└─────────────────────┘
```

---

## 7. NGUYÊN TẮC THIẾT KẾ (Design Principles)

1. **Đơn giản hóa** — peek.vn chỉ làm 1 việc và làm tốt. Website này cũng vậy.
2. **Chi phí thấp** — Dùng free tier tối đa, chỉ trả tiền khi thật sự cần.
3. **Bảo trì dễ dàng** — Mỗi nguồn feed là 1 row trong bảng `feeds`, thêm nguồn = insert row, không cần sửa code.
4. **Performance** — Trang chủ phải load < 2s ngay cả khi có 5000+ bài viết trong DB.
5. **Không vi phạm bản quyền** — Chỉ hiển thị title + summary + link đến trang gốc, không trích dẫn nội dung dài.

