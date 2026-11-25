PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tasks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 100),
  description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 500),
  task_date   TEXT NOT NULL,
  status      INTEGER NOT NULL DEFAULT 0 CHECK (status IN (0, 1)),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_date_status ON tasks(task_date, status);

CREATE TABLE IF NOT EXISTS cat (
  id         INTEGER PRIMARY KEY CHECK (id = 1),
  mood       TEXT NOT NULL DEFAULT 'happy' CHECK (mood IN ('happy', 'sleepy', 'hungry')),
  hunger     INTEGER NOT NULL DEFAULT 48 CHECK (hunger BETWEEN 0 AND 100),
  coins      INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO cat(id, mood, hunger, coins) VALUES (1, 'happy', 48, 0);
