# Hướng Dẫn Deploy FoodXplore Lên Vercel

## Tổng quan

Sau khi hoàn thành, website sẽ có URL: `https://foodxplore.vercel.app`

**Chi phí**: Miễn phí (Vercel Hobby) — không cần trả tiền.

---

## Bước 1: Chuẩn bị code trên GitHub

### 1.1 Tạo GitHub Repository

1. Truy cập [github.com](https://github.com) → Đăng nhập
2. Click **New repository**
3. Đặt tên: `foodxplore`
4. Chọn **Private** (hoặc Public)
5. Click **Create repository**

### 1.2 Push code lên GitHub

Mở terminal trong thư mục project:

```bash
cd "D:\Claude\Projects\Own website"

# Khởi tạo git (nếu chưa có)
git init

# Thêm tất cả files
git add .

# Commit
git commit -m "Initial commit: FoodXplore"

# Thêm remote (thay YOUR_USERNAME bằng username GitHub của bạn)
git remote add origin https://github.com/YOUR_USERNAME/foodxplore.git

# Push lên GitHub
git branch -M main
git push -u origin main
```

> **Lưu ý**: File `.env.local` chứa credentials đã được ignore trong `.gitignore` rồi, nên không push lên GitHub.

---

## Bước 2: Deploy lên Vercel

### 2.1 Kết nối Vercel với GitHub

1. Truy cập [vercel.com](https://vercel.com) → **Sign Up** (đăng nhập bằng GitHub)
2. Click **Add New** → **Project**
3. Tìm repository `foodxplore` trong danh sách → Click **Import**
4. Cấu hình project:

```
Framework Preset:      Next.js
Root Directory:        ./
Build Command:         npm run build
Output Directory:      .next
Install Command:       npm install
```

### 2.2 Thêm Environment Variables

Trước khi deploy, thêm 3 biến môi trường:

Click **Environment Variables** và thêm từng dòng:

| Name | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | Production, Preview, Development (chỉ build & runtime) |

> **Lấy giá trị**: Vào Supabase Dashboard → **Settings** → **API**

### 2.3 Deploy

Click **Deploy** → Chờ 2-3 phút → Xong!

Sau khi deploy thành công, Vercel sẽ cho URL:
```
https://foodxplore.vercel.app
```

---

## Bước 3: Cấu hình GitHub Actions Secrets

Để crawler chạy tự động qua GitHub Actions, cần thêm secrets:

### 3.1 Thêm Secrets trong GitHub

1. Truy cập GitHub → Repository `foodxplore` → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** và thêm:

| Name | Value |
|---|---|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` |

3. Click **Add secret**

### 3.2 Kiểm tra crawler

Vào **Actions** tab trên GitHub → **Crawl News** → **Run workflow** để chạy thử crawler.

---

## Bước 4: Cấu hình Custom Domain (Tùy chọn)

Nếu bạn muốn dùng domain riêng (ví dụ: `foodxplore.vn`):

1. Mua domain từ [Namecheap](https://namecheap.com), [Porkbun](https://porkbun.com), hoặc [GoDaddy](https://godaddy.com)
2. Trong Vercel Dashboard → **Domains** → Nhập domain
3. Thêm DNS records theo hướng dẫn:
   - **CNAME**: `cname.vercel-dns.com` (subdomain)
   - **A record**: Vercel sẽ cung cấp IP

---

## Bước 5: Kiểm tra sau deploy

### 5.1 Trang chủ
- [ ] Website load đúng với logo FoodXplore
- [ ] Tin tức hiển thị (từ Supabase)
- [ ] Chuyển tab danh mục bên trái hoạt động
- [ ] Theme toggle sáng/tối hoạt động

### 5.2 API
- [ ] `https://foodxplore.vercel.app/api/articles` → trả về JSON articles
- [ ] `https://foodxplore.vercel.app/api/hot` → trả về tin hot nhất
- [ ] `https://foodxplore.vercel.app/api/sources` → trả về danh sách nguồn

### 5.3 SEO
- [ ] Title & description đúng
- [ ] Favicon hiển thị
- [ ] Font Inter tải đúng

---

## Cấu hình nâng cao

### Kích hoạt ISR (Incremental Static Regeneration)

Trang chủ tự động cập nhật mỗi 15 phút:

```typescript
// src/app/page.tsx
export const revalidate = 900; // 15 phút
```

Muốn thay đổi? Sửa giá trị này và push lại.

### Vercel Cron cho Crawler (thay thế GitHub Actions)

Nếu muốn crawler chạy trên Vercel thay vì GitHub Actions:

1. File `vercel.json` đã được cấu hình sẵn
2. Tạo API route `src/app/api/crawl/route.ts` để Vercel gọi:

```typescript
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Gọi crawler logic ở đây
    // Hoặc trigger Railway/外部 service
    return NextResponse.json({ status: 'ok', triggered_at: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

3. **Lưu ý**: Vercel Hobby giới hạn cron 2 lần/ngày — đủ cho 6h và 12h!

---

## Troubleshooting

### "Build failed"

Kiểm tra logs trong Vercel Dashboard → **Deployments** → Xem error chi tiết.

Thường gặp:
- Missing env variables → Thêm lại trong **Settings → Environment Variables**
- TypeScript errors → Chạy `npm run build` local để debug

### "404 trên trang"

Kiểm tra `NEXT_PUBLIC_SITE_URL` trong env variables.

### "CORS error"

Kiểm tra `next.config.js` đã có headers CORS hay chưa.

### Không thấy articles

1. Kiểm tra Supabase → `articles` table có dữ liệu chưa
2. Chạy `seed-demo.sql` để thêm demo data
3. Kiểm tra RLS policies trong Supabase

---

## Liên hệ hỗ trợ

Nếu gặp lỗi không giải quyết được, gửi thông tin:
- URL Vercel
- Screenshot lỗi
- Nội dung Vercel Build Logs
