TRUNCATE attachments, posts, threads, bans RESTART IDENTITY CASCADE;

INSERT INTO threads (subject, last_bump) VALUES
('Добро пожаловать на форум!', NOW()),
('Обсуждение анонимности в интернете', NOW() - INTERVAL '1 day'),
('Как вам новый дизайн?', NOW() - INTERVAL '2 hours');

INSERT INTO posts (thread_id, content, author_name, ip_address, is_op, created_at) VALUES
(1, 'Первый пост! Привет всем!', 'Аноним', '127.0.0.1', TRUE, NOW()),
(1, 'И тебе привет!', 'Anonymous', '192.168.1.1', FALSE, NOW() + INTERVAL '5 minutes'),
(2, 'Анонимность - это важно', 'Секретный', '10.0.0.1', TRUE, NOW() - INTERVAL '1 day');