-- FoodXplore: separate the editorial takeaway from the source excerpt.
-- Safe to run more than once.

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS key_takeaway TEXT,
  ADD COLUMN IF NOT EXISTS takeaway_model TEXT,
  ADD COLUMN IF NOT EXISTS takeaway_generated_at TIMESTAMPTZ;

COMMENT ON COLUMN public.articles.key_takeaway IS
  'Bản tóm lược độc lập do FoodXplore tạo từ tiêu đề và phần mô tả của nguồn';

COMMENT ON COLUMN public.articles.takeaway_model IS
  'Mô hình đã dùng để tạo key_takeaway';

COMMENT ON COLUMN public.articles.takeaway_generated_at IS
  'Thời điểm tạo bản tóm lược độc lập gần nhất';

-- Do not accept legacy data that merely copied the display summary.
UPDATE public.articles
SET
  key_takeaway = NULL,
  takeaway_model = NULL,
  takeaway_generated_at = NULL
WHERE key_takeaway IS NOT NULL
  AND lower(regexp_replace(key_takeaway, '[^[:alnum:]]', '', 'g')) =
      lower(regexp_replace(COALESCE(summary, ''), '[^[:alnum:]]', '', 'g'));

SELECT
  COUNT(*) AS total_articles,
  COUNT(key_takeaway) AS articles_with_distinct_takeaway
FROM public.articles;
