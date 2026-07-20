# HƯỚNG DẪN DEPLOY FOODXPLORE — TỪNG BƯỚC CHI TIẾT

> Thời gian ước tính: **30-45 phút**
> Chi phí: **0đ** (miễn phí hoàn toàn)

---

## BƯỚC 1: ĐĂNG KÝ TÀI KHOẢN

### 1.1. GitHub (lưu trữ code)

1. Mở trình duyệt → Truy cập: **https://github.com**
2. Click **Sign up**
3. Nhập email → **Create account**
4. Điền thông tin:
   - Username: (ví dụ: `hungnguyen123`) — **GHI NHỚ username này**
   - Password: (đặt mạnh)
   - Email: email của bạn
5. Verify email → Xong

### 1.2. Vercel (hosting website)

1. Mở trình duyệt → Truy cập: **https://vercel.com**
2. Click **Sign Up**
3. Chọn **Continue with GitHub** (nhanh nhất)
4. Cho phép Vercel truy cập GitHub → **Authorize Vercel**
5. Xong — đã đăng nhập Vercel bằng GitHub

### 1.3. Supabase (database — NẾU CHƯA CÓ)

1. Mở trình duyệt → Truy cập: **https://supabase.com**
2. Click **Start your project**
3. Đăng nhập bằng GitHub (nhanh nhất)
4. Click **New project**
5. Điền thông tin:
   - Organization: (chọn personal)
   - Name: `foodxplore`
   - Database Password: **GHI NHỚ password này**
   - Region: **Singapore**
6. Click **Create new project** → Chờ 2 phút tạo xong

---

## BƯỚC 2: LẤY API KEYS TỪ SUPABASE

Sau khi Supabase project tạo xong:

1. Trong Supabase Dashboard → Click **Settings** (biểu tượng ⚙️ ở góc dưới trái)
2. Click **API**
3. Bạn sẽ thấy 3 giá trị quan trọng:

```
Project URL:        https://xxxxx.supabase.co    ← Copy
anon public key:    eyJhbGc...                  ← Copy
service_role key:   eyJhbGc...                  ← Copy
```

4. **Mở Notepad** → Paste cả 3 giá trị này vào → Lưu lại (sẽ cần dùng ở bước 4)

---

## BƯỚC 3: TẠO GITHUB REPOSITORY VÀ PUSH CODE

### 3.1. Tạo Repository trên GitHub

1. Đăng nhập **github.com**
2. Click dấu **+** (góc trên phải) → **New repository**
3. Điền thông tin:
   - Owner: (username của bạn)
   - Repository name: `foodxplore`
   - Description: `FoodXplore — Discover what shapes food`
   - Visibility: **Public** hoặc **Private** đều được
   - ✅ **KHÔNG tick** "Add a README file"
4. Click **Create repository**
5. Bạn sẽ thấy trang mới với URL, ví dụ:
   `https://github.com/hungnguyen123/foodxplore`
   → Trang này đang trống, sẽ chứa code của bạn

### 3.2. Push code lên GitHub

Mở **Command Prompt** hoặc **PowerShell** trên máy tính:

```cmd
cd "D:\Claude\Projects\Own website"
git init
git add .
git commit -m "FoodXplore v1.0"
git branch -M main
git remote add origin https://github.com/hungnguyen123/foodxplore.git
git push -u origin main
```

> **Thay `hungnguyen123` bằng username GitHub của bạn ở bước 1.1**

6. Refresh trang GitHub → Bạn sẽ thấy code đã được push lên!

---

## BƯỚC 4: KẾT NỐI VERCEL VÀ DEPLOY

### 4.1. Import GitHub Repository vào Vercel

1. Đăng nhập **vercel.com**
2. Click **Add New** → **Project**
3. Tìm repository `foodxplore` trong danh sách → Click **Import**
4. Cấu hình sẵn sàng (thường Vercel tự detect đúng):
   ```
   Framework Preset:    Next.js ✅
   Root Directory:     ./
   Build Command:      npm run build  ✅
   Output Directory:   .next  ✅
   Environment Variables: (sẽ thêm ở bước 4.2)
   ```
5. Click **Environment Variables**

### 4.2. Thêm Environment Variables

Click **Add** cho từng biến:

| Variable | Value (thay bằng giá trị từ Bước 2) |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` |

6. Click **Save**
7. ✅ Tick chọn "Yes" cho cả **Production**, **Preview**, **Development**
8. Click **Deploy**

### 4.3. Đợi deploy

- Vercel sẽ hiển thị tiến trình build
- Chờ **2-3 phút**
- Khi thấy ✅ **Ready** → Click vào URL:
  ```
  https://foodxplore-xxxx.vercel.app
  ```

### 4.4. Đổi tên (tùy chọn)

1. Trong Vercel Dashboard → **Settings** → **General**
2. Click bút chì bên cạnh **Project Name**
3. Đổi thành: `foodxplore`
4. URL sẽ thành: `https://foodxplore.vercel.app`

---

## BƯỚC 5: CHẠY SCHEMA SQL TRONG SUPABASE

### 5.1. Mở SQL Editor

1. Quay lại **Supabase Dashboard**
2. Click **SQL Editor** trong menu bên trái
3. Click **New Query**

### 5.2. Chạy Schema

1. Copy toàn bộ nội dung file `database/schema.sql`
   - Mở file: `D:\Claude\Projects\Own website\database\schema.sql`
   - Select all (Ctrl+A) → Copy (Ctrl+C)
2. Paste vào SQL Editor
3. Click **Run** (phím tắt: Ctrl+Enter)
4. Chờ ~30 giây → Thấy thông báo "Success"

### 5.3. (Tùy chọn) Thêm demo data

1. Click **New Query** lần nữa
2. Copy nội dung file `database/seed-demo.sql`
3. Paste vào SQL Editor
4. Click **Run**
5. 14 bài viết demo sẽ được thêm vào

### 5.4. Kiểm tra dữ liệu

1. Click **Table Editor** trong menu bên trái
2. Click **categories** → Thấy 8 dòng ✅
3. Click **sources** → Thấy 33 dòng ✅
4. Click **articles** → Thấy 14 dòng (nếu chạy seed-demo) ✅

---

## BƯỚC 6: CẤU HÌNH GITHUB ACTIONS CHO CRAWLER

### 6.1. Thêm Secrets vào GitHub

1. Quay lại **github.com** → Repository `foodxplore`
2. Click **Settings** (biểu tượng ⚙️)
3. Trong menu bên trái → Click **Secrets and variables** → **Actions**
4. Click **New repository secret** (2 lần cho 2 biến):

**Secret 1:**
- Name: `SUPABASE_URL`
- Secret: `https://xxxxx.supabase.co` (từ Bước 2)
- Click **Add secret**

**Secret 2:**
- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Secret: `eyJhbGc...` (từ Bước 2)
- Click **Add secret**

### 6.2. Kiểm tra crawler

1. Trong repository → Click **Actions** (menu bên trái)
2. Click **Crawl News** workflow
3. Click **Run workflow** → **Run workflow**
4. Chờ ~5 phút → Kiểm tra log xem có lỗi không

---

## BƯỚC 7: KIỂM TRA WEBSITE

Mở trình duyệt → Truy cập website của bạn:

```
https://foodxplore.vercel.app
```

Kiểm tra:
- [ ] Logo FoodXplore hiển thị
- [ ] Tin tức hiển thị (từ Supabase)
- [ ] Click tab danh mục bên trái → chuyển tin
- [ ] Click 🌙/☀️ góc phải → đổi theme

Kiểm tra API:
- [ ] `https://foodxplore.vercel.app/api/articles` → Thấy JSON
- [ ] `https://foodxplore.vercel.app/api/hot` → Thấy tin hot

---

## XỬ LÝ LỖI THƯỜNG GẶP

### Lỗi: "Table not found"
→ Quay lại Bước 5 → Chạy lại schema.sql trong SQL Editor

### Lỗi: "Permission denied" khi đọc dữ liệu
→ Kiểm tra RLS policies trong Supabase:
   - Vào **Authentication** → **Policies**
   - Đảm bảo có policy "Public read" cho articles, categories, sources

### Lỗi: Trang trắng sau deploy
→ Kiểm tra Environment Variables trong Vercel:
   - Vào **Settings** → **Environment Variables**
   - Đảm bảo 3 biến đã được thêm đúng

### Lỗi: Không có tin hiển thị
→ Chạy seed-demo.sql ở Bước 5.3 để thêm 14 bài demo

---

## CẬP NHẬT CODE SAU NÀY

Mỗi khi bạn thay đổi code trong thư mục project:

```cmd
cd "D:\Claude\Projects\Own website"
git add .
git commit -m "Mô tả thay đổi"
git push
```

→ Vercel sẽ tự động deploy lại!

---

## LIÊN HỆ HỖ TRỢ

Nếu gặp lỗi không giải quyết được, gửi cho mình:
1. URL website của bạn
2. Screenshot lỗi
3. Nội dung trong Vercel Build Logs (vào **Deployments** → Click deployment gần nhất → **Logs**)
