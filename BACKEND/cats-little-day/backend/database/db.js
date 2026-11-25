import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(resolve(directory, 'schema.sql'), 'utf8');

export function localDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function openDatabase({ path = process.env.DB_PATH || resolve(directory, 'cats.sqlite'), seed = true } = {}) {
  const isFresh = path === ':memory:' || !existsSync(path);
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(schema);
  if (seed && isFresh) {
    const insert = db.prepare('INSERT INTO tasks(title, description, task_date) VALUES (?, ?, ?)');
    const today = localDate();
    insert.run('Uống một cốc nước 💧', 'Bắt đầu ngày mới thật nhẹ nhàng', today);
    insert.run('Đọc sách 20 phút 📚', 'Dành một chút thời gian cho bản thân', today);
    insert.run('Đi dạo ngoài trời 🌿', 'Hít thở không khí trong lành', today);
  }
  return db;
}

export function inTransaction(db, callback) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = callback();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
