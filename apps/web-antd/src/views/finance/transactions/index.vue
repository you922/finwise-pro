<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  notification,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

import { useFinanceStore } from '#/store/finance';

defineOptions({ name: 'TransactionManagement' });

const financeStore = useFinanceStore();

const currentLanguage = ref('zh-CN');
const showIncomeModal = ref(false);
const showExpenseModal = ref(false);
const showEditModal = ref(false);
const showRecycleBinModal = ref(false);
const showImportModal = ref(false);
const showExportModal = ref(false);
const searchText = ref('');
const filterType = ref('');
const filterCategory = ref('');
const editingTransaction = ref<any>(null);

// Pagination state management
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50', '100', '200', '500', '1000'],
  showTotal: (total: number) => `共 ${total} 条记录`,
});

const handleTableChange = (pager: { current?: number; pageSize?: number }) => {
  const nextPageSize = pager.pageSize ?? pagination.value.pageSize;
  const total = filteredTransactions.value.length;
  const totalPages = Math.max(1, Math.ceil(total / nextPageSize));

  pagination.value = {
    ...pagination.value,
    pageSize: nextPageSize,
    total,
    current: Math.min(pager.current ?? pagination.value.current, totalPages),
  };
};

// Reset pagination when filters change
watch([filterType, filterCategory, searchText], () => {
  pagination.value.current = 1;
});

// 多语言支持
const isEnglish = computed(() => currentLanguage.value === 'en-US');

// 表格列
const columns = [
  {
    title: '📋 项目名称',
    dataIndex: 'project',
    key: 'project',
    width: 200,
    ellipsis: true,
    sorter: (a: any, b: any) => {
      const projA = a.project || a.description || '';
      const projB = b.project || b.description || '';
      return projA.localeCompare(projB);
    },
  },
  {
    title: '日期',
    dataIndex: 'transactionDate',
    key: 'transactionDate',
    width: 110,
    sorter: (a: any, b: any) => {
      const dateA = a.transactionDate
        ? new Date(a.transactionDate).getTime()
        : 0;
      const dateB = b.transactionDate
        ? new Date(b.transactionDate).getTime()
        : 0;
      return dateA - dateB;
    },
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 90,
    filters: [
      { text: '收入', value: 'income' },
      { text: '支出', value: 'expense' },
      { text: '转账', value: 'transfer' },
    ],
    onFilter: (value: string, record: any) => record.type === value,
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    width: 150,
    ellipsis: true,
  },
  {
    title: '分类',
    dataIndex: 'categoryId',
    key: 'categoryId',
    width: 130,
    sorter: (a: any, b: any) => {
      const catA = getCategoryName(a.categoryId);
      const catB = getCategoryName(b.categoryId);
      return catA.localeCompare(catB);
    },
  },
  {
    title: '金额',
    dataIndex: 'amount',
    key: 'amount',
    width: 130,
    sorter: (a: any, b: any) => a.amount - b.amount,
  },
  {
    title: '币种',
    dataIndex: 'currency',
    key: 'currency',
    width: 80,
    filters: [
      { text: 'CNY', value: 'CNY' },
      { text: 'USD', value: 'USD' },
      { text: 'EUR', value: 'EUR' },
      { text: 'GBP', value: 'GBP' },
      { text: 'JPY', value: 'JPY' },
    ],
    onFilter: (value: string, record: any) => record.currency === value,
  },
  {
    title: '账户',
    dataIndex: 'accountId',
    key: 'accountId',
    width: 150,
  },
  {
    title: '操作',
    key: 'action',
    width: 120,
    fixed: 'right',
  },
];

// 快速添加表单
const quickIncomeForm = ref({
  currency: 'CNY',
  quantity: 1,
  unitPrice: null,
  amount: null,
  weight: null,
  weightUnit: 'kg',
  category: '',
  accountId: null,
  date: dayjs(),
  description: '',
});

const quickExpenseForm = ref({
  currency: 'CNY',
  quantity: 1,
  unitPrice: null,
  amount: null,
  weight: null,
  weightUnit: 'kg',
  category: '',
  accountId: null,
  date: dayjs(),
  description: '',
});

// 是否使用单价×数量计算模式
const useIncomeQuantityMode = ref(false);
const useExpenseQuantityMode = ref(false);

// 当前选中的日期类型
const selectedIncomeDateType = ref<
  'custom' | 'month' | 'today' | 'week' | 'yesterday'
>('today');
const selectedExpenseDateType = ref<
  'custom' | 'month' | 'today' | 'week' | 'yesterday'
>('today');

// 获取日期类型对应的颜色
const getDateTypeColor = (type: string) => {
  const colors = {
    today: '#52c41a', // 绿色 - 今天
    yesterday: '#1890ff', // 蓝色 - 昨天
    week: '#722ed1', // 紫色 - 本周
    month: '#fa8c16', // 橙色 - 本月
    custom: '#8c8c8c', // 灰色 - 自定义
  };
  return colors[type] || colors.custom;
};

// 选中账户的货币
const selectedIncomeCurrency = computed(() => {
  const account = financeStore.getAccountById(quickIncomeForm.value.accountId);
  return account?.currency || 'CNY';
});

const selectedExpenseCurrency = computed(() => {
  const account = financeStore.getAccountById(quickExpenseForm.value.accountId);
  return account?.currency || 'CNY';
});

// 监听账户变化，保存到 localStorage
watch(
  () => quickIncomeForm.value.accountId,
  (newAccountId) => {
    if (newAccountId) {
      localStorage.setItem('lastIncomeAccountId', String(newAccountId));
    }
  },
);

watch(
  () => quickExpenseForm.value.accountId,
  (newAccountId) => {
    if (newAccountId) {
      localStorage.setItem('lastExpenseAccountId', String(newAccountId));
    }
  },
);

// 监听单价和数量变化，自动计算总金额 - 收入
watch(
  [() => quickIncomeForm.value.unitPrice, () => quickIncomeForm.value.quantity],
  ([unitPrice, quantity]) => {
    if (useIncomeQuantityMode.value && unitPrice && quantity) {
      quickIncomeForm.value.amount = unitPrice * quantity;
    }
  },
);

// 监听单价和数量变化，自动计算总金额 - 支出
watch(
  [
    () => quickExpenseForm.value.unitPrice,
    () => quickExpenseForm.value.quantity,
  ],
  ([unitPrice, quantity]) => {
    if (useExpenseQuantityMode.value && unitPrice && quantity) {
      quickExpenseForm.value.amount = unitPrice * quantity;
    }
  },
);

// 切换计算模式 - 收入
const toggleIncomeQuantityMode = (enabled: boolean) => {
  useIncomeQuantityMode.value = enabled;
  if (enabled) {
    if (quickIncomeForm.value.amount && quickIncomeForm.value.quantity) {
      quickIncomeForm.value.unitPrice =
        quickIncomeForm.value.amount / quickIncomeForm.value.quantity;
    }
  } else {
    quickIncomeForm.value.quantity = 1;
    quickIncomeForm.value.unitPrice = null;
  }
};

// 切换计算模式 - 支出
const toggleExpenseQuantityMode = (enabled: boolean) => {
  useExpenseQuantityMode.value = enabled;
  if (enabled) {
    if (quickExpenseForm.value.amount && quickExpenseForm.value.quantity) {
      quickExpenseForm.value.unitPrice =
        quickExpenseForm.value.amount / quickExpenseForm.value.quantity;
    }
  } else {
    quickExpenseForm.value.quantity = 1;
    quickExpenseForm.value.unitPrice = null;
  }
};

// 交易表单（用于编辑）
const transactionForm = ref({
  type: 'expense',
  amount: null,
  currency: 'CNY',
  customCurrencyCode: '',
  customCurrencyName: '',
  description: '',
  category: '',
  customCategoryName: '',
  account: '',
  customAccountName: '',
  date: dayjs(),
});

// 原始交易数据（排除已删除的）
const allTransactions = computed(() =>
  financeStore.transactions.filter((t) => !t.isDeleted),
);

// 已删除的交易数据
const deletedTransactions = computed(() =>
  financeStore.transactions.filter((t) => t.isDeleted),
);

// 账户列表
const accounts = computed(() => financeStore.accounts);

// 过滤后的交易数据
const filteredTransactions = computed(() => {
  let filtered = allTransactions.value;

  // 按类型筛选
  if (filterType.value) {
    filtered = filtered.filter((t) => t.type === filterType.value);
  }

  // 按分类筛选
  if (filterCategory.value) {
    filtered = filtered.filter(
      (t) => t.categoryId === Number(filterCategory.value),
    );
  }

  // 按搜索文本筛选（搜索描述）
  if (searchText.value) {
    const searchLower = searchText.value.toLowerCase();
    filtered = filtered.filter((t) =>
      t.description?.toLowerCase().includes(searchLower),
    );
  }

  return filtered;
});

const paginatedTransactions = computed(() => {
  const { current, pageSize } = pagination.value;
  const start = (current - 1) * pageSize;
  return filteredTransactions.value.slice(start, start + pageSize);
});

watch(
  filteredTransactions,
  (list) => {
    const totalPages = Math.max(
      1,
      Math.ceil(list.length / pagination.value.pageSize),
    );
    pagination.value.total = list.length;
    if (pagination.value.current > totalPages) {
      pagination.value.current = totalPages;
    }
  },
  { immediate: true },
);

// 导出选项
const exportOptions = ref({
  scope: 'filtered' as 'all' | 'current' | 'filtered',
  categoryFilter: null as null | number,
  format: 'csv' as 'csv' | 'excel' | 'json',
  fields: {
    date: true,
    type: true,
    category: true,
    description: true,
    amount: true,
    currency: true,
    account: true,
  },
});

// 导入相关状态
const importPreviewData = ref<any[]>([]);
const importColumns = ref<string[]>([]);
const importMapping = ref({
  date: '',
  type: '',
  category: '',
  description: '',
  amount: '',
  currency: '',
  account: '',
});

// 初始化加载数据
onMounted(async () => {
  await Promise.all([
    financeStore.initializeData(),
    financeStore.fetchTransactions(),
  ]);
});

// 功能实现
const getCategoryColor = (categoryId: null | number) => {
  if (!categoryId) return 'default';
  const category = financeStore.getCategoryById(categoryId);
  return category?.color || 'default';
};

const getCategoryName = (categoryId: null | number) => {
  if (!categoryId) return '未分类';
  const category = financeStore.getCategoryById(categoryId);
  return category ? `${category.icon} ${category.name}` : '未知分类';
};

const getAccountName = (accountId: number) => {
  const account = financeStore.getAccountById(accountId);
  return account ? `${account.icon} ${account.name}` : '未知账户';
};

// 计算统计数据（基于所有交易，不受筛选影响）
const statistics = computed(() => {
  const all = allTransactions.value;

  // 计算总收入（转换为基础货币CNY）
  const totalIncome = all
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amountInBase, 0);

  // 计算总支出（转换为基础货币CNY）
  const totalExpense = all
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amountInBase, 0);

  // 计算净收入
  const netIncome = totalIncome - totalExpense;

  // 交易笔数
  const transactionCount = all.length;

  return {
    totalIncome,
    totalExpense,
    netIncome,
    transactionCount,
  };
});

const quickAddIncome = () => {
  // 读取上次选择的账户
  const lastAccountId = localStorage.getItem('lastIncomeAccountId');
  const accountId = lastAccountId
    ? Number(lastAccountId)
    : accounts.value[0]?.id;

  quickIncomeForm.value = {
    amount: null,
    description: '',
    category: '',
    accountId: accountId || null,
    date: dayjs(),
  };
  showIncomeModal.value = true;
};

const quickAddExpense = () => {
  // 读取上次选择的账户
  const lastAccountId = localStorage.getItem('lastExpenseAccountId');
  const accountId = lastAccountId
    ? Number(lastAccountId)
    : accounts.value[0]?.id;

  quickExpenseForm.value = {
    amount: null,
    description: '',
    category: '',
    accountId: accountId || null,
    date: dayjs(),
  };
  showExpenseModal.value = true;
};

// 日期快捷方式 - 收入
const setIncomeDate = (type: 'month' | 'today' | 'week' | 'yesterday') => {
  selectedIncomeDateType.value = type;
  switch (type) {
    case 'month': {
      quickIncomeForm.value.date = dayjs().startOf('month');
      break;
    }
    case 'today': {
      quickIncomeForm.value.date = dayjs();
      break;
    }
    case 'week': {
      quickIncomeForm.value.date = dayjs().startOf('week');
      break;
    }
    case 'yesterday': {
      quickIncomeForm.value.date = dayjs().subtract(1, 'day');
      break;
    }
  }
};

// 日期快捷方式 - 支出
const setExpenseDate = (type: 'month' | 'today' | 'week' | 'yesterday') => {
  selectedExpenseDateType.value = type;
  switch (type) {
    case 'month': {
      quickExpenseForm.value.date = dayjs().startOf('month');
      break;
    }
    case 'today': {
      quickExpenseForm.value.date = dayjs();
      break;
    }
    case 'week': {
      quickExpenseForm.value.date = dayjs().startOf('week');
      break;
    }
    case 'yesterday': {
      quickExpenseForm.value.date = dayjs().subtract(1, 'day');
      break;
    }
  }
};

const submitIncome = async () => {
  try {
    if (
      !quickIncomeForm.value.amount ||
      !quickIncomeForm.value.category ||
      !quickIncomeForm.value.accountId
    ) {
      notification.error({
        message: '添加失败',
        description: '请填写完整信息',
      });
      return;
    }

    // 获取选中的账户
    const account = financeStore.getAccountById(
      quickIncomeForm.value.accountId,
    );
    if (!account) {
      notification.error({
        message: '添加失败',
        description: '请选择有效的账户',
      });
      return;
    }

    // 获取对应的收入分类
    const category = financeStore.incomeCategories.find(
      (c) => c.name === quickIncomeForm.value.category,
    );

    await financeStore.createTransaction({
      type: 'income',
      amount: quickIncomeForm.value.amount,
      currency: account.currency,
      categoryId: category?.id,
      accountId: account.id,
      transactionDate: quickIncomeForm.value.date.format('YYYY-MM-DD'),
      description: quickIncomeForm.value.description || '快速添加收入',
    });

    notification.success({
      message: '收入已添加',
      description: '收入记录已保存',
    });
    showIncomeModal.value = false;
  } catch (error) {
    console.error('添加收入失败:', error);
    notification.error({
      message: '添加失败',
      description: '添加收入时出错，请稍后重试',
    });
  }
};

const submitExpense = async () => {
  try {
    if (
      !quickExpenseForm.value.amount ||
      !quickExpenseForm.value.category ||
      !quickExpenseForm.value.accountId
    ) {
      notification.error({
        message: '添加失败',
        description: '请填写完整信息',
      });
      return;
    }

    // 获取选中的账户
    const account = financeStore.getAccountById(
      quickExpenseForm.value.accountId,
    );
    if (!account) {
      notification.error({
        message: '添加失败',
        description: '请选择有效的账户',
      });
      return;
    }

    // 获取对应的支出分类
    const category = financeStore.expenseCategories.find(
      (c) => c.name === quickExpenseForm.value.category,
    );

    await financeStore.createTransaction({
      type: 'expense',
      amount: quickExpenseForm.value.amount,
      currency: account.currency,
      categoryId: category?.id,
      accountId: account.id,
      transactionDate: quickExpenseForm.value.date.format('YYYY-MM-DD'),
      description: quickExpenseForm.value.description || '快速添加支出',
    });

    notification.success({
      message: '支出已添加',
      description: '支出记录已保存',
    });
    showExpenseModal.value = false;
  } catch (error) {
    console.error('添加支出失败:', error);
    notification.error({
      message: '添加失败',
      description: '添加支出时出错，请稍后重试',
    });
  }
};

// 导出数据处理函数
const handleExportData = () => {
  try {
    // 根据导出范围获取数据
    let dataToExport: any[] = [];

    switch (exportOptions.value.scope) {
      case 'all': {
        dataToExport = allTransactions.value;
        break;
      }
      case 'current': {
        dataToExport = paginatedTransactions.value;
        // 如果选择了分类筛选
        if (exportOptions.value.categoryFilter) {
          dataToExport = dataToExport.filter(
            (t) => t.categoryId === exportOptions.value.categoryFilter,
          );
        }
        break;
      }
      case 'filtered': {
        dataToExport = filteredTransactions.value;
        break;
      }
    }

    // 转换数据格式
    const exportData = dataToExport.map((transaction) => {
      const row: any = {};

      if (exportOptions.value.fields.date) {
        row['日期'] = transaction.transactionDate;
      }
      if (exportOptions.value.fields.type) {
        row['类型'] = transaction.type === 'income' ? '收入' : '支出';
      }
      if (exportOptions.value.fields.category) {
        row['分类'] = getCategoryName(transaction.categoryId);
      }
      if (exportOptions.value.fields.description) {
        row['项目名称'] = transaction.description || '';
      }
      if (exportOptions.value.fields.amount) {
        row['金额'] = transaction.amount;
      }
      if (exportOptions.value.fields.currency) {
        row['币种'] = transaction.currency;
      }
      if (exportOptions.value.fields.account) {
        row['账户'] = getAccountName(transaction.accountId);
      }

      return row;
    });

    // 根据格式导出
    const timestamp = new Date().toISOString().split('T')[0];

    switch (exportOptions.value.format) {
      case 'csv': {
        exportToCSV(exportData, `交易数据-${timestamp}.csv`);

        break;
      }
      case 'excel': {
        exportToExcel(exportData, `交易数据-${timestamp}.xlsx`);

        break;
      }
      case 'json': {
        exportToJSON(exportData, `交易数据-${timestamp}.json`);

        break;
      }
      // No default
    }

    notification.success({
      message: '导出成功',
      description: `已导出 ${exportData.length} 条交易记录`,
    });

    showExportModal.value = false;
  } catch (error) {
    console.error('导出失败:', error);
    notification.error({
      message: '导出失败',
      description: '数据导出过程中出现错误',
    });
  }
};

// 导出为 CSV
const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) {
    notification.warning({
      message: '无数据',
      description: '没有可导出的数据',
    });
    return;
  }

  // 获取表头
  const headers = Object.keys(data[0]);

  // 构建 CSV 内容
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // 处理包含逗号的值
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value;
        })
        .join(','),
    ),
  ].join('\n');

  // 添加 BOM 以支持中文
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  downloadFile(blob, filename);
};

// 导出为 JSON
const exportToJSON = (data: any[], filename: string) => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  downloadFile(blob, filename);
};

// 导出为 Excel
const exportToExcel = (data: any[], filename: string) => {
  if (data.length === 0) {
    notification.warning({
      message: '无数据',
      description: '没有可导出的数据',
    });
    return;
  }

  // 创建工作簿
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '交易数据');

  // 设置列宽
  const headers = Object.keys(data[0]);
  const colWidths = headers.map((header) => ({
    wch:
      Math.max(
        header.length,
        ...data.map((row) => String(row[header] || '').length),
      ) + 2,
  }));
  worksheet['!cols'] = colWidths;

  // 生成 Excel 文件
  XLSX.writeFile(workbook, filename);
};

// 下载文件
const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// 处理文件上传
const handleFileUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  try {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    switch (fileExtension) {
      case 'csv': {
        await parseCSVFile(file);

        break;
      }
      case 'json': {
        await parseJSONFile(file);

        break;
      }
      case 'xls':
      case 'xlsx': {
        await parseExcelFile(file);

        break;
      }
      // No default
    }
  } catch (error) {
    console.error('文件解析失败:', error);
    notification.error({
      message: '文件解析失败',
      description: '请检查文件格式是否正确',
    });
  }
};

// 解析 JSON 文件
const parseJSONFile = async (file: File) => {
  const text = await file.text();
  const data = JSON.parse(text);

  if (Array.isArray(data) && data.length > 0) {
    importPreviewData.value = data;
    importColumns.value = Object.keys(data[0]);

    // 自动映射字段
    autoMapFields(importColumns.value);
  }
};

// 解析 CSV 文件
const parseCSVFile = async (file: File) => {
  const text = await file.text();
  const lines = text.split('\n').filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error('CSV 文件格式不正确');
  }

  // 解析表头
  const headers = lines[0]
    .split(',')
    .map((h) => h.trim().replaceAll(/^"|"$/g, ''));
  importColumns.value = headers;

  // 解析数据行
  const data = lines.slice(1).map((line) => {
    const values = line
      .split(',')
      .map((v) => v.trim().replaceAll(/^"|"$/g, ''));
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });

  importPreviewData.value = data;

  // 自动映射字段
  autoMapFields(headers);
};

// 解析 Excel 文件
const parseExcelFile = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  // 获取第一个工作表
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // 将工作表转换为 JSON
  const data = XLSX.utils.sheet_to_json(worksheet);

  if (data.length === 0) {
    throw new Error('Excel 文件中没有数据');
  }

  importPreviewData.value = data;
  importColumns.value = Object.keys(data[0] as any);

  // 自动映射字段
  autoMapFields(importColumns.value);
};

// 自动映射字段
const autoMapFields = (columns: string[]) => {
  const mapping: any = {
    date: '',
    type: '',
    category: '',
    description: '',
    amount: '',
    currency: '',
    account: '',
  };

  columns.forEach((col) => {
    const colLower = col.toLowerCase();
    if (colLower.includes('日期') || colLower.includes('date')) {
      mapping.date = col;
    } else if (
      colLower.includes('类型') ||
      colLower.includes('type') ||
      colLower.includes('收支')
    ) {
      mapping.type = col;
    } else if (colLower.includes('分类') || colLower.includes('category')) {
      mapping.category = col;
    } else if (
      colLower.includes('描述') ||
      colLower.includes('项目') ||
      colLower.includes('description')
    ) {
      mapping.description = col;
    } else if (colLower.includes('金额') || colLower.includes('amount')) {
      mapping.amount = col;
    } else if (colLower.includes('币种') || colLower.includes('currency')) {
      mapping.currency = col;
    } else if (
      colLower.includes('账户') ||
      colLower.includes('account') ||
      colLower.includes('计入')
    ) {
      mapping.account = col;
    }
  });

  importMapping.value = mapping;
};

// 处理导入数据
const handleImportData = async () => {
  try {
    if (importPreviewData.value.length === 0) {
      notification.warning({
        message: '无数据',
        description: '请先上传文件',
      });
      return;
    }

    // 验证必填字段映射
    if (
      !importMapping.value.date ||
      !importMapping.value.type ||
      !importMapping.value.amount
    ) {
      notification.error({
        message: '字段映射不完整',
        description: '请至少映射日期、类型和金额字段',
      });
      return;
    }

    let successCount = 0;
    let failCount = 0;

    // 日期解析函数 - 支持多种格式，可继承上一个有效日期
    const parseDate = (dateStr: string, lastValidDate: string = ''): string => {
      // 如果日期为空，使用上一个有效日期
      if (!dateStr || dateStr.trim() === '') {
        return lastValidDate || dayjs().format('YYYY-MM-DD');
      }

      // 处理中文日期格式：8月3日、10月15日
      const chinesePattern = /(\d+)月(\d+)日/;
      const match = dateStr.match(chinesePattern);
      if (match) {
        const month = match[1].padStart(2, '0');
        const day = match[2].padStart(2, '0');
        // 根据月份判断年份（8-12月为2024年，1-7月为2025年）
        const year = Number.parseInt(match[1]) >= 8 ? '2024' : '2025';
        return `${year}-${month}-${day}`;
      }

      // 处理标准日期格式 YYYY-MM-DD, YYYY/MM/DD
      const standardDate = dayjs(dateStr);
      if (standardDate.isValid()) {
        return standardDate.format('YYYY-MM-DD');
      }

      // 如果都无法解析，使用上一个有效日期或今天
      return lastValidDate || dayjs().format('YYYY-MM-DD');
    };

    // 导入数据
    let lastValidDate = ''; // 记录上一个有效日期
    for (const row of importPreviewData.value) {
      try {
        // 获取类型，如果为空则默认为支出
        const type = row[importMapping.value.type] || '支出';
        const typeValue =
          type === '收入' || type === 'income' ? 'income' : 'expense';

        // 查找分类
        let categoryId: number | undefined;
        if (importMapping.value.category && row[importMapping.value.category]) {
          const categoryName = row[importMapping.value.category].replaceAll(
            /[^\u4E00-\u9FA5a-z]/gi,
            '',
          );
          const categories =
            typeValue === 'income'
              ? financeStore.incomeCategories
              : financeStore.expenseCategories;
          const category = categories.find((c) => c.name === categoryName);
          categoryId = category?.id;
        }

        // 查找账户
        let accountId: number | undefined;
        if (importMapping.value.account && row[importMapping.value.account]) {
          const accountField = row[importMapping.value.account];
          // 尝试在账户字段中查找"美金现金"、"泰铢现金"等账户名关键词
          const account = financeStore.accounts.find(
            (a) =>
              accountField.includes(a.name) || a.name.includes(accountField),
          );
          accountId = account?.id;
        }

        // 获取币种，如果没有映射币种字段则使用默认USD
        const currency =
          importMapping.value.currency && row[importMapping.value.currency]
            ? row[importMapping.value.currency]
            : 'USD';

        // 如果没有找到账户，使用默认账户
        if (!accountId) {
          const defaultAccount = financeStore.accounts.find(
            (a) => a.currency === currency && a.type === 'cash',
          );
          accountId = defaultAccount?.id;
        }

        // 如果还是没有找到，使用任意USD账户
        if (!accountId) {
          const usdAccount = financeStore.accounts.find(
            (a) => a.currency === 'USD',
          );
          accountId = usdAccount?.id;
        }

        if (!accountId) {
          failCount++;
          continue;
        }

        // 解析并格式化日期，空日期继承上一个有效日期
        const formattedDate = parseDate(
          row[importMapping.value.date],
          lastValidDate,
        );

        // 如果当前行有日期，更新lastValidDate
        if (
          row[importMapping.value.date] &&
          row[importMapping.value.date].trim() !== ''
        ) {
          lastValidDate = formattedDate;
        }

        // 获取描述，优先使用description字段，否则使用项目名称
        const description = importMapping.value.description
          ? row[importMapping.value.description] || ''
          : row[importMapping.value.category] || '未命名交易';

        await financeStore.createTransaction({
          type: typeValue,
          amount: Number(row[importMapping.value.amount]),
          currency,
          categoryId,
          accountId,
          transactionDate: formattedDate,
          description,
        });

        successCount++;
      } catch (error) {
        console.error('导入单条数据失败:', error);
        failCount++;
      }
    }

    notification.success({
      message: '导入完成',
      description: `成功导入 ${successCount} 条，失败 ${failCount} 条`,
    });

    // 重置导入状态
    showImportModal.value = false;
    importPreviewData.value = [];
    importColumns.value = [];
    importMapping.value = {
      date: '',
      type: '',
      category: '',
      description: '',
      amount: '',
      currency: '',
      account: '',
    };
  } catch (error) {
    console.error('导入失败:', error);
    notification.error({
      message: '导入失败',
      description: '数据导入过程中出现错误',
    });
  }
};

const editTransaction = (record: any) => {
  editingTransaction.value = record;

  // 填充表单
  transactionForm.value = {
    type: record.type,
    amount: record.amount,
    currency: record.currency,
    customCurrencyCode: '',
    customCurrencyName: '',
    description: record.description || '',
    category: record.categoryId ? String(record.categoryId) : '',
    customCategoryName: '',
    account: record.accountId ? String(record.accountId) : '',
    customAccountName: '',
    date: dayjs(record.transactionDate),
  };

  showEditModal.value = true;
};

const submitEditTransaction = async () => {
  try {
    await financeStore.updateTransaction(editingTransaction.value.id, {
      type: transactionForm.value.type,
      amount: transactionForm.value.amount!,
      currency: transactionForm.value.currency,
      categoryId: transactionForm.value.category
        ? Number(transactionForm.value.category)
        : undefined,
      accountId: Number(transactionForm.value.account),
      transactionDate: transactionForm.value.date.format('YYYY-MM-DD'),
      description: transactionForm.value.description,
    });

    notification.success({
      message: '更新成功',
      description: '交易信息已更新',
    });

    showEditModal.value = false;
    editingTransaction.value = null;
    resetTransactionForm();
  } catch (error) {
    console.error('更新交易失败:', error);
    notification.error({
      message: '更新失败',
      description: '更新交易时出错，请稍后重试',
    });
  }
};

const openRecycleBin = () => {
  showRecycleBinModal.value = true;
};

const restoreTransaction = async (record: any) => {
  try {
    await financeStore.restoreTransaction(record.id);
    notification.success({
      message: '恢复成功',
      description: '交易已恢复',
    });
  } catch (error) {
    console.error('恢复交易失败:', error);
    notification.error({
      message: '恢复失败',
      description: '恢复交易时出错，请稍后重试',
    });
  }
};

const deleteTransaction = (record: any) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除这笔交易吗？\n\n类型: ${record.type === 'income' ? '收入' : '支出'}\n金额: ${record.currency} ${record.amount}\n描述: ${record.description || '无'}\n\n删除后可以在回收站中恢复。`,
    okText: '确定删除',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      try {
        await financeStore.softDeleteTransaction(record.id);
        notification.success({
          message: '删除成功',
          description: '交易已移至回收站',
        });
      } catch (error) {
        console.error('删除交易失败:', error);
        notification.error({
          message: '删除失败',
          description: '删除交易时出错，请稍后重试',
        });
      }
    },
  });
};

const _handleCurrencyChange = (currency: string) => {
  if (currency !== 'CUSTOM') {
    transactionForm.value.customCurrencyCode = '';
    transactionForm.value.customCurrencyName = '';
  }
};

const _handleCategoryChange = (category: string) => {
  if (category !== 'CUSTOM') {
    transactionForm.value.customCategoryName = '';
  }
};

const _handleAccountChange = (account: string) => {
  if (account !== 'CUSTOM') {
    transactionForm.value.customAccountName = '';
  }
};

// 搜索和筛选通过 computed filteredTransactions 自动完成，不需要额外的 handleSearch 方法
</script>

<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="mb-2 text-3xl font-bold text-gray-900">💰 交易管理</h1>
      <p class="text-gray-600">全面的收支交易记录管理系统</p>
    </div>

    <!-- 快速统计 -->
    <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
      <Card class="text-center transition-shadow hover:shadow-lg">
        <div class="space-y-2">
          <div class="text-3xl">📈</div>
          <p class="text-sm text-gray-500">总收入</p>
          <p class="text-2xl font-bold text-green-600">
            ¥{{
              statistics.totalIncome.toLocaleString('zh-CN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            }}
          </p>
        </div>
      </Card>
      <Card class="text-center transition-shadow hover:shadow-lg">
        <div class="space-y-2">
          <div class="text-3xl">📉</div>
          <p class="text-sm text-gray-500">总支出</p>
          <p class="text-2xl font-bold text-red-600">
            ¥{{
              statistics.totalExpense.toLocaleString('zh-CN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            }}
          </p>
        </div>
      </Card>
      <Card class="text-center transition-shadow hover:shadow-lg">
        <div class="space-y-2">
          <div class="text-3xl">💎</div>
          <p class="text-sm text-gray-500">净收入</p>
          <p
            class="text-2xl font-bold"
            :class="
              statistics.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
            "
          >
            ¥{{
              statistics.netIncome.toLocaleString('zh-CN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            }}
          </p>
        </div>
      </Card>
      <Card class="text-center transition-shadow hover:shadow-lg">
        <div class="space-y-2">
          <div class="text-3xl">📊</div>
          <p class="text-sm text-gray-500">交易笔数</p>
          <p class="text-2xl font-bold text-blue-600">
            {{ statistics.transactionCount }}
          </p>
        </div>
      </Card>
    </div>

    <!-- 操作栏 -->
    <Card class="mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <Input
            v-model:value="searchText"
            :placeholder="isEnglish ? 'Search transactions...' : '搜索交易...'"
            style="width: 300px"
            allow-clear
          />
          <Select
            v-model:value="filterType"
            :placeholder="isEnglish ? 'Type' : '类型'"
            style="width: 120px"
          >
            <Select.Option value="">
              {{ isEnglish ? 'All' : '全部' }}
            </Select.Option>
            <Select.Option value="income">
              {{ isEnglish ? 'Income' : '收入' }}
            </Select.Option>
            <Select.Option value="expense">
              {{ isEnglish ? 'Expense' : '支出' }}
            </Select.Option>
          </Select>
          <Select
            v-model:value="filterCategory"
            :placeholder="isEnglish ? 'Category' : '分类'"
            style="width: 180px"
          >
            <Select.Option value="">
              {{ isEnglish ? 'All' : '全部分类' }}
            </Select.Option>
            <Select.OptGroup label="收入分类">
              <Select.Option
                v-for="category in financeStore.incomeCategories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.icon }} {{ category.name }}
              </Select.Option>
            </Select.OptGroup>
            <Select.OptGroup label="支出分类">
              <Select.Option
                v-for="category in financeStore.expenseCategories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.icon }} {{ category.name }}
              </Select.Option>
            </Select.OptGroup>
          </Select>
        </div>
        <div class="flex space-x-2">
          <Button @click="openRecycleBin">
            🗑️ 回收站
            <span v-if="deletedTransactions.length > 0" class="ml-1"
              >({{ deletedTransactions.length }})</span
            >
          </Button>
          <Button type="primary" @click="quickAddIncome"> 💰 添加收入 </Button>
          <Button @click="quickAddExpense"> 💸 添加支出 </Button>
          <Button @click="showExportModal = true"> 📥 导出数据 </Button>
          <Button @click="showImportModal = true"> 📤 导入数据 </Button>
        </div>
      </div>
    </Card>

    <!-- 交易列表 -->
    <Card title="📋 项目名称">
      <div v-if="filteredTransactions.length === 0" class="py-12 text-center">
        <div class="mb-6 text-8xl">📊</div>
        <h3 class="mb-2 text-xl font-medium text-gray-800">暂无交易数据</h3>
        <p class="mb-6 text-gray-500">开始记录您的第一笔收入或支出吧！</p>
        <div class="space-x-4">
          <Button type="primary" size="large" @click="quickAddIncome">
            💰 添加收入
          </Button>
          <Button size="large" @click="quickAddExpense"> 💸 添加支出 </Button>
        </div>
      </div>
      <Table
        v-else
        :columns="columns"
        :data-source="filteredTransactions"
        :pagination="pagination"
        :row-key="(record) => record.id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'project'">
            <span :title="record.project || record.description">
              {{ record.project || record.description }}
            </span>
          </template>
          <template v-else-if="column.dataIndex === 'type'">
            <Tag :color="record.type === 'income' ? 'green' : 'red'">
              {{ record.type === 'income' ? '📈 收入' : '📉 支出' }}
            </Tag>
          </template>
          <template v-else-if="column.dataIndex === 'amount'">
            <span
              :class="
                record.type === 'income'
                  ? 'font-bold text-green-600'
                  : 'font-bold text-red-600'
              "
            >
              {{ record.type === 'income' ? '+' : '-' }}{{ record.currency }}
              {{ Math.abs(record.amount).toLocaleString() }}
            </span>
          </template>
          <template v-else-if="column.dataIndex === 'categoryId'">
            <Tag :color="getCategoryColor(record.categoryId)">
              {{ getCategoryName(record.categoryId) }}
            </Tag>
          </template>
          <template v-else-if="column.dataIndex === 'accountId'">
            <span>{{ getAccountName(record.accountId) }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="editTransaction(record)">
                {{ isEnglish ? 'Edit' : '编辑' }}
              </Button>
              <Button
                type="link"
                size="small"
                danger
                @click="deleteTransaction(record)"
              >
                {{ isEnglish ? 'Delete' : '删除' }}
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 快速添加收入模态框 -->
    <Modal
      v-model:open="showIncomeModal"
      title="💰 快速添加收入"
      @ok="submitIncome"
      :width="900"
    >
      <Form :model="quickIncomeForm" layout="vertical" class="mt-4">
        <Row :gutter="16">
          <!-- 分类 -->
          <Col :span="14">
            <Form.Item label="分类" required>
              <Radio.Group
                v-model:value="quickIncomeForm.category"
                size="large"
                button-style="solid"
                class="category-radio-group"
              >
                <Radio.Button
                  v-for="category in financeStore.incomeCategories"
                  :key="category.id"
                  :value="category.name"
                >
                  {{ category.icon }} {{ category.name }}
                </Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Col>

          <!-- 项目名称 -->
          <Col :span="10">
            <Form.Item label="项目名称">
              <Input.TextArea
                v-model:value="quickIncomeForm.description"
                placeholder="请输入项目名称..."
                :rows="4"
                style="height: 100%"
              />
            </Form.Item>
          </Col>
        </Row>

        <!-- 货币类型、账户和金额 -->
        <div class="mb-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <Row :gutter="16">
            <Col :span="12">
              <div class="mb-4">
                <label class="mb-2 block text-sm font-medium"
                  >货币类型 <span class="text-red-500">*</span></label
                >
                <Radio.Group
                  v-model:value="quickIncomeForm.currency"
                  size="large"
                  button-style="solid"
                  class="currency-radio-group"
                >
                  <Radio.Button
                    v-for="currency in financeStore.currencies"
                    :key="currency.code"
                    :value="currency.code"
                  >
                    {{ currency.symbol }} {{ currency.name }}
                  </Radio.Button>
                </Radio.Group>
              </div>
            </Col>
            <Col :span="12">
              <div class="mb-4 flex items-center justify-between">
                <label class="text-sm font-medium">按数量×单价计算</label>
                <Switch
                  v-model:checked="useIncomeQuantityMode"
                  @change="toggleIncomeQuantityMode"
                />
              </div>
            </Col>
          </Row>

          <!-- 数量×单价模式 -->
          <Row v-if="useIncomeQuantityMode" :gutter="16" class="mb-4">
            <Col :span="8">
              <label class="mb-2 block text-sm font-medium">数量</label>
              <InputNumber
                v-model:value="quickIncomeForm.quantity"
                :min="0.01"
                :precision="2"
                placeholder="数量"
                style="width: 100%"
                size="large"
              />
            </Col>
            <Col :span="8">
              <label class="mb-2 block text-sm font-medium">单价</label>
              <InputNumber
                v-model:value="quickIncomeForm.unitPrice"
                :min="0"
                :precision="2"
                placeholder="单价"
                style="width: 100%"
                size="large"
              >
                <template #addonBefore>{{ selectedIncomeCurrency }}</template>
              </InputNumber>
            </Col>
            <Col :span="8">
              <label class="mb-2 block text-sm font-medium"
                >总金额 <span class="text-red-500">*</span></label
              >
              <InputNumber
                v-model:value="quickIncomeForm.amount"
                :min="0"
                :precision="2"
                placeholder="自动计算"
                style="width: 100%"
                size="large"
                :disabled="true"
              >
                <template #addonBefore>{{ selectedIncomeCurrency }}</template>
              </InputNumber>
            </Col>
          </Row>

          <!-- 直接输入金额模式 -->
          <Row v-else :gutter="16" class="mb-4">
            <Col :span="24">
              <label class="mb-2 block text-sm font-medium"
                >金额 <span class="text-red-500">*</span></label
              >
              <InputNumber
                v-model:value="quickIncomeForm.amount"
                :min="0"
                :precision="2"
                placeholder="请输入金额"
                style="width: 100%"
                size="large"
              >
                <template #addonBefore>{{ selectedIncomeCurrency }}</template>
              </InputNumber>
            </Col>
          </Row>

          <!-- 重量 -->
          <Row :gutter="16" class="mb-4">
            <Col :span="16">
              <label class="mb-2 block text-sm font-medium">重量（可选）</label>
              <InputNumber
                v-model:value="quickIncomeForm.weight"
                :min="0"
                :precision="3"
                placeholder="如需记录重量请输入"
                style="width: 100%"
              />
            </Col>
            <Col :span="8">
              <label class="mb-2 block text-sm font-medium">单位</label>
              <Select
                v-model:value="quickIncomeForm.weightUnit"
                style="width: 100%"
              >
                <Select.Option value="kg">千克(kg)</Select.Option>
                <Select.Option value="g">克(g)</Select.Option>
                <Select.Option value="t">吨(t)</Select.Option>
                <Select.Option value="lb">磅(lb)</Select.Option>
              </Select>
            </Col>
          </Row>

          <div>
            <label class="mb-2 block text-sm font-medium"
              >收入账户 <span class="text-red-500">*</span></label
            >
            <Radio.Group
              v-model:value="quickIncomeForm.accountId"
              size="large"
              button-style="solid"
              class="account-radio-group"
            >
              <Radio.Button
                v-for="account in financeStore.accounts"
                :key="account.id"
                :value="account.id"
              >
                {{ account.icon }} {{ account.name }}
              </Radio.Button>
            </Radio.Group>
          </div>
        </div>

        <!-- 日期 -->
        <Row :gutter="16">
          <Col :span="10">
            <Form.Item label="日期快捷选择">
              <div class="flex flex-col space-y-2">
                <Button
                  :type="
                    selectedIncomeDateType === 'today' ? 'primary' : 'default'
                  "
                  :style="{
                    backgroundColor:
                      selectedIncomeDateType === 'today'
                        ? getDateTypeColor('today')
                        : undefined,
                    borderColor:
                      selectedIncomeDateType === 'today'
                        ? getDateTypeColor('today')
                        : undefined,
                  }"
                  @click="setIncomeDate('today')"
                  block
                >
                  今天
                </Button>
                <Button
                  :type="
                    selectedIncomeDateType === 'yesterday'
                      ? 'primary'
                      : 'default'
                  "
                  :style="{
                    backgroundColor:
                      selectedIncomeDateType === 'yesterday'
                        ? getDateTypeColor('yesterday')
                        : undefined,
                    borderColor:
                      selectedIncomeDateType === 'yesterday'
                        ? getDateTypeColor('yesterday')
                        : undefined,
                  }"
                  @click="setIncomeDate('yesterday')"
                  block
                >
                  昨天
                </Button>
                <Button
                  :type="
                    selectedIncomeDateType === 'week' ? 'primary' : 'default'
                  "
                  :style="{
                    backgroundColor:
                      selectedIncomeDateType === 'week'
                        ? getDateTypeColor('week')
                        : undefined,
                    borderColor:
                      selectedIncomeDateType === 'week'
                        ? getDateTypeColor('week')
                        : undefined,
                  }"
                  @click="setIncomeDate('week')"
                  block
                >
                  本周
                </Button>
                <Button
                  :type="
                    selectedIncomeDateType === 'month' ? 'primary' : 'default'
                  "
                  :style="{
                    backgroundColor:
                      selectedIncomeDateType === 'month'
                        ? getDateTypeColor('month')
                        : undefined,
                    borderColor:
                      selectedIncomeDateType === 'month'
                        ? getDateTypeColor('month')
                        : undefined,
                  }"
                  @click="setIncomeDate('month')"
                  block
                >
                  本月
                </Button>
              </div>
            </Form.Item>
          </Col>
          <Col :span="14">
            <Form.Item label="选择日期" required>
              <div
                class="date-picker-wrapper"
                :style="{
                  border: `2px solid ${getDateTypeColor(selectedIncomeDateType)}`,
                  borderRadius: '6px',
                  padding: '4px',
                }"
              >
                <DatePicker
                  v-model:value="quickIncomeForm.date"
                  placeholder="请选择日期"
                  style="width: 100%"
                  size="large"
                  format="YYYY-MM-DD"
                />
              </div>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>

    <!-- 快速添加支出模态框 -->
    <Modal
      v-model:open="showExpenseModal"
      :title="isEnglish ? '💸 Quick Add Expense' : '💸 快速添加支出'"
      @ok="submitExpense"
      width="900px"
    >
      <Form :model="quickExpenseForm" layout="vertical">
        <Row :gutter="16">
          <Col :span="14">
            <Form.Item :label="isEnglish ? 'Category' : '分类'" required>
              <Select
                v-model:value="quickExpenseForm.category"
                :placeholder="isEnglish ? 'Select category' : '选择分类'"
                size="large"
              >
                <Select.Option
                  v-for="category in financeStore.expenseCategories"
                  :key="category.id"
                  :value="category.name"
                >
                  {{ category.icon }} {{ category.name }}
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col :span="10">
            <Form.Item :label="isEnglish ? 'Project Name' : '项目名称'">
              <Input.TextArea
                v-model:value="quickExpenseForm.description"
                :placeholder="
                  isEnglish ? 'Enter project name...' : '请输入项目名称...'
                "
                :rows="1"
              />
            </Form.Item>
          </Col>
        </Row>

        <div
          style="
            padding: 16px;
            margin-bottom: 16px;
            background: #f5f5f5;
            border-radius: 8px;
          "
        >
          <Form.Item
            :label="isEnglish ? 'Currency' : '货币类型'"
            required
            style="margin-bottom: 12px"
          >
            <Radio.Group
              v-model:value="selectedExpenseCurrency"
              button-style="solid"
              size="large"
            >
              <Radio.Button value="CNY">🇨🇳 人民币 (CNY)</Radio.Button>
              <Radio.Button value="USD">🇺🇸 美元 (USD)</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Row :gutter="12">
            <Col :span="12">
              <Form.Item style="margin-bottom: 12px">
                <div
                  style="
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    margin-bottom: 4px;
                  "
                >
                  <span>{{
                    isEnglish
                      ? 'Quantity × Unit Price Mode'
                      : '数量 × 单价 模式'
                  }}</span>
                  <Switch
                    v-model:checked="useExpenseQuantityMode"
                    @change="toggleExpenseQuantityMode"
                    size="small"
                  />
                </div>
                <div
                  v-if="useExpenseQuantityMode"
                  style="display: flex; gap: 8px"
                >
                  <InputNumber
                    v-model:value="quickExpenseForm.quantity"
                    :placeholder="isEnglish ? 'Qty' : '数量'"
                    :precision="2"
                    :min="0.01"
                    size="large"
                    style="flex: 1"
                  />
                  <span style="line-height: 40px">×</span>
                  <InputNumber
                    v-model:value="quickExpenseForm.unitPrice"
                    :placeholder="isEnglish ? 'Unit Price' : '单价'"
                    :precision="2"
                    :min="0.01"
                    size="large"
                    style="flex: 1"
                  />
                </div>
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                :label="isEnglish ? 'Amount' : '金额'"
                required
                style="margin-bottom: 12px"
              >
                <InputNumber
                  v-model:value="quickExpenseForm.amount"
                  :precision="2"
                  :disabled="useExpenseQuantityMode"
                  style="width: 100%"
                  :placeholder="isEnglish ? 'Enter amount' : '请输入金额'"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row :gutter="12">
            <Col :span="12">
              <Form.Item
                :label="isEnglish ? 'Weight' : '重量'"
                style="margin-bottom: 12px"
              >
                <div style="display: flex; gap: 8px">
                  <InputNumber
                    v-model:value="quickExpenseForm.weight"
                    :placeholder="isEnglish ? 'Weight' : '重量'"
                    :precision="2"
                    :min="0"
                    size="large"
                    style="flex: 1"
                  />
                  <Select
                    v-model:value="quickExpenseForm.weightUnit"
                    size="large"
                    style="width: 80px"
                  >
                    <Select.Option value="kg">kg</Select.Option>
                    <Select.Option value="g">g</Select.Option>
                    <Select.Option value="lb">lb</Select.Option>
                  </Select>
                </div>
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                :label="isEnglish ? 'Account' : '支出账户'"
                required
                style="margin-bottom: 0"
              >
                <Radio.Group
                  v-model:value="quickExpenseForm.accountId"
                  button-style="solid"
                  size="large"
                  style="width: 100%"
                >
                  <Radio.Button
                    v-for="account in financeStore.accounts.filter(
                      (a) => a.currency === selectedExpenseCurrency,
                    )"
                    :key="account.id"
                    :value="account.id"
                    style="width: 50%; text-align: center"
                  >
                    {{ account.icon }} {{ account.name }}
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Row :gutter="16">
          <Col :span="10">
            <Form.Item
              :label="isEnglish ? 'Quick Date Select' : '日期快捷选择'"
              style="margin-bottom: 0"
            >
              <Space>
                <Button
                  size="small"
                  @click="setExpenseDate('today')"
                  :style="{
                    borderColor:
                      selectedExpenseDateType === 'today'
                        ? getDateTypeColor('today')
                        : undefined,
                    color:
                      selectedExpenseDateType === 'today'
                        ? getDateTypeColor('today')
                        : undefined,
                  }"
                >
                  今天
                </Button>
                <Button
                  size="small"
                  @click="setExpenseDate('yesterday')"
                  :style="{
                    borderColor:
                      selectedExpenseDateType === 'yesterday'
                        ? getDateTypeColor('yesterday')
                        : undefined,
                    color:
                      selectedExpenseDateType === 'yesterday'
                        ? getDateTypeColor('yesterday')
                        : undefined,
                  }"
                >
                  昨天
                </Button>
                <Button
                  size="small"
                  @click="setExpenseDate('week')"
                  :style="{
                    borderColor:
                      selectedExpenseDateType === 'week'
                        ? getDateTypeColor('week')
                        : undefined,
                    color:
                      selectedExpenseDateType === 'week'
                        ? getDateTypeColor('week')
                        : undefined,
                  }"
                >
                  本周
                </Button>
                <Button
                  size="small"
                  @click="setExpenseDate('month')"
                  :style="{
                    borderColor:
                      selectedExpenseDateType === 'month'
                        ? getDateTypeColor('month')
                        : undefined,
                    color:
                      selectedExpenseDateType === 'month'
                        ? getDateTypeColor('month')
                        : undefined,
                  }"
                >
                  本月
                </Button>
              </Space>
            </Form.Item>
          </Col>
          <Col :span="14">
            <Form.Item
              :label="isEnglish ? 'Select Date' : '选择日期'"
              required
              style="margin-bottom: 0"
            >
              <DatePicker
                v-model:value="quickExpenseForm.date"
                style="width: 100%"
                format="YYYY-MM-DD"
                size="large"
                @change="selectedExpenseDateType = 'custom'"
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>

    <!-- 编辑交易模态框 -->
    <Modal
      v-model:open="showEditModal"
      title="✏️ 编辑交易"
      @ok="submitEditTransaction"
      width="600px"
    >
      <Form :model="transactionForm" layout="vertical">
        <Row :gutter="16">
          <Col :span="8">
            <Form.Item label="类型" required>
              <Select v-model:value="transactionForm.type">
                <Select.Option value="income">收入</Select.Option>
                <Select.Option value="expense">支出</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item label="金额" required>
              <InputNumber
                v-model:value="transactionForm.amount"
                :precision="2"
                style="width: 100%"
                placeholder="请输入金额"
                size="large"
              />
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item label="币种" required>
              <Select
                v-model:value="transactionForm.currency"
                placeholder="选择币种"
                style="width: 100%"
              >
                <Select.Option
                  v-for="currency in financeStore.currencies"
                  :key="currency.code"
                  :value="currency.code"
                >
                  {{ currency.symbol }} {{ currency.name }}
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row :gutter="16">
          <Col :span="12">
            <Form.Item label="分类" required>
              <Select
                v-model:value="transactionForm.category"
                placeholder="选择分类"
              >
                <Select.OptGroup label="收入分类">
                  <Select.Option
                    v-for="category in financeStore.incomeCategories"
                    :key="category.id"
                    :value="String(category.id)"
                  >
                    {{ category.icon }} {{ category.name }}
                  </Select.Option>
                </Select.OptGroup>
                <Select.OptGroup label="支出分类">
                  <Select.Option
                    v-for="category in financeStore.expenseCategories"
                    :key="category.id"
                    :value="String(category.id)"
                  >
                    {{ category.icon }} {{ category.name }}
                  </Select.Option>
                </Select.OptGroup>
              </Select>
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="日期" required>
              <DatePicker
                v-model:value="transactionForm.date"
                style="width: 100%"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="描述">
          <Input
            v-model:value="transactionForm.description"
            placeholder="交易描述..."
          />
        </Form.Item>

        <Form.Item label="账户" required>
          <Select
            v-model:value="transactionForm.account"
            placeholder="选择账户"
          >
            <Select.Option
              v-for="account in financeStore.accounts"
              :key="account.id"
              :value="String(account.id)"
            >
              {{ account.icon }} {{ account.name }}
            </Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>

    <!-- 导出数据模态框 -->
    <Modal
      v-model:open="showExportModal"
      title="📥 导出交易数据"
      @ok="handleExportData"
      width="600px"
    >
      <Form layout="vertical">
        <Form.Item label="导出范围" required>
          <Radio.Group v-model:value="exportOptions.scope" size="large">
            <Radio.Button value="current">
              📄 当前页数据 ({{ paginatedTransactions.length }}
              条)
            </Radio.Button>
            <Radio.Button value="filtered">
              🔍 筛选后数据 ({{ filteredTransactions.length }}
              条)
            </Radio.Button>
            <Radio.Button value="all">
              📊 全部数据 ({{ allTransactions.length }} 条)
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item v-if="exportOptions.scope === 'current'" label="按分类导出">
          <Select
            v-model:value="exportOptions.categoryFilter"
            placeholder="选择分类(可选)"
            allow-clear
          >
            <Select.OptGroup label="收入分类">
              <Select.Option
                v-for="category in financeStore.incomeCategories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.icon }} {{ category.name }}
              </Select.Option>
            </Select.OptGroup>
            <Select.OptGroup label="支出分类">
              <Select.Option
                v-for="category in financeStore.expenseCategories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.icon }} {{ category.name }}
              </Select.Option>
            </Select.OptGroup>
          </Select>
        </Form.Item>

        <Form.Item label="导出格式" required>
          <Radio.Group v-model:value="exportOptions.format" size="large">
            <Radio.Button value="csv">📄 CSV 格式</Radio.Button>
            <Radio.Button value="excel">📊 Excel 格式</Radio.Button>
            <Radio.Button value="json">🔧 JSON 格式</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="包含字段">
          <div class="space-y-2">
            <div class="grid grid-cols-2 gap-2">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="exportOptions.fields.date"
                  class="mr-2"
                />
                日期
              </label>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="exportOptions.fields.type"
                  class="mr-2"
                />
                类型
              </label>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="exportOptions.fields.category"
                  class="mr-2"
                />
                分类
              </label>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="exportOptions.fields.description"
                  class="mr-2"
                />
                项目名称
              </label>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="exportOptions.fields.amount"
                  class="mr-2"
                />
                金额
              </label>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="exportOptions.fields.currency"
                  class="mr-2"
                />
                币种
              </label>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="exportOptions.fields.account"
                  class="mr-2"
                />
                账户
              </label>
            </div>
          </div>
        </Form.Item>
      </Form>
    </Modal>

    <!-- 导入数据模态框 -->
    <Modal
      v-model:open="showImportModal"
      title="📤 导入交易数据"
      @ok="handleImportData"
      width="800px"
    >
      <Form layout="vertical">
        <Form.Item label="上传文件" required>
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.json"
            @change="handleFileUpload"
            class="block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
          />
          <p class="mt-2 text-sm text-gray-500">
            支持 CSV、Excel (.xlsx, .xls) 和 JSON 格式
          </p>
        </Form.Item>

        <div v-if="importPreviewData.length > 0">
          <Form.Item label="字段映射" required>
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="mb-1 block text-sm font-medium">日期字段</label>
                  <Select
                    v-model:value="importMapping.date"
                    placeholder="选择对应列"
                    style="width: 100%"
                  >
                    <Select.Option
                      v-for="col in importColumns"
                      :key="col"
                      :value="col"
                    >
                      {{ col }}
                    </Select.Option>
                  </Select>
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium">类型字段</label>
                  <Select
                    v-model:value="importMapping.type"
                    placeholder="选择对应列"
                    style="width: 100%"
                  >
                    <Select.Option
                      v-for="col in importColumns"
                      :key="col"
                      :value="col"
                    >
                      {{ col }}
                    </Select.Option>
                  </Select>
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium">分类字段</label>
                  <Select
                    v-model:value="importMapping.category"
                    placeholder="选择对应列"
                    style="width: 100%"
                  >
                    <Select.Option
                      v-for="col in importColumns"
                      :key="col"
                      :value="col"
                    >
                      {{ col }}
                    </Select.Option>
                  </Select>
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium"
                    >项目名称字段</label
                  >
                  <Select
                    v-model:value="importMapping.description"
                    placeholder="选择对应列"
                    style="width: 100%"
                  >
                    <Select.Option
                      v-for="col in importColumns"
                      :key="col"
                      :value="col"
                    >
                      {{ col }}
                    </Select.Option>
                  </Select>
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium">金额字段</label>
                  <Select
                    v-model:value="importMapping.amount"
                    placeholder="选择对应列"
                    style="width: 100%"
                  >
                    <Select.Option
                      v-for="col in importColumns"
                      :key="col"
                      :value="col"
                    >
                      {{ col }}
                    </Select.Option>
                  </Select>
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium"
                    >币种字段（可选，默认USD）</label
                  >
                  <Select
                    v-model:value="importMapping.currency"
                    placeholder="选择对应列"
                    style="width: 100%"
                    allow-clear
                  >
                    <Select.Option
                      v-for="col in importColumns"
                      :key="col"
                      :value="col"
                    >
                      {{ col }}
                    </Select.Option>
                  </Select>
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium">账户字段</label>
                  <Select
                    v-model:value="importMapping.account"
                    placeholder="选择对应列"
                    style="width: 100%"
                  >
                    <Select.Option
                      v-for="col in importColumns"
                      :key="col"
                      :value="col"
                    >
                      {{ col }}
                    </Select.Option>
                  </Select>
                </div>
              </div>
            </div>
          </Form.Item>

          <Form.Item label="数据预览">
            <div class="max-h-60 overflow-auto rounded-lg border">
              <table class="w-full text-sm">
                <thead class="sticky top-0 bg-gray-50">
                  <tr>
                    <th
                      class="px-4 py-2 text-left"
                      v-for="col in importColumns"
                      :key="col"
                    >
                      {{ col }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, idx) in importPreviewData.slice(0, 5)"
                    :key="idx"
                    class="border-t"
                  >
                    <td
                      class="px-4 py-2"
                      v-for="col in importColumns"
                      :key="col"
                    >
                      {{ row[col] }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="mt-2 text-sm text-gray-500">
              预览前 5 条数据，共 {{ importPreviewData.length }} 条待导入
            </p>
          </Form.Item>
        </div>
      </Form>
    </Modal>

    <!-- 回收站模态框 -->
    <Modal
      v-model:open="showRecycleBinModal"
      title="🗑️ 回收站"
      width="800px"
      :footer="null"
    >
      <div v-if="deletedTransactions.length === 0" class="py-12 text-center">
        <div class="mb-6 text-8xl">🗑️</div>
        <h3 class="mb-2 text-xl font-medium text-gray-800">回收站为空</h3>
        <p class="text-gray-500">已删除的交易会出现在这里</p>
      </div>
      <Table
        v-else
        :columns="columns"
        :data-source="deletedTransactions"
        :pagination="{ pageSize: 5 }"
        :row-key="(record) => record.id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'type'">
            <Tag :color="record.type === 'income' ? 'green' : 'red'">
              {{ record.type === 'income' ? '📈 收入' : '📉 支出' }}
            </Tag>
          </template>
          <template v-else-if="column.dataIndex === 'amount'">
            <span
              :class="
                record.type === 'income'
                  ? 'font-bold text-green-600'
                  : 'font-bold text-red-600'
              "
            >
              {{ record.type === 'income' ? '+' : '-' }}{{ record.currency }}
              {{ Math.abs(record.amount).toLocaleString() }}
            </span>
          </template>
          <template v-else-if="column.dataIndex === 'categoryId'">
            <Tag :color="getCategoryColor(record.categoryId)">
              {{ getCategoryName(record.categoryId) }}
            </Tag>
          </template>
          <template v-else-if="column.dataIndex === 'accountId'">
            <span>{{ getAccountName(record.accountId) }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button
                type="link"
                size="small"
                @click="restoreTransaction(record)"
              >
                ♻️ 恢复
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Modal>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
}
</style>
