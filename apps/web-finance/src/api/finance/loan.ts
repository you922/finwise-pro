import type { Loan, LoanRepayment, SearchParams } from '#/types/finance';

import { loanService } from '#/api/mock/finance-service';

// 获取贷款列表
export async function getLoanList(params: SearchParams) {
  return loanService.getList(params);
}

// 获取贷款详情
export async function getLoanDetail(id: string) {
  const result = await loanService.getDetail(id);
  if (!result) {
    throw new Error('Loan not found');
  }
  return result;
}

// 创建贷款
export async function createLoan(data: Partial<Loan>) {
  return loanService.create(data);
}

// 更新贷款
export async function updateLoan(id: string, data: Partial<Loan>) {
  return loanService.update(id, data);
}

// 删除贷款
export async function deleteLoan(id: string) {
  return loanService.delete(id);
}

// 添加还款记录
export async function addLoanRepayment(
  loanId: string,
  repayment: Partial<LoanRepayment>,
) {
  return loanService.addRepayment(loanId, repayment);
}

// 更新贷款状态
export async function updateLoanStatus(id: string, status: Loan['status']) {
  return loanService.updateStatus(id, status);
}

// 获取贷款统计
export async function getLoanStatistics() {
  return loanService.getStatistics();
}
