import { getQuery } from 'h3';

import { listAccounts } from '~/utils/finance-metadata';
import { useResponseSuccess } from '~/utils/response';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const currency = query.currency as string | undefined;

  let accounts = listAccounts();

  if (currency) {
    accounts = accounts.filter((account) => account.currency === currency);
  }

  return useResponseSuccess(accounts);
});
