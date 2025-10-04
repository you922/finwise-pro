import { defineEventHandler, readBody } from '#nitro';

import { MOCK_BUDGETS } from '../../utils/mock-data';
import { useResponseSuccess } from '../../utils/response';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const newBudget = {
    id: Date.now(),
    userId: 1,
    category: body.category,
    categoryId: body.categoryId,
    emoji: body.emoji,
    limit: body.limit,
    spent: body.spent || 0,
    remaining: body.remaining || body.limit,
    percentage: body.percentage || 0,
    currency: body.currency,
    period: body.period,
    alertThreshold: body.alertThreshold,
    description: body.description,
    autoRenew: body.autoRenew,
    overspendAlert: body.overspendAlert,
    dailyReminder: body.dailyReminder,
    monthlyTrend: body.monthlyTrend || 0,
    createdAt: new Date().toISOString(),
    isDeleted: false,
  };

  MOCK_BUDGETS.push(newBudget);
  return useResponseSuccess(newBudget);
});
