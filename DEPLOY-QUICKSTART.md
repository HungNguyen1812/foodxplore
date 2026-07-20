# Deploy Nhanh — FoodXplore

## Chuẩn bị (30 phút)

### 1. Supabase (15 phút)

```
1. Vào supabase.com → New Project → Đặt tên "foodxplore-db"
2. Chờ tạo xong → Settings → API → Copy 3 keys:
   - Project URL
   - anon public key
   - service_role key
3. SQL Editor → Paste schema.sql → Run
4. (Tùy chọn) SQL Editor → Paste seed-demo.sql → Run (thêm 14 bài test)
```

### 2. GitHub Repository (5 phút)

```
1. github.com → New repo → "foodxplore" (Private)
2. Mở terminal, cd vào thư mục project:
   
   cd "D:\Claude\Projects\Own website"
   git init
   git add .
   git commit -m "FoodXplore v1.0"
   git remote add origin https://github.com/YOUR_USERNAME/foodxplore.git
   git push -u origin main
```

### 3. Vercel (10 phút)

```
1. vercel.com → Sign in with GitHub → Add New Project
2. Import "foodxplore" repo
3. Framework: Next.js (auto-detect)
4. Environment Variables → Add 3 biến:
   - NEXT_PUBLIC_SUPABASE_URL = https://xxx.supabase.co
   - NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbG...
   - SUPABASE_SERVICE_ROLE_KEY = eyJhbG...
5. Deploy → Đợi 2-3 phút
6. Xong! Website sẽ có URL: https://foodxplore.vercel.app
```

### 4. GitHub Actions Secrets (5 phút)

```
1. github.com → foodxplore repo → Settings → Secrets → Actions
2. New secret:
   - Name: SUPABASE_URL → Value: https://xxx.supabase.co
   - Name: SUPABASE_SERVICE_ROLE_KEY → Value: eyJhbG...
3. Done! Crawler sẽ tự chạy vào 6h và 12h hàng ngày
```

---

## Kiểm tra sau deploy

```
✅ https://foodxplore.vercel.app              → Trang chủ
✅ https://foodxplore.vercel.app/api/articles → JSON articles
✅ https://foodxplore.vercel.app/api/hot      → Tin hot nhất
✅ https://foodxplore.vercel.app/api/sources  → Danh sách nguồn
```

## Thời gian ước tính: 30-45 phút

Mọi thứ miễn phí — không cần trả tiền.
