// Задача 8.1: генерация SVG-капчи без внешних зависимостей
// Задача 8.2: одноразовая проверка токена перед созданием постов
const express = require('express');
const crypto  = require('crypto');

const router = express.Router();

// In-memory хранилище: token → { answer, expires }
// В production следует заменить на Redis
const store = new Map();

// Очистка просроченных токенов каждые 5 минут
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store) {
    if (v.expires < now) store.delete(k);
  }
}, 5 * 60 * 1000);

// ── GET /api/captcha ──────────────────────────────────────────────────────
// Возвращает { token, svg }
router.get('/', (_req, res) => {
  // 5 символов: цифры + заглавные буквы (без омографов 0/O, 1/I/L)
  const chars  = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  const answer = Array.from({ length: 5 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');

  const token = crypto.randomBytes(16).toString('hex');
  store.set(token, {
    answer,
    expires: Date.now() + 10 * 60 * 1000, // 10 минут
  });

  res.json({ token, svg: buildSvg(answer) });
});

// ── POST /api/captcha/verify ──────────────────────────────────────────────
router.post('/verify', (req, res) => {
  const { token, answer } = req.body;
  res.json({ valid: verifyCaptcha(token, answer) });
});

// ── Экспортируется и используется в routes/threads.js ────────────────────
function verifyCaptcha(token, answer) {
  if (!token || !answer) return false;
  const entry = store.get(token);
  if (!entry || entry.expires < Date.now()) {
    store.delete(token);
    return false;
  }
  const ok = entry.answer === answer.trim().toUpperCase();
  if (ok) store.delete(token); // одноразовый токен
  return ok;
}

// ── SVG генератор ─────────────────────────────────────────────────────────
function buildSvg(text) {
  const W = 160, H = 60;

  const letters = text.split('').map((ch, i) => {
    const x    = 16 + i * 27 + rnd(-4, 4);
    const y    = 38 + rnd(-5, 5);
    const rot  = rnd(-18, 18);
    const size = 24 + rnd(-2, 2);
    const colors = ['#b00', '#006', '#060', '#660', '#006699'];
    const fill = colors[i % colors.length];
    return `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}"
      font-family="monospace" font-weight="bold"
      transform="rotate(${rot},${x},${y})">${ch}</text>`;
  });

  const lines = Array.from({ length: 5 }, () =>
    `<line x1="${rnd(0,W)}" y1="${rnd(0,H)}" x2="${rnd(0,W)}" y2="${rnd(0,H)}"
      stroke="#aaa" stroke-width="1" opacity="0.5"/>`
  );

  const dots = Array.from({ length: 25 }, () =>
    `<circle cx="${rnd(0,W)}" cy="${rnd(0,H)}" r="1.5" fill="#bbb" opacity="0.6"/>`
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"
    style="background:#f5f5f0;border:1px solid #ccc;border-radius:3px;display:block">
    ${lines.join('')}${dots.join('')}${letters.join('')}
  </svg>`;
}

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = { router, verifyCaptcha };
