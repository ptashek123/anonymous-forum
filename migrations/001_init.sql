-- ============================================================
-- Migration 001: Initial Schema
-- Задачи: 1.1, 7.1, 7.2
-- ============================================================

CREATE TABLE IF NOT EXISTS threads (
    id        SERIAL PRIMARY KEY,
    subject   VARCHAR(255),
    last_bump TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Задача 7.1: B-Tree индекс для bump-сортировки тредов
CREATE INDEX IF NOT EXISTS idx_threads_last_bump
    ON threads USING BTREE (last_bump DESC);

CREATE TABLE IF NOT EXISTS posts (
    id          SERIAL PRIMARY KEY,
    thread_id   INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    author_name VARCHAR(64) NOT NULL DEFAULT 'Anonymous',
    tripcode    VARCHAR(15),
    ip_address  INET NOT NULL,
    is_op       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_thread_id
    ON posts USING BTREE (thread_id);

-- Для модуля модерации (поиск постов по IP)
CREATE INDEX IF NOT EXISTS idx_posts_ip
    ON posts USING BTREE (ip_address);

-- Частичный индекс для каталога (только OP-посты)
CREATE INDEX IF NOT EXISTS idx_posts_is_op
    ON posts (is_op) WHERE is_op = TRUE;

CREATE TABLE IF NOT EXISTS attachments (
    id             SERIAL PRIMARY KEY,
    post_id        INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    file_path      VARCHAR(512) NOT NULL,
    thumbnail_path VARCHAR(512) NOT NULL
);

CREATE TABLE IF NOT EXISTS bans (
    id         SERIAL PRIMARY KEY,
    ip_address INET NOT NULL,
    reason     TEXT,
    expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bans_ip_expires
    ON bans USING BTREE (ip_address, expires_at);

-- Задача 7.2: view для профилирования тяжёлых тредов
-- Использование: SELECT * FROM thread_stats ORDER BY reply_count DESC;
CREATE OR REPLACE VIEW thread_stats AS
    SELECT t.id,
           t.subject,
           t.last_bump,
           COUNT(p.id) AS reply_count
    FROM threads t
    LEFT JOIN posts p ON p.thread_id = t.id AND p.is_op = FALSE
    GROUP BY t.id;
