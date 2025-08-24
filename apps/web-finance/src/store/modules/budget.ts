import type { Budget, BudgetStats, Transaction } from '#/types/finance';

import dayjs from 'dayjs';
import { defineStore } from 'pinia';

import { add, getAll, remove, STORES, update } from '#/utils/db';

interface BudgetState {
  budgets: Budget[];
  loading: boolean;
}

export const useBudgetStore = defineStore('budget', {
  state: (): BudgetState => ({
    budgets: [],
    loading: false,
  }),

  getters: {
    // 获取当前月份的预算
    currentMonthBudgets: (state) => {
      const now = dayjs();
      const year = now.year();
      const month = now.month() + 1;

      return state.budgets.filter(
        (b) =>
          b.year === year &&
          (b.period === 'yearly' ||
            (b.period === 'monthly' && b.month === month)),
      );
    },

    // 获取指定分类的当前预算
    getCategoryBudget: (state) => (categoryId: string) => {
      const now = dayjs();
      const year = now.year();
      const month = now.month() + 1;

      return state.budgets.find(
        (b) =>
          b.categoryId === categoryId &&
          b.year === year &&
          (b.period === 'yearly' ||
            (b.period === 'monthly' && b.month === month)),
      );
    },
  },

  actions: {
    // 获取所有预算
    async fetchBudgets() {
      this.loading = true;
      try {
        const budgets = await getAll<Budget>(STORES.BUDGETS);
        this.budgets = budgets;
      } catch (error) {
        console.error('获取预算失败:', error);
      } finally {
        this.loading = false;
      }
    },

    // 创建预算
    async createBudget(budget: Partial<Budget>) {
      try {
        const newBudget: Budget = {
          id: crypto.randomUUID(),
          categoryId: budget.categoryId || '',
          amount: budget.amount || 0,
          currency: budget.currency || 'CNY',
          period: budget.period || 'monthly',
          year: budget.year || dayjs().year(),
          month: budget.month,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await add(STORES.BUDGETS, newBudget);
        this.budgets.push(newBudget);
        return newBudget;
      } catch (error) {
        console.error('创建预算失败:', error);
        throw error;
      }
    },

    // 更新预算
    async updateBudget(id: string, updates: Partial<Budget>) {
      try {
        const index = this.budgets.findIndex((b) => b.id === id);
        if (index === -1) throw new Error('预算不存在');

        const updatedBudget = {
          ...this.budgets[index],
          ...updates,
          updated_at: new Date().toISOString(),
        };

        await update(STORES.BUDGETS, updatedBudget);
        this.budgets[index] = updatedBudget;
        return updatedBudget;
      } catch (error) {
        console.error('更新预算失败:', error);
        throw error;
      }
    },

    // 删除预算
    async deleteBudget(id: string) {
      try {
        await remove(STORES.BUDGETS, id);
        const index = this.budgets.findIndex((b) => b.id === id);
        if (index !== -1) {
          this.budgets.splice(index, 1);
        }
      } catch (error) {
        console.error('删除预算失败:', error);
        throw error;
      }
    },

    // 计算预算统计
    calculateBudgetStats(
      budget: Budget,
      transactions: Transaction[],
    ): BudgetStats {
      // 过滤出属于该预算期间的交易
      let filteredTransactions: Transaction[] = [];

      if (budget.period === 'monthly') {
        filteredTransactions = transactions.filter((t) => {
          const date = dayjs(t.date);
          return (
            t.type === 'expense' &&
            t.categoryId === budget.categoryId &&
            date.year() === budget.year &&
            date.month() + 1 === budget.month
          );
        });
      } else {
        // 年度预算
        filteredTransactions = transactions.filter((t) => {
          const date = dayjs(t.date);
          return (
            t.type === 'expense' &&
            t.categoryId === budget.categoryId &&
            date.year() === budget.year
          );
        });
      }

      // 计算已花费金额
      const spent = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      return {
        budget,
        spent,
        remaining,
        percentage: Math.round(percentage),
        transactions: filteredTransactions.length,
      };
    },

    // 检查是否存在相同的预算
    isBudgetExists(
      categoryId: string,
      year: number,
      period: 'monthly' | 'yearly',
      month?: number,
    ): boolean {
      return this.budgets.some(
        (b) =>
          b.categoryId === categoryId &&
          b.year === year &&
          b.period === period &&
          (period === 'yearly' || b.month === month),
      );
    },
  },
});
