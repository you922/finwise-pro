// 财务管理系统类型定义

// 货币类型
export type Currency = 'CNY' | 'MMK' | 'THB' | 'USD';

// 交易类型
export type TransactionType = 'expense' | 'income';

// 人员角色
export type PersonRole = 'borrower' | 'lender' | 'payee' | 'payer';

// 贷款状态
export type LoanStatus = 'active' | 'overdue' | 'paid';

// 交易状态
export type TransactionStatus = 'cancelled' | 'completed' | 'pending';

// 分类
export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  parentId?: string;
  icon?: string;
  color?: string;
  budget?: number; // 月度预算
  created_at: string;
  updated_at?: string;
}

// 人员
export interface Person {
  id: string;
  name: string;
  roles: PersonRole[];
  contact?: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

// 交易
export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  description?: string;
  date: string;
  quantity?: number;
  project?: string;
  payer?: string;
  payee?: string;
  recorder?: string;
  currency: Currency;
  status: TransactionStatus;
  tags?: string[]; // 标签
  created_at: string;
  updated_at?: string;
}

// 还款记录
export interface LoanRepayment {
  id: string;
  amount: number;
  currency: Currency;
  date: string;
  note?: string;
}

// 贷款
export interface Loan {
  id: string;
  borrower: string;
  lender: string;
  amount: number;
  currency: Currency;
  startDate: string;
  dueDate?: string;
  description?: string;
  status: LoanStatus;
  repayments: LoanRepayment[];
  created_at: string;
  updated_at?: string;
}

// 统计数据
export interface Statistics {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  currency: Currency;
  period?: {
    end: string;
    start: string;
  };
}

// 分页参数
export interface PageParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 分页结果
export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 搜索参数
export interface SearchParams extends PageParams {
  keyword?: string;
  type?: TransactionType;
  categoryId?: string;
  personId?: string;
  currency?: Currency;
  dateFrom?: string;
  dateTo?: string;
  status?: LoanStatus | TransactionStatus;
}

// 导入结果
export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{
    message: string;
    row: number;
  }>;
}

// 导出参数
export interface ExportParams {
  format: 'csv' | 'excel' | 'pdf';
  fields?: string[];
  filters?: SearchParams;
}

// 标签
export interface Tag {
  id: string;
  name: string;
  color?: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

// 预算
export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  currency: Currency;
  period: 'monthly' | 'yearly';
  year: number;
  month?: number; // 1-12, 仅月度预算需要
  created_at: string;
  updated_at?: string;
}

// 预算统计
export interface BudgetStats {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  transactions: number;
}
