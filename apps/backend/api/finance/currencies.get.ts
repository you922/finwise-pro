import { listCurrencies } from '~/utils/finance-metadata';
import { useResponseSuccess } from '~/utils/response';

export default defineEventHandler(async () => {
  return useResponseSuccess(listCurrencies());
});
