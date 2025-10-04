import { getQuery } from 'h3';

import { fetchCategories } from '~/utils/finance-repository';
import { useResponseSuccess } from '~/utils/response';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const type = query.type as 'income' | 'expense' | undefined;

  const categories = fetchCategories({ type });

  return useResponseSuccess(categories);
});
