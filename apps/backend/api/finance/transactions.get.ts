import { getQuery } from 'h3';

import { fetchTransactions } from '~/utils/finance-repository';
import { useResponseSuccess } from '~/utils/response';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const type = query.type as string | undefined;
  const transactions = fetchTransactions({ type });

  return useResponseSuccess(transactions);
});
