import { getRouterParam, readBody } from 'h3';

import { updateCategoryRecord } from '~/utils/finance-metadata';
import { useResponseError, useResponseSuccess } from '~/utils/response';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));
  if (Number.isNaN(id)) {
    return useResponseError('参数错误', -1);
  }

  const body = await readBody(event);

  const updated = updateCategoryRecord(id, {
    name: body?.name,
    icon: body?.icon,
    color: body?.color,
    userId: body?.userId,
    isActive: body?.isActive,
  });

  if (!updated) {
    return useResponseError('分类不存在', -1);
  }

  return useResponseSuccess(updated);
});
