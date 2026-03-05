ALTER TABLE threads 
ADD COLUMN views_count INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN threads.views_count IS 'Количество просмотров темы (для аналитики)';