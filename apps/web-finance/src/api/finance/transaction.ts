import type { 
  ExportParams, 
  ImportResult, 
  PageResult, 
  SearchParams, 
  Transaction 
} from '#/types/finance';

import { transactionService } from '#/api/mock/finance-service';

// 获取交易列表
export async function getTransactionList(params: SearchParams) {
  return transactionService.getList(params);
}

// 获取交易详情
export async function getTransactionDetail(id: string) {
  const result = await transactionService.getDetail(id);
  if (!result) {
    throw new Error('Transaction not found');
  }
  return result;
}

// 创建交易
export async function createTransaction(data: Partial<Transaction>) {
  return transactionService.create(data);
}

// 更新交易
export async function updateTransaction(id: string, data: Partial<Transaction>) {
  return transactionService.update(id, data);
}

// 删除交易
export async function deleteTransaction(id: string) {
  return transactionService.delete(id);
}

// 批量删除交易
export async function batchDeleteTransactions(ids: string[]) {
  return transactionService.batchDelete(ids);
}

// 导出交易
export async function exportTransactions(params: ExportParams) {
  // 暂时返回一个空的 Blob，实际实现需要根据参数生成文件
  return new Blob(['Export data'], { type: 'application/octet-stream' });
}

// 导入交易
export async function importTransactions(file: File) {
  // 暂时返回模拟结果，实际实现需要解析文件内容
  return {
    success: 0,
    failed: 0,
    errors: [],
  } as ImportResult;
}

// 获取统计数据
export async function getTransactionStatistics(params?: SearchParams) {
  return transactionService.getStatistics(params);
}