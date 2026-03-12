// Задачи 1.3, 5.1, 5.2
// Логика авто-имени «Anonymous» и генерации трипкода
const crypto = require('crypto');

/**
 * Парсит поле author из запроса.
 *
 * Формат ввода:
 *   ""           → { authorName: "Anonymous", tripcode: null }
 *   "Имя"        → { authorName: "Имя",       tripcode: null }
 *   "Имя#пароль" → { authorName: "Имя",       tripcode: "!Xk9AbCdEfG" }
 *   "#пароль"    → { authorName: "Anonymous",  tripcode: "!Xk9AbCdEfG" }
 */
function parseTripcode(rawAuthor) {
  if (!rawAuthor || rawAuthor.trim() === '') {
    return { authorName: 'Anonymous', tripcode: null };
  }

  // Задача 5.2: обработка символа '#'
  const hashIdx = rawAuthor.indexOf('#');
  if (hashIdx === -1) {
    return { authorName: rawAuthor.trim(), tripcode: null };
  }

  const name     = rawAuthor.slice(0, hashIdx).trim() || 'Anonymous';
  const password = rawAuthor.slice(hashIdx + 1);

  // Задача 5.1: SHA-256 хэш пароля → первые 10 символов base64 с префиксом '!'
  const hash = crypto
    .createHash('sha256')
    .update(password)
    .digest('base64')
    .slice(0, 10);

  return { authorName: name, tripcode: '!' + hash };
}

module.exports = { parseTripcode };
