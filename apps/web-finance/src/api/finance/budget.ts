import type { Budget } from '#/types/finance';

import { createBaseApi } from './base';

const baseBudgetApi = createBaseApi<Budget>('budget');

export const budgetApi = {
  ...baseBudgetApi,
  
  // 获取指定年月的预算列表
  getList: async (params?: { year?: number; month?: number; page?: number; pageSize?: number }) => {
    // 模拟预算数据
    const mockBudgets: Budget[] = [
      {
        id: '1',
        categoryId: 'cat-1',
        amount: 5000,
        currency: 'CNY',
        period: 'monthly',
        year: params?.year || new Date().getFullYear(),
        month: params?.month || new Date().getMonth() + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '2',
        categoryId: 'cat-2',
        amount: 3000,
        currency: 'CNY',
        period: 'monthly',
        year: params?.year || new Date().getFullYear(),
        month: params?.month || new Date().getMonth() + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '3',
        categoryId: 'cat-3',
        amount: 2000,
        currency: 'CNY',
        period: 'monthly',
        year: params?.year || new Date().getFullYear(),
        month: params?.month || new Date().getMonth() + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    
    return {
      data: {
        items: mockBudgets,
        total: mockBudgets.length,
        page: params?.page || 1,
        pageSize: params?.pageSize || 10,
      },
    };
  },
};