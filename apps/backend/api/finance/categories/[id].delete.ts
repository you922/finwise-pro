import { getRouterParam } from 'h3';

import { deleteCategoryRecord } from '~/utils/finance-metadata';
import { useResponseError, useResponseSuccess } from '~/utils/response';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));
  if (Number.isNaN(id)) {
    return useResponseError('参数错误', -1);
  }

  const deleted = deleteCategoryRecord(id);
  if (!deleted) {
    return useResponseError('分类不存在', -1);
  }

  return useResponseSuccess({ message: '删除成功' });
});
