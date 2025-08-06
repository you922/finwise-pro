// 数据迁移工具 - 从旧的 localStorage 迁移到 IndexedDB
import type { 
  Category, 
  Loan, 
  Person, 
  Transaction 
} from '#/types/finance';

import { importDatabase } from './db';

// 旧系统的存储键
const OLD_STORAGE_KEYS = {
  TRANSACTIONS: 'transactions',
  CATEGORIES: 'categories',
  PERSONS: 'persons',
  LOANS: 'loans',
};

// 生成新的 ID
function generateNewId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 迁移分类数据
function migrateCategories(oldCategories: any[]): Category[] {
  return oldCategories.map(cat => ({
    id: cat.id || generateNewId(),
    name: cat.name,
    type: cat.type,
    parentId: cat.parentId,
    created_at: cat.created_at || new Date().toISOString(),
  }));
}

// 迁移人员数据
function migratePersons(oldPersons: any[]): Person[] {
  return oldPersons.map(person => ({
    id: person.id || generateNewId(),
    name: person.name,
    roles: person.roles || [],
    contact: person.contact,
    description: person.description,
    created_at: person.created_at || new Date().toISOString(),
  }));
}

// 迁移交易数据
function migrateTransactions(oldTransactions: any[]): Transaction[] {
  return oldTransactions.map(trans => ({
    id: trans.id || generateNewId(),
    amount: Number(trans.amount) || 0,
    type: trans.type,
    categoryId: trans.categoryId,
    description: trans.description,
    date: trans.date,
    quantity: trans.quantity || 1,
    project: trans.project,
    payer: trans.payer,
    payee: trans.payee,
    recorder: trans.recorder || '管理员',
    currency: trans.currency || 'CNY',
    status: trans.status || 'completed',
    created_at: trans.created_at || new Date().toISOString(),
  }));
}

// 迁移贷款数据
function migrateLoans(oldLoans: any[]): Loan[] {
  return oldLoans.map(loan => ({
    id: loan.id || generateNewId(),
    borrower: loan.borrower,
    lender: loan.lender,
    amount: Number(loan.amount) || 0,
    currency: loan.currency || 'CNY',
    startDate: loan.startDate,
    dueDate: loan.dueDate,
    description: loan.description,
    status: loan.status || 'active',
    repayments: loan.repayments || [],
    created_at: loan.created_at || new Date().toISOString(),
  }));
}

// 从 localStorage 读取旧数据
function readOldData<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return [];
  }
}

// 执行数据迁移
export async function migrateData(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    console.log('开始数据迁移...');
    
    // 读取旧数据
    const oldCategories = readOldData<any>(OLD_STORAGE_KEYS.CATEGORIES);
    const oldPersons = readOldData<any>(OLD_STORAGE_KEYS.PERSONS);
    const oldTransactions = readOldData<any>(OLD_STORAGE_KEYS.TRANSACTIONS);
    const oldLoans = readOldData<any>(OLD_STORAGE_KEYS.LOANS);
    
    console.log('读取到的旧数据：', {
      categories: oldCategories.length,
      persons: oldPersons.length,
      transactions: oldTransactions.length,
      loans: oldLoans.length,
    });
    
    // 如果没有旧数据，则不需要迁移
    if (
      oldCategories.length === 0 &&
      oldPersons.length === 0 &&
      oldTransactions.length === 0 &&
      oldLoans.length === 0
    ) {
      return {
        success: true,
        message: '没有需要迁移的数据',
      };
    }
    
    // 转换数据格式
    const categories = migrateCategories(oldCategories);
    const persons = migratePersons(oldPersons);
    const transactions = migrateTransactions(oldTransactions);
    const loans = migrateLoans(oldLoans);
    
    // 导入到新系统
    await importDatabase({
      categories,
      persons,
      transactions,
      loans,
    });
    
    // 迁移成功后，可以选择清除旧数据
    // localStorage.removeItem(OLD_STORAGE_KEYS.CATEGORIES);
    // localStorage.removeItem(OLD_STORAGE_KEYS.PERSONS);
    // localStorage.removeItem(OLD_STORAGE_KEYS.TRANSACTIONS);
    // localStorage.removeItem(OLD_STORAGE_KEYS.LOANS);
    
    return {
      success: true,
      message: '数据迁移成功',
      details: {
        categories: categories.length,
        persons: persons.length,
        transactions: transactions.length,
        loans: loans.length,
      },
    };
  } catch (error) {
    console.error('数据迁移失败:', error);
    return {
      success: false,
      message: '数据迁移失败',
      details: error,
    };
  }
}

// 检查是否需要迁移
export function needsMigration(): boolean {
  const hasOldData = 
    localStorage.getItem(OLD_STORAGE_KEYS.CATEGORIES) ||
    localStorage.getItem(OLD_STORAGE_KEYS.PERSONS) ||
    localStorage.getItem(OLD_STORAGE_KEYS.TRANSACTIONS) ||
    localStorage.getItem(OLD_STORAGE_KEYS.LOANS);
  
  return !!hasOldData;
}