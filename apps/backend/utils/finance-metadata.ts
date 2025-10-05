import {
  MOCK_ACCOUNTS,
  MOCK_BUDGETS,
  MOCK_CATEGORIES,
  MOCK_CURRENCIES,
  MOCK_EXCHANGE_RATES,
} from './mock-data';

export function listAccounts() {
  return MOCK_ACCOUNTS;
}

export function listCategories() {
  return MOCK_CATEGORIES;
}

export function listBudgets() {
  return MOCK_BUDGETS;
}

export function listCurrencies() {
  return MOCK_CURRENCIES;
}

export function listExchangeRates() {
  return MOCK_EXCHANGE_RATES;
}

export function createCategoryRecord(category: any) {
  const newCategory = {
    ...category,
    id: MOCK_CATEGORIES.length + 1,
    createdAt: new Date().toISOString(),
  };
  MOCK_CATEGORIES.push(newCategory);
  return newCategory;
}

export function updateCategoryRecord(id: number, category: any) {
  const index = MOCK_CATEGORIES.findIndex((c) => c.id === id);
  if (index !== -1) {
    MOCK_CATEGORIES[index] = { ...MOCK_CATEGORIES[index], ...category };
    return MOCK_CATEGORIES[index];
  }
  return null;
}

export function deleteCategoryRecord(id: number) {
  const index = MOCK_CATEGORIES.findIndex((c) => c.id === id);
  if (index !== -1) {
    MOCK_CATEGORIES.splice(index, 1);
    return true;
  }
  return false;
}
