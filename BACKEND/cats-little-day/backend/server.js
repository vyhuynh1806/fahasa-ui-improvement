import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { openDatabase } from './database/db.js';
import { createStore, AppError } from './database/store.js';
import { taskRoutes } from './routes/taskRoutes.js';
import { catRoutes } from './routes/catRoutes.js';
import { statsRoutes } from './routes/statsRoutes.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const db = openDatabase();
const store = createStore(db);
const app = express();

app.disable('x-powered-by');
app.use((_req, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); next(); });
app.use('/api', express.json({ limit: '20kb' }));
app.use('/api/tasks', taskRoutes(store));
app.use('/api/cat', catRoutes(store));
app.use('/api/stats', statsRoutes(store));
app.use('/api', (_req, res) => res.status(404).json({ error: 'API không tồn tại.', code: 'NOT_FOUND' }));

app.use(express.static(join(root, 'frontend'), { extensions: ['html'] }));
app.use((_req, res) => res.status(404).sendFile(join(root, 'frontend', '404.html')));

app.use((err, _req, res, _next) => {
  if (err instanceof AppError) return res.status(err.status).json({ error: err.message, code: err.code });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON không hợp lệ.', code: 'INVALID_JSON' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Dữ liệu gửi lên quá lớn.', code: 'TOO_LARGE' });
  console.error('[API error]', err);
  return res.status(500).json({ error: 'Có lỗi xảy ra trên máy chủ.', code: 'INTERNAL_ERROR' });
});

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '127.0.0.1';
const server = app.listen(port, host, () => {
  console.log(`🐱 Cat's Little Day đang chạy tại http://${host}:${port}`);
  console.log('SQLite:', process.env.DB_PATH || join(root, 'backend/database/cats.sqlite'));
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => server.close(() => { db.close(); process.exit(0); }));
}
