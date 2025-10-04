<template>
  <div class="p-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">📈 财务报表</h1>
        <p class="text-gray-600">全面的财务数据分析与报表生成</p>
      </div>
      <div class="flex space-x-2">
        <Button @click="showImportModal = true">
          📤 导入报表
        </Button>
        <Button @click="showExportModal = true" type="primary">
          📥 导出报表
        </Button>
        <Button @click="printReport">
          🖨️ 打印报表
        </Button>
      </div>
    </div>

    <!-- 时间筛选 -->
    <Card class="mb-6">
      <div class="flex items-center space-x-4">
        <span class="font-medium">报表周期：</span>
        <Radio.Group v-model:value="period" button-style="solid">
          <Radio.Button value="month">本月</Radio.Button>
          <Radio.Button value="quarter">本季度</Radio.Button>
          <Radio.Button value="year">本年</Radio.Button>
          <Radio.Button value="all">全部</Radio.Button>
        </Radio.Group>
        <RangePicker v-if="period === 'custom'" v-model:value="customRange" />
      </div>
    </Card>

    <!-- 核心指标汇总 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card class="text-center hover:shadow-lg transition-shadow">
        <div class="text-3xl mb-2">💰</div>
        <p class="text-sm text-gray-500">总收入</p>
        <p class="text-2xl font-bold text-green-600">
          ¥{{ periodIncome.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}
        </p>
      </Card>
      <Card class="text-center hover:shadow-lg transition-shadow">
        <div class="text-3xl mb-2">💸</div>
        <p class="text-sm text-gray-500">总支出</p>
        <p class="text-2xl font-bold text-red-600">
          ¥{{ periodExpense.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}
        </p>
      </Card>
      <Card class="text-center hover:shadow-lg transition-shadow">
        <div class="text-3xl mb-2">💎</div>
        <p class="text-sm text-gray-500">净收入</p>
        <p class="text-2xl font-bold" :class="periodNet >= 0 ? 'text-purple-600' : 'text-red-600'">
          {{ periodNet >= 0 ? '+' : '' }}¥{{ periodNet.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}
        </p>
      </Card>
      <Card class="text-center hover:shadow-lg transition-shadow">
        <div class="text-3xl mb-2">📊</div>
        <p class="text-sm text-gray-500">交易笔数</p>
        <p class="text-2xl font-bold text-blue-600">{{ periodTransactions.length }}</p>
      </Card>
    </div>

    <!-- 详细报表 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 收入分析 -->
      <Card title="📈 收入分析">
        <div class="space-y-3">
          <div v-if="incomeByCategory.length === 0" class="text-center py-8">
            <p class="text-gray-500">暂无收入数据</p>
          </div>
          <div v-else v-for="item in incomeByCategory" :key="item.categoryId" class="p-3 bg-gray-50 rounded-lg">
            <div class="flex justify-between items-center mb-2">
              <span class="font-medium">{{ item.categoryName }}</span>
              <span class="text-sm font-bold text-green-600">
                ¥{{ item.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}
              </span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  class="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
                  :style="{ width: item.percentage + '%' }"
                ></div>
              </div>
              <span class="text-xs text-gray-500 w-12 text-right">{{ item.percentage }}%</span>
            </div>
            <p class="text-xs text-gray-500 mt-1">{{ item.count }} 笔 · 平均 ¥{{ (item.amount / item.count).toFixed(2) }}</p>
          </div>
        </div>
      </Card>

      <!-- 支出分析 -->
      <Card title="📉 支出分析">
        <div class="space-y-3">
          <div v-if="expenseByCategory.length === 0" class="text-center py-8">
            <p class="text-gray-500">暂无支出数据</p>
          </div>
          <div v-else v-for="item in expenseByCategory" :key="item.categoryId" class="p-3 bg-gray-50 rounded-lg">
            <div class="flex justify-between items-center mb-2">
              <span class="font-medium">{{ item.categoryName }}</span>
              <span class="text-sm font-bold text-red-600">
                ¥{{ item.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}
              </span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  class="bg-gradient-to-r from-red-400 to-red-600 h-2 rounded-full transition-all duration-500"
                  :style="{ width: item.percentage + '%' }"
                ></div>
              </div>
              <span class="text-xs text-gray-500 w-12 text-right">{{ item.percentage }}%</span>
            </div>
            <p class="text-xs text-gray-500 mt-1">{{ item.count }} 笔 · 平均 ¥{{ (item.amount / item.count).toFixed(2) }}</p>
          </div>
        </div>
      </Card>
    </div>

    <!-- 交易明细表 -->
    <Card title="📋 交易明细">
      <Table
        :columns="columns"
        :dataSource="periodTransactions"
        :pagination="{ pageSize: 20 }"
        :rowKey="record => record.id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'type'">
            <Tag :color="record.type === 'income' ? 'green' : 'red'">
              {{ record.type === 'income' ? '📈 收入' : '📉 支出' }}
            </Tag>
          </template>
          <template v-else-if="column.dataIndex === 'amount'">
            <span :class="record.type === 'income' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'">
              {{ record.type === 'income' ? '+' : '-' }}¥{{ Math.abs(record.amount).toLocaleString() }}
            </span>
          </template>
          <template v-else-if="column.dataIndex === 'categoryId'">
            <Tag>{{ getCategoryName(record.categoryId) }}</Tag>
          </template>
          <template v-else-if="column.dataIndex === 'accountId'">
            {{ getAccountName(record.accountId) }}
          </template>
        </template>
      </Table>
    </Card>

    <!-- 导出报表模态框 -->
    <Modal v-model:open="showExportModal" title="📥 导出财务报表" @ok="handleExportReport" width="600px">
      <Form layout="vertical">
        <Form.Item label="导出格式" required>
          <Radio.Group v-model:value="exportOptions.format" size="large">
            <Radio.Button value="pdf">📄 PDF 格式</Radio.Button>
            <Radio.Button value="excel">📊 Excel 格式</Radio.Button>
            <Radio.Button value="csv">📋 CSV 格式</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="包含内容">
          <div class="space-y-2">
            <label class="flex items-center">
              <input type="checkbox" v-model="exportOptions.includeSummary" class="mr-2" /> 核心指标汇总
            </label>
            <label class="flex items-center">
              <input type="checkbox" v-model="exportOptions.includeIncome" class="mr-2" /> 收入分析
            </label>
            <label class="flex items-center">
              <input type="checkbox" v-model="exportOptions.includeExpense" class="mr-2" /> 支出分析
            </label>
            <label class="flex items-center">
              <input type="checkbox" v-model="exportOptions.includeTransactions" class="mr-2" /> 交易明细
            </label>
          </div>
        </Form.Item>

        <Form.Item label="报表标题">
          <Input v-model:value="exportOptions.title" placeholder="财务报表" />
        </Form.Item>
      </Form>
    </Modal>

    <!-- 导入报表模态框 -->
    <Modal v-model:open="showImportModal" title="📤 导入财务报表数据" @ok="handleImportReport" width="700px">
      <Form layout="vertical">
        <Form.Item label="上传文件" required>
          <input
            type="file"
            accept=".xlsx,.xls,.csv,.json"
            @change="handleReportFileUpload"
            class="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          <p class="text-sm text-gray-500 mt-2">支持 Excel (.xlsx, .xls)、CSV 和 JSON 格式</p>
        </Form.Item>

        <div v-if="importPreviewData.length > 0">
          <Form.Item label="数据预览">
            <div class="border rounded-lg overflow-auto max-h-60">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 sticky top-0">
                  <tr>
                    <th class="px-4 py-2 text-left">日期</th>
                    <th class="px-4 py-2 text-left">类型</th>
                    <th class="px-4 py-2 text-left">分类</th>
                    <th class="px-4 py-2 text-left">金额</th>
                    <th class="px-4 py-2 text-left">描述</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, idx) in importPreviewData.slice(0, 5)" :key="idx" class="border-t">
                    <td class="px-4 py-2">{{ row.date || row['日期'] }}</td>
                    <td class="px-4 py-2">{{ row.type || row['类型'] }}</td>
                    <td class="px-4 py-2">{{ row.category || row['分类'] }}</td>
                    <td class="px-4 py-2">{{ row.amount || row['金额'] }}</td>
                    <td class="px-4 py-2">{{ row.description || row['描述'] || row['项目名称'] }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="text-sm text-gray-500 mt-2">
              预览前 5 条数据，共 {{ importPreviewData.length }} 条待导入
            </p>
          </Form.Item>
        </div>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Card, Button, Radio, DatePicker, Table, Tag, notification, Modal, Form, Input } from 'ant-design-vue';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

import { useFinanceStore } from '#/store/finance';

defineOptions({ name: 'ReportsAnalytics' });

const financeStore = useFinanceStore();
const { RangePicker } = DatePicker;

const period = ref('month');
const customRange = ref();

// 导出和导入状态
const showExportModal = ref(false);
const showImportModal = ref(false);
const importPreviewData = ref<any[]>([]);

const exportOptions = ref({
  format: 'excel' as 'pdf' | 'excel' | 'csv',
  includeSummary: true,
  includeIncome: true,
  includeExpense: true,
  includeTransactions: true,
  title: '财务报表'
});

// 获取周期内的交易
const periodTransactions = computed(() => {
  const now = dayjs();
  let startDate: dayjs.Dayjs;

  switch (period.value) {
    case 'month':
      startDate = now.startOf('month');
      break;
    case 'quarter':
      startDate = now.startOf('quarter');
      break;
    case 'year':
      startDate = now.startOf('year');
      break;
    case 'all':
      return financeStore.transactions.filter(t => !t.isDeleted);
    default:
      return financeStore.transactions.filter(t => !t.isDeleted);
  }

  return financeStore.transactions.filter(t =>
    !t.isDeleted && dayjs(t.transactionDate).isAfter(startDate)
  );
});

// 周期收入
const periodIncome = computed(() => {
  return periodTransactions.value
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amountInBase, 0);
});

// 周期支出
const periodExpense = computed(() => {
  return periodTransactions.value
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amountInBase, 0);
});

// 周期净收入
const periodNet = computed(() => periodIncome.value - periodExpense.value);

// 按分类统计收入
const incomeByCategory = computed(() => {
  const incomeTransactions = periodTransactions.value.filter(t => t.type === 'income');
  if (incomeTransactions.length === 0) return [];

  const categoryMap = new Map();
  incomeTransactions.forEach(t => {
    const categoryId = t.categoryId || 0;
    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, {
        categoryId,
        categoryName: financeStore.getCategoryById(categoryId)?.name || '未分类',
        amount: 0,
        count: 0
      });
    }
    const category = categoryMap.get(categoryId);
    category.amount += t.amountInBase;
    category.count += 1;
  });

  return Array.from(categoryMap.values())
    .map(item => ({
      ...item,
      percentage: Math.round((item.amount / periodIncome.value) * 100)
    }))
    .sort((a, b) => b.amount - a.amount);
});

// 按分类统计支出
const expenseByCategory = computed(() => {
  const expenseTransactions = periodTransactions.value.filter(t => t.type === 'expense');
  if (expenseTransactions.length === 0) return [];

  const categoryMap = new Map();
  expenseTransactions.forEach(t => {
    const categoryId = t.categoryId || 0;
    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, {
        categoryId,
        categoryName: financeStore.getCategoryById(categoryId)?.name || '未分类',
        amount: 0,
        count: 0
      });
    }
    const category = categoryMap.get(categoryId);
    category.amount += t.amountInBase;
    category.count += 1;
  });

  return Array.from(categoryMap.values())
    .map(item => ({
      ...item,
      percentage: Math.round((item.amount / periodExpense.value) * 100)
    }))
    .sort((a, b) => b.amount - a.amount);
});

// 表格列
const columns = [
  { title: '日期', dataIndex: 'transactionDate', key: 'transactionDate', width: 120 },
  { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '分类', dataIndex: 'categoryId', key: 'categoryId', width: 120 },
  { title: '金额', dataIndex: 'amount', key: 'amount', width: 150 },
  { title: '账户', dataIndex: 'accountId', key: 'accountId', width: 120 }
];

const getCategoryName = (categoryId: number | null) => {
  if (!categoryId) return '未分类';
  const category = financeStore.getCategoryById(categoryId);
  return category ? `${category.icon} ${category.name}` : '未知分类';
};

const getAccountName = (accountId: number) => {
  const account = financeStore.getAccountById(accountId);
  return account ? `${account.icon} ${account.name}` : '未知账户';
};

// 导出报表
const handleExportReport = () => {
  try {
    const timestamp = new Date().toISOString().split('T')[0];
    const title = exportOptions.value.title || '财务报表';

    if (exportOptions.value.format === 'excel') {
      exportToExcel(title, timestamp);
    } else if (exportOptions.value.format === 'csv') {
      exportToCSV(title, timestamp);
    } else if (exportOptions.value.format === 'pdf') {
      notification.info({
        message: 'PDF 格式',
        description: 'PDF 导出功能开发中，暂时使用 Excel 代替'
      });
      exportToExcel(title, timestamp);
    }

    notification.success({
      message: '导出成功',
      description: `报表已成功导出`
    });

    showExportModal.value = false;
  } catch (error) {
    console.error('导出失败:', error);
    notification.error({
      message: '导出失败',
      description: '报表导出过程中出现错误'
    });
  }
};

// 导出为 Excel
const exportToExcel = (title: string, timestamp: string) => {
  const workbook = XLSX.utils.book_new();

  // 核心指标汇总
  if (exportOptions.value.includeSummary) {
    const summaryData = [
      ['核心指标汇总', '', '', ''],
      ['指标', '金额', '', ''],
      ['总收入', `¥${periodIncome.value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`, '', ''],
      ['总支出', `¥${periodExpense.value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`, '', ''],
      ['净收入', `¥${periodNet.value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`, '', ''],
      ['交易笔数', periodTransactions.value.length, '', '']
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, '核心指标');
  }

  // 收入分析
  if (exportOptions.value.includeIncome && incomeByCategory.value.length > 0) {
    const incomeData = incomeByCategory.value.map(item => ({
      '分类': item.categoryName,
      '金额': item.amount,
      '笔数': item.count,
      '平均': (item.amount / item.count).toFixed(2),
      '占比': `${item.percentage}%`
    }));
    const incomeSheet = XLSX.utils.json_to_sheet(incomeData);
    XLSX.utils.book_append_sheet(workbook, incomeSheet, '收入分析');
  }

  // 支出分析
  if (exportOptions.value.includeExpense && expenseByCategory.value.length > 0) {
    const expenseData = expenseByCategory.value.map(item => ({
      '分类': item.categoryName,
      '金额': item.amount,
      '笔数': item.count,
      '平均': (item.amount / item.count).toFixed(2),
      '占比': `${item.percentage}%`
    }));
    const expenseSheet = XLSX.utils.json_to_sheet(expenseData);
    XLSX.utils.book_append_sheet(workbook, expenseSheet, '支出分析');
  }

  // 交易明细
  if (exportOptions.value.includeTransactions && periodTransactions.value.length > 0) {
    const transactionsData = periodTransactions.value.map(t => ({
      '日期': t.transactionDate,
      '类型': t.type === 'income' ? '收入' : '支出',
      '描述': t.description || '',
      '分类': getCategoryName(t.categoryId),
      '金额': t.amount,
      '币种': t.currency,
      '账户': getAccountName(t.accountId)
    }));
    const transactionsSheet = XLSX.utils.json_to_sheet(transactionsData);
    XLSX.utils.book_append_sheet(workbook, transactionsSheet, '交易明细');
  }

  // 生成文件
  XLSX.writeFile(workbook, `${title}-${timestamp}.xlsx`);
};

// 导出为 CSV
const exportToCSV = (title: string, timestamp: string) => {
  let csvContent = '';

  // 核心指标汇总
  if (exportOptions.value.includeSummary) {
    csvContent += '核心指标汇总\n';
    csvContent += '指标,金额\n';
    csvContent += `总收入,¥${periodIncome.value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}\n`;
    csvContent += `总支出,¥${periodExpense.value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}\n`;
    csvContent += `净收入,¥${periodNet.value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}\n`;
    csvContent += `交易笔数,${periodTransactions.value.length}\n\n`;
  }

  // 交易明细
  if (exportOptions.value.includeTransactions && periodTransactions.value.length > 0) {
    csvContent += '交易明细\n';
    csvContent += '日期,类型,描述,分类,金额,币种,账户\n';
    periodTransactions.value.forEach(t => {
      csvContent += `${t.transactionDate},${t.type === 'income' ? '收入' : '支出'},"${t.description || ''}",${getCategoryName(t.categoryId)},${t.amount},${t.currency},${getAccountName(t.accountId)}\n`;
    });
  }

  // 下载文件
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}-${timestamp}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// 打印报表
const printReport = () => {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      notification.error({
        message: '打印失败',
        description: '无法打开打印窗口，请检查浏览器设置'
      });
      return;
    }

    const periodText = {
      month: '本月',
      quarter: '本季度',
      year: '本年',
      all: '全部'
    }[period.value] || '自定义';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>财务报表 - ${periodText}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; color: #333; }
          h2 { color: #666; margin-top: 30px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
          .summary-card { border: 1px solid #eee; padding: 15px; border-radius: 8px; text-align: center; }
          .summary-card .label { color: #888; font-size: 14px; }
          .summary-card .value { font-size: 24px; font-weight: bold; margin-top: 5px; }
          .income { color: #52c41a; }
          .expense { color: #f5222d; }
          .net { color: #722ed1; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          tr:nth-child(even) { background-color: #fafafa; }
          .category-item { margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 5px; }
          .category-name { font-weight: bold; }
          .category-amount { float: right; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>📈 财务报表</h1>
        <p style="text-align: center; color: #888;">报表周期: ${periodText} · 生成时间: ${new Date().toLocaleString('zh-CN')}</p>

        <h2>核心指标汇总</h2>
        <div class="summary">
          <div class="summary-card">
            <div class="label">总收入</div>
            <div class="value income">¥${periodIncome.value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="summary-card">
            <div class="label">总支出</div>
            <div class="value expense">¥${periodExpense.value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="summary-card">
            <div class="label">净收入</div>
            <div class="value net">${periodNet.value >= 0 ? '+' : ''}¥${periodNet.value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="summary-card">
            <div class="label">交易笔数</div>
            <div class="value">${periodTransactions.value.length}</div>
          </div>
        </div>

        ${incomeByCategory.value.length > 0 ? `
        <h2>收入分析</h2>
        <div>
          ${incomeByCategory.value.map(item => `
            <div class="category-item">
              <span class="category-name">${item.categoryName}</span>
              <span class="category-amount income">¥${item.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
              <div style="clear: both; margin-top: 5px; color: #888; font-size: 12px;">
                ${item.count} 笔 · 平均 ¥${(item.amount / item.count).toFixed(2)} · ${item.percentage}%
              </div>
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${expenseByCategory.value.length > 0 ? `
        <h2>支出分析</h2>
        <div>
          ${expenseByCategory.value.map(item => `
            <div class="category-item">
              <span class="category-name">${item.categoryName}</span>
              <span class="category-amount expense">¥${item.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
              <div style="clear: both; margin-top: 5px; color: #888; font-size: 12px;">
                ${item.count} 笔 · 平均 ¥${(item.amount / item.count).toFixed(2)} · ${item.percentage}%
              </div>
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${periodTransactions.value.length > 0 ? `
        <h2>交易明细</h2>
        <table>
          <thead>
            <tr>
              <th>日期</th>
              <th>类型</th>
              <th>描述</th>
              <th>分类</th>
              <th>金额</th>
              <th>账户</th>
            </tr>
          </thead>
          <tbody>
            ${periodTransactions.value.map(t => `
              <tr>
                <td>${t.transactionDate}</td>
                <td>${t.type === 'income' ? '📈 收入' : '📉 支出'}</td>
                <td>${t.description || ''}</td>
                <td>${getCategoryName(t.categoryId)}</td>
                <td class="${t.type === 'income' ? 'income' : 'expense'}">
                  ${t.type === 'income' ? '+' : '-'}¥${Math.abs(t.amount).toLocaleString()}
                </td>
                <td>${getAccountName(t.accountId)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        <div class="no-print" style="text-align: center; margin-top: 40px;">
          <button onclick="window.print()" style="padding: 10px 30px; font-size: 16px; cursor: pointer;">🖨️ 打印</button>
          <button onclick="window.close()" style="padding: 10px 30px; font-size: 16px; margin-left: 10px; cursor: pointer;">关闭</button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  } catch (error) {
    console.error('打印失败:', error);
    notification.error({
      message: '打印失败',
      description: '生成打印预览时出现错误'
    });
  }
};

// 处理报表文件上传
const handleReportFileUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  try {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'json') {
      const text = await file.text();
      const data = JSON.parse(text);
      importPreviewData.value = Array.isArray(data) ? data : [data];
    } else if (fileExtension === 'csv') {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) throw new Error('CSV 文件格式不正确');

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });
      importPreviewData.value = data;
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      importPreviewData.value = data;
    }
  } catch (error) {
    console.error('文件解析失败:', error);
    notification.error({
      message: '文件解析失败',
      description: '请检查文件格式是否正确'
    });
  }
};

// 处理导入报表
const handleImportReport = async () => {
  try {
    if (importPreviewData.value.length === 0) {
      notification.warning({
        message: '无数据',
        description: '请先上传文件'
      });
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const row of importPreviewData.value) {
      try {
        const type = row.type || row['类型'];
        const typeValue = type === '收入' || type === 'income' ? 'income' : 'expense';

        // 查找分类
        const categoryName = (row.category || row['分类'] || '').replace(/[^\u4e00-\u9fa5a-zA-Z]/g, '');
        const categories = typeValue === 'income'
          ? financeStore.incomeCategories
          : financeStore.expenseCategories;
        const category = categories.find(c => c.name === categoryName);

        // 查找账户 - 使用默认账户
        const defaultAccount = financeStore.accounts.find(a => a.currency === (row.currency || row['币种'] || 'CNY'));

        if (!defaultAccount) {
          failCount++;
          continue;
        }

        await financeStore.createTransaction({
          type: typeValue,
          amount: Number(row.amount || row['金额']),
          currency: row.currency || row['币种'] || 'CNY',
          categoryId: category?.id,
          accountId: defaultAccount.id,
          transactionDate: row.date || row['日期'],
          description: row.description || row['描述'] || row['项目名称'] || ''
        });

        successCount++;
      } catch (error) {
        console.error('导入单条数据失败:', error);
        failCount++;
      }
    }

    notification.success({
      message: '导入完成',
      description: `成功导入 ${successCount} 条，失败 ${failCount} 条`
    });

    showImportModal.value = false;
    importPreviewData.value = [];
  } catch (error) {
    console.error('导入失败:', error);
    notification.error({
      message: '导入失败',
      description: '数据导入过程中出现错误'
    });
  }
};

onMounted(async () => {
  await Promise.all([
    financeStore.initializeData(),
    financeStore.fetchTransactions(),
  ]);
});
</script>

<style scoped>
.grid { display: grid; }
</style>
