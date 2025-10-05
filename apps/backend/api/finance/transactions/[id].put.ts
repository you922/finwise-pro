import { getRouterParam, readBody } from 'h3';
import {
  restoreTransaction,
  updateTransaction,
} from '~/utils/finance-repository';
import { useResponseError, useResponseSuccess } from '~/utils/response';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));
  if (Number.isNaN(id)) {
    return useResponseError('参数错误', -1);
  }

  const body = await readBody(event);

  if (body?.isDeleted === false) {
    const restored = restoreTransaction(id);
    if (!restored) {
      return useResponseError('交易不存在', -1);
    }
    return useResponseSuccess(restored);
  }

  const payload: Record<string, unknown> = {};

  if (body?.type) payload.type = body.type;
  if (body?.amount !== undefined) {
    const amount = Number(body.amount);
    if (Number.isNaN(amount)) {
      return useResponseError('金额格式不正确', -1);
    }
    payload.amount = amount;
  }
  if (body?.currency) payload.currency = body.currency;
  if (body?.categoryId !== undefined)
    payload.categoryId = body.categoryId ?? null;
  if (body?.accountId !== undefined) payload.accountId = body.accountId ?? null;
  if (body?.transactionDate) payload.transactionDate = body.transactionDate;
  if (body?.description !== undefined)
    payload.description = body.description ?? '';
  if (body?.project !== undefined) payload.project = body.project ?? null;
  if (body?.memo !== undefined) payload.memo = body.memo ?? null;
  if (body?.isDeleted !== undefined) payload.isDeleted = body.isDeleted;

  const updated = updateTransaction(id, payload);
  if (!updated) {
    return useResponseError('交易不存在', -1);
  }

  return useResponseSuccess(updated);
});
