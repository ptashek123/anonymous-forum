// Задачи: 1.2, 2.2, 2.3, 4.3, 6.1, 8.2
const express  = require('express');
const path     = require('path');
const sharp    = require('sharp');
const pool     = require('../db/pool');
const banCheck = require('../middleware/banCheck');
const { upload, UPLOADS_DIR } = require('../middleware/upload');
const { parseTripcode }       = require('../middleware/tripcode');
const { verifyCaptcha }       = require('./captcha');

const router = express.Router();

// ── GET /api/threads ──────────────────────────────────────────────────────
// Лента: список тредов, сортировка по last_bump (индекс 7.1)
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.id,
        t.subject,
        t.last_bump,
        p.id          AS op_post_id,
        p.content,
        p.author_name,
        p.tripcode,
        p.created_at,
        a.file_path,
        a.thumbnail_path,
        (SELECT COUNT(*) FROM posts r
         WHERE r.thread_id = t.id AND r.is_op = FALSE) AS reply_count
      FROM threads t
      JOIN posts p
        ON p.thread_id = t.id AND p.is_op = TRUE
      LEFT JOIN attachments a
        ON a.post_id = p.id
      ORDER BY t.last_bump DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/threads/catalog ──────────────────────────────────────────────
// Задача 6.1: только OP-посты для режима «Каталог»
router.get('/catalog', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.id,
        t.subject,
        t.last_bump,
        p.id          AS op_post_id,
        p.content,
        p.author_name,
        p.created_at,
        a.thumbnail_path,
        (SELECT COUNT(*) FROM posts r
         WHERE r.thread_id = t.id AND r.is_op = FALSE) AS reply_count
      FROM threads t
      JOIN posts p
        ON p.thread_id = t.id AND p.is_op = TRUE
      LEFT JOIN attachments a
        ON a.post_id = p.id
      ORDER BY t.last_bump DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/threads/:id ──────────────────────────────────────────────────
// Полный тред + задача 4.3: backlinks
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const threadRes = await pool.query(
      'SELECT * FROM threads WHERE id = $1', [id]
    );
    if (threadRes.rowCount === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const postsRes = await pool.query(`
      SELECT p.*, a.file_path, a.thumbnail_path
      FROM posts p
      LEFT JOIN attachments a ON a.post_id = p.id
      WHERE p.thread_id = $1
      ORDER BY p.created_at ASC
    `, [id]);

    // Задача 4.3: строим backlinks
    // backlinkMap[targetId] = [postId, postId, ...]
    const backlinkMap = {};
    for (const post of postsRes.rows) {
      const refs = [...(post.content || '').matchAll(/>>(\d+)/g)]
        .map(m => parseInt(m[1]));
      for (const ref of refs) {
        if (!backlinkMap[ref]) backlinkMap[ref] = [];
        if (!backlinkMap[ref].includes(post.id)) {
          backlinkMap[ref].push(post.id);
        }
      }
    }

    const posts = postsRes.rows.map(p => ({
      ...p,
      backlinks: backlinkMap[p.id] || [],
    }));

    res.json({ thread: threadRes.rows[0], posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/threads ─────────────────────────────────────────────────────
// Создание нового треда
router.post('/', banCheck, upload.single('file'), async (req, res) => {
  const { subject, content, author, captcha_token, captcha_answer } = req.body;
  const ip = req.ip;

  if (!content?.trim()) {
    return res.status(400).json({ error: 'Content is required' });
  }
  // Задача 8.2: проверка капчи
  if (!verifyCaptcha(captcha_token, captcha_answer)) {
    return res.status(400).json({ error: 'Invalid captcha' });
  }

  const { authorName, tripcode } = parseTripcode(author);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [thread] } = await client.query(
      `INSERT INTO threads (subject, last_bump)
       VALUES ($1, NOW()) RETURNING id`,
      [subject?.trim() || null]
    );

    const { rows: [post] } = await client.query(
      `INSERT INTO posts
         (thread_id, content, author_name, tripcode, ip_address, is_op)
       VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id`,
      [thread.id, content.trim(), authorName, tripcode, ip]
    );

    if (req.file) {
      const att = await saveAttachment(req.file);
      await client.query(
        `INSERT INTO attachments (post_id, file_path, thumbnail_path)
         VALUES ($1, $2, $3)`,
        [post.id, att.filePath, att.thumbPath]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ threadId: thread.id, postId: post.id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// ── POST /api/threads/:id/posts ───────────────────────────────────────────
// Ответ в существующий тред
router.post('/:id/posts', banCheck, upload.single('file'), async (req, res) => {
  const { id } = req.params;
  const { content, author, captcha_token, captcha_answer } = req.body;
  const ip = req.ip;

  if (!content?.trim()) {
    return res.status(400).json({ error: 'Content is required' });
  }
  if (!verifyCaptcha(captcha_token, captcha_answer)) {
    return res.status(400).json({ error: 'Invalid captcha' });
  }

  const { authorName, tripcode } = parseTripcode(author);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const threadCheck = await client.query(
      'SELECT id FROM threads WHERE id = $1', [id]
    );
    if (threadCheck.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Thread not found' });
    }

    const { rows: [post] } = await client.query(
      `INSERT INTO posts
         (thread_id, content, author_name, tripcode, ip_address, is_op)
       VALUES ($1, $2, $3, $4, $5, FALSE) RETURNING id`,
      [id, content.trim(), authorName, tripcode, ip]
    );

    if (req.file) {
      const att = await saveAttachment(req.file);
      await client.query(
        `INSERT INTO attachments (post_id, file_path, thumbnail_path)
         VALUES ($1, $2, $3)`,
        [post.id, att.filePath, att.thumbPath]
      );
    }

    // Bump — обновляем last_bump, индекс 7.1 ускоряет следующую сортировку
    await client.query(
      'UPDATE threads SET last_bump = NOW() WHERE id = $1', [id]
    );

    await client.query('COMMIT');
    res.status(201).json({ postId: post.id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// ── Задача 2.2: генерация миниатюры через sharp ───────────────────────────
async function saveAttachment(file) {
  const filePath     = `uploads/${file.filename}`;
  const thumbName    = `thumb_${file.filename.replace(/\.[^.]+$/, '.jpg')}`;
  const thumbAbsPath = path.join(UPLOADS_DIR, thumbName);
  const thumbPath    = `uploads/${thumbName}`;

  await sharp(file.path)
    .resize(200, 200, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toFile(thumbAbsPath);

  return { filePath, thumbPath };
}

module.exports = router;
