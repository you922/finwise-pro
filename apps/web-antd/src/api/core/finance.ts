import { requestClient } from '../request';

export namespace FinanceApi {
  // 货币类型
  export interface Currency {
    code: string;
    name: string;
    symbol: string;
    isBase: boolean;
    isActive: boolean;
  }

  // 分类
  export interface Category {
    id: number;
    userId?: null | number;
    name: string;
    type: 'expense' | 'income';
    icon: string;
    color: string;
    sortOrder?: number;
    isSystem?: boolean;
    isActive?: boolean;
  }

  // 账户
  export interface Account {
    id: number;
    userId?: number;
    name: string;
    type:
      | 'alipay'
      | 'bank'
      | 'cash'
      | 'credit_card'
      | 'investment'
      | 'virtual_wallet'
      | 'wechat';
    currency: string;
    balance?: number;
    icon?: string;
    color?: string;
    isActive?: boolean;
  }

  // 汇率
  export interface ExchangeRate {
    id: number;
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    date: string;
    source: 'api' | 'manual' | 'system';
  }

  // 交易
  export interface Transaction {
    id: number;
    userId: number;
    type: 'expense' | 'income' | 'transfer';
    amount: number;
    currency: string;
    exchangeRateToBase: number;
    amountInBase: number;
    categoryId?: null | number;
    accountId?: null | number;
    transactionDate: string;
    description: string;
    project?: string;
    memo?: string;
    createdAt: string;
    isDeleted?: boolean;
    deletedAt?: string;
  }

  // 创建交易的参数
  export interface CreateTransactionParams {
    type: 'expense' | 'income' | 'transfer';
    amount: number;
    currency: string;
    categoryId?: number;
    accountId?: number;
    transactionDate: string;
    description?: string;
    project?: string;
    memo?: string;
    createdAt?: string;
  }

  // 预算
  export interface Budget {
    id: number;
    userId: number;
    category: string;
    categoryId?: number;
    emoji: string;
    limit: number;
    spent: number;
    remaining: number;
    percentage: number;
    currency: string;
    period: 'monthly' | 'quarterly' | 'weekly' | 'yearly';
    alertThreshold: number;
    description?: string;
    autoRenew: boolean;
    overspendAlert: boolean;
    dailyReminder: boolean;
    monthlyTrend?: number;
    createdAt: string;
    isDeleted?: boolean;
    deletedAt?: string;
  }

  // 创建预算的参数
  export interface CreateBudgetParams {
    category: string;
    categoryId?: number;
    emoji: string;
    limit: number;
    spent?: number;
    remaining?: number;
    percentage?: number;
    currency: string;
    period: 'monthly' | 'quarterly' | 'weekly' | 'yearly';
    alertThreshold: number;
    description?: string;
    autoRenew: boolean;
    overspendAlert: boolean;
    dailyReminder: boolean;
    monthlyTrend?: number;
  }

  /**
   * 获取所有货币
   */
  export async function getCurrencies() {
    return requestClient.get<Currency[]>('/finance/currencies');
  }

  /**
   * 获取分类
   */
  export async function getCategories(params?: {
    type?: 'expense' | 'income' | 'transfer';
  }) {
    return requestClient.get<Category[]>('/finance/categories', { params });
  }

  /**
   * 创建分类
   */
  export async function createCategory(data: {
    color?: string;
    icon?: string;
    name: string;
    type: 'expense' | 'income';
  }) {
    return requestClient.post<Category | null>('/finance/categories', data);
  }

  /**
   * 更新分类
   */
  export async function updateCategory(
    id: number,
    data: {
      color?: string;
      icon?: string;
      name?: string;
      sortOrder?: number;
    },
  ) {
    return requestClient.put<Category | null>(
      `/finance/categories/${id}`,
      data,
    );
  }

  /**
   * 删除分类
   */
  export async function deleteCategory(id: number) {
    return requestClient.delete<{ message: string }>(
      `/finance/categories/${id}`,
    );
  }

  /**
   * 获取账户
   */
  export async function getAccounts(params?: { currency?: string }) {
    return requestClient.get<Account[]>('/finance/accounts', { params });
  }

  /**
   * 获取汇率
   */
  export async function getExchangeRates(params?: {
    date?: string;
    from?: string;
    to?: string;
  }) {
    return requestClient.get<ExchangeRate[]>('/finance/exchange-rates', {
      params,
    });
  }

  /**
   * 获取交易列表
   */
  export async function getTransactions(params?: {
    type?: 'expense' | 'income' | 'transfer';
  }) {
    return requestClient.get<Transaction[]>('/finance/transactions', {
      params,
    });
  }

  /**
   * 创建交易
   */
  export async function createTransaction(data: CreateTransactionParams) {
    return requestClient.post<Transaction>('/finance/transactions', data);
  }

  /**
   * 更新交易
   */
  export async function updateTransaction(
    id: number,
    data: Partial<CreateTransactionParams>,
  ) {
    return requestClient.put<Transaction>(`/finance/transactions/${id}`, data);
  }

  /**
   * 软删除交易
   */
  export async function deleteTransaction(id: number) {
    return requestClient.delete<{ message: string }>(
      `/finance/transactions/${id}`,
    );
  }

  /**
   * 恢复交易
   */
  export async function restoreTransaction(id: number) {
    return requestClient.put<Transaction>(`/finance/transactions/${id}`, {
      isDeleted: false,
    });
  }

  /**
   * 获取预算列表
   */
  export async function getBudgets() {
    return requestClient.get<Budget[]>('/finance/budgets');
  }

  /**
   * 创建预算
   */
  export async function createBudget(data: CreateBudgetParams) {
    return requestClient.post<Budget>('/finance/budgets', data);
  }

  /**
   * 更新预算
   */
  export async function updateBudget(
    id: number,
    data: Partial<CreateBudgetParams>,
  ) {
    return requestClient.put<Budget>(`/finance/budgets/${id}`, data);
  }

  /**
   * 删除预算
   */
  export async function deleteBudget(id: number) {
    return requestClient.delete<{ message: string }>(`/finance/budgets/${id}`);
  }

  /**
   * 恢复预算
   */
  export async function restoreBudget(id: number) {
    return requestClient.put<Budget>(`/finance/budgets/${id}`, {
      isDeleted: false,
    });
  }
}
