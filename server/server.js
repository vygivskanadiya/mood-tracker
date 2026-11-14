const path = require('path');
const express = require('express');
const moodEntries = require('./data/mood-entries.json');

const app = express();
const PORT = 3000;
const CLIENT_DIR = path.join(__dirname, '..');

// Практична робота №15: заголовки безпеки для кожної відповіді сервера
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

// GET /api/mood-entries — усі демо-записи; ?limit=N — останні N записів
app.get('/api/mood-entries', (req, res) => {
  if (req.query.limit === undefined) {
    res.json(moodEntries);
    return;
  }

  const limit = Number(req.query.limit);
  if (!Number.isInteger(limit) || limit < 1) {
    res.status(400).json({
      error: 'Параметр limit має бути додатним цілим числом',
    });
    return;
  }

  res.json(moodEntries.slice(-limit));
});

// Статичні файли клієнта віддаємо з того самого сервера (один origin)
app.get('/', (req, res) => {
  res.sendFile(path.join(CLIENT_DIR, 'index.html'));
});
app.get('/script.js', (req, res) => {
  res.sendFile(path.join(CLIENT_DIR, 'script.js'));
});
app.use('/css', express.static(path.join(CLIENT_DIR, 'css')));

// Будь-який інший шлях — 404 із JSON-повідомленням
app.use((req, res) => {
  res.status(404).json({ error: 'Не знайдено' });
});

app.listen(PORT, () => {
  console.log(`Сервер запущено на http://localhost:${PORT}`);
});