import type { 
  ExportParams, 
  ImportResult, 
  PageResult, 
  SearchParams, 
  Transaction 
} from '#/types/finance';

import { ref } from 'vue';

import { defineStore } from 'pinia';

import {
  batchDeleteTransactions as batchDeleteApi,
  createTransaction as createTransactionApi,
  deleteTransaction as deleteTransactionApi,
  exportTransactions as exportTransactionsApi,
  getTransactionList,
  getTransactionStatistics,
  importTransactions as importTransactionsApi,
  updateTransaction as updateTransactionApi,
} from '#/api/finance';

export const useTransactionStore = defineStore('finance-transaction', () => {
  // 状态
  const transactions = ref<Transaction[]>([]);
  const currentTransaction = ref<Transaction | null>(null);
  const loading = ref(false);
  const pageInfo = ref({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });
  const statistics = ref({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });

  // 获取交易列表
  async function fetchTransactions(params: SearchParams) {
    loading.value = true;
    try {
      const result = await getTransactionList(params);
      transactions.value = result.items;
      pageInfo.value = {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      };
      return result;
    } finally {
      loading.value = false;
    }
  }

  // 获取统计数据
  async function fetchStatistics(params?: SearchParams) {
    const data = await getTransactionStatistics(params);
    statistics.value = data;
    return data;
  }

  // 创建交易
  async function createTransaction(data: Partial<Transaction>) {
    const newTransaction = await createTransactionApi(data);
    transactions.value.unshift(newTransaction);
    return newTransaction;
  }

  // 更新交易
  async function updateTransaction(id: string, data: Partial<Transaction>) {
    const updatedTransaction = await updateTransactionApi(id, data);
    const index = transactions.value.findIndex((t) => t.id === id);
    if (index !== -1) {
      transactions.value[index] = updatedTransaction;
    }
    return updatedTransaction;
  }

  // 删除交易
  async function deleteTransaction(id: string) {
    await deleteTransactionApi(id);
    transactions.value = transactions.value.filter((t) => t.id !== id);
  }

  // 批量删除交易
  async function batchDeleteTransactions(ids: string[]) {
    await batchDeleteApi(ids);
    transactions.value = transactions.value.filter((t) => !ids.includes(t.id));
  }

  // 导出交易
  async function exportTransactions(params: ExportParams) {
    const blob = await exportTransactionsApi(params);
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${Date.now()}.${params.format}`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // 导入交易
  async function importTransactions(file: File): Promise<ImportResult> {
    loading.value = true;
    try {
      const result = await importTransactionsApi(file);
      // 导入成功后刷新列表
      await fetchTransactions({ page: 1, pageSize: 20 });
      return result;
    } finally {
      loading.value = false;
    }
  }

  // 设置当前交易
  function setCurrentTransaction(transaction: Transaction | null) {
    currentTransaction.value = transaction;
  }

  return {
    transactions,
    currentTransaction,
    loading,
    pageInfo,
    statistics,
    fetchTransactions,
    fetchStatistics,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    batchDeleteTransactions,
    exportTransactions,
    importTransactions,
    setCurrentTransaction,
  };
});