import type { Transaction, Category, Person } from '#/types/finance';

import dayjs from 'dayjs';

/**
 * 导出数据为CSV格式
 */
export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) {
    return;
  }

  // 获取所有列名
  const headers = Object.keys(data[0]);
  
  // 创建CSV内容
  let csvContent = '\uFEFF'; // UTF-8 BOM
  
  // 添加表头
  csvContent += headers.join(',') + '\n';
  
  // 添加数据行
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // 处理包含逗号或换行符的值
      if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    });
    csvContent += values.join(',') + '\n';
  });
  
  // 创建Blob并下载
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${dayjs().format('YYYYMMDD_HHmmss')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 导出交易数据
 */
export function exportTransactions(
  transactions: Transaction[],
  categories: Category[],
  persons: Person[]
) {
  // 创建分类和人员的映射
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  const personMap = new Map(persons.map(p => [p.id, p.name]));
  
  // 转换交易数据为导出格式
  const exportData = transactions.map(t => ({
    日期: t.date,
    类型: t.type === 'income' ? '收入' : '支出',
    分类: categoryMap.get(t.categoryId) || '',
    金额: t.amount,
    货币: t.currency,
    项目: t.project || '',
    付款人: t.payer || '',
    收款人: t.payee || '',
    数量: t.quantity,
    单价: t.quantity > 1 ? (t.amount / t.quantity).toFixed(2) : t.amount,
    状态: t.status === 'completed' ? '已完成' : t.status === 'pending' ? '待处理' : '已取消',
    描述: t.description || '',
    记录人: t.recorder || '',
    创建时间: t.created_at,
    更新时间: t.updated_at
  }));
  
  exportToCSV(exportData, '交易记录');
}

/**
 * 导出数据为JSON格式
 */
export function exportToJSON(data: any, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${dayjs().format('YYYYMMDD_HHmmss')}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 生成导入模板
 */
export function generateImportTemplate() {
  const template = [
    {
      date: '2025-08-05',
      type: 'expense',
      category: '餐饮',
      amount: 100.00,
      currency: 'CNY',
      description: '午餐',
      project: '项目名称',
      payer: '付款人',
      payee: '收款人',
      status: 'completed',
      tags: '标签1,标签2',
    },
    {
      date: '2025-08-05',
      type: 'income',
      category: '工资',
      amount: 5000.00,
      currency: 'CNY',
      description: '月薪',
      project: '',
      payer: '公司',
      payee: '自己',
      status: 'completed',
      tags: '',
    },
  ];
  
  exportToCSV(template, 'transaction_import_template');
}

/**
 * 导出所有数据（完整备份）
 */
export function exportAllData(
  transactions: Transaction[],
  categories: Category[],
  persons: Person[]
) {
  const exportData = {
    version: '1.0',
    exportDate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    data: {
      transactions,
      categories,
      persons
    }
  };
  
  exportToJSON(exportData, '财务数据备份');
}

/**
 * 解析CSV文件
 */
export function parseCSV(text: string): Record<string, any>[] {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  // 解析表头
  const headers = lines[0].split(',').map(h => h.trim());
  
  // 解析数据行
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    // 创建对象
    const row: Record<string, any> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }
  
  return data;
}