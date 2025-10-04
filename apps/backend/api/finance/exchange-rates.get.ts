import { getQuery } from 'h3';

import { listExchangeRates } from '~/utils/finance-metadata';
import { useResponseSuccess } from '~/utils/response';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const fromCurrency = query.from as string | undefined;
  const toCurrency = query.to as string | undefined;
  const date = query.date as string | undefined;

  let rates = listExchangeRates();

  if (fromCurrency) {
    rates = rates.filter((rate) => rate.fromCurrency === fromCurrency);
  }

  if (toCurrency) {
    rates = rates.filter((rate) => rate.toCurrency === toCurrency);
  }

  if (date) {
    rates = rates.filter((rate) => rate.date === date);
  } else if (rates.length > 0) {
    const latestDate = rates.reduce((max, rate) => (rate.date > max ? rate.date : max), rates[0].date);
    rates = rates.filter((rate) => rate.date === latestDate);
  }

  return useResponseSuccess(rates);
});
