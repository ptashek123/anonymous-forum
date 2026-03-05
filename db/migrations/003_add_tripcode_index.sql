CREATE INDEX IF NOT EXISTS idx_posts_tripcode ON posts(tripcode);

COMMENT ON INDEX idx_posts_tripcode IS 'Ускоряет поиск сообщений по трипкоду пользователя';

CREATE INDEX IF NOT EXISTS idx_posts_tripcode_created ON posts(tripcode, created_at DESC);

COMMENT ON INDEX idx_posts_tripcode_created IS 'Ускоряет получение истории сообщений по трипкоду';