import { readBody } from 'h3';
import { createCategoryRecord } from '~/utils/finance-metadata';
import { useResponseError, useResponseSuccess } from '~/utils/response';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body?.name || !body?.type) {
    return useResponseError('分类名称和类型为必填项', -1);
  }

  const category = createCategoryRecord({
    name: body.name,
    type: body.type,
    icon: body.icon,
    color: body.color,
    userId: 1,
    isActive: body.isActive ?? true,
  });

  return useResponseSuccess(category);
});
