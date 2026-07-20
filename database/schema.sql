-- ============================================================
-- DATABASE SCHEMA — Website Tổng Hợp Tin Ngành Thực Phẩm
-- Database: Supabase (PostgreSQL)
-- Phiên bản: 1.0 | Ngày: 2026-07-19
-- ============================================================

-- ============================================================
-- 1. BẢNG categories — Phân loại tin tức
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,          -- Tên hiển thị: "Kinh doanh"
    slug VARCHAR(100) UNIQUE NOT NULL,  -- URL slug: "kinh-doanh"
    icon VARCHAR(50),                    -- Icon emoji hoặc tên icon
    color VARCHAR(7) DEFAULT '#16a34a',  -- Màu chủ đạo (hex)
    description TEXT,                    -- Mô tả ngắn
    sort_order INT DEFAULT 0,           -- Thứ tự sắp xếp
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. BẢNG sources — Nguồn báo (Feed)
-- ============================================================
CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,           -- Tên đầy đủ: "FoodNavigator"
    short_name VARCHAR(50),              -- Tên viết tắt: "FN"
    url VARCHAR(500) NOT NULL,            -- URL trang chủ
    feed_url VARCHAR(500),               -- URL RSS feed (NULL nếu dùng scraping)
    feed_type VARCHAR(20) DEFAULT 'rss', -- 'rss' | 'scraping' | 'api'
    country VARCHAR(10) DEFAULT 'intl',  -- 'vn' | 'intl'
    category_id UUID REFERENCES categories(id),
    credibility_score INT DEFAULT 5 CHECK (credibility_score BETWEEN 1 AND 10),
    -- Điểm uy tín:
    -- 10 = Reuters, Bloomberg, FDA, FAO
    -- 8  = FoodNavigator, FoodBusinessNews, VnExpress
    -- 6  = Tuổi Trẻ, Thanh Niên, Food Safety Magazine
    -- 4  = Blog, trang nhỏ
    language VARCHAR(10) DEFAULT 'vi',   -- 'vi' | 'en'
    favicon_url TEXT,
    last_fetched TIMESTAMPTZ,
    articles_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. BẢNG articles — Bài viết
-- ============================================================
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    link VARCHAR(1000) UNIQUE NOT NULL,  -- URL gốc, dùng làm unique key
    summary TEXT,                        -- Mô tả ngắn (từ RSS hoặc scrape)
    content_preview TEXT,                -- Preview 200 ký tự đầu (tùy chọn)
    
    -- Nguồn
    source_id UUID REFERENCES sources(id),
    source_name VARCHAR(200),           -- Denormalized để query nhanh
    source_country VARCHAR(10),          -- 'vn' | 'intl'
    
    -- Phân loại
    category_id UUID REFERENCES categories(id),
    category_slug VARCHAR(100),          -- Denormalized
    category_name VARCHAR(100),          -- Denormalized
    
    -- Hình ảnh
    image_url TEXT,
    image_thumb TEXT,                    -- Phiên bản thumbnail (đã resize)
    
    -- Thời gian
    pub_date TIMESTAMPTZ,               -- Thời gian đăng bài gốc
    fetched_at TIMESTAMPTZ DEFAULT NOW(),-- Thời gian crawler lấy về
    
    -- Xếp hạng nóng
    hot_score FLOAT DEFAULT 0,           -- Điểm nóng (0-200)
    is_hot BOOLEAN DEFAULT FALSE,        -- Đánh dấu tin nóng (top 5%)
    
    -- Meta
    keywords TEXT[],                     -- Mảng từ khóa để lọc/tìm kiếm
    read_time INT,                       -- Thời gian đọc ước tính (phút)
    language VARCHAR(10) DEFAULT 'vi',
    
    -- Trạng thái
    is_featured BOOLEAN DEFAULT FALSE,
    is_processed BOOLEAN DEFAULT FALSE,  -- Đã xử lý (phân loại, tính score)
    is_archived BOOLEAN DEFAULT FALSE,   -- Đã lưu trữ (bài quá 30 ngày)
    
    -- SEO
    slug VARCHAR(500),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. BẢNG hot_keywords — Từ khóa trending
-- ============================================================
CREATE TABLE IF NOT EXISTS hot_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword VARCHAR(100) UNIQUE NOT NULL,
    weight INT DEFAULT 5 CHECK (weight BETWEEN 1 AND 10),
    -- Trọng số:
    -- 10 = breaking, recall, banned, lạm phát
    -- 8  = M&A, IPO, đình công, thiếu hụt
    -- 6  = tăng giá, quy định mới, đổi mới
    -- 4  = xu hướng, dự báo, nghiên cứu
    -- 2  = từ khóa chung
    category_id UUID REFERENCES categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    article_count_7d INT DEFAULT 0,     -- Số bài trong 7 ngày gần đây
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. BẢNG crawl_logs — Nhật ký hoạt động crawler
-- ============================================================
CREATE TABLE IF NOT EXISTS crawl_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_id UUID REFERENCES sources(id),
    feed_name VARCHAR(200),
    status VARCHAR(20) DEFAULT 'running', -- 'running' | 'success' | 'error' | 'partial'
    articles_fetched INT DEFAULT 0,
    articles_new INT DEFAULT 0,
    articles_duplicates INT DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INT,                    -- Thời gian chạy (milliseconds)
    error_message TEXT,
    http_status_code INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. BẢNG settings — Cấu hình hệ thống
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES — Tối ưu hiệu năng truy vấn
-- ============================================================

-- Index cho trang chủ: sắp xếp theo điểm nóng
CREATE INDEX IF NOT EXISTS idx_articles_hot_score 
    ON articles(hot_score DESC) 
    WHERE is_archived = FALSE AND is_hot = TRUE;

-- Index cho trang tin mới: sắp xếp theo thời gian
CREATE INDEX IF NOT EXISTS idx_articles_pub_date 
    ON articles(pub_date DESC) 
    WHERE is_archived = FALSE;

-- Index cho lọc danh mục
CREATE INDEX IF NOT EXISTS idx_articles_category 
    ON articles(category_id, hot_score DESC) 
    WHERE is_archived = FALSE;

-- Index cho lọc quốc gia
CREATE INDEX IF NOT EXISTS idx_articles_country 
    ON articles(source_country, hot_score DESC) 
    WHERE is_archived = FALSE;

-- Index cho kiểm tra trùng lặp (quan trọng!)
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_link 
    ON articles(link);

-- Index cho tìm kiếm full-text
CREATE INDEX IF NOT EXISTS idx_articles_title_search 
    ON articles USING gin(to_tsvector('vietnamese', title));

CREATE INDEX IF NOT EXISTS idx_articles_summary_search 
    ON articles USING gin(to_tsvector('vietnamese', summary));

-- Index cho nguồn feed
CREATE INDEX IF NOT EXISTS idx_sources_active 
    ON sources(is_active, country) 
    WHERE is_active = TRUE;

-- Index cho hot keywords
CREATE INDEX IF NOT EXISTS idx_hot_keywords_weight 
    ON hot_keywords(weight DESC) 
    WHERE is_active = TRUE;

-- Index cho crawl logs
CREATE INDEX IF NOT EXISTS idx_crawl_logs_feed 
    ON crawl_logs(feed_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_crawl_logs_status 
    ON crawl_logs(status, started_at DESC);

-- ============================================================
-- TRIGGERS — Tự động cập nhật
-- ============================================================

-- Trigger: tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Áp dụng trigger cho các bảng chính
CREATE TRIGGER trigger_articles_updated
    BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_sources_updated
    BEFORE UPDATE ON sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_categories_updated
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_hot_keywords_updated
    BEFORE UPDATE ON hot_keywords
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: tự động cập nhật articles_count trong categories
CREATE OR REPLACE FUNCTION update_category_article_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE categories SET 
            (SELECT COUNT(*) FROM articles WHERE category_id = NEW.category_id)
        WHERE id = NEW.category_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE categories SET article_count = article_count - 1
        WHERE id = OLD.category_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_article_count_category
    AFTER INSERT OR DELETE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_category_article_count();

-- Trigger: tự động cập nhật articles_count trong sources
CREATE OR REPLACE FUNCTION update_source_article_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE sources SET articles_count = articles_count + 1
        WHERE id = NEW.source_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE sources SET articles_count = articles_count - 1
        WHERE id = OLD.source_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_article_count_source
    AFTER INSERT OR DELETE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_source_article_count();

-- ============================================================
-- SEED DATA — Dữ liệu khởi tạo
-- ============================================================

-- 1. Insert categories
INSERT INTO categories (name, slug, icon, color, description, sort_order) VALUES
('Tổng hợp', 'tong-hop', '📋', '#6b7280', 'Tin tức tổng hợp từ mọi nguồn', 0),
('Kinh doanh', 'kinh-doanh', '💼', '#2563eb', 'Doanh nghiệp, M&A, thị trường, cổ phiếu F&B', 1),
('An toàn thực phẩm', 'an-toan-thuc-pham', '🛡️', '#dc2626', 'Cảnh báo, thu hồi, kiểm nghiệm, vi phạm ATTP', 2),
('Giá cả & Xuất nhậ khẩu', 'gia-ca', '📊', '#d97706', 'Biến động giá, thị trường hàng hóa, xuất nhậ khẩu', 3),
('Công nghệ & Đổi mới', 'cong-nghe', '⚡', '#7c3aed', 'Food tech, AI, automation, đổi mới sáng tạo', 4),
('Quy định & Chính sách', 'quy-dinh', '📜', '#0891b2', 'FDA, EFSA, Bộ Y Tế, tiêu chuẩn, chứng nhận', 5),
('Sức khỏe & Dinh dưỡng', 'suc-khoe', '🥗', '#16a34a', 'Xu hướng tiêu dùng, dinh dưỡng, sản phẩm mới', 6),
('Nông nghiệp & Chuỗi cung ứng', 'nong-nghiep', '🌾', '#65a30d', 'Nguyên liệu, vùng nguyên liệu, logistics, chăn nuôi', 7)
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert sources (50 nguồn)
INSERT INTO sources (name, short_name, url, feed_type, country, category_id, credibility_score, language) VALUES
-- VIỆT NAM — Báo chung
('VnExpress', 'VnExpress', 'https://vnexpress.net', 'rss', 'vn', (SELECT id FROM categories WHERE slug='tong-hop'), 8, 'vi'),
('VietnamNet', 'VNN', 'https://vietnamnet.vn', 'rss', 'vn', (SELECT id FROM categories WHERE slug='tong-hop'), 7, 'vi'),
('Thanh Niên', 'TN', 'https://thanhnien.vn', 'rss', 'vn', (SELECT id FROM categories WHERE slug='tong-hop'), 7, 'vi'),
('Tuổi Trẻ', 'TT', 'https://tuoitre.vn', 'rss', 'vn', (SELECT id FROM categories WHERE slug='tong-hop'), 7, 'vi'),
('VTV', 'VTV', 'https://vtv.vn', 'rss', 'vn', (SELECT id FROM categories WHERE slug='tong-hop'), 7, 'vi'),
('Nhân Dân', 'ND', 'https://nhandan.vn', 'rss', 'vn', (SELECT id FROM categories WHERE slug='tong-hop'), 8, 'vi'),
-- VIỆT NAM — Chuyên ngành
('VietStock', 'VStock', 'https://vietstock.vn', 'scraping', 'vn', (SELECT id FROM categories WHERE slug='kinh-doanh'), 8, 'vi'),
('VnFeedNews', 'VFN', 'https://vnfeednews.com', 'scraping', 'vn', (SELECT id FROM categories WHERE slug='gia-ca'), 7, 'vi'),
('Cục An toàn thực phẩm', 'ATTP', 'https://vfa.gov.vn', 'scraping', 'vn', (SELECT id FROM categories WHERE slug='an-toan-thuc-pham'), 10, 'vi'),
('Hiệp hội Lương thực VN', 'VFA', 'https://vietfood.org.vn', 'scraping', 'vn', (SELECT id FROM categories WHERE slug='gia-ca'), 9, 'vi'),
('Báo Nhà Nông', 'NN', 'https://nhanong.vn', 'scraping', 'vn', (SELECT id FROM categories WHERE slug='nong-nghiep'), 7, 'vi'),
('Nông Nghiệp Việt Nam', 'NNVN', 'https://nongnghiep.vn', 'scraping', 'vn', (SELECT id FROM categories WHERE slug='nong-nghiep'), 7, 'vi'),
('VnEconomy', 'VNE', 'https://vneconomy.vn', 'scraping', 'vn', (SELECT id FROM categories WHERE slug='kinh-doanh'), 8, 'vi'),
('CafeF', 'CafeF', 'https://cafef.vn', 'scraping', 'vn', (SELECT id FROM categories WHERE slug='kinh-doanh'), 8, 'vi'),
('Báo Ẩm thực', 'ANU', 'https://amthucvietnam.vn', 'scraping', 'vn', (SELECT id FROM categories WHERE slug='suc-khoe'), 5, 'vi'),
-- QUỐC TẾ — Báo chung
('Reuters Business', 'Reuters', 'https://reuters.com', 'rss', 'intl', (SELECT id FROM categories WHERE slug='kinh-doanh'), 10, 'en'),
('BBC Business', 'BBC', 'https://bbc.com/news/business', 'rss', 'intl', (SELECT id FROM categories WHERE slug='kinh-doanh'), 9, 'en'),
('Bloomberg Food', 'Bloomberg', 'https://bloomberg.com', 'rss', 'intl', (SELECT id FROM categories WHERE slug='gia-ca'), 10, 'en'),
('CNBC', 'CNBC', 'https://cnbc.com', 'rss', 'intl', (SELECT id FROM categories WHERE slug='kinh-doanh'), 9, 'en'),
('Financial Times', 'FT', 'https://ft.com', 'rss', 'intl', (SELECT id FROM categories WHERE slug='kinh-doanh'), 10, 'en'),
-- QUỐC TẾ — Chuyên ngành thực phẩm
('FoodNavigator', 'FN', 'https://foodnavigator.com', 'rss', 'intl', (SELECT id FROM categories WHERE slug='tong-hop'), 9, 'en'),
('FoodNavigator USA', 'FN-USA', 'https://foodnavigator-usa.com', 'rss', 'intl', (SELECT id FROM categories WHERE slug='tong-hop'), 9, 'en'),
('Food Business News', 'FBN', 'https://foodbusinessnews.net', 'rss', 'intl', (SELECT id FROM categories WHERE slug='cong-nghe'), 8, 'en'),
('Food Safety Magazine', 'FSM', 'https://food-safety.com', 'rss', 'intl', (SELECT id FROM categories WHERE slug='an-toan-thuc-pham'), 8, 'en'),
('Food Processing', 'FP', 'https://foodprocessing.com', 'rss', 'intl', (SELECT id FROM categories WHERE slug='cong-nghe'), 8, 'en'),
('Just Food', 'JF', 'https://just-food.com', 'rss', 'intl', (SELECT id FROM categories WHERE slug='kinh-doanh'), 8, 'en'),
('Food Dive', 'FD', 'https://fooddive.com', 'rss', 'intl', (SELECT id FROM categories WHERE slug='kinh-doanh'), 8, 'en'),
('The Food Institute', 'TFI', 'https://foodinstitute.com', 'rss', 'intl', (SELECT id FROM categories WHERE slug='kinh-doanh'), 7, 'en'),
('Food Manufacture UK', 'FMUK', 'https://foodmanufacture.co.uk', 'rss', 'intl', (SELECT id FROM categories WHERE slug='cong-nghe'), 7, 'en'),
-- QUỐC TẾ — Cơ quan quản lý
('FDA', 'FDA', 'https://fda.gov', 'rss', 'intl', (SELECT id FROM categories WHERE slug='an-toan-thuc-pham'), 10, 'en'),
('USDA', 'USDA', 'https://usda.gov', 'rss', 'intl', (SELECT id FROM categories WHERE slug='gia-ca'), 10, 'en'),
('FAO', 'FAO', 'https://fao.org', 'rss', 'intl', (SELECT id FROM categories WHERE slug='nong-nghiep'), 10, 'en'),
('WTO', 'WTO', 'https://wto.org', 'rss', 'intl', (SELECT id FROM categories WHERE slug='quy-dinh'), 10, 'en'),
('EFSA', 'EFSA', 'https://efsa.europa.eu', 'rss', 'intl', (SELECT id FROM categories WHERE slug='an-toan-thuc-pham'), 10, 'en'),
('WFP', 'WFP', 'https://wfp.org', 'rss', 'intl', (SELECT id FROM categories WHERE slug='nong-nghiep'), 9, 'en'),
-- QUỐC TẾ — Khoa học & Nghiên cứu
('IFL Science', 'IFLS', 'https://iflscience.com', 'rss', 'intl', (SELECT id FROM categories WHERE slug='suc-khoe'), 8, 'en'),
('New Scientist', 'NS', 'https://newscientist.com', 'rss', 'intl', (SELECT id FROM categories WHERE slug='cong-nghe'), 9, 'en'),
-- TÀI CHÍNH VIỆT NAM
('SSI Research', 'SSI', 'https://ssi.com.vn', 'scraping', 'vn', (SELECT id FROM categories WHERE slug='kinh-doanh'), 9, 'vi'),
('Vietcap', 'VC', 'https://vietcap.com.vn', 'scraping', 'vn', (SELECT id FROM categories WHERE slug='kinh-doanh'), 8, 'vi'),
('MBS', 'MBS', 'https://mbs.com.vn', 'scraping', 'vn', (SELECT id FROM categories WHERE slug='kinh-doanh'), 8, 'vi')
ON CONFLICT DO NOTHING;

-- 3. Insert hot keywords
INSERT INTO hot_keywords (keyword, weight, category_id) VALUES
-- Breaking / Cảnh báo
('recall', 10, (SELECT id FROM categories WHERE slug='an-toan-thuc-pham')),
('thu hồi', 10, (SELECT id FROM categories WHERE slug='an-toan-thuc-pham')),
('banned', 10, (SELECT id FROM categories WHERE slug='an-toan-thuc-pham')),
('cấm nhập khẩu', 10, (SELECT id FROM categories WHERE slug='quy-dinh')),
-- M&A / IPO
('M&A', 9, (SELECT id FROM categories WHERE slug='kinh-doanh')),
('sáp nhập', 9, (SELECT id FROM categories WHERE slug='kinh-doanh')),
('IPO', 9, (SELECT id FROM categories WHERE slug='kinh-doanh')),
('mua lại', 8, (SELECT id FROM categories WHERE slug='kinh-doanh')),
-- Giá cả
('lạm phát', 10, (SELECT id FROM categories WHERE slug='gia-ca')),
('tăng giá', 8, (SELECT id FROM categories WHERE slug='gia-ca')),
('biến động giá', 8, (SELECT id FROM categories WHERE slug='gia-ca')),
('chi phí sản xuất', 7, (SELECT id FROM categories WHERE slug='gia-ca')),
-- Quy định
('FDA phê duyệt', 9, (SELECT id FROM categories WHERE slug='quy-dinh')),
('quy định mới', 8, (SELECT id FROM categories WHERE slug='quy-dinh')),
('EU green deal', 8, (SELECT id FROM categories WHERE slug='quy-dinh')),
-- Xu hướng
('AI', 7, (SELECT id FROM categories WHERE slug='cong-nghe')),
('food tech', 7, (SELECT id FROM categories WHERE slug='cong-nghe')),
('protein thực vật', 7, (SELECT id FROM categories WHERE slug='suc-khoe')),
('clean label', 6, (SELECT id FROM categories WHERE slug='suc-khoe')),
('an toàn', 6, (SELECT id FROM categories WHERE slug='an-toan-thuc-pham'))
ON CONFLICT (keyword) DO NOTHING;

-- 4. Insert settings
INSERT INTO settings (key, value, description) VALUES
('crawl_interval_minutes', '30', 'Khoảng thời gian giữa các lần crawl (phút)'),
('hot_score_recalculate_hours', '48', 'Sau bao lâu thì recalculate hot_score (giờ)'),
('max_articles_age_days', '30', 'Số ngày giữ bài viết, quá thì archive (ngày)'),
('hot_articles_count', '20', 'Số bài viết được đánh dấu là tin nóng'),
('article_per_page', '20', 'Số bài viết mỗi trang'),
('timezone', 'Asia/Ho_Chi_Minh', 'Múi giờ hiển thị')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE hot_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Public read access (ai cũng đọc được)
CREATE POLICY "Public read articles" ON articles FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read sources" ON sources FOR SELECT USING (true);
CREATE POLICY "Public read hot_keywords" ON hot_keywords FOR SELECT USING (true);
CREATE POLICY "Public read crawl_logs" ON crawl_logs FOR SELECT USING (true);

-- Only service role can write (backend crawler)
-- (Thiết lập trong Supabase Dashboard: Service role key)

-- ============================================================
-- VIEWS — Truy vấn thường dùng
-- ============================================================

-- View: Tin nóng (top 20)
CREATE OR REPLACE VIEW v_hot_articles AS
SELECT 
    a.id, a.title, a.link, a.summary, a.image_url,
    a.source_name, a.source_country, a.pub_date, a.hot_score,
    a.category_slug, a.category_name,
    c.icon, c.color
FROM articles a
LEFT JOIN categories c ON a.category_id = c.id
WHERE a.is_archived = FALSE
ORDER BY a.hot_score DESC
LIMIT 20;

-- View: Tin mới nhất
CREATE OR REPLACE VIEW v_latest_articles AS
SELECT 
    a.id, a.title, a.link, a.summary, a.image_url,
    a.source_name, a.source_country, a.pub_date, a.hot_score,
    a.category_slug, a.category_name,
    c.icon, c.color
FROM articles a
LEFT JOIN categories c ON a.category_id = c.id
WHERE a.is_archived = FALSE
ORDER BY a.pub_date DESC
LIMIT 50;

-- View: Thống kê nguồn
CREATE OR REPLACE VIEW v_source_stats AS
SELECT 
    s.id, s.name, s.short_name, s.country, s.credibility_score,
    s.last_fetched, s.articles_count,
    c.name AS category_name,
    cl.status AS last_crawl_status,
    cl.articles_fetched AS last_fetch_count,
    CASE 
        WHEN s.last_fetched IS NULL THEN 'never'
        WHEN s.last_fetched < NOW() - INTERVAL '1 hour' THEN 'stale'
        ELSE 'fresh'
    END AS health_status
FROM sources s
LEFT JOIN categories c ON s.category_id = c.id
LEFT JOIN LATERAL (
    SELECT status, articles_fetched
    FROM crawl_logs
    WHERE feed_id = s.id
    ORDER BY started_at DESC
    LIMIT 1
) cl ON true;

-- ============================================================
-- FUNCTION: Recalculate hot_score hàng loạt
-- ============================================================
CREATE OR REPLACE FUNCTION recalculate_all_hot_scores()
RETURNS void AS $$
DECLARE
    article_row RECORD;
    raw_score FLOAT;
BEGIN
    FOR article_row IN 
        SELECT a.id, a.pub_date, a.source_id, a.keywords
        FROM articles a
        WHERE a.is_archived = FALSE
          AND a.pub_date > NOW() - INTERVAL '72 hours'
    LOOP
        -- Gọi hàm tính điểm cho từng bài
        UPDATE articles
        SET hot_score = calculate_article_hot_score(article_row.id)
        WHERE id = article_row.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- CLEANUP: Xóa bài viết cũ (chạy mỗi ngày)
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_old_articles()
RETURNS void AS $$
BEGIN
    UPDATE articles
    SET is_archived = TRUE
    WHERE is_archived = FALSE
      AND pub_date < NOW() - INTERVAL '30 days';
    
    -- Xóa hẳn bài archived quá 90 ngày
    DELETE FROM articles
    WHERE is_archived = TRUE
      AND pub_date < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- BỔ SUNG: FUNCTION hot score + FIX views (chạy sau phần trên)
-- ============================================================

-- Hàm tính hot_score cho 1 bài viết
CREATE OR REPLACE FUNCTION calculate_article_hot_score(article_uuid UUID)
RETURNS FLOAT AS $$
DECLARE
    v_source_cred INT;
    v_age_hours FLOAT;
    v_time_decay FLOAT;
    v_keyword_score INT := 0;
    v_final_score FLOAT;
    v_pub_date TIMESTAMPTZ;
    v_keywords TEXT[];
    v_kw RECORD;
BEGIN
    -- Lấy thông tin bài viết
    SELECT s.credibility_score, a.pub_date, a.keywords
    INTO v_source_cred, v_pub_date, v_keywords
    FROM articles a
    JOIN sources s ON a.source_id = s.id
    WHERE a.id = article_uuid;

    IF v_pub_date IS NULL THEN RETURN 0; END IF;

    -- 1. Source score (0-50)
    v_source_cred := COALESCE(v_source_cred, 5);

    -- 2. Time decay (0-50) — giảm 1 điểm mỗi 2 giờ
    v_age_hours := EXTRACT(EPOCH FROM (NOW() - v_pub_date)) / 3600.0;
    v_time_decay := GREATEST(0, 50 - (v_age_hours / 2.0));

    -- 3. Keyword score (0-20)
    IF v_keywords IS NOT NULL AND array_length(v_keywords, 1) > 0 THEN
        FOR v_kw IN
            SELECT kw.weight FROM hot_keywords kw WHERE kw.is_active = true
            AND EXISTS (SELECT 1 FROM unnest(v_keywords) kw2 WHERE kw2 = kw.keyword)
        LOOP
            v_keyword_score := v_keyword_score + v_kw.weight;
        END LOOP;
        v_keyword_score := LEAST(v_keyword_score, 20);
    END IF;

    -- Tổng hợp
    v_final_score := (v_source_cred * 5) + v_time_decay + v_keyword_score;
    RETURN ROUND(v_final_score::NUMERIC, 2)::FLOAT;
END;
$$ LANGUAGE plpgsql;

-- Cập nhật lại v_hot_articles — thêm cột cần thiết cho frontend
DROP VIEW IF EXISTS v_hot_articles;
CREATE OR REPLACE VIEW v_hot_articles AS
SELECT
    a.id,
    a.title,
    a.summary,
    a.link,
    a.image_url,
    a.pub_date,
    a.hot_score,
    a.is_hot,
    a.keywords,
    a.source_id,
    a.source_name,
    a.source_country,
    a.category_id,
    a.category_slug,
    a.category_name,
    s.name AS source_name_full,
    s.country AS source_country_full,
    c.icon,
    c.color
FROM articles a
LEFT JOIN sources s ON a.source_id = s.id
LEFT JOIN categories c ON a.category_id = c.id
WHERE a.is_archived = FALSE
ORDER BY a.hot_score DESC
LIMIT 20;

-- Cập nhật lại v_latest_articles
DROP VIEW IF EXISTS v_latest_articles;
CREATE OR REPLACE VIEW v_latest_articles AS
SELECT
    a.id,
    a.title,
    a.summary,
    a.link,
    a.image_url,
    a.pub_date,
    a.hot_score,
    a.is_hot,
    a.source_name,
    a.source_country,
    a.category_slug,
    a.category_name,
    c.icon,
    c.color
FROM articles a
LEFT JOIN categories c ON a.category_id = c.id
WHERE a.is_archived = FALSE
ORDER BY a.pub_date DESC
LIMIT 50;

-- Cập nhật lại v_source_stats
DROP VIEW IF EXISTS v_source_stats;
CREATE OR REPLACE VIEW v_source_stats AS
SELECT
    s.id,
    s.name,
    s.short_name,
    s.country,
    s.credibility_score,
    s.last_fetched,
    s.articles_count,
    s.is_active,
    c.name AS category_name,
    cl.status AS last_crawl_status,
    cl.articles_fetched AS last_fetch_count,
    CASE
        WHEN s.last_fetched IS NULL THEN 'never'
        WHEN s.last_fetched < NOW() - INTERVAL '1 hour' THEN 'stale'
        ELSE 'fresh'
    END AS health_status
FROM sources s
LEFT JOIN categories c ON s.category_id = c.id
LEFT JOIN LATERAL (
    SELECT status, articles_fetched
    FROM crawl_logs
    WHERE feed_id = s.id
    ORDER BY started_at DESC
    LIMIT 1
) cl ON true;

-- Thêm cột article_count vào categories (cho frontend)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS article_count INT DEFAULT 0;

-- Index cho tìm kiếm (bổ sung)
CREATE INDEX IF NOT EXISTS idx_articles_keyword_search
    ON articles USING gin(keywords);
