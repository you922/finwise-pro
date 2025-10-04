import { getRouterParam } from 'h3';

import { softDeleteTransaction } from '~/utils/finance-repository';
import { useResponseError, useResponseSuccess } from '~/utils/response';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));

  if (Number.isNaN(id)) {
    return useResponseError('参数错误', -1);
  }

  const updated = softDeleteTransaction(id);
  if (!updated) {
    return useResponseError('交易不存在', -1);
  }

  return useResponseSuccess({ message: '删除成功' });
});
