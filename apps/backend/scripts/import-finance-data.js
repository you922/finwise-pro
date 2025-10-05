#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const Database = require('better-sqlite3');

const args = process.argv.slice(2);
const params = {};
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg.startsWith('--')) {
    const key = arg.slice(2);
    const next = args[i + 1];
    if (!next || next.startsWith('--')) {
      params[key] = true;
    } else {
      params[key] = next;
      i += 1;
    }
  }
}

if (!params.csv) {
  console.error('请通过 --csv <路径> 指定 CSV 数据文件');
  process.exit(1);
}

const inputPath = path.resolve(params.csv);
if (!fs.existsSync(inputPath)) {
  console.error(`无法找到 CSV 文件: ${inputPath}`);
  process.exit(1);
}

const baseYear = params.year ? Number(params.year) : 2024;
if (Number.isNaN(baseYear)) {
  console.error('参数 --year 必须为数字');
  process.exit(1);
}

const storeDir = path.join(process.cwd(), 'storage');
fs.mkdirSync(storeDir, { recursive: true });
const dbFile = path.join(storeDir, 'finance.db');
const db = new Database(dbFile);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS finance_currencies (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    is_base INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS finance_exchange_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_currency TEXT NOT NULL,
    to_currency TEXT NOT NULL,
    rate REAL NOT NULL,
    date TEXT NOT NULL,
    source TEXT DEFAULT 'manual'
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS finance_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    currency TEXT NOT NULL,
    type TEXT DEFAULT 'cash',
    balance REAL DEFAULT 0,
    icon TEXT,
    color TEXT,
    user_id INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1
  );
`);

db.exec(`
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

db.exec(`
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
    deleted_at TEXT
  );
`);

const RAW_TEXT = fs.readFileSync(inputPath, 'utf8').replace(/^\uFEFF/, '');
const lines = RAW_TEXT.split(/\r?\n/).filter((line) => line.trim().length > 0);
if (lines.length <= 1) {
  console.error('CSV 文件内容为空');
  process.exit(1);
}

const header = lines[0].split(',');
const DATE_IDX = header.indexOf('日期');
const PROJECT_IDX = header.indexOf('项目');
const TYPE_IDX = header.indexOf('收支');
const AMOUNT_IDX = header.indexOf('金额');
const ACCOUNT_IDX = header.indexOf('支出人');
const CATEGORY_IDX = header.indexOf('计入');
const SHARE_IDX = header.indexOf('阿德应得分红');

if (
  DATE_IDX === -1 ||
  PROJECT_IDX === -1 ||
  TYPE_IDX === -1 ||
  AMOUNT_IDX === -1 ||
  ACCOUNT_IDX === -1 ||
  CATEGORY_IDX === -1
) {
  console.error('CSV 表头缺少必需字段');
  process.exit(1);
}

const CURRENCIES = [
  { code: 'CNY', name: '人民币', symbol: '¥', isBase: true },
  { code: 'USD', name: '美元', symbol: '$', isBase: false },
  { code: 'THB', name: '泰铢', symbol: '฿', isBase: false },
];

const EXCHANGE_RATES = [
  {
    fromCurrency: 'CNY',
    toCurrency: 'CNY',
    rate: 1,
    date: `${baseYear}-01-01`,
    source: 'system',
  },
  {
    fromCurrency: 'USD',
    toCurrency: 'CNY',
    rate: 7.14,
    date: `${baseYear}-01-01`,
    source: 'manual',
  },
  {
    fromCurrency: 'THB',
    toCurrency: 'CNY',
    rate: 0.2,
    date: `${baseYear}-01-01`,
    source: 'manual',
  },
];

const DEFAULT_EXPENSE_CATEGORY = '未分类支出';
const DEFAULT_INCOME_CATEGORY = '未分类收入';

db.prepare('DELETE FROM finance_transactions').run();
db.prepare('DELETE FROM finance_accounts').run();
db.prepare('DELETE FROM finance_categories').run();
db.prepare('DELETE FROM finance_currencies').run();
db.prepare('DELETE FROM finance_exchange_rates').run();

db.transaction(() => {
  const insertCurrency = db.prepare(`
    INSERT INTO finance_currencies (code, name, symbol, is_base, is_active)
    VALUES (@code, @name, @symbol, @isBase, 1)
  `);
  for (const currency of CURRENCIES) {
    insertCurrency.run({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      isBase: currency.isBase ? 1 : 0,
    });
  }
  const insertRate = db.prepare(`
    INSERT INTO finance_exchange_rates (from_currency, to_currency, rate, date, source)
    VALUES (@fromCurrency, @toCurrency, @rate, @date, @source)
  `);
  for (const rate of EXCHANGE_RATES) {
    insertRate.run(rate);
  }
})();

function inferCurrency(accountName, amountText) {
  const name = accountName ?? '';
  const text = `${name}${amountText ?? ''}`;
  const lower = text.toLowerCase();
  if (
    lower.includes('美金') ||
    lower.includes('usd') ||
    lower.includes('u$') ||
    lower.includes('u ')
  ) {
    return 'USD';
  }
  if (lower.includes('泰铢') || lower.includes('thb')) {
    return 'THB';
  }
  return 'CNY';
}

function parseAmount(raw) {
  if (!raw) return 0;
  const matches = String(raw)
    .replaceAll(/[^0-9.+-]/g, (char) =>
      char === '+' || char === '-' ? char : ' ',
    )
    .match(/[-+]?\d+(?:\.\d+)?/g);
  if (!matches) return 0;
  return matches.map(Number).reduce((sum, value) => sum + value, 0);
}

function normalizeDate(value, monthTracker) {
  const cleaned = value.trim();
  const match = cleaned.match(/(\d{1,2})月(\d{1,2})日/);
  if (!match) {
    throw new Error(`无法解析日期: ${value}`);
  }
  const month = Number(match[1]);
  const day = Number(match[2]);
  let year = baseYear;
  if (
    monthTracker.lastMonth !== null &&
    month > monthTracker.lastMonth &&
    monthTracker.wrapped
  ) {
    year -= 1;
  }
  if (
    monthTracker.lastMonth !== null &&
    month < monthTracker.lastMonth &&
    !monthTracker.wrapped
  ) {
    monthTracker.wrapped = true;
  }
  monthTracker.lastMonth = month;
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return iso;
}

const accountMap = new Map();
const categoryMap = new Map();

const insertAccount = db.prepare(`
  INSERT INTO finance_accounts (name, currency, type, balance, icon, color, user_id, is_active)
  VALUES (@name, @currency, @type, 0, @icon, @color, 1, 1)
`);

const insertCategory = db.prepare(`
  INSERT INTO finance_categories (name, type, icon, color, user_id, is_active)
  VALUES (@name, @type, @icon, @color, 1, 1)
`);

db.transaction(() => {
  if (!categoryMap.has(`${DEFAULT_INCOME_CATEGORY}-income`)) {
    const info = insertCategory.run({
      name: DEFAULT_INCOME_CATEGORY,
      type: 'income',
      icon: '💰',
      color: '#10b981',
    });
    categoryMap.set(`${DEFAULT_INCOME_CATEGORY}-income`, info.lastInsertRowid);
  }
  if (!categoryMap.has(`${DEFAULT_EXPENSE_CATEGORY}-expense`)) {
    const info = insertCategory.run({
      name: DEFAULT_EXPENSE_CATEGORY,
      type: 'expense',
      icon: '🏷️',
      color: '#6366f1',
    });
    categoryMap.set(
      `${DEFAULT_EXPENSE_CATEGORY}-expense`,
      info.lastInsertRowid,
    );
  }
})();

const monthTracker = { lastMonth: null, wrapped: false };
let carryDate = '';
const transactions = [];

for (let i = 1; i < lines.length; i += 1) {
  const row = lines[i].split(',');
  while (row.length < header.length) row.push('');

  const rawDate = row[DATE_IDX].trim();
  if (rawDate) {
    carryDate = normalizeDate(rawDate, monthTracker);
  }
  if (!carryDate) {
    continue;
  }

  const project = row[PROJECT_IDX].trim();
  const typeText = row[TYPE_IDX].trim();
  const amountRaw = row[AMOUNT_IDX].trim();
  const accountNameRaw = row[ACCOUNT_IDX].trim();
  const categoryRaw = row[CATEGORY_IDX].trim();
  const shareRaw = SHARE_IDX === -1 ? '' : row[SHARE_IDX].trim();

  const amount = parseAmount(amountRaw);
  if (!amount) {
    continue;
  }

  const normalizedType =
    typeText.includes('收') && !typeText.includes('支') ? 'income' : 'expense';
  const accountName = accountNameRaw || '美金现金';
  const currency = inferCurrency(accountNameRaw, amountRaw);

  if (!accountMap.has(accountName)) {
    const icon = currency === 'USD' ? '💵' : currency === 'THB' ? '💱' : '💰';
    const color =
      currency === 'USD'
        ? '#1677ff'
        : currency === 'THB'
          ? '#22c55e'
          : '#6366f1';
    const info = insertAccount.run({
      name: accountName,
      currency,
      type: 'cash',
      icon,
      color,
    });
    accountMap.set(accountName, Number(info.lastInsertRowid));
  }

  const categoryName =
    categoryRaw ||
    (normalizedType === 'income'
      ? DEFAULT_INCOME_CATEGORY
      : DEFAULT_EXPENSE_CATEGORY);
  const categoryKey = `${categoryName}-${normalizedType}`;
  if (!categoryMap.has(categoryKey)) {
    const icon = normalizedType === 'income' ? '💰' : '🏷️';
    const color = normalizedType === 'income' ? '#10b981' : '#fb7185';
    const info = insertCategory.run({
      name: categoryName,
      type: normalizedType,
      icon,
      color,
    });
    categoryMap.set(categoryKey, Number(info.lastInsertRowid));
  }

  const descriptionParts = [];
  if (project) descriptionParts.push(project);
  if (categoryRaw) descriptionParts.push(`计入: ${categoryRaw}`);
  if (shareRaw) descriptionParts.push(`分红: ${shareRaw}`);

  const description = descriptionParts.join(' | ');
  transactions.push({
    type: normalizedType,
    amount,
    currency,
    categoryId: categoryMap.get(categoryKey) ?? null,
    accountId: accountMap.get(accountName) ?? null,
    transactionDate: carryDate,
    description,
    project: project || null,
    memo: shareRaw || null,
  });
}

const insertTransaction = db.prepare(`
  INSERT INTO finance_transactions (
    type,
    amount,
    currency,
    exchange_rate_to_base,
    amount_in_base,
    category_id,
    account_id,
    transaction_date,
    description,
    project,
    memo,
    created_at,
    is_deleted
  ) VALUES (@type, @amount, @currency, @exchangeRateToBase, @amountInBase, @categoryId, @accountId, @transactionDate, @description, @project, @memo, @createdAt, 0)
`);

const getRateStmt = db.prepare(`
  SELECT rate
  FROM finance_exchange_rates
  WHERE from_currency = ? AND to_currency = 'CNY'
  ORDER BY date DESC
  LIMIT 1
`);

const insertMany = db.transaction((items) => {
  for (const item of items) {
    const rateRow = getRateStmt.get(item.currency);
    const rate = rateRow ? rateRow.rate : 1;
    const amountInBase = +(item.amount * rate).toFixed(2);
    insertTransaction.run({
      ...item,
      exchangeRateToBase: rate,
      amountInBase,
      createdAt: `${item.transactionDate}T00:00:00.000Z`,
    });
  }
});

insertMany(transactions);

console.log(
  `已导入 ${transactions.length} 条交易，账户 ${accountMap.size} 个，分类 ${categoryMap.size} 个。`,
);
