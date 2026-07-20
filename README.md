# FoodXplore — Discover what shapes food

Tổng hợp tin tức ngành thực phẩm từ 50+ nguồn trong nước và quốc tế.

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Crawler**: Node.js / TypeScript
- **Hosting**: Vercel (frontend) + Railway (crawler)
- **Font**: Inter + JetBrains Mono

## 🚀 Cách chạy local

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Thiết lập Supabase

1. Tạo project tại [supabase.com](https://supabase.com)
2. Copy `.env.example` → `.env.local` và điền credentials:

```bash
cp .env.example .env.local
```

3. Chạy schema trong Supabase SQL Editor:

```
→ Mở supabase.com → SQL Editor → Paste nội dung database/schema.sql → Run
```

### 3. Chạy development server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

## ☁️ Deploy lên Vercel

```bash
npm i -g vercel
vercel
```

Thêm environment variables trong Vercel Dashboard → Settings → Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (chỉ build & runtime, không phải client)

## 📡 API Endpoints

| Endpoint | Mô tả |
|---|---|
| `GET /api/articles` | Lấy danh sách bài viết (lọc, phân trang) |
| `GET /api/hot` | Bài viết hot nhất |
| `GET /api/sources` | Danh sách nguồn tin |
| `GET /api/categories` | Danh sách danh mục |

## 🔄 Thiết lập Crawler

```bash
npm run crawl
```

Chạy mỗi 15 phút qua Vercel Cron hoặc GitHub Actions.

## 📁 Cấu trúc thư mục

```
src/
├── app/                  # Next.js App Router
│   ├── page.tsx          # Trang chủ (ISR 15ph)
│   ├── [category]/       # Trang danh mục
│   └── api/             # API routes
├── components/           # React components
├── lib/                 # Supabase client, utilities
└── types/               # TypeScript types
crawler/src/             # Crawler script
database/
├── schema.sql           # Database schema + seeds
└── ARCHITECTURE.md      # Tài liệu kiến trúc
```

## 🎨 Design System

- **Brand**: FoodXplore — xanh mint/emerald
- **Fonts**: Inter (UI) + JetBrains Mono (số)
- **Layout**: 3 cột — sidebar (200px) + content + sidebar (300px)
- **Theme**: Light/Dark toggle với localStorage persistence
