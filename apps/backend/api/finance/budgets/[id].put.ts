import { defineEventHandler, getRouterParam, readBody } from '#nitro';

import { MOCK_BUDGETS } from '../../../utils/mock-data';
import { useResponseError, useResponseSuccess } from '../../../utils/response';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));
  const body = await readBody(event);

  const index = MOCK_BUDGETS.findIndex((b) => b.id === id);

  if (index === -1) {
    return useResponseError('预算不存在', -1);
  }

  // 如果是恢复操作
  if (body.isDeleted === false) {
    MOCK_BUDGETS[index] = {
      ...MOCK_BUDGETS[index],
      isDeleted: false,
      deletedAt: undefined,
    };
    return useResponseSuccess(MOCK_BUDGETS[index]);
  }

  // 普通更新
  const updatedBudget = {
    ...MOCK_BUDGETS[index],
    category: body.category ?? MOCK_BUDGETS[index].category,
    categoryId: body.categoryId ?? MOCK_BUDGETS[index].categoryId,
    emoji: body.emoji ?? MOCK_BUDGETS[index].emoji,
    limit: body.limit ?? MOCK_BUDGETS[index].limit,
    spent: body.spent ?? MOCK_BUDGETS[index].spent,
    remaining: body.remaining ?? MOCK_BUDGETS[index].remaining,
    percentage: body.percentage ?? MOCK_BUDGETS[index].percentage,
    currency: body.currency ?? MOCK_BUDGETS[index].currency,
    period: body.period ?? MOCK_BUDGETS[index].period,
    alertThreshold: body.alertThreshold ?? MOCK_BUDGETS[index].alertThreshold,
    description: body.description ?? MOCK_BUDGETS[index].description,
    autoRenew: body.autoRenew ?? MOCK_BUDGETS[index].autoRenew,
    overspendAlert: body.overspendAlert ?? MOCK_BUDGETS[index].overspendAlert,
    dailyReminder: body.dailyReminder ?? MOCK_BUDGETS[index].dailyReminder,
    monthlyTrend: body.monthlyTrend ?? MOCK_BUDGETS[index].monthlyTrend,
  };

  MOCK_BUDGETS[index] = updatedBudget;
  return useResponseSuccess(updatedBudget);
});
