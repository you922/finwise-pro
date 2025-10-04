import { defineStore } from 'pinia';
import { ref } from 'vue';

import { FinanceApi } from '#/api/core/finance';

export const useFinanceStore = defineStore('finance', () => {
  // 状态
  const currencies = ref<FinanceApi.Currency[]>([]);
  const incomeCategories = ref<FinanceApi.Category[]>([]);
  const expenseCategories = ref<FinanceApi.Category[]>([]);
  const accounts = ref<FinanceApi.Account[]>([]);
  const exchangeRates = ref<FinanceApi.ExchangeRate[]>([]);
  const transactions = ref<FinanceApi.Transaction[]>([]);
  const budgets = ref<FinanceApi.Budget[]>([]);

  // 加载状态
  const loading = ref({
    currencies: false,
    categories: false,
    accounts: false,
    exchangeRates: false,
    transactions: false,
    budgets: false,
  });

  // 获取货币列表
  async function fetchCurrencies() {
    loading.value.currencies = true;
    try {
      currencies.value = await FinanceApi.getCurrencies();
    } finally {
      loading.value.currencies = false;
    }
  }

  // 获取分类列表
  async function fetchCategories() {
    loading.value.categories = true;
    try {
      const [income, expense] = await Promise.all([
        FinanceApi.getCategories({ type: 'income' }),
        FinanceApi.getCategories({ type: 'expense' }),
      ]);
      incomeCategories.value = income;
      expenseCategories.value = expense;
    } finally {
      loading.value.categories = false;
    }
  }

  // 创建分类
  async function createCategory(data: {
    name: string;
    type: 'income' | 'expense';
    icon?: string;
    color?: string;
  }) {
    const category = await FinanceApi.createCategory(data);
    if (!category) {
      return null;
    }
    if (category.type === 'income') {
      incomeCategories.value.push(category);
    } else {
      expenseCategories.value.push(category);
    }
    return category;
  }

  // 更新分类
  async function updateCategory(
    id: number,
    data: {
      name?: string;
      icon?: string;
      color?: string;
      sortOrder?: number;
    },
  ) {
    const category = await FinanceApi.updateCategory(id, data);
    if (!category) {
      return null;
    }
    const list =
      category.type === 'income'
        ? incomeCategories.value
        : expenseCategories.value;
    const index = list.findIndex((c) => c.id === id);
    if (index !== -1) {
      list[index] = category;
    }
    return category;
  }

  // 删除分类
  async function deleteCategory(id: number) {
    await FinanceApi.deleteCategory(id);
    // 从本地列表中移除
    let index = incomeCategories.value.findIndex((c) => c.id === id);
    if (index !== -1) {
      incomeCategories.value.splice(index, 1);
    } else {
      index = expenseCategories.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        expenseCategories.value.splice(index, 1);
      }
    }
  }

  // 获取账户列表
  async function fetchAccounts(currency?: string) {
    loading.value.accounts = true;
    try {
      accounts.value = await FinanceApi.getAccounts(
        currency ? { currency } : undefined,
      );
    } finally {
      loading.value.accounts = false;
    }
  }

  // 获取汇率
  async function fetchExchangeRates() {
    loading.value.exchangeRates = true;
    try {
      exchangeRates.value = await FinanceApi.getExchangeRates();
    } finally {
      loading.value.exchangeRates = false;
    }
  }

  // 获取交易列表
  async function fetchTransactions() {
    loading.value.transactions = true;
    try {
      transactions.value = await FinanceApi.getTransactions();
    } finally {
      loading.value.transactions = false;
    }
  }

  // 创建交易
  async function createTransaction(data: FinanceApi.CreateTransactionParams) {
    const transaction = await FinanceApi.createTransaction(data);
    // 添加到本地列表
    transactions.value.unshift(transaction);
    // 重新获取账户余额
    await fetchAccounts();
    return transaction;
  }

  // 更新交易
  async function updateTransaction(
    id: number,
    data: Partial<FinanceApi.CreateTransactionParams>,
  ) {
    const transaction = await FinanceApi.updateTransaction(id, data);
    // 更新本地列表
    const index = transactions.value.findIndex((t) => t.id === id);
    if (index !== -1) {
      transactions.value[index] = transaction;
    }
    // 重新获取账户余额
    await fetchAccounts();
    return transaction;
  }

  // 软删除交易
  async function softDeleteTransaction(id: number) {
    await FinanceApi.deleteTransaction(id);
    // 更新本地列表中的删除状态
    const index = transactions.value.findIndex((t) => t.id === id);
    if (index !== -1) {
      transactions.value[index] = {
        ...transactions.value[index],
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      };
    }
    // 重新获取账户余额
    await fetchAccounts();
  }

  // 恢复交易
  async function restoreTransaction(id: number) {
    const transaction = await FinanceApi.restoreTransaction(id);
    // 更新本地列表
    const index = transactions.value.findIndex((t) => t.id === id);
    if (index !== -1) {
      transactions.value[index] = transaction;
    }
    // 重新获取账户余额
    await fetchAccounts();
    return transaction;
  }

  // 根据货币代码获取货币信息
  function getCurrencyByCode(code: string) {
    return currencies.value.find((c) => c.code === code);
  }

  // 根据账户ID获取账户信息
  function getAccountById(id: number) {
    return accounts.value.find((a) => a.id === id);
  }

  // 根据分类ID获取分类信息
  function getCategoryById(id: number) {
    return [...incomeCategories.value, ...expenseCategories.value].find(
      (c) => c.id === id,
    );
  }

  // 获取汇率
  function getExchangeRate(from: string, to: string) {
    return exchangeRates.value.find(
      (r) => r.fromCurrency === from && r.toCurrency === to,
    );
  }

  // 根据货币过滤账户
  function getAccountsByCurrency(currency: string) {
    return accounts.value.filter((a) => a.currency === currency);
  }

  // 获取预算列表
  async function fetchBudgets() {
    loading.value.budgets = true;
    try {
      budgets.value = await FinanceApi.getBudgets();
    } finally {
      loading.value.budgets = false;
    }
  }

  // 创建预算
  async function createBudget(data: FinanceApi.CreateBudgetParams) {
    const budget = await FinanceApi.createBudget(data);
    budgets.value.push(budget);
    return budget;
  }

  // 更新预算
  async function updateBudget(
    id: number,
    data: Partial<FinanceApi.CreateBudgetParams>,
  ) {
    const budget = await FinanceApi.updateBudget(id, data);
    const index = budgets.value.findIndex((b) => b.id === id);
    if (index !== -1) {
      budgets.value[index] = budget;
    }
    return budget;
  }

  // 删除预算
  async function deleteBudget(id: number) {
    await FinanceApi.deleteBudget(id);
    const index = budgets.value.findIndex((b) => b.id === id);
    if (index !== -1) {
      budgets.value[index] = {
        ...budgets.value[index],
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      };
    }
  }

  // 恢复预算
  async function restoreBudget(id: number) {
    const budget = await FinanceApi.restoreBudget(id);
    const index = budgets.value.findIndex((b) => b.id === id);
    if (index !== -1) {
      budgets.value[index] = budget;
    }
    return budget;
  }

  // 初始化所有数据
  async function initializeData() {
    await Promise.all([
      fetchCurrencies(),
      fetchCategories(),
      fetchAccounts(),
      fetchExchangeRates(),
    ]);
  }

  return {
    // 状态
    currencies,
    incomeCategories,
    expenseCategories,
    accounts,
    exchangeRates,
    transactions,
    budgets,
    loading,

    // 方法
    fetchCurrencies,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchAccounts,
    fetchExchangeRates,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    softDeleteTransaction,
    restoreTransaction,
    fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    restoreBudget,
    getCurrencyByCode,
    getAccountById,
    getCategoryById,
    getExchangeRate,
    getAccountsByCurrency,
    initializeData,
  };
});
