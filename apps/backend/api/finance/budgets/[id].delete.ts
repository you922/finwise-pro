import { defineEventHandler, getRouterParam } from '#nitro';

import { MOCK_BUDGETS } from '../../../utils/mock-data';
import { useResponseError, useResponseSuccess } from '../../../utils/response';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));
  const index = MOCK_BUDGETS.findIndex((b) => b.id === id);

  if (index === -1) {
    return useResponseError('预算不存在', -1);
  }

  // 软删除
  MOCK_BUDGETS[index] = {
    ...MOCK_BUDGETS[index],
    isDeleted: true,
    deletedAt: new Date().toISOString(),
  };

  return useResponseSuccess({ message: '删除成功' });
});
