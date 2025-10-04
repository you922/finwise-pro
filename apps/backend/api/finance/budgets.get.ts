import { defineEventHandler } from '#nitro';

import { MOCK_BUDGETS } from '../../utils/mock-data';
import { useResponseSuccess } from '../../utils/response';

export default defineEventHandler(() => {
  // 返回未删除的预算
  const budgets = MOCK_BUDGETS.filter((b) => !b.isDeleted);
  return useResponseSuccess(budgets);
});
