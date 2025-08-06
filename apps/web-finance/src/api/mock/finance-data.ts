// Mock 数据生成工具
import type { 
  Category, 
  Loan, 
  Person, 
  Transaction 
} from '#/types/finance';

// 生成UUID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 初始分类数据
export const mockCategories: Category[] = [
  // 收入分类
  { id: '1', name: '工资', type: 'income', created_at: '2024-01-01' },
  { id: '2', name: '投资收益', type: 'income', created_at: '2024-01-01' },
  { id: '3', name: '兼职', type: 'income', created_at: '2024-01-01' },
  { id: '4', name: '奖金', type: 'income', created_at: '2024-01-01' },
  { id: '5', name: '其他收入', type: 'income', created_at: '2024-01-01' },
  
  // 支出分类
  { id: '6', name: '餐饮', type: 'expense', created_at: '2024-01-01' },
  { id: '7', name: '交通', type: 'expense', created_at: '2024-01-01' },
  { id: '8', name: '购物', type: 'expense', created_at: '2024-01-01' },
  { id: '9', name: '娱乐', type: 'expense', created_at: '2024-01-01' },
  { id: '10', name: '住房', type: 'expense', created_at: '2024-01-01' },
  { id: '11', name: '医疗', type: 'expense', created_at: '2024-01-01' },
  { id: '12', name: '教育', type: 'expense', created_at: '2024-01-01' },
  { id: '13', name: '其他支出', type: 'expense', created_at: '2024-01-01' },
];

// 初始人员数据
export const mockPersons: Person[] = [
  {
    id: '1',
    name: '张三',
    roles: ['payer', 'payee'],
    contact: '13800138000',
    description: '主要客户',
    created_at: '2024-01-01',
  },
  {
    id: '2',
    name: '李四',
    roles: ['payee', 'borrower'],
    contact: '13900139000',
    description: '供应商',
    created_at: '2024-01-01',
  },
  {
    id: '3',
    name: '王五',
    roles: ['payer', 'lender'],
    contact: '13700137000',
    description: '合作伙伴',
    created_at: '2024-01-01',
  },
  {
    id: '4',
    name: '赵六',
    roles: ['payee'],
    contact: '13600136000',
    description: '员工',
    created_at: '2024-01-01',
  },
];

// 生成随机交易数据
export function generateMockTransactions(count: number = 50): Transaction[] {
  const transactions: Transaction[] = [];
  const currencies = ['USD', 'CNY', 'THB', 'MMK'] as const;
  const statuses = ['pending', 'completed', 'cancelled'] as const;
  const projects = ['项目A', '项目B', '项目C', '日常运营'];
  
  for (let i = 0; i < count; i++) {
    const type = Math.random() > 0.4 ? 'expense' : 'income';
    const categoryIds = type === 'income' ? ['1', '2', '3', '4', '5'] : ['6', '7', '8', '9', '10', '11', '12', '13'];
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 90)); // 最近90天的数据
    
    transactions.push({
      id: generateId(),
      amount: Math.floor(Math.random() * 10000) + 100,
      type,
      categoryId: categoryIds[Math.floor(Math.random() * categoryIds.length)],
      description: `${type === 'income' ? '收入' : '支出'}记录 ${i + 1}`,
      date: date.toISOString().split('T')[0],
      quantity: Math.floor(Math.random() * 10) + 1,
      project: projects[Math.floor(Math.random() * projects.length)],
      payer: type === 'expense' ? '公司' : mockPersons[Math.floor(Math.random() * mockPersons.length)].name,
      payee: type === 'income' ? '公司' : mockPersons[Math.floor(Math.random() * mockPersons.length)].name,
      recorder: '管理员',
      currency: currencies[Math.floor(Math.random() * currencies.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      created_at: date.toISOString(),
    });
  }
  
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// 生成贷款数据
export function generateMockLoans(count: number = 10): Loan[] {
  const loans: Loan[] = [];
  const statuses = ['active', 'paid', 'overdue'] as const;
  
  for (let i = 0; i < count; i++) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 12));
    
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + Math.floor(Math.random() * 12) + 1);
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const amount = Math.floor(Math.random() * 100000) + 10000;
    
    const loan: Loan = {
      id: generateId(),
      borrower: mockPersons[Math.floor(Math.random() * mockPersons.length)].name,
      lender: mockPersons[Math.floor(Math.random() * mockPersons.length)].name,
      amount,
      currency: 'CNY',
      startDate: startDate.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      description: `贷款合同 ${i + 1}`,
      status,
      repayments: [],
      created_at: startDate.toISOString(),
    };
    
    // 生成还款记录
    if (status !== 'active') {
      const repaymentCount = Math.floor(Math.random() * 5) + 1;
      let totalRepaid = 0;
      
      for (let j = 0; j < repaymentCount; j++) {
        const repaymentDate = new Date(startDate);
        repaymentDate.setMonth(repaymentDate.getMonth() + j + 1);
        
        const repaymentAmount = Math.floor(amount / repaymentCount);
        totalRepaid += repaymentAmount;
        
        loan.repayments.push({
          id: generateId(),
          amount: repaymentAmount,
          currency: 'CNY',
          date: repaymentDate.toISOString().split('T')[0],
          note: `第${j + 1}期还款`,
        });
      }
      
      // 如果是已还清状态，确保还款总额等于贷款金额
      if (status === 'paid' && totalRepaid < amount) {
        loan.repayments.push({
          id: generateId(),
          amount: amount - totalRepaid,
          currency: 'CNY',
          date: new Date().toISOString().split('T')[0],
          note: '最终还款',
        });
      }
    }
    
    loans.push(loan);
  }
  
  return loans;
}