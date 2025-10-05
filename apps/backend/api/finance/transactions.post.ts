import { readBody } from 'h3';
import { createTransaction } from '~/utils/finance-repository';
import { useResponseError, useResponseSuccess } from '~/utils/response';

const DEFAULT_CURRENCY = 'CNY';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body?.type || !body?.amount || !body?.transactionDate) {
    return useResponseError('缺少必填字段', -1);
  }

  const amount = Number(body.amount);
  if (Number.isNaN(amount)) {
    return useResponseError('金额格式不正确', -1);
  }

  const transaction = createTransaction({
    type: body.type,
    amount,
    currency: body.currency ?? DEFAULT_CURRENCY,
    categoryId: body.categoryId ?? null,
    accountId: body.accountId ?? null,
    transactionDate: body.transactionDate,
    description: body.description ?? '',
    project: body.project ?? null,
    memo: body.memo ?? null,
  });

  return useResponseSuccess(transaction);
});
