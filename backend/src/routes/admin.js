// Задача 3: Модуль модерации
// 3.1 Защищённый вход  3.2 Удаление постов/файлов  3.3 Бан-лист по IP
const express = require('express');
const fs      = require('fs');
const path    = require('path');
const pool    = require('../db/pool');
const { UPLOADS_DIR } = require('../middleware/upload');

const router = express.Router();

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Wrong password' });
  }
  res.json({ token: process.env.ADMIN_TOKEN });
});

router.get('/posts', requireAdmin, async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.thread_id, p.content, p.author_name,
             p.ip_address, p.created_at, p.is_op,
             a.thumbnail_path
      FROM posts p
      LEFT JOIN attachments a ON a.post_id = p.id
      ORDER BY p.created_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/posts/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const attRes = await client.query(
      'SELECT file_path, thumbnail_path FROM attachments WHERE post_id = $1', [id]
    );
    const postRes = await client.query(
      'DELETE FROM posts WHERE id = $1 RETURNING id, thread_id, is_op', [id]
    );
    if (postRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Post not found' });
    }
    const { is_op, thread_id } = postRes.rows[0];
    if (is_op) {
      const threadAtts = await client.query(`
        SELECT a.file_path, a.thumbnail_path
        FROM attachments a JOIN posts p ON a.post_id = p.id
        WHERE p.thread_id = $1
      `, [thread_id]);
      threadAtts.rows.forEach(removeFiles);
      await client.query('DELETE FROM threads WHERE id = $1', [thread_id]);
    }
    await client.query('COMMIT');
    attRes.rows.forEach(removeFiles);
    res.json({ deleted: id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

router.get('/bans', requireAdmin, async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bans ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/bans', requireAdmin, async (req, res) => {
  const { ip_address, reason, expires_at } = req.body;
  if (!ip_address) return res.status(400).json({ error: 'ip_address required' });
  try {
    const result = await pool.query(
      'INSERT INTO bans (ip_address, reason, expires_at) VALUES ($1, $2, $3) RETURNING *',
      [ip_address, reason || null, expires_at || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/bans/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM bans WHERE id = $1', [req.params.id]);
    res.json({ deleted: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

function removeFiles({ file_path, thumbnail_path }) {
  for (const p of [file_path, thumbnail_path]) {
    if (!p) continue;
    try { fs.unlinkSync(path.join(UPLOADS_DIR, '..', p)); } catch (_) {}
  }
}

module.exports = router;
