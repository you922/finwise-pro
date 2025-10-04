<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {{ isEnglish ? 'Financial Dashboard' : '📊 财务仪表板' }}
      </h1>
      <p class="text-gray-600">
        {{ isEnglish ? 'Comprehensive financial data overview and real-time monitoring' : '智能财务数据概览与实时监控' }}
      </p>
    </div>

    <!-- 核心指标卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card v-for="metric in keyMetrics" :key="metric.title" class="hover:shadow-lg transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">{{ metric.title }}</p>
            <p class="text-2xl font-bold" :class="metric.color">{{ metric.value }}</p>
            <p class="text-xs" :class="metric.trend > 0 ? 'text-green-500' : 'text-red-500'">
              {{ metric.trend > 0 ? '↗️' : '↘️' }} {{ Math.abs(metric.trend) }}%
            </p>
          </div>
          <div :class="metric.iconBg" class="w-12 h-12 rounded-lg flex items-center justify-center">
            <span class="text-2xl text-white">{{ metric.iconEmoji }}</span>
          </div>
        </div>
      </Card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 收支趋势图 -->
      <Card class="lg:col-span-2" title="📈 收支趋势分析">
        <div class="space-y-6">
          <div class="flex flex-wrap items-center gap-2">
            <Button
              v-for="option in trendRangeOptions"
              :key="option.value"
              :type="trendRange === option.value ? 'primary' : 'default'"
              size="small"
              @click="setTrendRange(option.value)"
            >
              {{ isEnglish ? option.labelEn : option.labelZh }}
            </Button>
          </div>

          <div v-if="trendChartData.hasData" class="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
            <EchartsUI ref="trendChartRef" height="320px" />
          </div>
          <div v-else class="flex h-80 flex-col items-center justify-center rounded-lg bg-gray-50 text-gray-500 dark:bg-gray-800">
            <div class="text-4xl mb-2">📭</div>
            <p class="font-medium">{{ isEnglish ? 'No transactions in the selected range' : '选定时间范围内暂无交易数据' }}</p>
            <p class="text-sm text-gray-400">{{ isEnglish ? 'Record transactions or adjust the range to view trends' : '新增交易或更换时间范围后可查看趋势' }}</p>
          </div>

          <div class="space-y-6">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700">
                  📈 {{ isEnglish ? `Income (${selectedRangeLabel})` : `${selectedRangeLabel}收入` }}
                </span>
                <span class="text-sm font-bold text-green-600">{{ formatCurrency(rangeIncome) }}</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
                <div
                  class="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                  :style="{ width: rangeIncomePercentage + '%' }"
                ></div>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700">
                  📉 {{ isEnglish ? `Expense (${selectedRangeLabel})` : `${selectedRangeLabel}支出` }}
                </span>
                <span class="text-sm font-bold text-red-600">{{ formatCurrency(rangeExpense) }}</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
                <div
                  class="bg-gradient-to-r from-red-400 to-red-600 h-3 rounded-full transition-all duration-500"
                  :style="{ width: rangeExpensePercentage + '%' }"
                ></div>
              </div>
            </div>

            <div class="flex items-center justify-between border-t pt-4">
              <span class="text-sm font-medium text-gray-700">
                💎 {{ isEnglish ? `Net Income (${selectedRangeLabel})` : `${selectedRangeLabel}净收入` }}
              </span>
              <span class="text-lg font-bold" :class="rangeNetIncome >= 0 ? 'text-purple-600' : 'text-red-600'">
                {{ formatCurrency(rangeNetIncome) }}
              </span>
            </div>

            <div class="grid grid-cols-3 gap-4 border-t pt-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600">{{ rangeTransactionCount }}</div>
                <div class="text-xs text-gray-500">{{ isEnglish ? 'Total Records' : '总笔数' }}</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">{{ rangeIncomeCount }}</div>
                <div class="text-xs text-gray-500">{{ isEnglish ? 'Income Records' : '收入笔数' }}</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-red-600">{{ rangeExpenseCount }}</div>
                <div class="text-xs text-gray-500">{{ isEnglish ? 'Expense Records' : '支出笔数' }}</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- 支出分类分析 -->
      <Card title="🥧 支出分类分布">
        <div class="space-y-4">
          <div v-if="categoryChartData.hasData" class="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
            <EchartsUI ref="categoryChartRef" height="260px" />
          </div>
          <div v-else class="flex h-64 flex-col items-center justify-center rounded-lg bg-gray-50 text-gray-500 dark:bg-gray-800">
            <div class="text-4xl mb-2">🥱</div>
            <p class="font-medium">{{ isEnglish ? 'No expense records for the selected range' : '选定范围内暂无支出记录' }}</p>
            <p class="text-sm text-gray-400">{{ isEnglish ? 'Record expenses to view category breakdown' : '新增支出后即可查看分类占比' }}</p>
          </div>

          <div v-if="categoryChartData.hasData" class="space-y-3 overflow-y-auto max-h-72 pr-1">
            <div
              v-for="item in expenseByCategory"
              :key="item.categoryId"
              class="rounded-lg border border-gray-200 bg-white p-3 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium">{{ item.categoryName }}</span>
                <span class="text-sm font-bold text-red-600">{{ formatCurrency(item.amount) }}</span>
              </div>
              <div class="flex items-center space-x-2">
                <div class="flex-1 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    class="h-2 rounded-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-500"
                    :style="{ width: item.percentage + '%' }"
                  ></div>
                </div>
                <span class="w-12 text-right text-xs text-gray-500">{{ item.percentage }}%</span>
              </div>
              <div class="text-xs text-gray-500 mt-1">
                {{ item.count }} {{ isEnglish ? 'records' : '笔交易' }}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>

    <!-- 最近交易和账户余额 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <!-- 最近交易 -->
      <Card title="🕒 最近交易记录">
        <template #extra>
          <Button type="link" @click="$router.push('/finance/transactions')">查看全部</Button>
        </template>
        <div v-if="recentTransactions.length === 0" class="text-center py-8">
          <div class="text-6xl mb-4">📝</div>
          <p class="text-gray-500 mb-4">暂无交易记录</p>
          <Button type="primary" @click="$router.push('/finance/transactions')">
            ➕ 添加第一笔交易
          </Button>
        </div>
        <div v-else class="space-y-3">
          <div v-for="transaction in recentTransactions" :key="transaction.id" 
               class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center space-x-3">
              <span class="text-lg">{{ transaction.emoji }}</span>
              <div>
                <p class="font-medium">{{ transaction.description }}</p>
                <p class="text-sm text-gray-500">{{ transaction.date }} · {{ transaction.category }}</p>
              </div>
            </div>
            <span class="font-semibold" :class="transaction.amount > 0 ? 'text-green-600' : 'text-red-600'">
              {{ transaction.amount > 0 ? '+' : '' }}{{ formatCurrency(transaction.amount) }}
            </span>
          </div>
        </div>
      </Card>

      <!-- 账户余额 -->
      <Card title="🏦 账户余额">
        <template #extra>
          <Button type="link" @click="$router.push('/finance/accounts')">管理账户</Button>
        </template>
        <div v-if="accounts.length === 0" class="text-center py-8">
          <div class="text-6xl mb-4">🏦</div>
          <p class="text-gray-500 mb-4">暂无账户信息</p>
          <Button type="primary" @click="$router.push('/finance/accounts')">
            ➕ 添加第一个账户
          </Button>
        </div>
        <div v-else class="space-y-3">
          <div v-for="account in accounts" :key="account.id"
               class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center space-x-3">
              <span class="text-lg">{{ account.icon }}</span>
              <span class="font-medium">{{ account.name }}</span>
            </div>
            <div class="text-right">
              <p class="font-semibold" :class="account.balance >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ formatCurrency(account.balance) }}
              </p>
              <p class="text-xs text-gray-500">{{ account.currency }}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>

    <!-- 快速操作 -->
    <Card class="mt-6" :title="isEnglish ? '⚡ Quick Actions' : '⚡ 快速操作'">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button type="primary" block size="large" @click="quickAddIncome">
          <span class="text-lg mr-2">💰</span>
          {{ isEnglish ? 'Add Income' : '添加收入' }}
        </Button>
        <Button block size="large" @click="quickAddExpense">
          <span class="text-lg mr-2">💸</span>
          {{ isEnglish ? 'Add Expense' : '添加支出' }}
        </Button>
        <Button block size="large" @click="$router.push('/finance/budgets')">
          <span class="text-lg mr-2">🎯</span>
          {{ isEnglish ? 'View Budgets' : '查看预算' }}
        </Button>
        <Button block size="large" @click="$router.push('/finance/reports')">
          <span class="text-lg mr-2">📊</span>
          {{ isEnglish ? 'Reports' : '生成报表' }}
        </Button>
      </div>
    </Card>

    <!-- 快速添加收入模态框 -->
    <Modal v-model:open="showIncomeModal" :title="isEnglish ? '💰 Quick Add Income' : '💰 快速添加收入'" @ok="submitIncome" width="600px">
      <Form :model="quickIncomeForm" layout="vertical">
        <Form.Item :label="isEnglish ? 'Category' : '分类'" required>
          <Select v-model:value="quickIncomeForm.category" :placeholder="isEnglish ? 'Select category' : '选择分类'" size="large">
            <Select.Option
              v-for="category in financeStore.incomeCategories"
              :key="category.id"
              :value="category.name"
            >
              {{ category.icon }} {{ category.name }}
            </Select.Option>
          </Select>
        </Form.Item>
        <Form.Item :label="isEnglish ? 'Project Name' : '项目名称'">
          <Input.TextArea v-model:value="quickIncomeForm.description" :placeholder="isEnglish ? 'Enter project name...' : '请输入项目名称...'" :rows="2" />
        </Form.Item>
        <Form.Item :label="isEnglish ? 'Currency' : '货币类型'" required>
          <Select v-model:value="selectedIncomeCurrency" disabled size="large">
            <Select.Option :value="selectedIncomeCurrency">
              {{ selectedIncomeCurrency }}
            </Select.Option>
          </Select>
        </Form.Item>
        <Form.Item :label="isEnglish ? 'Amount' : '金额'" required>
          <InputNumber v-model:value="quickIncomeForm.amount" :precision="2" style="width: 100%" :placeholder="isEnglish ? 'Enter amount' : '请输入金额'" size="large" />
        </Form.Item>
        <Form.Item :label="isEnglish ? 'Account' : '收入账户'" required>
          <Select v-model:value="quickIncomeForm.accountId" :placeholder="isEnglish ? 'Select account' : '选择账户'" size="large">
            <Select.Option
              v-for="account in financeStore.accounts"
              :key="account.id"
              :value="account.id"
            >
              {{ account.icon }} {{ account.name }}
            </Select.Option>
          </Select>
        </Form.Item>
        <Form.Item :label="isEnglish ? 'Date' : '日期'" required>
          <div class="space-y-2">
            <div class="flex space-x-2 mb-2">
              <Button size="small" @click="setIncomeDate('today')">今天</Button>
              <Button size="small" @click="setIncomeDate('yesterday')">昨天</Button>
              <Button size="small" @click="setIncomeDate('week')">本周</Button>
              <Button size="small" @click="setIncomeDate('month')">本月</Button>
            </div>
            <DatePicker v-model:value="quickIncomeForm.date" style="width: 100%" format="YYYY-MM-DD" />
          </div>
        </Form.Item>
      </Form>
    </Modal>

    <!-- 快速添加支出模态框 -->
    <Modal v-model:open="showExpenseModal" :title="isEnglish ? '💸 Quick Add Expense' : '💸 快速添加支出'" @ok="submitExpense" width="600px">
      <Form :model="quickExpenseForm" layout="vertical">
        <Form.Item :label="isEnglish ? 'Category' : '分类'" required>
          <Select v-model:value="quickExpenseForm.category" :placeholder="isEnglish ? 'Select category' : '选择分类'" size="large">
            <Select.Option
              v-for="category in financeStore.expenseCategories"
              :key="category.id"
              :value="category.name"
            >
              {{ category.icon }} {{ category.name }}
            </Select.Option>
          </Select>
        </Form.Item>
        <Form.Item :label="isEnglish ? 'Project Name' : '项目名称'">
          <Input.TextArea v-model:value="quickExpenseForm.description" :placeholder="isEnglish ? 'Enter project name...' : '请输入项目名称...'" :rows="2" />
        </Form.Item>
        <Form.Item :label="isEnglish ? 'Currency' : '货币类型'" required>
          <Select v-model:value="selectedExpenseCurrency" disabled size="large">
            <Select.Option :value="selectedExpenseCurrency">
              {{ selectedExpenseCurrency }}
            </Select.Option>
          </Select>
        </Form.Item>
        <Form.Item :label="isEnglish ? 'Amount' : '金额'" required>
          <InputNumber v-model:value="quickExpenseForm.amount" :precision="2" style="width: 100%" :placeholder="isEnglish ? 'Enter amount' : '请输入金额'" size="large" />
        </Form.Item>
        <Form.Item :label="isEnglish ? 'Account' : '支出账户'" required>
          <Select v-model:value="quickExpenseForm.accountId" :placeholder="isEnglish ? 'Select account' : '选择账户'" size="large">
            <Select.Option
              v-for="account in financeStore.accounts"
              :key="account.id"
              :value="account.id"
            >
              {{ account.icon }} {{ account.name }}
            </Select.Option>
          </Select>
        </Form.Item>
        <Form.Item :label="isEnglish ? 'Date' : '日期'" required>
          <div class="space-y-2">
            <div class="flex space-x-2 mb-2">
              <Button size="small" @click="setExpenseDate('today')">今天</Button>
              <Button size="small" @click="setExpenseDate('yesterday')">昨天</Button>
              <Button size="small" @click="setExpenseDate('week')">本周</Button>
              <Button size="small" @click="setExpenseDate('month')">本月</Button>
            </div>
            <DatePicker v-model:value="quickExpenseForm.date" style="width: 100%" format="YYYY-MM-DD" />
          </div>
        </Form.Item>
      </Form>
    </Modal>

    <!-- 快速添加账户模态框 -->
    <Modal v-model:open="showAccountModal" :title="isEnglish ? '🏦 Add Account' : '🏦 添加账户'" @ok="submitAccount">
      <Form :model="quickAccountForm" layout="vertical">
        <Form.Item :label="isEnglish ? 'Account Name' : '账户名称'" required>
          <Input v-model:value="quickAccountForm.name" :placeholder="isEnglish ? 'Enter account name' : '请输入账户名称'" />
        </Form.Item>
        <Form.Item :label="isEnglish ? 'Account Type' : '账户类型'">
          <Select v-model:value="quickAccountForm.type" style="width: 100%">
            <Select.Option value="savings">{{ isEnglish ? 'Savings Account' : '储蓄账户' }}</Select.Option>
            <Select.Option value="checking">{{ isEnglish ? 'Checking Account' : '支票账户' }}</Select.Option>
            <Select.Option value="credit">{{ isEnglish ? 'Credit Card' : '信用卡' }}</Select.Option>
            <Select.Option value="investment">{{ isEnglish ? 'Investment Account' : '投资账户' }}</Select.Option>
            <Select.Option value="ewallet">{{ isEnglish ? 'E-Wallet' : '电子钱包' }}</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item :label="isEnglish ? 'Initial Balance' : '初始余额'">
          <InputNumber v-model:value="quickAccountForm.initialBalance" :precision="2" style="width: 100%" :placeholder="isEnglish ? 'Enter initial balance' : '请输入初始余额'" />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { Card, Button, Select, Modal, Form, InputNumber, Input, notification, DatePicker } from 'ant-design-vue';
import type { EchartsUIType } from '@vben/plugins/echarts';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import dayjs from 'dayjs';

import { useFinanceStore } from '#/store/finance';

defineOptions({ name: 'FinanceDashboard' });

const financeStore = useFinanceStore();

// 简化主题状态管理
const isDark = ref(false);
const currentLanguage = ref('zh-CN');
const refreshing = ref(false);
const showIncomeModal = ref(false);
const showExpenseModal = ref(false);
const showAccountModal = ref(false);

// 多语言支持
const isEnglish = computed(() => currentLanguage.value === 'en-US');

type TrendRangeValue = 'month' | '3month' | '6month' | 'year';

const trendRangeOptions: Array<{
  value: TrendRangeValue;
  days: number;
  labelZh: string;
  labelEn: string;
}> = [
  { value: 'month', days: 30, labelZh: '本月', labelEn: 'This Month' },
  { value: '3month', days: 90, labelZh: '近3月', labelEn: 'Last 3 Months' },
  { value: '6month', days: 180, labelZh: '近半年', labelEn: 'Last 6 Months' },
  { value: 'year', days: 365, labelZh: '本年', labelEn: 'This Year' },
];

const trendRange = ref<TrendRangeValue>('month');

const selectedRangeOption = computed(() =>
  trendRangeOptions.find((option) => option.value === trendRange.value)!,
);

const selectedRangeLabel = computed(() =>
  isEnglish.value ? selectedRangeOption.value.labelEn : selectedRangeOption.value.labelZh,
);

const setTrendRange = (value: TrendRangeValue) => {
  trendRange.value = value;
};

const trendChartRef = ref<EchartsUIType>();
const categoryChartRef = ref<EchartsUIType>();
const { renderEcharts: renderTrendChart } = useEcharts(trendChartRef);
const { renderEcharts: renderCategoryChart } = useEcharts(categoryChartRef);

// 从 financeStore 获取数据
const allTransactions = computed(() => financeStore.transactions.filter(t => !t.isDeleted));
const accounts = computed(() => financeStore.accounts);

// 快速添加表单
const quickIncomeForm = ref({
  amount: null,
  description: '',
  category: '',
  accountId: null,
  date: dayjs()
});

const quickExpenseForm = ref({
  amount: null,
  description: '',
  category: '',
  accountId: null,
  date: dayjs()
});

const quickAccountForm = ref({
  name: '',
  type: 'savings',
  initialBalance: 0
});

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
watch(() => quickIncomeForm.value.accountId, (newAccountId) => {
  if (newAccountId) {
    localStorage.setItem('lastIncomeAccountId', String(newAccountId));
  }
});

watch(() => quickExpenseForm.value.accountId, (newAccountId) => {
  if (newAccountId) {
    localStorage.setItem('lastExpenseAccountId', String(newAccountId));
  }
});

const baseCurrencySymbol = computed(() => {
  const baseCurrency = financeStore.currencies.find((currency) => currency.isBase);
  return baseCurrency?.symbol || '¥';
});

const formatCurrency = (value: number) => {
  const sign = value < 0 ? '-' : '';
  const absolute = Math.abs(value);
  return `${sign}${baseCurrencySymbol.value}${absolute.toLocaleString('zh-CN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
};

const rangeTransactions = computed(() => {
  const endDate = dayjs().format('YYYY-MM-DD');
  const startDate = dayjs()
    .subtract(selectedRangeOption.value.days - 1, 'day')
    .format('YYYY-MM-DD');
  return allTransactions.value.filter(
    (transaction) =>
      transaction.transactionDate >= startDate && transaction.transactionDate <= endDate,
  );
});

const trendChartData = computed(() => {
  const days = selectedRangeOption.value.days;
  const endDate = dayjs();
  const startDate = endDate.subtract(days - 1, 'day');
  const useMonthlyBucket = days > 120;
  const english = isEnglish.value;

  const bucketKeys: string[] = [];
  if (useMonthlyBucket) {
    let cursor = startDate.startOf('month');
    const endMonth = endDate.startOf('month');
    while (cursor.isBefore(endMonth) || cursor.isSame(endMonth)) {
      bucketKeys.push(cursor.format('YYYY-MM'));
      cursor = cursor.add(1, 'month');
    }
  } else {
    for (let i = 0; i < days; i++) {
      const date = startDate.add(i, 'day');
      bucketKeys.push(date.format('YYYY-MM-DD'));
    }
  }

  const bucketMap = new Map<string, { income: number; expense: number }>();
  rangeTransactions.value.forEach((transaction) => {
    const bucketKey = dayjs(transaction.transactionDate).format(
      useMonthlyBucket ? 'YYYY-MM' : 'YYYY-MM-DD',
    );
    if (!bucketMap.has(bucketKey)) {
      bucketMap.set(bucketKey, { income: 0, expense: 0 });
    }
    const bucket = bucketMap.get(bucketKey)!;
    if (transaction.type === 'income') {
      bucket.income += transaction.amountInBase;
    } else if (transaction.type === 'expense') {
      bucket.expense += transaction.amountInBase;
    }
  });

  const labels: string[] = [];
  const incomeSeries: number[] = [];
  const expenseSeries: number[] = [];
  const netSeries: number[] = [];

  bucketKeys.forEach((key) => {
    const bucket = bucketMap.get(key) ?? { income: 0, expense: 0 };
    const label = useMonthlyBucket
      ? english
        ? dayjs(key).format('MMM')
        : dayjs(key).format('MM月')
      : dayjs(key).format('MM-DD');
    labels.push(label);
    const income = Number(bucket.income.toFixed(2));
    const expense = Number(bucket.expense.toFixed(2));
    incomeSeries.push(income);
    expenseSeries.push(expense);
    netSeries.push(Number((income - expense).toFixed(2)));
  });

  const totalIncome = incomeSeries.reduce((sum, value) => sum + value, 0);
  const totalExpense = expenseSeries.reduce((sum, value) => sum + value, 0);
  const netIncome = Number((totalIncome - totalExpense).toFixed(2));
  const incomeCount = rangeTransactions.value.filter((t) => t.type === 'income').length;
  const expenseCount = rangeTransactions.value.filter((t) => t.type === 'expense').length;

  return {
    labels,
    incomeSeries,
    expenseSeries,
    netSeries,
    totalIncome,
    totalExpense,
    netIncome,
    totalTransactions: rangeTransactions.value.length,
    incomeCount,
    expenseCount,
    hasData: rangeTransactions.value.length > 0,
    useMonthly: useMonthlyBucket,
  };
});

const rangeIncome = computed(() => trendChartData.value.totalIncome);
const rangeExpense = computed(() => trendChartData.value.totalExpense);
const rangeNetIncome = computed(() => trendChartData.value.netIncome);
const rangeTransactionCount = computed(() => trendChartData.value.totalTransactions);
const rangeIncomeCount = computed(() => trendChartData.value.incomeCount);
const rangeExpenseCount = computed(() => trendChartData.value.expenseCount);

const rangeTotalAmount = computed(() => rangeIncome.value + rangeExpense.value);
const rangeIncomePercentage = computed(() => {
  if (rangeTotalAmount.value === 0) return 0;
  return Math.min(100, Math.round((rangeIncome.value / rangeTotalAmount.value) * 100));
});
const rangeExpensePercentage = computed(() => {
  if (rangeTotalAmount.value === 0) return 0;
  return Math.min(100, Math.round((rangeExpense.value / rangeTotalAmount.value) * 100));
});

const expenseByCategory = computed(() => {
  const expenseTransactions = rangeTransactions.value.filter((t) => t.type === 'expense');
  if (expenseTransactions.length === 0) return [];

  const english = isEnglish.value;
  const categoryMap = new Map<number, { categoryId: number; categoryName: string; amount: number; count: number }>();

  expenseTransactions.forEach((transaction) => {
    const categoryId = transaction.categoryId ?? 0;
    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, {
        categoryId,
        categoryName:
          financeStore.getCategoryById(categoryId)?.name || (english ? 'Uncategorized' : '未分类'),
        amount: 0,
        count: 0,
      });
    }
    const bucket = categoryMap.get(categoryId)!;
    bucket.amount += transaction.amountInBase;
    bucket.count += 1;
  });

  return Array.from(categoryMap.values())
    .map((item) => {
      const amount = Number(item.amount.toFixed(2));
      const percentage = rangeExpense.value === 0 ? 0 : Math.round((amount / rangeExpense.value) * 100);
      return {
        ...item,
        amount,
        percentage,
      };
    })
    .sort((a, b) => b.amount - a.amount);
});

const categoryChartData = computed(() => ({
  hasData: expenseByCategory.value.length > 0,
  series: expenseByCategory.value.map((item) => ({
    name: item.categoryName,
    value: item.amount,
  })),
}));

watch(
  () => ({
    labels: trendChartData.value.labels,
    income: trendChartData.value.incomeSeries,
    expense: trendChartData.value.expenseSeries,
    net: trendChartData.value.netSeries,
    lang: isEnglish.value,
    symbol: baseCurrencySymbol.value,
  }),
  () => {
    const data = trendChartData.value;
    if (!data.hasData) {
      if (trendChartRef.value) {
        renderTrendChart({
          grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
          legend: { data: [] },
          xAxis: { type: 'category', data: [] },
          yAxis: { type: 'value' },
          series: [],
        });
      }
      return;
    }
    const incomeLabel = isEnglish.value ? 'Income' : '收入';
    const expenseLabel = isEnglish.value ? 'Expense' : '支出';
    const netLabel = isEnglish.value ? 'Net Income' : '净收入';

    renderTrendChart({
      animationDuration: 500,
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      legend: { data: [incomeLabel, expenseLabel, netLabel] },
      tooltip: {
        trigger: 'axis',
        formatter: (items: any[]) => {
          if (!items || items.length === 0) {
            return '';
          }
          const header = items[0]?.axisValueLabel ?? '';
          const rows = items
            .map((item) => `${item.marker}${item.seriesName}: ${formatCurrency(Number(item.data ?? 0))}`)
            .join('<br />');
          return `${header}<br />${rows}`;
        },
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.labels,
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => formatCurrency(value),
        },
      },
      series: [
        {
          areaStyle: { opacity: 0.08 },
          data: data.incomeSeries,
          name: incomeLabel,
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          type: 'line',
        },
        {
          areaStyle: { opacity: 0.08 },
          data: data.expenseSeries,
          name: expenseLabel,
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          type: 'line',
        },
        {
          data: data.netSeries,
          name: netLabel,
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          type: 'line',
          lineStyle: { type: 'dashed', width: 2 },
        },
      ],
    });
  },
  { deep: true, immediate: true },
);

watch(
  () => ({
    series: categoryChartData.value.series,
    lang: isEnglish.value,
    symbol: baseCurrencySymbol.value,
  }),
  () => {
    const data = categoryChartData.value;
    if (!data.hasData) {
      if (categoryChartRef.value) {
        renderCategoryChart({ series: [] });
      }
      return;
    }
    const title = isEnglish.value ? 'Expense Category' : '支出分类';

    renderCategoryChart({
      animationDuration: 400,
      tooltip: {
        trigger: 'item',
        formatter: (item: any) =>
          `${item.marker}${item.name}<br />${formatCurrency(Number(item.value ?? 0))} (${item.percent}%)`,
      },
      legend: {
        data: data.series.map((item) => item.name),
        left: 'left',
        orient: 'vertical',
        top: 'middle',
      },
      series: [
        {
          data: data.series,
          name: title,
          radius: ['45%', '70%'],
          center: ['55%', '50%'],
          type: 'pie',
          label: { formatter: '{b}: {d}%' },
          labelLine: { length: 18, length2: 12 },
          itemStyle: { borderRadius: 6, borderWidth: 1 },
        },
      ],
    });
  },
  { deep: true, immediate: true },
);

// 计算总收入、总支出（所有交易）
const totalIncome = computed(() => {
  return allTransactions.value
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amountInBase, 0);
});

const totalExpense = computed(() => {
  return allTransactions.value
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amountInBase, 0);
});

const totalNetIncome = computed(() => totalIncome.value - totalExpense.value);

const totalTransactionCount = computed(() => allTransactions.value.length);

// 核心指标 - 动态多语言
const keyMetrics = computed(() => [
  {
    title: isEnglish.value ? 'Total Income' : '总收入',
    value: formatCurrency(totalIncome.value),
    trend: 0,
    color: 'text-green-600',
    iconEmoji: '📈',
    iconBg: 'bg-green-500'
  },
  {
    title: isEnglish.value ? 'Total Expense' : '总支出',
    value: formatCurrency(totalExpense.value),
    trend: 0,
    color: 'text-red-600',
    iconEmoji: '📉',
    iconBg: 'bg-red-500'
  },
  {
    title: isEnglish.value ? 'Net Income' : '净收入',
    value: formatCurrency(totalNetIncome.value),
    trend: 0,
    color: totalNetIncome.value >= 0 ? 'text-purple-600' : 'text-red-600',
    iconEmoji: '💎',
    iconBg: totalNetIncome.value >= 0 ? 'bg-purple-500' : 'bg-red-500'
  },
  {
    title: isEnglish.value ? 'Transactions' : '交易笔数',
    value: totalTransactionCount.value,
    trend: 0,
    color: 'text-blue-600',
    iconEmoji: '📊',
    iconBg: 'bg-blue-500'
  }
]);

// 最近交易（最多显示5条）
const recentTransactions = computed(() => {
  return allTransactions.value
    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
    .slice(0, 5)
    .map(t => ({
      id: t.id,
      emoji: t.type === 'income' ? '📈' : '📉',
      description: t.description || '无描述',
      date: t.transactionDate,
      category: financeStore.getCategoryById(t.categoryId)?.name || '未分类',
      amount: t.type === 'income' ? t.amountInBase : -t.amountInBase
    }));
});

// 功能实现
const changeLanguage = (lang: string) => {
  console.log('切换语言到:', lang);
  // 实际应用中这里应该调用Vben的语言切换API
  notification.success({
    message: lang === 'en-US' ? 'Language Changed' : '语言已切换',
    description: lang === 'en-US' ? 'Language switched to English' : '语言已切换为中文'
  });
};

const toggleTheme = () => {
  isDark.value = !isDark.value;
  console.log('切换主题到:', isDark.value ? 'dark' : 'light');
  
  // 实际切换页面主题
  const html = document.documentElement;
  if (isDark.value) {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  
  notification.info({
    message: isEnglish.value ? 'Theme Switched' : '主题已切换',
    description: isEnglish.value ? `Switched to ${isDark.value ? 'Dark' : 'Light'} theme` : `已切换到${isDark.value ? '深色' : '浅色'}主题`
  });
};

const refreshData = async () => {
  refreshing.value = true;
  try {
    // 模拟数据刷新
    await new Promise(resolve => setTimeout(resolve, 1000));
    notification.success({
      message: isEnglish.value ? 'Data Refreshed' : '数据已刷新',
      description: isEnglish.value ? 'All data has been updated' : '所有数据已更新'
    });
  } catch (error) {
    notification.error({
      message: isEnglish.value ? 'Refresh Failed' : '刷新失败',
      description: isEnglish.value ? 'Failed to refresh data' : '数据刷新失败'
    });
  } finally {
    refreshing.value = false;
  }
};

const quickAddIncome = () => {
  // 读取上次选择的账户
  const lastAccountId = localStorage.getItem('lastIncomeAccountId');
  const accountId = lastAccountId ? Number(lastAccountId) : accounts.value[0]?.id;

  quickIncomeForm.value = {
    amount: null,
    description: '',
    category: '',
    accountId: accountId || null,
    date: dayjs()
  };
  showIncomeModal.value = true;
};

const quickAddExpense = () => {
  // 读取上次选择的账户
  const lastAccountId = localStorage.getItem('lastExpenseAccountId');
  const accountId = lastAccountId ? Number(lastAccountId) : accounts.value[0]?.id;

  quickExpenseForm.value = {
    amount: null,
    description: '',
    category: '',
    accountId: accountId || null,
    date: dayjs()
  };
  showExpenseModal.value = true;
};

// 日期快捷方式 - 收入
const setIncomeDate = (type: string) => {
  switch (type) {
    case 'today':
      quickIncomeForm.value.date = dayjs();
      break;
    case 'yesterday':
      quickIncomeForm.value.date = dayjs().subtract(1, 'day');
      break;
    case 'week':
      quickIncomeForm.value.date = dayjs().startOf('week');
      break;
    case 'month':
      quickIncomeForm.value.date = dayjs().startOf('month');
      break;
  }
};

// 日期快捷方式 - 支出
const setExpenseDate = (type: string) => {
  switch (type) {
    case 'today':
      quickExpenseForm.value.date = dayjs();
      break;
    case 'yesterday':
      quickExpenseForm.value.date = dayjs().subtract(1, 'day');
      break;
    case 'week':
      quickExpenseForm.value.date = dayjs().startOf('week');
      break;
    case 'month':
      quickExpenseForm.value.date = dayjs().startOf('month');
      break;
  }
};

const addAccount = () => {
  showAccountModal.value = true;
};

const submitIncome = async () => {
  try {
    if (!quickIncomeForm.value.amount || !quickIncomeForm.value.category || !quickIncomeForm.value.accountId) {
      notification.error({
        message: '添加失败',
        description: '请填写完整信息'
      });
      return;
    }

    // 获取选中的账户
    const account = financeStore.getAccountById(quickIncomeForm.value.accountId);
    if (!account) {
      notification.error({
        message: '添加失败',
        description: '请选择有效的账户'
      });
      return;
    }

    // 获取对应的收入分类
    const category = financeStore.incomeCategories.find(c => c.name === quickIncomeForm.value.category);

    await financeStore.createTransaction({
      type: 'income',
      amount: quickIncomeForm.value.amount,
      currency: account.currency,
      categoryId: category?.id,
      accountId: account.id,
      transactionDate: quickIncomeForm.value.date.format('YYYY-MM-DD'),
      description: quickIncomeForm.value.description || '快速添加收入'
    });

    notification.success({
      message: '收入已添加',
      description: '收入记录已保存'
    });
    showIncomeModal.value = false;
  } catch (error) {
    console.error('添加收入失败:', error);
    notification.error({
      message: '添加失败',
      description: '添加收入时出错，请稍后重试'
    });
  }
};

const submitExpense = async () => {
  try {
    if (!quickExpenseForm.value.amount || !quickExpenseForm.value.category || !quickExpenseForm.value.accountId) {
      notification.error({
        message: '添加失败',
        description: '请填写完整信息'
      });
      return;
    }

    // 获取选中的账户
    const account = financeStore.getAccountById(quickExpenseForm.value.accountId);
    if (!account) {
      notification.error({
        message: '添加失败',
        description: '请选择有效的账户'
      });
      return;
    }

    // 获取对应的支出分类
    const category = financeStore.expenseCategories.find(c => c.name === quickExpenseForm.value.category);

    await financeStore.createTransaction({
      type: 'expense',
      amount: quickExpenseForm.value.amount,
      currency: account.currency,
      categoryId: category?.id,
      accountId: account.id,
      transactionDate: quickExpenseForm.value.date.format('YYYY-MM-DD'),
      description: quickExpenseForm.value.description || '快速添加支出'
    });

    notification.success({
      message: '支出已添加',
      description: '支出记录已保存'
    });
    showExpenseModal.value = false;
  } catch (error) {
    console.error('添加支出失败:', error);
    notification.error({
      message: '添加失败',
      description: '添加支出时出错，请稍后重试'
    });
  }
};

const submitAccount = () => {
  console.log('添加账户:', quickAccountForm.value);
  notification.success({
    message: isEnglish.value ? 'Account Added' : '账户已添加',
    description: isEnglish.value ? 'New account has been created' : '新账户已创建'
  });
  showAccountModal.value = false;
  resetAccountForm();
};


const resetAccountForm = () => {
  quickAccountForm.value = { name: '', type: 'savings', initialBalance: 0 };
};

onMounted(async () => {
  console.log('FinWise Pro Dashboard 加载完成');
  // 加载所有数据
  await Promise.all([
    financeStore.initializeData(),
    financeStore.fetchTransactions(),
  ]);
});
</script>

<style scoped>
.grid {
  display: grid;
}
</style>
