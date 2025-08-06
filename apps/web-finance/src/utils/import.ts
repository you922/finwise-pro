import type { Transaction, Category, Person } from '#/types/finance';

import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * 解析CSV文本
 */
export function parseCSV(text: string): Record<string, any>[] {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  // 解析表头
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  // 解析数据行
  const data: Record<string, any>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    if (values.length === headers.length) {
      const row: Record<string, any> = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }
  }
  
  return data;
}

/**
 * 导入交易数据从CSV
 */
export function importTransactionsFromCSV(
  csvData: Record<string, any>[],
  categories: Category[],
  persons: Person[]
): { 
  transactions: Partial<Transaction>[], 
  errors: string[],
  newCategories: string[],
  newPersons: string[]
} {
  const transactions: Partial<Transaction>[] = [];
  const errors: string[] = [];
  const newCategories = new Set<string>();
  const newPersons = new Set<string>();
  
  // 创建分类和人员的反向映射（名称到ID）
  const categoryMap = new Map(categories.map(c => [c.name, c]));
  
  csvData.forEach((row, index) => {
    try {
      // 解析类型
      const type = row['类型'] === '收入' ? 'income' : 'expense';
      
      // 查找或标记新分类
      let categoryId = '';
      const categoryName = row['分类'];
      if (categoryName) {
        const category = categoryMap.get(categoryName);
        if (category && category.type === type) {
          categoryId = category.id;
        } else {
          newCategories.add(categoryName);
        }
      }
      
      // 标记新的人员
      if (row['付款人'] && !persons.some(p => p.name === row['付款人'])) {
        newPersons.add(row['付款人']);
      }
      if (row['收款人'] && !persons.some(p => p.name === row['收款人'])) {
        newPersons.add(row['收款人']);
      }
      
      // 解析金额
      const amount = parseFloat(row['金额']);
      if (isNaN(amount)) {
        errors.push(`第${index + 2}行: 金额格式错误`);
        return;
      }
      
      // 解析日期
      const date = row['日期'] ? dayjs(row['日期']).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
      if (!dayjs(date).isValid()) {
        errors.push(`第${index + 2}行: 日期格式错误`);
        return;
      }
      
      // 解析状态
      let status: 'pending' | 'completed' | 'cancelled' = 'completed';
      if (row['状态'] === '待处理') status = 'pending';
      else if (row['状态'] === '已取消') status = 'cancelled';
      
      // 创建交易对象
      const transaction: Partial<Transaction> = {
        id: uuidv4(),
        type,
        categoryId,
        amount,
        currency: row['货币'] || 'CNY',
        date,
        project: row['项目'] || '',
        payer: row['付款人'] || '',
        payee: row['收款人'] || '',
        quantity: parseInt(row['数量']) || 1,
        status,
        description: row['描述'] || '',
        recorder: row['记录人'] || '导入',
        created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
      };
      
      transactions.push(transaction);
    } catch (error) {
      errors.push(`第${index + 2}行: 数据解析错误`);
    }
  });
  
  return {
    transactions,
    errors,
    newCategories: Array.from(newCategories),
    newPersons: Array.from(newPersons)
  };
}

/**
 * 导入JSON备份数据
 */
export function importFromJSON(jsonData: any): {
  valid: boolean,
  data?: {
    transactions: Transaction[],
    categories: Category[],
    persons: Person[]
  },
  error?: string
} {
  try {
    // 验证数据格式
    if (!jsonData.version || !jsonData.data) {
      return { valid: false, error: '无效的备份文件格式' };
    }
    
    const { transactions, categories, persons } = jsonData.data;
    
    // 验证必要字段
    if (!Array.isArray(transactions) || !Array.isArray(categories) || !Array.isArray(persons)) {
      return { valid: false, error: '备份数据不完整' };
    }
    
    // 为导入的数据生成新的ID（避免冲突）
    const idMap = new Map<string, string>();
    
    // 处理分类
    const newCategories = categories.map(c => {
      const newId = uuidv4();
      idMap.set(c.id, newId);
      return { ...c, id: newId };
    });
    
    // 处理人员
    const newPersons = persons.map(p => {
      const newId = uuidv4();
      idMap.set(p.id, newId);
      return { ...p, id: newId };
    });
    
    // 处理交易（更新关联的ID）
    const newTransactions = transactions.map(t => {
      const newId = uuidv4();
      return {
        ...t,
        id: newId,
        categoryId: idMap.get(t.categoryId) || t.categoryId,
        created_at: t.created_at || dayjs().format('YYYY-MM-DD HH:mm:ss'),
        updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
      };
    });
    
    return {
      valid: true,
      data: {
        transactions: newTransactions,
        categories: newCategories,
        persons: newPersons
      }
    };
  } catch (error) {
    return { valid: false, error: '解析备份文件失败' };
  }
}

/**
 * 读取文件内容
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * 生成导入模板
 */
export function generateImportTemplate(): string {
  const headers = [
    '日期',
    '类型',
    '分类',
    '金额',
    '货币',
    '项目',
    '付款人',
    '收款人',
    '数量',
    '状态',
    '描述',
    '记录人'
  ];
  
  const examples = [
    [
      dayjs().format('YYYY-MM-DD'),
      '支出',
      '餐饮',
      '50.00',
      'CNY',
      '项目A',
      '张三',
      '餐厅',
      '1',
      '已完成',
      '午餐',
      '管理员'
    ],
    [
      dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
      '收入',
      '工资',
      '10000.00',
      'CNY',
      '',
      '公司',
      '李四',
      '1',
      '已完成',
      '月薪',
      '管理员'
    ]
  ];
  
  let csvContent = '\uFEFF'; // UTF-8 BOM
  csvContent += headers.join(',') + '\n';
  examples.forEach(row => {
    csvContent += row.join(',') + '\n';
  });
  
  return csvContent;
}