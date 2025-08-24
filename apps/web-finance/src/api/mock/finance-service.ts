// Mock API 服务实现
import type {
  Category,
  ImportResult,
  Loan,
  LoanRepayment,
  PageParams,
  PageResult,
  Person,
  SearchParams,
  Transaction,
} from '#/types/finance';

import {
  add,
  addBatch,
  get,
  getAll,
  initDB,
  remove,
  STORES,
  update,
} from '#/utils/db';

import {
  generateMockLoans,
  generateMockTransactions,
  mockCategories,
  mockPersons,
} from './finance-data';

// 生成UUID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// 初始化数据
export async function initializeData() {
  try {
    await initDB();

    // 检查是否已有数据
    const existingCategories = await getAll<Category>(STORES.CATEGORIES);
    if (existingCategories.length === 0) {
      console.log('初始化Mock数据...');

      // 初始化分类
      await addBatch(STORES.CATEGORIES, mockCategories);
      console.log('分类数据已初始化');

      // 初始化人员
      await addBatch(STORES.PERSONS, mockPersons);
      console.log('人员数据已初始化');

      // 初始化交易
      const transactions = generateMockTransactions(100);
      await addBatch(STORES.TRANSACTIONS, transactions);
      console.log('交易数据已初始化');

      // 初始化贷款
      const loans = generateMockLoans(20);
      await addBatch(STORES.LOANS, loans);
      console.log('贷款数据已初始化');
    } else {
      console.log('数据库已有数据，跳过初始化');
    }
  } catch (error) {
    console.error('初始化数据失败:', error);
    throw error;
  }
}

// 分页处理
function paginate<T>(items: T[], params: PageParams): PageResult<T> {
  const { page = 1, pageSize = 20, sortBy, sortOrder = 'desc' } = params;

  // 排序
  if (sortBy && items.length > 0) {
    items.sort((a, b) => {
      const aVal = (a as any)[sortBy];
      const bVal = (b as any)[sortBy];
      
      // 处理日期字段的特殊排序
      if (sortBy === 'date' || sortBy === 'created_at' || sortBy === 'updated_at') {
        const dateA = new Date(aVal).getTime();
        const dateB = new Date(bVal).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      // 处理其他字段
      const order = sortOrder === 'asc' ? 1 : -1;
      if (aVal === null || aVal === undefined) return order;
      if (bVal === null || bVal === undefined) return -order;
      return aVal > bVal ? order : -order;
    });
  }

  // 分页
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedItems = items.slice(start, end);

  return {
    items: paginatedItems,
    total: items.length,
    page,
    pageSize,
    totalPages: Math.ceil(items.length / pageSize),
  };
}

// 搜索过滤
function filterTransactions(
  transactions: Transaction[],
  params: SearchParams,
): Transaction[] {
  let filtered = transactions;

  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.description?.toLowerCase().includes(keyword) ||
        t.project?.toLowerCase().includes(keyword) ||
        t.payer?.toLowerCase().includes(keyword) ||
        t.payee?.toLowerCase().includes(keyword),
    );
  }

  if (params.type) {
    filtered = filtered.filter((t) => t.type === params.type);
  }

  if (params.categoryId) {
    filtered = filtered.filter((t) => t.categoryId === params.categoryId);
  }

  if (params.currency) {
    filtered = filtered.filter((t) => t.currency === params.currency);
  }

  if (params.status) {
    filtered = filtered.filter((t) => t.status === params.status);
  }

  if (params.dateFrom) {
    filtered = filtered.filter((t) => t.date >= params.dateFrom);
  }

  if (params.dateTo) {
    filtered = filtered.filter((t) => t.date <= params.dateTo);
  }

  return filtered;
}

// 分类统计
export async function getCategoryStatistics(params: any) {
  const transactions = await getAll<Transaction>(STORES.TRANSACTIONS);
  const categories = await getAll<Category>(STORES.CATEGORIES);
  
  // 过滤日期范围
  let filtered = transactions;
  if (params.dateFrom) {
    filtered = filtered.filter(t => t.date >= params.dateFrom);
  }
  if (params.dateTo) {
    filtered = filtered.filter(t => t.date <= params.dateTo);
  }
  
  // 按分类统计
  const categoryStats: any[] = [];
  let totalIncome = 0;
  let totalExpense = 0;
  
  for (const category of categories) {
    const categoryTransactions = filtered.filter(t => t.categoryId === category.id);
    
    if (categoryTransactions.length > 0) {
      const amount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      const count = categoryTransactions.length;
      
      if (category.type === 'income') {
        totalIncome += amount;
      } else {
        totalExpense += amount;
      }
      
      categoryStats.push({
        categoryId: category.id,
        categoryName: category.name,
        icon: category.icon || (category.type === 'income' ? '💰' : '💸'),
        type: category.type,
        amount,
        count,
        percentage: 0, // 稍后计算
        average: amount / count,
        trend: Math.floor(Math.random() * 20) - 10, // 模拟趋势数据
      });
    }
  }
  
  // 计算百分比
  categoryStats.forEach(stat => {
    const total = stat.type === 'income' ? totalIncome : totalExpense;
    stat.percentage = total > 0 ? Math.round((stat.amount / total) * 100) : 0;
  });
  
  // 按金额排序
  categoryStats.sort((a, b) => b.amount - a.amount);
  
  return {
    categories,
    totalIncome,
    totalExpense,
    categoryStats,
  };
}

// Category API
export const categoryService = {
  async getList(params?: PageParams): Promise<PageResult<Category>> {
    const categories = await getAll<Category>(STORES.CATEGORIES);
    return paginate(categories, params || { page: 1, pageSize: 100 });
  },

  async getDetail(id: string): Promise<Category | null> {
    return get<Category>(STORES.CATEGORIES, id);
  },

  async create(data: Partial<Category>): Promise<Category> {
    const category: Category = {
      id: generateId(),
      name: data.name!,
      type: data.type!,
      parentId: data.parentId,
      created_at: new Date().toISOString(),
    };
    await add(STORES.CATEGORIES, category);
    return category;
  },

  async update(id: string, data: Partial<Category>): Promise<Category> {
    const existing = await get<Category>(STORES.CATEGORIES, id);
    if (!existing) {
      throw new Error('Category not found');
    }
    const updated = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
    };
    await update(STORES.CATEGORIES, updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await remove(STORES.CATEGORIES, id);
  },

  async getTree(): Promise<Category[]> {
    const categories = await getAll<Category>(STORES.CATEGORIES);
    // 这里可以构建树形结构，暂时返回平铺数据
    return categories;
  },
};

// Transaction API
export const transactionService = {
  async getList(params: SearchParams): Promise<PageResult<Transaction>> {
    const transactions = await getAll<Transaction>(STORES.TRANSACTIONS);
    const filtered = filterTransactions(transactions, params);
    // 默认按日期倒序排序（最新的在前）
    const sortParams = {
      ...params,
      sortBy: params.sortBy || 'date',
      sortOrder: params.sortOrder || 'desc'
    };
    return paginate(filtered, sortParams);
  },

  async getDetail(id: string): Promise<null | Transaction> {
    return get<Transaction>(STORES.TRANSACTIONS, id);
  },

  async create(data: Partial<Transaction>): Promise<Transaction> {
    const transaction: Transaction = {
      id: generateId(),
      amount: data.amount!,
      type: data.type!,
      categoryId: data.categoryId!,
      description: data.description,
      date: data.date || new Date().toISOString().split('T')[0],
      quantity: data.quantity || 1,
      project: data.project,
      payer: data.payer,
      payee: data.payee,
      recorder: data.recorder || '管理员',
      currency: data.currency || 'CNY',
      status: data.status || 'completed',
      tags: data.tags || [],
      created_at: new Date().toISOString(),
    };
    await add(STORES.TRANSACTIONS, transaction);
    return transaction;
  },

  async update(id: string, data: Partial<Transaction>): Promise<Transaction> {
    const existing = await get<Transaction>(STORES.TRANSACTIONS, id);
    if (!existing) {
      throw new Error('Transaction not found');
    }
    const updated = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
    };
    await update(STORES.TRANSACTIONS, updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await remove(STORES.TRANSACTIONS, id);
  },

  async batchDelete(ids: string[]): Promise<void> {
    for (const id of ids) {
      await remove(STORES.TRANSACTIONS, id);
    }
  },

  async getStatistics(params?: SearchParams): Promise<any> {
    const transactions = await getAll<Transaction>(STORES.TRANSACTIONS);
    const filtered = params
      ? filterTransactions(transactions, params)
      : transactions;

    const totalIncome = filtered
      .filter((t) => t.type === 'income' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filtered
      .filter((t) => t.type === 'expense' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      totalTransactions: filtered.length,
    };
  },

  async import(data: Transaction[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const [i, datum] of data.entries()) {
      try {
        await this.create(datum);
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  },
};

// Person API
export const personService = {
  async getList(params?: PageParams): Promise<PageResult<Person>> {
    const persons = await getAll<Person>(STORES.PERSONS);
    return paginate(persons, params || { page: 1, pageSize: 100 });
  },

  async getDetail(id: string): Promise<null | Person> {
    return get<Person>(STORES.PERSONS, id);
  },

  async create(data: Partial<Person>): Promise<Person> {
    const person: Person = {
      id: generateId(),
      name: data.name!,
      roles: data.roles || [],
      contact: data.contact,
      description: data.description,
      created_at: new Date().toISOString(),
    };
    await add(STORES.PERSONS, person);
    return person;
  },

  async update(id: string, data: Partial<Person>): Promise<Person> {
    const existing = await get<Person>(STORES.PERSONS, id);
    if (!existing) {
      throw new Error('Person not found');
    }
    const updated = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
    };
    await update(STORES.PERSONS, updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await remove(STORES.PERSONS, id);
  },

  async search(keyword: string): Promise<Person[]> {
    const persons = await getAll<Person>(STORES.PERSONS);
    const lowercaseKeyword = keyword.toLowerCase();
    return persons.filter(
      (p) =>
        p.name.toLowerCase().includes(lowercaseKeyword) ||
        p.contact?.toLowerCase().includes(lowercaseKeyword) ||
        p.description?.toLowerCase().includes(lowercaseKeyword),
    );
  },
};

// Loan API
export const loanService = {
  async getList(params: SearchParams): Promise<PageResult<Loan>> {
    const loans = await getAll<Loan>(STORES.LOANS);
    let filtered = loans;

    if (params.status) {
      filtered = filtered.filter((l) => l.status === params.status);
    }

    if (params.keyword) {
      const keyword = params.keyword.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.borrower.toLowerCase().includes(keyword) ||
          l.lender.toLowerCase().includes(keyword) ||
          l.description?.toLowerCase().includes(keyword),
      );
    }

    return paginate(filtered, params);
  },

  async getDetail(id: string): Promise<Loan | null> {
    return get<Loan>(STORES.LOANS, id);
  },

  async create(data: Partial<Loan>): Promise<Loan> {
    const loan: Loan = {
      id: generateId(),
      borrower: data.borrower!,
      lender: data.lender!,
      amount: data.amount!,
      currency: data.currency || 'CNY',
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate,
      description: data.description,
      status: data.status || 'active',
      repayments: [],
      created_at: new Date().toISOString(),
    };
    await add(STORES.LOANS, loan);
    return loan;
  },

  async update(id: string, data: Partial<Loan>): Promise<Loan> {
    const existing = await get<Loan>(STORES.LOANS, id);
    if (!existing) {
      throw new Error('Loan not found');
    }
    const updated = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
    };
    await update(STORES.LOANS, updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await remove(STORES.LOANS, id);
  },

  async addRepayment(
    loanId: string,
    repayment: Partial<LoanRepayment>,
  ): Promise<Loan> {
    const loan = await get<Loan>(STORES.LOANS, loanId);
    if (!loan) {
      throw new Error('Loan not found');
    }

    const newRepayment: LoanRepayment = {
      id: generateId(),
      amount: repayment.amount!,
      currency: repayment.currency || loan.currency,
      date: repayment.date || new Date().toISOString().split('T')[0],
      note: repayment.note,
    };

    loan.repayments.push(newRepayment);

    // 检查是否已还清
    const totalRepaid = loan.repayments.reduce((sum, r) => sum + r.amount, 0);
    if (totalRepaid >= loan.amount) {
      loan.status = 'paid';
    }

    await update(STORES.LOANS, loan);
    return loan;
  },

  async updateStatus(id: string, status: Loan['status']): Promise<Loan> {
    const loan = await get<Loan>(STORES.LOANS, id);
    if (!loan) {
      throw new Error('Loan not found');
    }
    loan.status = status;
    await update(STORES.LOANS, loan);
    return loan;
  },

  async getStatistics(): Promise<any> {
    const loans = await getAll<Loan>(STORES.LOANS);

    const activeLoans = loans.filter((l) => l.status === 'active');
    const paidLoans = loans.filter((l) => l.status === 'paid');
    const overdueLoans = loans.filter((l) => l.status === 'overdue');

    const totalLent = loans.reduce((sum, l) => sum + l.amount, 0);
    const totalRepaid = loans.reduce(
      (sum, l) =>
        sum + l.repayments.reduce((repaySum, r) => repaySum + r.amount, 0),
      0,
    );

    return {
      totalLent,
      totalBorrowed: totalLent, // 在实际应用中可能需要区分
      totalRepaid,
      activeLoans: activeLoans.length,
      overdueLoans: overdueLoans.length,
      paidLoans: paidLoans.length,
    };
  },
};
