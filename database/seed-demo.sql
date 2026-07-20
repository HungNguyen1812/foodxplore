-- ============================================================
-- SEED DEMO DATA — Dữ liệu mẫu để test frontend
-- Chạy sau khi đã chạy schema.sql xong
-- ============================================================

-- Xóa demo data cũ (nếu có)
DELETE FROM articles WHERE title LIKE '%Vinamilk%' OR title LIKE '%Coca-Cola%' OR title LIKE '%VinMart%';

-- Insert 14 bài viết demo (cùng dữ liệu với prototype)
INSERT INTO articles (title, link, summary, source_id, source_name, source_country, category_id, category_slug, category_name, pub_date, hot_score, is_hot, image_url, is_crawled, is_processed) VALUES

-- KINH DOANH (3 bài)
(
  'Vinamilk công bố kế hoạch mở rộng 5 nhà máy mới tại miền Trung và Tây Nguyên',
  'https://vnexpress.net/vinamilk-mo-rong-nha-may-2026',
  'Vinamilk vừa công bố kế hoạch đầu tư 8.500 tỷ đồng xây 5 nhà máy sữa tại miền Trung và Tây Nguyên giai đoạn 2026–2028, nhằm đáp ứng nhu cầu tiêu dùng tăng 12%/năm tại khu vực.',
  (SELECT id FROM sources WHERE short_name='VnExpress'),
  'VnExpress', 'vn',
  (SELECT id FROM categories WHERE slug='kinh-doanh'),
  'kinh-doanh', 'Kinh doanh',
  NOW() - INTERVAL '2 hours',
  92.5, true,
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
  true, true
),
(
  'Coca-Cola Việt Nam đầu tư 200 triệu USD xây nhà máy tại Bình Dương',
  'https://vneconomy.vn/coca-cola-binh-duong-2026',
  'Coca-Cola được cấp phép xây nhà máy thứ 4 tại Việt Nam với vốn 200 triệu USD tại KCN Bình Dương, dự kiến vận hành từ Q3/2027.',
  (SELECT id FROM sources WHERE short_name='VNE'),
  'VnEconomy', 'vn',
  (SELECT id FROM categories WHERE slug='kinh-doanh'),
  'kinh-doanh', 'Kinh doanh',
  NOW() - INTERVAL '45 minutes',
  87.3, true,
  'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200&h=160&fit=crop',
  true, true
),
(
  'Masan đóng cửa 12 siêu thị VinMart, tập trung mô hình mini tại đô thị',
  'https://vietnamnet.vn/masan-dong-cua-vinmart-2026',
  'Masan Group thông báo đóng cửa 12 siêu thị VinMart không hiệu quả, chuyển hướng sang mô hình VinMart+ mini phù hợp với khu dân cư đô thị.',
  (SELECT id FROM sources WHERE short_name='VNN'),
  'VietnamNet', 'vn',
  (SELECT id FROM categories WHERE slug='kinh-doanh'),
  'kinh-doanh', 'Kinh doanh',
  NOW() - INTERVAL '3 hours',
  64.2, false,
  'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=200&h=160&fit=crop',
  true, true
),

-- ATTP (2 bài)
(
  'FDA cảnh báo 12 loại thực phẩm chức năng chứa chất cấm tại Hoa Kỳ',
  'https://fda.gov/recall-warning-2026',
  'Cơ quan Quản lý Thực phẩm và Dược phẩm Hoa Kỳ đưa ra cảnh báo khẩn về 12 sản phẩm thực phẩm chức năng bán trực tuyến chứa thành phần dược phẩm chưa được phê duyệt.',
  (SELECT id FROM sources WHERE short_name='FDA'),
  'FDA', 'intl',
  (SELECT id FROM categories WHERE slug='an-toan-thuc-pham'),
  'an-toan-thuc-pham', 'An toàn thực phẩm',
  NOW() - INTERVAL '1 hour',
  94.1, true,
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=160&fit=crop',
  true, true
),
(
  'Cục ATTP phát hiện 3 cơ sở bánh trung thu dùng nguyên liệu quá hạn',
  'https://vfa.gov.vn/kiem-tra-trung-thu-2026',
  'Đợt kiểm tra cao điểm trước mùa Trung thu, Cục ATTP phát hiện 3 cơ sở tại TP.HCM dùng nguyên liệu quá hạn, xử phạt tổng 250 triệu đồng.',
  (SELECT id FROM sources WHERE short_name='ATTP'),
  'Cục ATTP', 'vn',
  (SELECT id FROM categories WHERE slug='an-toan-thuc-pham'),
  'an-toan-thuc-pham', 'An toàn thực phẩm',
  NOW() - INTERVAL '5 hours',
  78.5, false,
  'https://images.unsplash.com/photo-1568376794508-ae52d6c7d05f?w=200&h=160&fit=crop',
  true, true
),

-- GIÁ CẢ (2 bài)
(
  'Giá cà phê robusta tăng 18% trong tháng 7 do thiếu hụt nguồn cung Brazil',
  'https://bloomberg.com/coffee-price-2026',
  'Giá cà phê robusta thế giới tăng 18% trong tháng 7, chạm đỉnh 2 năm, do Brazil — nước sản xuất lớn nhất — chịu ảnh hưởng nặng bởi hạn hán kéo dài.',
  (SELECT id FROM sources WHERE short_name='Bloomberg'),
  'Bloomberg', 'intl',
  (SELECT id FROM categories WHERE slug='gia-ca'),
  'gia-ca', 'Giá cả',
  NOW() - INTERVAL '2 hours',
  79.5, false,
  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=200&h=160&fit=crop',
  true, true
),
(
  'Giá lúa gạo xuất khẩu Việt Nam tăng 12% đạt đỉnh 3 năm',
  'https://vietfood.org/gia-gao-2026',
  'Theo VFA, giá gạo xuất khẩu loại 5% tấm đạt 638 USD/tấn — mức cao nhất kể từ năm 2023, do nhu cầu tăng mạnh từ châu Á và châu Phi.',
  (SELECT id FROM sources WHERE short_name='VFA'),
  'VFA', 'vn',
  (SELECT id FROM categories WHERE slug='gia-ca'),
  'gia-ca', 'Giá cả',
  NOW() - INTERVAL '4 hours',
  71.8, false,
  'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&h=160&fit=crop',
  true, true
),

-- CÔNG NGHỆ (2 bài)
(
  'Nestlé ứng dụng AI trong quản lý chuỗi cung ứng tại Đông Nam Á',
  'https://foodnavigator.com/nestle-ai-sea-2026',
  'Nestlé triển khai nền tảng AI của Google Cloud để tối ưu chuỗi cung ứng tại 6 quốc gia Đông Nam Á, giúp giảm 23% lãng phí thực phẩm trong vận chuyển.',
  (SELECT id FROM sources WHERE short_name='FN'),
  'FoodNavigator', 'intl',
  (SELECT id FROM categories WHERE slug='cong-nghe'),
  'cong-nghe', 'Công nghệ',
  NOW() - INTERVAL '3 hours',
  72.8, false,
  'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=200&h=160&fit=crop',
  true, true
),
(
  'Startup Việt Nam ra mắt ứng dụng truy xuất nguồn gốc rau quả bằng QR',
  'https://vnexpress.net/freshtrace-qr-2026',
  'FreshTrace — startup tại Hà Nội — ra mắt ứng dụng cho phép người tiêu dùng quét QR truy xuất nguồn gốc rau quả từ trang trại đến cửa hàng trong 2 giây.',
  (SELECT id FROM sources WHERE short_name='VnExpress'),
  'VnExpress', 'vn',
  (SELECT id FROM categories WHERE slug='cong-nghe'),
  'cong-nghe', 'Công nghệ',
  NOW() - INTERVAL '6 hours',
  56.4, false,
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=160&fit=crop',
  true, true
),

-- QUY ĐỊNH (1 bài)
(
  'Bộ Y Tế ban hành quy định mới về dán nhãn dinh dưỡng thực phẩm đóng gói',
  'https://vfa.gov.vn/thong-tu-nhan-dinh-duong-2026',
  'Bộ Y Tế ban hành Thông tư 15/2026/TT-BYT quy định nhãn dinh dưỡng bắt buộc trên thực phẩm đóng gói, có hiệu lực từ 01/01/2027.',
  (SELECT id FROM sources WHERE short_name='ATTP'),
  'Cục ATTP', 'vn',
  (SELECT id FROM categories WHERE slug='quy-dinh'),
  'quy-dinh', 'Quy định',
  NOW() - INTERVAL '4 hours',
  81.2, false,
  'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=200&h=160&fit=crop',
  true, true
),

-- SỨC KHỎE (2 bài)
(
  'Xu hướng "protein thực vật" tăng 45% tại thị trường Việt Nam năm 2025',
  'https://vnexpress.net/protein-thuc-vat-vn-2026',
  'Theo Euromonitor, thị trường protein thực vật tại Việt Nam tăng 45% trong năm 2025, đạt 2.3 tỷ USD — phản ánh sự chuyển dịch mạnh trong thói quen tiêu dùng.',
  (SELECT id FROM sources WHERE short_name='VnExpress'),
  'VnExpress', 'vn',
  (SELECT id FROM categories WHERE slug='suc-khoe'),
  'suc-khoe', 'Sức khỏe',
  NOW() - INTERVAL '5 hours',
  68.4, false,
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=160&fit=crop',
  true, true
),
(
  'WHO cảnh báo mức tiêu thụ đường toàn cầu vượt ngưỡng khuyến nghị 250%',
  'https://reuters.com/who-sugar-warning-2026',
  'Báo cáo WHO cho thấy lượng đường tiêu thụ trung bình toàn cầu cao hơn 250% so với khuyến nghị, đặc biệt ở trẻ em, đe dọa béo phì và tiểu đường gia tăng.',
  (SELECT id FROM sources WHERE short_name='Reuters'),
  'Reuters', 'intl',
  (SELECT id FROM categories WHERE slug='suc-khoe'),
  'suc-khoe', 'Sức khỏe',
  NOW() - INTERVAL '8 hours',
  75.0, false,
  'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=200&h=160&fit=crop',
  true, true
),

-- NÔNG NGHIỆP (2 bài)
(
  'Vietnam overtakes Thailand as world''s second largest rice exporter',
  'https://reuters.com/vietnam-rice-export-2026',
  'Việt Nam vượt Thái Lan trở thành nước xuất khẩu gạo lớn thứ hai thế giới, với khối lượng 4.7 triệu tấn trong 6 tháng đầu 2026, tăng 22% cùng kỳ năm ngoái.',
  (SELECT id FROM sources WHERE short_name='Reuters'),
  'Reuters', 'intl',
  (SELECT id FROM categories WHERE slug='nong-nghiep'),
  'nong-nghiep', 'Nông nghiệp',
  NOW() - INTERVAL '6 hours',
  88.9, true,
  'https://images.unsplash.com/photo-1568347355280-d33fdf77d42a?w=200&h=160&fit=crop',
  true, true
),
(
  'ĐBSCL chuyển đổi 50.000 ha sang canh tác lúa hữu cơ giai đoạn 2026–2030',
  'https://nongnghiep.vn/dbscl-lua-huu-co-2026',
  'Bộ Nông nghiệp thông báo kế hoạch chuyển đổi 50.000 ha đất lúa tại Đồng bằng sông Cửu Long sang mô hình hữu cơ trong 5 năm tới.',
  (SELECT id FROM sources WHERE short_name='NNVN'),
  'Nông Nghiệp Việt Nam', 'vn',
  (SELECT id FROM categories WHERE slug='nong-nghiep'),
  'nong-nghiep', 'Nông nghiệp',
  NOW() - INTERVAL '7 hours',
  62.3, false,
  'https://images.unsplash.com/photo-1530507629858-e3759c289668?w=200&h=160&fit=crop',
  true, true
)
ON CONFLICT (link) DO NOTHING;

-- Cập nhật article_count cho từng category
UPDATE categories SET article_count = (
  SELECT COUNT(*) FROM articles WHERE articles.category_id = categories.id AND is_archived = FALSE
);

-- Cập nhật articles_count cho từng source
UPDATE sources SET articles_count = (
  SELECT COUNT(*) FROM articles WHERE articles.source_id = sources.id AND is_archived = FALSE
);

-- Kiểm tra
SELECT 'Categories:' AS info, COUNT(*) AS count FROM categories
UNION ALL
SELECT 'Sources:', COUNT(*) FROM sources
UNION ALL
SELECT 'Articles:', COUNT(*) FROM articles
UNION ALL
SELECT 'Hot keywords:', COUNT(*) FROM hot_keywords;
