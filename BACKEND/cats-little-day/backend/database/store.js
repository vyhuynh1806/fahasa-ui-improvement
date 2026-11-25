import { inTransaction, localDate } from './db.js';

export class AppError extends Error {
  constructor(message, status = 400, code = 'BAD_REQUEST') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const taskSelect = 'SELECT id, title, description, task_date, status, created_at FROM tasks';
const catSelect = 'SELECT id, mood, hunger, coins, updated_at FROM cat WHERE id = 1';

export const validDate = (str) => {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  if (y < 2000 || y > 2100) return false;
  const val = new Date(Date.UTC(y, m - 1, d));
  return val.getUTCFullYear() === y && val.getUTCMonth() + 1 === m && val.getUTCDate() === d;
};

function requiredId(value) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1) throw new AppError('Mã công việc không hợp lệ.', 400, 'INVALID_ID');
  return n;
}

function cleanTask(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('Dữ liệu công việc không hợp lệ.');
  }
  if (typeof body.title !== 'string' || body.title.trim().length < 1 || body.title.trim().length > 100) {
    throw new AppError('Tên công việc phải có từ 1 đến 100 ký tự.');
  }
  const desc = body.description ?? '';
  if (typeof desc !== 'string' || desc.length > 500) {
    throw new AppError('Mô tả không được vượt quá 500 ký tự.');
  }
  if (!validDate(body.task_date)) throw new AppError('Ngày thực hiện không hợp lệ (YYYY-MM-DD).');
  return { title: body.title.trim(), description: desc.trim(), task_date: body.task_date };
}

function normalizedSearch(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi');
}

function makeDateList(base) {
  const [year, month, day] = base.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  const dates = [];
  for (let offset = 6; offset >= 0; offset--) {
    const dayDate = new Date(d.getTime() - offset * 86400000);
    dates.push(dayDate.toISOString().slice(0, 10));
  }
  return dates;
}

export function createStore(db) {
  function getTask(id) {
    return db.prepare(`${taskSelect} WHERE id = ?`).get(requiredId(id)) ?? null;
  }
  function getCat() {
    return db.prepare(catSelect).get();
  }
  function getTasks({ date, status = 'all', search = '' } = {}) {
    if (date !== undefined && !validDate(date)) throw new AppError('Ngày lọc không hợp lệ.');
    if (!['all', 'completed', 'pending'].includes(status)) throw new AppError('Bộ lọc trạng thái không hợp lệ.');
    if (typeof search !== 'string' || search.length > 100) throw new AppError('Từ khóa tìm kiếm quá dài.');
    const where = [];
    const args = [];
    if (date) { where.push('task_date = ?'); args.push(date); }
    if (status !== 'all') { where.push('status = ?'); args.push(status === 'completed' ? 1 : 0); }
    const sql = `${taskSelect} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY task_date ASC, status ASC, id DESC`;
    const tasks = db.prepare(sql).all(...args);
    const needle = normalizedSearch(search.trim());
    return needle ? tasks.filter((task) => normalizedSearch(task.title).includes(needle)) : tasks;
  }
  function createTask(body) {
    const values = cleanTask(body);
    return inTransaction(db, () => {
      const res = db.prepare('INSERT INTO tasks(title, description, task_date) VALUES (?, ?, ?)')
        .run(values.title, values.description, values.task_date);
      return getTask(Number(res.lastInsertRowid));
    });
  }
  function updateTask(id, body) {
    const safeId = requiredId(id);
    const values = cleanTask(body);
    return inTransaction(db, () => {
      if (!getTask(safeId)) throw new AppError('Không tìm thấy công việc.', 404, 'NOT_FOUND');
      db.prepare('UPDATE tasks SET title = ?, description = ?, task_date = ? WHERE id = ?')
        .run(values.title, values.description, values.task_date, safeId);
      return getTask(safeId);
    });
  }
  function setCompletion(id, completed) {
    const safeId = requiredId(id);
    if (typeof completed !== 'boolean') throw new AppError('Trường completed phải là true hoặc false.');
    return inTransaction(db, () => {
      const before = getTask(safeId);
      if (!before) throw new AppError('Không tìm thấy công việc.', 404, 'NOT_FOUND');
      const desired = completed ? 1 : 0;
      if (before.status === desired) return { task: before, cat: getCat(), earned: 0, changed: false };
      const earned = completed ? 10 : -10;
      db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(desired, safeId);
      const cat = getCat();
      const mood = completed && cat.hunger < 75 ? 'happy' : cat.mood;
      db.prepare("UPDATE cat SET coins = coins + ?, mood = ?, updated_at = datetime('now') WHERE id = 1")
        .run(earned, mood);
      return { task: getTask(safeId), cat: getCat(), earned, changed: true };
    });
  }
  function deleteTask(id) {
    const safeId = requiredId(id);
    return inTransaction(db, () => {
      const task = getTask(safeId);
      if (!task) throw new AppError('Không tìm thấy công việc.', 404, 'NOT_FOUND');
      db.prepare('DELETE FROM tasks WHERE id = ?').run(safeId);
      const earned = task.status === 1 ? -10 : 0;
      if (earned) {
        db.prepare("UPDATE cat SET coins = coins + ?, updated_at = datetime('now') WHERE id = 1").run(earned);
      }
      return { deleted: true, id: safeId, earned, cat: getCat() };
    });
  }
  function feedCat() {
    return inTransaction(db, () => {
      const cat = getCat();
      if (cat.coins < 20) throw new AppError('Bạn cần ít nhất 20 xu để cho mèo ăn.', 409, 'NOT_ENOUGH_COINS');
      db.prepare("UPDATE cat SET coins = coins - 20, hunger = max(0, hunger - 45), mood = 'happy', updated_at = datetime('now') WHERE id = 1").run();
      return getCat();
    });
  }
  function petCat() {
    return inTransaction(db, () => {
      const cat = getCat();
      const hunger = Math.min(100, cat.hunger + 9);
      const mood = hunger >= 76 ? 'hungry' : 'happy';
      db.prepare("UPDATE cat SET hunger = ?, mood = ?, updated_at = datetime('now') WHERE id = 1")
        .run(hunger, mood);
      return getCat();
    });
  }
  function napCat() {
    return inTransaction(db, () => {
      const cat = getCat();
      const mood = cat.mood === 'sleepy' ? (cat.hunger >= 76 ? 'hungry' : 'happy') : 'sleepy';
      db.prepare("UPDATE cat SET mood = ?, updated_at = datetime('now') WHERE id = 1").run(mood);
      return getCat();
    });
  }
  function getStats(date = localDate()) {
    if (!validDate(date)) throw new AppError('Ngày thống kê không hợp lệ.');
    const counts = db.prepare('SELECT count(*) AS total, coalesce(sum(status),0) AS completed FROM tasks').get();
    const today = db.prepare('SELECT count(*) AS total, coalesce(sum(status),0) AS completed FROM tasks WHERE task_date = ?').get(date);
    const dates = makeDateList(date);
    const rows = db.prepare('SELECT task_date, count(*) AS total, coalesce(sum(status),0) AS completed FROM tasks WHERE task_date BETWEEN ? AND ? GROUP BY task_date')
      .all(dates[0], dates[6]);
    const byDate = new Map(rows.map((x) => [x.task_date, x]));
    return {
      total: counts.total,
      completed: counts.completed,
      pending: counts.total - counts.completed,
      completionRate: counts.total ? Math.round(counts.completed / counts.total * 100) : 0,
      today: { total: today.total, completed: today.completed, pending: today.total - today.completed, rate: today.total ? Math.round(today.completed / today.total * 100) : 0 },
      coins: getCat().coins,
      weekly: dates.map((d) => ({ date: d, total: byDate.get(d)?.total ?? 0, completed: byDate.get(d)?.completed ?? 0 }))
    };
  }
  return { getTask, getTasks, createTask, updateTask, setCompletion, deleteTask, getCat, feedCat, petCat, napCat, getStats };
}
