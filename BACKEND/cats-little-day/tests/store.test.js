import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../backend/database/db.js';
import { createStore, AppError } from '../backend/database/store.js';

function fixture(callback) {
  const db = openDatabase({ path: ':memory:', seed: false });
  try { return callback(createStore(db)); }
  finally { db.close(); }
}
const date = '2026-11-25';
const sample = (title = 'Tưới hoa 🌷') => ({ title, description: 'Tận hưởng một ngày mới', task_date: date });

test('SQLite khởi tạo bảng và mèo mặc định', () => fixture((store) => {
  assert.deepEqual(store.getTasks(), []);
  assert.deepEqual([store.getCat().coins, store.getCat().hunger, store.getCat().mood], [0, 48, 'happy']);
  assert.equal(store.getStats(date).completionRate, 0);
}));

test('CRUD tạo, sửa, tìm kiếm, lọc ngày và xóa', () => fixture((store) => {
  const original = store.createTask(sample());
  assert.equal(original.status, 0);
  assert.equal(store.getTask(original.id).title, 'Tưới hoa 🌷');
  assert.equal(store.getTasks({ search: 'Tưới' }).length, 1);
  assert.equal(store.getTasks({ date: '2026-11-26' }).length, 0);
  const edited = store.updateTask(original.id, { ...sample('Đi bộ'), task_date: '2026-11-26' });
  assert.equal(edited.title, 'Đi bộ');
  assert.equal(store.getTasks({ date: '2026-11-26' }).length, 1);
  assert.deepEqual([store.deleteTask(original.id).deleted, store.getTasks().length], [true, 0]);
}));

test('hoàn thành chỉ cộng 10 xu một lần; bỏ chọn trừ đúng 10', () => fixture((store) => {
  const task = store.createTask(sample());
  assert.equal(store.setCompletion(task.id, true).earned, 10);
  assert.equal(store.setCompletion(task.id, true).earned, 0);
  assert.equal(store.getCat().coins, 10);
  assert.equal(store.getTasks({ status: 'completed' }).length, 1);
  assert.equal(store.getStats(date).today.rate, 100);
  assert.equal(store.setCompletion(task.id, false).earned, -10);
  assert.equal(store.setCompletion(task.id, false).earned, 0);
  assert.equal(store.getCat().coins, 0);
  assert.equal(store.getStats(date).today.completed, 0);
}));

test('cho ăn yêu cầu >=20 xu và trừ đúng 20 trong transaction', () => fixture((store) => {
  assert.throws(() => store.feedCat(), (err) => err.code === 'NOT_ENOUGH_COINS');
  const a = store.createTask(sample('A'));
  const b = store.createTask(sample('B'));
  store.setCompletion(a.id, true);
  store.setCompletion(b.id, true);
  const fed = store.feedCat();
  assert.equal(fed.coins, 0);
  assert.equal(fed.hunger, 3);
  assert.equal(fed.mood, 'happy');
  assert.throws(() => store.feedCat(), AppError);
}));

test('bỏ chọn / xóa task sau khi tiêu xu tạo dư nợ, không nhân xu', () => fixture((store) => {
  const a = store.createTask(sample('A'));
  const b = store.createTask(sample('B'));
  store.setCompletion(a.id, true);
  store.setCompletion(b.id, true);
  store.feedCat();
  assert.equal(store.setCompletion(a.id, false).cat.coins, -10);
  assert.equal(store.deleteTask(b.id).cat.coins, -20);
  assert.equal(store.setCompletion(a.id, true).cat.coins, -10);
  assert.equal(store.setCompletion(a.id, true).cat.coins, -10);
  assert.equal(store.getStats(date).coins, -10);
}));

test('validation và rollback không làm thay đổi coins hoặc dữ liệu', () => fixture((store) => {
  const a = store.createTask(sample());
  assert.throws(() => store.createTask({ ...sample(), title: ' ' }), AppError);
  assert.throws(() => store.updateTask(a.id, { ...sample(), task_date: '2026-02-30' }), AppError);
  assert.throws(() => store.setCompletion(a.id, 'yes'), AppError);
  assert.throws(() => store.setCompletion(999999, true), (err) => err.status === 404);
  assert.throws(() => store.deleteTask(999999), (err) => err.status === 404);
  assert.equal(store.getTask(a.id).title, 'Tưới hoa 🌷');
  assert.equal(store.getCat().coins, 0);
}));

test('mèo có 3 trạng thái happy / sleepy / hungry', () => fixture((store) => {
  assert.equal(store.napCat().mood, 'sleepy');
  assert.equal(store.napCat().mood, 'happy');
  let cat;
  for (let i = 0; i < 4; i++) cat = store.petCat();
  assert.equal(cat.mood, 'hungry');
  assert.equal(cat.hunger, 84);
}));

test('thống kê 7 ngày dùng ngày thực hiện và tổng riêng', () => fixture((store) => {
  const task = store.createTask(sample());
  store.createTask({ ...sample('Hôm trước'), task_date: '2026-11-24' });
  store.createTask({ ...sample('Tuần trước'), task_date: '2026-11-01' });
  store.setCompletion(task.id, true);
  const stats = store.getStats(date);
  assert.deepEqual([stats.total, stats.completed, stats.pending, stats.completionRate], [3, 1, 2, 33]);
  assert.equal(stats.weekly.length, 7);
  assert.equal(stats.weekly.at(-1).completed, 1);
  assert.equal(stats.weekly.at(-2).total, 1);
}));

test('tìm kiếm tiếng Việt không phân biệt chữ hoa và dấu', () => fixture((store) => {
  store.createTask(sample('Đọc truyện mỗi tối'));
  assert.equal(store.getTasks({ search: 'doc truyen' }).length, 1);
  assert.equal(store.getTasks({ search: 'ĐỌC' }).length, 1);
  assert.equal(store.getTasks({ search: '%' }).length, 0);
}));

test('SQLite trên ổ đĩa giữ dữ liệu sau khi đóng và mở lại', async () => {
  const { mkdtempSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const dir = mkdtempSync(join(tmpdir(), 'cat-little-test-'));
  const path = join(dir, 'test.sqlite');
  try {
    let db = openDatabase({ path, seed: false });
    const task = createStore(db).createTask(sample('Không biến mất'));
    createStore(db).setCompletion(task.id, true);
    db.close();
    db = openDatabase({ path, seed: true });
    assert.equal(createStore(db).getTasks().length, 1);
    assert.equal(createStore(db).getCat().coins, 10);
    db.close();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
