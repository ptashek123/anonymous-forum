// Тест для требования с наиболее выраженной функциональностью:
// Создание анонимного треда (User Story 2, приоритет Высокий)
//
// Покрывает: БД (threads + posts + attachments), API POST /threads,
// логику Anonymous, генерацию трипкода, капчу, bump-сортировку

const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');

// ── Настройка тестового окружения ─────────────────────────────
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/imageboard';
process.env.ADMIN_TOKEN = 'test_token';
process.env.UPLOADS_DIR = path.join(__dirname, 'test_uploads');

// Создаём папку для тестовых загрузок
if (!fs.existsSync(process.env.UPLOADS_DIR)) {
  fs.mkdirSync(process.env.UPLOADS_DIR, { recursive: true });
}

const pool = require('../db/pool');
const threadsRouter = require('../routes/threads');
const { router: captchaRouter, verify } = require('../routes/captcha');

// Минимальное Express-приложение для тестов
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/captcha', captchaRouter);
app.use('/api/threads', threadsRouter);

// ── Хелпер: получить валидный токен капчи ─────────────────────
async function getValidCaptcha() {
  const res = await request(app).get('/api/captcha');
  return {
    token: res.body.token, answer: res.body.svg
      ? extractAnswerHack(res.body.svg) : 'TEST'
  };
}

// Извлекаем ответ из SVG (только для тестов — в проде пользователь вводит вручную)
function extractAnswerHack(svg) {
  const matches = [...svg.matchAll(/>([A-Z0-9])</g)].map(m => m[1]);
  return matches.join('');
}

// ── Очистка тестовых данных после всех тестов ─────────────────
afterAll(async () => {
  await pool.query(`
    DELETE FROM threads WHERE subject LIKE 'TEST_%'
  `);
  // Удаляем тестовые файлы
  if (fs.existsSync(process.env.UPLOADS_DIR)) {
    fs.rmSync(process.env.UPLOADS_DIR, { recursive: true, force: true });
  }
  await pool.end();
});

// ═════════════════════════════════════════════════════════════════
// ТЕСТ 1: Создание треда — главное требование (US2)
// ═════════════════════════════════════════════════════════════════
describe('POST /api/threads — создание анонимного треда', () => {

  test('создаёт тред с автором Anonymous при пустом поле имени', async () => {
    const captchaRes = await request(app).get('/api/captcha');
    const token = captchaRes.body.token;
    const answer = extractAnswerHack(captchaRes.body.svg);

    const res = await request(app)
      .post('/api/threads')
      .field('content', 'Test content for anonymous thread')
      .field('subject', 'TEST_anonymous')
      .field('author', '')           // пустое → должен стать Anonymous
      .field('captcha_token', token)
      .field('captcha_answer', answer);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('threadId');
    expect(res.body).toHaveProperty('postId');

    // Проверяем что в БД автор действительно сохранился как Anonymous
    const { rows } = await pool.query(
      'SELECT author_name FROM posts WHERE id = $1', [res.body.postId]
    );
    expect(rows[0].author_name).toBe('Anonymous');
  });

  test('создаёт тред с заголовком и сохраняет его в БД', async () => {
    const captchaRes = await request(app).get('/api/captcha');
    const token = captchaRes.body.token;
    const answer = extractAnswerHack(captchaRes.body.svg);

    const res = await request(app)
      .post('/api/threads')
      .field('content', 'Thread with subject test')
      .field('subject', 'TEST_with_subject')
      .field('captcha_token', token)
      .field('captcha_answer', answer);

    expect(res.status).toBe(201);

    const { rows } = await pool.query(
      'SELECT subject FROM threads WHERE id = $1', [res.body.threadId]
    );
    expect(rows[0].subject).toBe('TEST_with_subject');
  });

  test('отклоняет тред без текста сообщения', async () => {
    const captchaRes = await request(app).get('/api/captcha');

    const res = await request(app)
      .post('/api/threads')
      .field('content', '')
      .field('captcha_token', captchaRes.body.token)
      .field('captcha_answer', 'anything');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Content is required');
  });

  test('отклоняет тред с неверной капчей', async () => {
    const res = await request(app)
      .post('/api/threads')
      .field('content', 'Some content')
      .field('captcha_token', 'fake_token')
      .field('captcha_answer', 'WRONG');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid captcha');
  });

  test('новый тред появляется первым в списке (bump-сортировка)', async () => {
    const captchaRes = await request(app).get('/api/captcha');
    const token = captchaRes.body.token;
    const answer = extractAnswerHack(captchaRes.body.svg);

    const createRes = await request(app)
      .post('/api/threads')
      .field('content', 'Latest thread content')
      .field('subject', 'TEST_bump_order')
      .field('captcha_token', token)
      .field('captcha_answer', answer);

    const threadId = createRes.body.threadId;

    const listRes = await request(app).get('/api/threads');
    expect(listRes.status).toBe(200);
    expect(listRes.body.length).toBeGreaterThan(0);
    expect(listRes.body[0].id).toBe(threadId); // должен быть первым
  });
});

// ═════════════════════════════════════════════════════════════════
// ТЕСТ 2: Ответ в тред (US3)
// ═════════════════════════════════════════════════════════════════
describe('POST /api/threads/:id/posts — ответ в тред', () => {
  let threadId;

  beforeAll(async () => {
    // Создаём тред для ответов
    const captchaRes = await request(app).get('/api/captcha');
    const res = await request(app)
      .post('/api/threads')
      .field('content', 'Parent thread for reply tests')
      .field('subject', 'TEST_reply_parent')
      .field('captcha_token', captchaRes.body.token)
      .field('captcha_answer', extractAnswerHack(captchaRes.body.svg));
    threadId = res.body.threadId;
  });

  test('добавляет ответ в существующий тред', async () => {
    const captchaRes = await request(app).get('/api/captcha');

    const res = await request(app)
      .post(`/api/threads/${threadId}/posts`)
      .field('content', 'Reply to the thread')
      .field('captcha_token', captchaRes.body.token)
      .field('captcha_answer', extractAnswerHack(captchaRes.body.svg));

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('postId');
  });

  test('ответ обновляет last_bump треда', async () => {
    const before = await pool.query(
      'SELECT last_bump FROM threads WHERE id = $1', [threadId]
    );

    await new Promise(r => setTimeout(r, 10)); // небольшая пауза

    const captchaRes = await request(app).get('/api/captcha');
    await request(app)
      .post(`/api/threads/${threadId}/posts`)
      .field('content', 'Bump test reply')
      .field('captcha_token', captchaRes.body.token)
      .field('captcha_answer', extractAnswerHack(captchaRes.body.svg));

    const after = await pool.query(
      'SELECT last_bump FROM threads WHERE id = $1', [threadId]
    );

    expect(new Date(after.rows[0].last_bump).getTime())
      .toBeGreaterThan(new Date(before.rows[0].last_bump).getTime());
  });

  test('возвращает 404 при ответе в несуществующий тред', async () => {
    const captchaRes = await request(app).get('/api/captcha');

    const res = await request(app)
      .post('/api/threads/999999/posts')
      .field('content', 'Reply to nothing')
      .field('captcha_token', captchaRes.body.token)
      .field('captcha_answer', extractAnswerHack(captchaRes.body.svg));

    expect(res.status).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════════
// ТЕСТ 3: Трипкод (задача 5.1, 5.2)
// ═════════════════════════════════════════════════════════════════
describe('Tripcode — идентификация без регистрации', () => {
  const { parseTripcode } = require('../middleware/tripcode');

  test('пустое имя → Anonymous без трипкода', () => {
    const result = parseTripcode('');
    expect(result.authorName).toBe('Anonymous');
    expect(result.tripcode).toBeNull();
  });

  test('имя без # → имя сохраняется, трипкода нет', () => {
    const result = parseTripcode('forgetmenot');
    expect(result.authorName).toBe('forgetmenot');
    expect(result.tripcode).toBeNull();
  });

  test('имя#пароль → трипкод начинается с !', () => {
    const result = parseTripcode('User#secret123');
    expect(result.authorName).toBe('User');
    expect(result.tripcode).toMatch(/^!/);
    expect(result.tripcode.length).toBe(11); // ! + 10 символов
  });

  test('одинаковый пароль всегда даёт одинаковый трипкод', () => {
    const r1 = parseTripcode('Alice#mypassword');
    const r2 = parseTripcode('Bob#mypassword');
    expect(r1.tripcode).toBe(r2.tripcode); // трипкод зависит только от пароля
  });

  test('разные пароли → разные трипкоды', () => {
    const r1 = parseTripcode('User#password1');
    const r2 = parseTripcode('User#password2');
    expect(r1.tripcode).not.toBe(r2.tripcode);
  });
});

// ═════════════════════════════════════════════════════════════════
// ТЕСТ 4: Капча (задача 8.1, 8.2)
// ═════════════════════════════════════════════════════════════════
describe('SVG-капча', () => {

  test('GET /api/captcha возвращает token и svg', async () => {
    const res = await request(app).get('/api/captcha');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('svg');
    expect(res.body.svg).toContain('<svg');
  });

  test('правильный ответ проходит верификацию', async () => {
    const captchaRes = await request(app).get('/api/captcha');
    const { token, svg } = captchaRes.body;
    const answer = extractAnswerHack(svg);

    const res = await request(app)
      .post('/api/captcha/verify')
      .send({ token, answer });

    expect(res.body.valid).toBe(true);
  });

  test('неверный ответ не проходит верификацию', async () => {
    const captchaRes = await request(app).get('/api/captcha');

    const res = await request(app)
      .post('/api/captcha/verify')
      .send({ token: captchaRes.body.token, answer: 'XXXXX' });

    expect(res.body.valid).toBe(false);
  });

  test('капча одноразовая — повторная проверка с тем же токеном не проходит', async () => {
    const captchaRes = await request(app).get('/api/captcha');
    const { token, svg } = captchaRes.body;
    const answer = extractAnswerHack(svg);

    await request(app).post('/api/captcha/verify').send({ token, answer });

    // Повторная попытка с тем же токеном
    const res2 = await request(app)
      .post('/api/captcha/verify')
      .send({ token, answer });

    expect(res2.body.valid).toBe(false);
  });
});
