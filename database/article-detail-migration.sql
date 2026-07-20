-- FoodXplore: lưu riêng nội dung gốc trước khi dịch.
-- Script an toàn để chạy nhiều lần.

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS original_title TEXT,
  ADD COLUMN IF NOT EXISTS original_summary TEXT,
  ADD COLUMN IF NOT EXISTS translation_model TEXT,
  ADD COLUMN IF NOT EXISTS translated_at TIMESTAMPTZ;

UPDATE public.articles
SET
  original_title = COALESCE(original_title, title),
  original_summary = COALESCE(original_summary, content_preview, summary)
WHERE original_title IS NULL
   OR original_summary IS NULL;

COMMENT ON COLUMN public.articles.original_title IS
  'Tiêu đề nguyên bản do RSS hoặc nguồn báo cung cấp';

COMMENT ON COLUMN public.articles.original_summary IS
  'Đoạn trích nguyên bản do RSS hoặc nguồn báo cung cấp';

COMMENT ON COLUMN public.articles.translation_model IS
  'Mô hình đã dùng để dịch bản hiển thị sang tiếng Việt';

SELECT
  COUNT(*) AS total_articles,
  COUNT(original_title) AS articles_with_original_title,
  COUNT(original_summary) AS articles_with_original_summary
FROM public.articles;
