# Setup Checklist — FoodXplore

## ✅ Đã hoàn thành phần này (bạn không cần làm gì)

- [x] Schema SQL đầy đủ (6 bảng, 12 indexes, 4 triggers, 4 views, seed data)
- [x] Hàm tính hot_score (`calculate_article_hot_score`)
- [x] Hướng dẫn cài đặt Supabase chi tiết
- [x] Seed demo data (14 bài viết để test)
- [x] Supabase client files (browser/server/admin)
- [x] Script kiểm tra kết nối

---

## 📋 Checklist của bạn — Cần thực hiện

### A. Tạo Supabase Project
- [ ] Truy cập [supabase.com](https://supabase.com) → **New Project**
- [ ] Đặt tên: `foodxplore`
- [ ] Region: Singapore
- [ ] Lưu lại **Database Password**

### B. Lấy API Credentials
Sau khi project tạo xong, vào **Settings → API**:

- [ ] Copy **Project URL** → `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Copy **anon public key** → `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Copy **service_role key** → `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

### C. Chạy Schema SQL
1. Mở **SQL Editor** trong Supabase Dashboard
2. Copy toàn bộ nội dung `database/schema.sql` → paste → **Run**
3. Chờ hoàn tất (~30s)

### D. (Tùy chọn) Chạy Demo Data
Nếu muốn test trước khi có crawler:
1. Mở **SQL Editor** trong Supabase
2. Copy nội dung `database/seed-demo.sql` → paste → **Run**

### E. Kiểm tra
Trong **Table Editor** của Supabase, kiểm tra:

| Bảng | Số dòng mong đợi |
|---|---|
| categories | 8 |
| sources | 33 |
| hot_keywords | 20 |
| settings | 6 |
| articles (sau seed) | 14 |

### F. Deploy Vercel
1. Push code lên GitHub
2. Vào [vercel.com](https://vercel.com) → **New Project** → Import GitHub repo
3. Thêm Environment Variables trong Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy** → Chờ ~2 phút

### G. (Sau khi deploy) Chạy thử
- Mở website → Kiểm tra trang chủ load đúng
- Kiểm tra chuyển tab danh mục bên trái hoạt động
- Kiểm tra theme toggle sáng/tối

---

## 🆘 Nếu gặp lỗi

### "Table not found"
→ Chạy lại `schema.sql` trong SQL Editor

### "Permission denied"
→ Dùng **service_role key**, không phải anon key

### "RLS policy denied"
→ Kiểm tra policies trong **Authentication → Policies**
→ Cần có `Public read articles`, `Public read categories`, v.v.

### Website trắng sau deploy
→ Kiểm tra Environment Variables trong Vercel Dashboard
→ Đảm bảo cả 3 biến đã được thêm
