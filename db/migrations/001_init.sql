CREATE TABLE threads (
    id BIGSERIAL PRIMARY KEY,
    subject VARCHAR(255) NOT NULL DEFAULT '',
    last_bump TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_threads_last_bump ON threads(last_bump DESC);

CREATE TABLE posts (
    id BIGSERIAL PRIMARY KEY,
    thread_id BIGINT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_name VARCHAR(50) NOT NULL DEFAULT 'Anonymous',
    tripcode VARCHAR(64),
    ip_address INET NOT NULL,
    is_op BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_posts_thread_id ON posts(thread_id);

CREATE INDEX idx_posts_ip_address ON posts(ip_address);

CREATE TABLE attachments (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    file_path VARCHAR(512) NOT NULL,
    thumbnail_path VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE bans (
    id BIGSERIAL PRIMARY KEY,
    ip_address INET NOT NULL UNIQUE,
    reason TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bans_ip_expires ON bans(ip_address, expires_at);