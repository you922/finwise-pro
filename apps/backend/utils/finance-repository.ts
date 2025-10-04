import db from './sqlite';

const BASE_CURRENCY = 'CNY';

interface TransactionRow {
  id: number;
  type: string;
  amount: number;
  currency: string;
  exchange_rate_to_base: number;
  amount_in_base: number;
  category_id: number | null;
  account_id: number | null;
  transaction_date: string;
  description: string | null;
  project: string | null;
  memo: string | null;
  created_at: string;
  is_deleted: number;
  deleted_at: string | null;
}

interface TransactionPayload {
  type: string;
  amount: number;
  currency: string;
  categoryId?: number | null;
  accountId?: number | null;
  transactionDate: string;
  description?: string;
  project?: string | null;
  memo?: string | null;
  createdAt?: string;
  isDeleted?: boolean;
}

function getExchangeRateToBase(currency: string) {
  if (currency === BASE_CURRENCY) {
    return 1;
  }
  const stmt = db.prepare(
    `SELECT rate FROM finance_exchange_rates WHERE from_currency = ? AND to_currency = ? ORDER BY date DESC LIMIT 1`,
  );
  const row = stmt.get(currency, BASE_CURRENCY) as { rate: number } | undefined;
  return row?.rate ?? 1;
}

function mapTransaction(row: TransactionRow) {
  return {
    id: row.id,
    userId: 1,
    type: row.type as 'income' | 'expense' | 'transfer',
    amount: row.amount,
    currency: row.currency,
    exchangeRateToBase: row.exchange_rate_to_base,
    amountInBase: row.amount_in_base,
    categoryId: row.category_id ?? undefined,
    accountId: row.account_id ?? undefined,
    transactionDate: row.transaction_date,
    description: row.description ?? '',
    project: row.project ?? undefined,
    memo: row.memo ?? undefined,
    createdAt: row.created_at,
    isDeleted: Boolean(row.is_deleted),
    deletedAt: row.deleted_at ?? undefined,
  };
}

export function fetchTransactions(options: { type?: string; includeDeleted?: boolean } = {}) {
  const clauses: string[] = [];
  const params: Record<string, unknown> = {};

  if (!options.includeDeleted) {
    clauses.push('is_deleted = 0');
  }
  if (options.type) {
    clauses.push('type = @type');
    params.type = options.type;
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const stmt = db.prepare<TransactionRow>(
    `SELECT id, type, amount, currency, exchange_rate_to_base, amount_in_base, category_id, account_id, transaction_date, description, project, memo, created_at, is_deleted, deleted_at FROM finance_transactions ${where} ORDER BY transaction_date DESC, id DESC`,
  );

  return stmt.all(params).map(mapTransaction);
}

export function getTransactionById(id: number) {
  const stmt = db.prepare<TransactionRow>(
    `SELECT id, type, amount, currency, exchange_rate_to_base, amount_in_base, category_id, account_id, transaction_date, description, project, memo, created_at, is_deleted, deleted_at FROM finance_transactions WHERE id = ?`,
  );
  const row = stmt.get(id);
  return row ? mapTransaction(row) : null;
}

export function createTransaction(payload: TransactionPayload) {
  const exchangeRate = getExchangeRateToBase(payload.currency);
  const amountInBase = +(payload.amount * exchangeRate).toFixed(2);
  const createdAt = payload.createdAt && payload.createdAt.length ? payload.createdAt : new Date().toISOString();

  const stmt = db.prepare(
    `INSERT INTO finance_transactions (type, amount, currency, exchange_rate_to_base, amount_in_base, category_id, account_id, transaction_date, description, project, memo, created_at, is_deleted) VALUES (@type, @amount, @currency, @exchangeRateToBase, @amountInBase, @categoryId, @accountId, @transactionDate, @description, @project, @memo, @createdAt, 0)`,
  );

  const info = stmt.run({
    type: payload.type,
    amount: payload.amount,
    currency: payload.currency,
    exchangeRateToBase: exchangeRate,
    amountInBase,
    categoryId: payload.categoryId ?? null,
    accountId: payload.accountId ?? null,
    transactionDate: payload.transactionDate,
    description: payload.description ?? '',
    project: payload.project ?? null,
    memo: payload.memo ?? null,
    createdAt,
  });

  return getTransactionById(Number(info.lastInsertRowid));
}

export function updateTransaction(id: number, payload: TransactionPayload) {
  const current = getTransactionById(id);
  if (!current) {
    return null;
  }

  const next = {
    type: payload.type ?? current.type,
    amount: payload.amount ?? current.amount,
    currency: payload.currency ?? current.currency,
    categoryId: payload.categoryId ?? current.categoryId ?? null,
    accountId: payload.accountId ?? current.accountId ?? null,
    transactionDate: payload.transactionDate ?? current.transactionDate,
    description: payload.description ?? current.description ?? '',
    project: payload.project ?? current.project ?? null,
    memo: payload.memo ?? current.memo ?? null,
    isDeleted: payload.isDeleted ?? current.isDeleted,
  };

  const exchangeRate = getExchangeRateToBase(next.currency);
  const amountInBase = +(next.amount * exchangeRate).toFixed(2);

  const stmt = db.prepare(
    `UPDATE finance_transactions SET type = @type, amount = @amount, currency = @currency, exchange_rate_to_base = @exchangeRateToBase, amount_in_base = @amountInBase, category_id = @categoryId, account_id = @accountId, transaction_date = @transactionDate, description = @description, project = @project, memo = @memo, is_deleted = @isDeleted, deleted_at = @deletedAt WHERE id = @id`,
  );

  const deletedAt = next.isDeleted ? new Date().toISOString() : null;

  stmt.run({
    id,
    type: next.type,
    amount: next.amount,
    currency: next.currency,
    exchangeRateToBase: exchangeRate,
    amountInBase,
    categoryId: next.categoryId,
    accountId: next.accountId,
    transactionDate: next.transactionDate,
    description: next.description,
    project: next.project,
    memo: next.memo,
    isDeleted: next.isDeleted ? 1 : 0,
    deletedAt,
  });

  return getTransactionById(id);
}

export function softDeleteTransaction(id: number) {
  const stmt = db.prepare(`UPDATE finance_transactions SET is_deleted = 1, deleted_at = @deletedAt WHERE id = @id`);
  stmt.run({ id, deletedAt: new Date().toISOString() });
  return getTransactionById(id);
}

export function restoreTransaction(id: number) {
  const stmt = db.prepare(`UPDATE finance_transactions SET is_deleted = 0, deleted_at = NULL WHERE id = @id`);
  stmt.run({ id });
  return getTransactionById(id);
}

export function replaceAllTransactions(rows: Array<{
  type: string;
  amount: number;
  currency: string;
  categoryId: number | null;
  accountId: number | null;
  transactionDate: string;
  description: string;
  project?: string | null;
  memo?: string | null;
  createdAt?: string;
}>) {
  db.prepare('DELETE FROM finance_transactions').run();

  const insert = db.prepare(
    `INSERT INTO finance_transactions (type, amount, currency, exchange_rate_to_base, amount_in_base, category_id, account_id, transaction_date, description, project, memo, created_at, is_deleted) VALUES (@type, @amount, @currency, @exchangeRateToBase, @amountInBase, @categoryId, @accountId, @transactionDate, @description, @project, @memo, @createdAt, 0)`,
  );

  const getRate = db.prepare(
    `SELECT rate FROM finance_exchange_rates WHERE from_currency = ? AND to_currency = 'CNY' ORDER BY date DESC LIMIT 1`,
  );

  const insertMany = db.transaction((items: Array<any>) => {
    for (const item of items) {
      const row = getRate.get(item.currency) as { rate: number } | undefined;
      const rate = row?.rate ?? 1;
      const amountInBase = +(item.amount * rate).toFixed(2);
      insert.run({
        ...item,
        exchangeRateToBase: rate,
        amountInBase,
        project: item.project ?? null,
        memo: item.memo ?? null,
        createdAt: item.createdAt ?? new Date(`${item.transactionDate}T00:00:00Z`).toISOString(),
      });
    }
  });

  insertMany(rows);
}

// 分类相关函数
interface CategoryRow {
  id: number;
  name: string;
  type: string;
  icon: string | null;
  color: string | null;
  user_id: number | null;
  is_active: number;
}

function mapCategory(row: CategoryRow) {
  return {
    id: row.id,
    userId: row.user_id ?? null,
    name: row.name,
    type: row.type as 'income' | 'expense',
    icon: row.icon ?? '📝',
    color: row.color ?? '#dfe4ea',
    sortOrder: row.id,
    isSystem: row.user_id === null,
    isActive: Boolean(row.is_active),
  };
}

export function fetchCategories(options: { type?: 'income' | 'expense' } = {}) {
  const where = options.type ? `WHERE type = @type AND is_active = 1` : 'WHERE is_active = 1';
  const params = options.type ? { type: options.type } : {};

  const stmt = db.prepare<CategoryRow>(
    `SELECT id, name, type, icon, color, user_id, is_active FROM finance_categories ${where} ORDER BY id ASC`,
  );

  return stmt.all(params).map(mapCategory);
}
