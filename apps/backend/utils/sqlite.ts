import { mkdirSync } from 'node:fs';

import Database from 'better-sqlite3';
import { dirname, join } from 'pathe';

const dbFile = join(process.cwd(), 'storage', 'finance.db');

mkdirSync(dirname(dbFile), { recursive: true });

const database = new Database(dbFile);

database.pragma('journal_mode = WAL');

database.exec(`
  CREATE TABLE IF NOT EXISTS finance_currencies (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    is_base INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1
  );
`);

database.exec(`
  CREATE TABLE IF NOT EXISTS finance_exchange_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_currency TEXT NOT NULL,
    to_currency TEXT NOT NULL,
    rate REAL NOT NULL,
    date TEXT NOT NULL,
    source TEXT DEFAULT 'manual'
  );
`);

database.exec(`
  CREATE TABLE IF NOT EXISTS finance_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    currency TEXT NOT NULL,
    type TEXT DEFAULT 'cash',
    icon TEXT,
    color TEXT,
    user_id INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1
  );
`);

database.exec(`
  CREATE TABLE IF NOT EXISTS finance_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    user_id INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1
  );
`);

database.exec(`
  CREATE TABLE IF NOT EXISTS finance_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    exchange_rate_to_base REAL NOT NULL,
    amount_in_base REAL NOT NULL,
    category_id INTEGER,
    account_id INTEGER,
    transaction_date TEXT NOT NULL,
    description TEXT,
    project TEXT,
    memo TEXT,
    created_at TEXT NOT NULL,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    deleted_at TEXT,
    FOREIGN KEY (currency) REFERENCES finance_currencies(code),
    FOREIGN KEY (category_id) REFERENCES finance_categories(id),
    FOREIGN KEY (account_id) REFERENCES finance_accounts(id)
  );
`);

export default database;
