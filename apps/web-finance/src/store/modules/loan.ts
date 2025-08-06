import type { 
  Loan, 
  LoanRepayment, 
  LoanStatus, 
  SearchParams 
} from '#/types/finance';

import { computed, ref } from 'vue';

import { defineStore } from 'pinia';

import {
  addLoanRepayment as addRepaymentApi,
  createLoan as createLoanApi,
  deleteLoan as deleteLoanApi,
  getLoanList,
  getLoanStatistics,
  updateLoan as updateLoanApi,
  updateLoanStatus as updateStatusApi,
} from '#/api/finance';

export const useLoanStore = defineStore('finance-loan', () => {
  // 状态
  const loans = ref<Loan[]>([]);
  const loading = ref(false);
  const statistics = ref({
    totalLent: 0,
    totalBorrowed: 0,
    totalRepaid: 0,
    activeLoans: 0,
    overdueLoans: 0,
  });

  // 计算属性
  const activeLoans = computed(() =>
    loans.value.filter((loan) => loan.status === 'active'),
  );

  const overdueLoans = computed(() =>
    loans.value.filter((loan) => loan.status === 'overdue'),
  );

  const paidLoans = computed(() =>
    loans.value.filter((loan) => loan.status === 'paid'),
  );

  // 获取贷款列表
  async function fetchLoans(params: SearchParams) {
    loading.value = true;
    try {
      const { items } = await getLoanList(params);
      loans.value = items;
      return items;
    } finally {
      loading.value = false;
    }
  }

  // 获取贷款统计
  async function fetchStatistics() {
    const data = await getLoanStatistics();
    statistics.value = data;
    return data;
  }

  // 创建贷款
  async function createLoan(data: Partial<Loan>) {
    const newLoan = await createLoanApi(data);
    loans.value.push(newLoan);
    return newLoan;
  }

  // 更新贷款
  async function updateLoan(id: string, data: Partial<Loan>) {
    const updatedLoan = await updateLoanApi(id, data);
    const index = loans.value.findIndex((l) => l.id === id);
    if (index !== -1) {
      loans.value[index] = updatedLoan;
    }
    return updatedLoan;
  }

  // 删除贷款
  async function deleteLoan(id: string) {
    await deleteLoanApi(id);
    loans.value = loans.value.filter((l) => l.id !== id);
  }

  // 添加还款记录
  async function addRepayment(loanId: string, repayment: Partial<LoanRepayment>) {
    const updatedLoan = await addRepaymentApi(loanId, repayment);
    const index = loans.value.findIndex((l) => l.id === loanId);
    if (index !== -1) {
      loans.value[index] = updatedLoan;
    }
    return updatedLoan;
  }

  // 更新贷款状态
  async function updateLoanStatus(id: string, status: LoanStatus) {
    const updatedLoan = await updateStatusApi(id, status);
    const index = loans.value.findIndex((l) => l.id === id);
    if (index !== -1) {
      loans.value[index] = updatedLoan;
    }
    return updatedLoan;
  }

  // 根据ID获取贷款
  function getLoanById(id: string) {
    return loans.value.find((l) => l.id === id);
  }

  // 根据借款人获取贷款
  function getLoansByBorrower(borrower: string) {
    return loans.value.filter((l) => l.borrower === borrower);
  }

  // 根据出借人获取贷款
  function getLoansByLender(lender: string) {
    return loans.value.filter((l) => l.lender === lender);
  }

  return {
    loans,
    loading,
    statistics,
    activeLoans,
    overdueLoans,
    paidLoans,
    fetchLoans,
    fetchStatistics,
    createLoan,
    updateLoan,
    deleteLoan,
    addRepayment,
    updateLoanStatus,
    getLoanById,
    getLoansByBorrower,
    getLoansByLender,
  };
});