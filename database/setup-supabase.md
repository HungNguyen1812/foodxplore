# Hướng Dẫn Cài Đặt Supabase

## Bước 1: Tạo Project Supabase

1. Truy cập [supabase.com](https://supabase.com) → Đăng nhập → **New Project**
2. Đặt tên: `foodxplore-db`
3. **Database Password**: Lưu lại password này!
4. **Region**: Singapore (gần nhất với Việt Nam)
5. Chờ project khởi tạo (~2 phút)

## Bước 2: Lấy API Credentials

Sau khi project tạo xong, vào **Settings** → **API**:

```
Project URL:       https://xxxxx.supabase.co
anon/public key:   eyJhbGc...           → NEXT_PUBLIC_SUPABASE_ANON_KEY
service_role key:  eyJhbGc...           → SUPABASE_SERVICE_ROLE_KEY
```

## Bước 3: Chạy Schema

### Cách 1: SQL Editor (Đơn giản nhất)

1. Trong Supabase Dashboard → **SQL Editor** → **New Query**
2. Copy toàn bộ nội dung `database/schema.sql` paste vào
3. Nhấn **Run** (phím tắt: `Ctrl+Enter`)
4. Chờ hoàn tất (~30 giây)

### Cách 2: CLI

```bash
npm install -g supabase
supabase login
supabase link --project-ref xxxxx
supabase db push
```

## Bước 4: Kiểm tra

Sau khi chạy schema, kiểm tra trong **Table Editor**:

- ✅ `categories` — 8 dòng (Tổng hợp → Nông nghiệp)
- ✅ `sources` — 33 dòng (VnExpress, Reuters, FDA...)
- ✅ `hot_keywords` — 20 dòng
- ✅ `settings` — 6 dòng
- ✅ `articles` — 0 dòng (sẽ có sau khi crawler chạy)
- ✅ `crawl_logs` — 0 dòng
- ✅ `v_hot_articles` — view đã tạo
- ✅ `v_source_stats` — view đã tạo

## Bước 5: Cấu hình Row Level Security (RLS)

Schema đã bật RLS. Kiểm tra:

1. Vào **Authentication** → **Policies**
2. Các bảng cần có policy:
   - `articles` → `Public read articles`
   - `categories` → `Public read categories`
   - `sources` → `Public read sources`
   - `hot_keywords` → `Public read hot_keywords`
   - `v_hot_articles` → `Public read articles` (kế thừa từ articles)
   - `v_source_stats` → `Public read sources` (kế thừa từ sources)

3. Để crawler ghi được dữ liệu, dùng **Service Role** (đã có `SUPABASE_SERVICE_ROLE_KEY`)

## Bước 6: Cấu hình Environment Variables

Tạo file `.env.local` trong thư mục project:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

## Bước 7: Bật Realtime (Optional)

Nếu muốn dùng realtime updates (tin mới xuất hiện ngay mà không cần reload):

1. **Database** → **Replication** → Bật cho bảng `articles`
2. Subscribe trong React component qua Supabase client

## Troubleshooting

### Lỗi: "permission denied"
→ Đảm bảo đang dùng **Service Role** key cho crawler, không phải anon key

### Lỗi: "relation does not exist"
→ Chạy lại schema.sql từ SQL Editor

### Lỗi: RLS blocks reads
→ Kiểm tra Policies trong Supabase Dashboard → Authentication → Policies

### Không thấy dữ liệu categories.article_count
→ Cột này được cập nhật tự động bởi trigger khi có bài viết mới

## Các bảng và quyền

| Bảng | Public Read | Crawler Write |
|---|---|---|
| articles | ✅ | ✅ (service role) |
| categories | ✅ | ❌ |
| sources | ✅ | ✅ (service role) |
| hot_keywords | ✅ | ✅ (service role) |
| crawl_logs | ✅ | ✅ (service role) |
| settings | ❌ | ✅ (service role) |
| v_hot_articles | ✅ (kế thừa) | — |
| v_source_stats | ✅ (kế thừa) | — |
