// Задача 3.3: проверка бана по IP перед каждым POST
const pool = require('../db/pool');

async function banCheck(req, res, next) {
  const ip = req.ip;
  try {
    const result = await pool.query(
      `SELECT id FROM bans
       WHERE ip_address = $1
         AND (expires_at IS NULL OR expires_at > NOW())
       LIMIT 1`,
      [ip]
    );
    if (result.rowCount > 0) {
      return res.status(403).json({ error: 'Your IP is banned.' });
    }
    next();
  } catch (err) {
    console.error('banCheck error:', err);
    next();
  }
}

module.exports = banCheck;
