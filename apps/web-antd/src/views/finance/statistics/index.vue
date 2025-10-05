<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';

import {
  Alert,
  Badge,
  Button,
  Card,
  DatePicker,
  notification,
  Progress,
  Radio,
  RangePicker,
  Select,
  Table,
  TabPane,
  Tabs,
} from 'ant-design-vue';
import dayjs, { Dayjs } from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import * as echarts from 'echarts';
import * as XLSX from 'xlsx';

import { useFinanceStore } from '#/store/finance';

dayjs.extend(quarterOfYear);

const financeStore = useFinanceStore();

// 时间维度
const timeDimension = ref<'custom' | 'monthly' | 'quarterly' | 'yearly'>(
  'monthly',
);
const selectedMonth = ref<Dayjs>(dayjs());
const selectedQuarter = ref<string>(`${dayjs().year()}-Q${dayjs().quarter()}`);
const selectedYear = ref<number>(dayjs().year());
const customRange = ref<[Dayjs, Dayjs]>([dayjs().subtract(30, 'day'), dayjs()]);

// 对比类型
const comparisonType = ref<'mom' | 'yoy'>('mom');

// ECharts实例
const cashFlowChart = ref<HTMLElement | null>(null);
const expenseTreeChart = ref<HTMLElement | null>(null);
let cashFlowChartInstance: echarts.ECharts | null = null;
let expenseTreeChartInstance: echarts.ECharts | null = null;

// 计算可用的年份和季度
const availableYears = computed(() => {
  const years = new Set<number>();
  financeStore.transactions.forEach((t) => {
    const year = dayjs(t.transactionDate).year();
    years.add(year);
  });
  return [...years].sort((a, b) => b - a);
});

const availableQuarters = computed(() => {
  const quarters = new Set<string>();
  financeStore.transactions.forEach((t) => {
    const date = dayjs(t.transactionDate);
    quarters.add(`${date.year()}-Q${date.quarter()}`);
  });
  return [...quarters]
    .sort((a, b) => b.localeCompare(a))
    .map((q) => ({
      value: q,
      label: `${q.replace('-Q', '年第')}季度`,
    }));
});

// 获取当前期间的交易数据
const getCurrentPeriodTransactions = () => {
  let endDate: Dayjs, startDate: Dayjs;

  switch (timeDimension.value) {
    case 'custom': {
      startDate = customRange.value[0];
      endDate = customRange.value[1];
      break;
    }
    case 'monthly': {
      startDate = selectedMonth.value.startOf('month');
      endDate = selectedMonth.value.endOf('month');
      break;
    }
    case 'quarterly': {
      const [year, quarter] = selectedQuarter.value.split('-Q');
      startDate = dayjs(
        `${year}-${(Number.parseInt(quarter) - 1) * 3 + 1}-01`,
      ).startOf('month');
      endDate = startDate.add(2, 'month').endOf('month');
      break;
    }
    case 'yearly': {
      startDate = dayjs(`${selectedYear.value}-01-01`);
      endDate = dayjs(`${selectedYear.value}-12-31`);
      break;
    }
  }

  return financeStore.transactions.filter((t) => {
    const date = dayjs(t.transactionDate);
    return (
      date.isAfter(startDate.subtract(1, 'day')) &&
      date.isBefore(endDate.add(1, 'day'))
    );
  });
};

// 当前期间数据
const currentPeriodData = computed(() => {
  const transactions = getCurrentPeriodTransactions();
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amountInBase, 0);
  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amountInBase, 0);
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');

  const maxExpenseTransaction =
    expenseTransactions.length > 0
      ? expenseTransactions.reduce((max, t) =>
          t.amountInBase > max.amountInBase ? t : max,
        )
      : null;

  return {
    totalIncome: income,
    totalExpense: expense,
    netIncome: income - expense,
    transactionCount: transactions.length,
    expenseCount: expenseTransactions.length,
    avgAmount:
      expenseTransactions.length > 0 ? expense / expenseTransactions.length : 0,
    maxExpense: maxExpenseTransaction?.amountInBase || 0,
    maxExpenseCategory: maxExpenseTransaction
      ? financeStore.getCategoryById(maxExpenseTransaction.categoryId)?.name
      : null,
  };
});

// 对比数据
const comparisonData = computed(() => {
  // 简化版本，后续可以添加更复杂的对比逻辑
  return {
    momExpense: 0,
    momIncome: 0,
    momCount: 0,
    yoyExpense: 0,
    yoyIncome: 0,
    yoyCount: 0,
    incomeTrend: null,
    expenseTrend: null,
    incomeCompareText: '',
    expenseCompareText: '',
  };
});

// 智能洞察
const smartInsights = computed(() => {
  const insights = [];

  // 洞察1: 支出趋势
  insights.push({
    type: 'expense_trend',
    icon: '📉',
    title: '支出趋势',
    description: `本期总支出 ¥${currentPeriodData.value.totalExpense.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
    value: `${currentPeriodData.value.expenseCount} 笔`,
    trend: null,
    valueClass: 'text-red-600',
    trendClass: '',
    alertLevel: 'bg-red-50 border-red-200',
    isAlert: false,
  });

  // 洞察2: 高频分类
  const categoryStats = new Map<number, { amount: number; count: number }>();
  getCurrentPeriodTransactions()
    .filter((t) => t.type === 'expense' && t.categoryId)
    .forEach((t) => {
      const stat = categoryStats.get(t.categoryId!) || { count: 0, amount: 0 };
      stat.count++;
      stat.amount += t.amountInBase;
      categoryStats.set(t.categoryId!, stat);
    });

  if (categoryStats.size > 0) {
    const topCategory = [...categoryStats.entries()].sort(
      (a, b) => b[1].count - a[1].count,
    )[0];
    const category = financeStore.getCategoryById(topCategory[0]);

    insights.push({
      type: 'top_category',
      icon: category?.icon || '📊',
      title: '高频分类',
      description: `${category?.name || '未知'} 是本期最常用的支出分类`,
      value: `${topCategory[1].count} 笔`,
      trend: null,
      valueClass: 'text-blue-600',
      trendClass: '',
      alertLevel: 'bg-blue-50 border-blue-200',
      isAlert: false,
    });
  }

  // 洞察3: 平均单笔
  insights.push({
    type: 'avg_amount',
    icon: '💎',
    title: '平均单笔',
    description: '本期平均每笔支出金额',
    value: `¥${currentPeriodData.value.avgAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
    trend: null,
    valueClass: 'text-purple-600',
    trendClass: '',
    alertLevel: 'bg-purple-50 border-purple-200',
    isAlert: false,
  });

  return insights;
});

// 分类健康度评分
const categoryHealthScores = computed(() => {
  const categoryStats = new Map<number, { amount: number; count: number }>();
  const transactions = getCurrentPeriodTransactions().filter(
    (t) => t.type === 'expense' && t.categoryId,
  );
  const totalExpense = currentPeriodData.value.totalExpense;

  transactions.forEach((t) => {
    const stat = categoryStats.get(t.categoryId!) || { count: 0, amount: 0 };
    stat.count++;
    stat.amount += t.amountInBase;
    categoryStats.set(t.categoryId!, stat);
  });

  return [...categoryStats.entries()]
    .map(([categoryId, stat]) => {
      const category = financeStore.getCategoryById(categoryId);
      const percentage =
        totalExpense > 0 ? (stat.amount / totalExpense) * 100 : 0;

      let status: 'exception' | 'normal' | 'success' = 'normal';
      let healthLabel = '正常';
      let badgeColor = 'green';
      let color = '#52c41a';

      if (percentage > 40) {
        status = 'exception';
        healthLabel = '偏高';
        badgeColor = 'red';
        color = '#ff4d4f';
      } else if (percentage > 25) {
        status = 'normal';
        healthLabel = '关注';
        badgeColor = 'orange';
        color = '#faad14';
      }

      return {
        categoryId,
        categoryName: category?.name || '未知',
        icon: category?.icon || '📝',
        amount: stat.amount,
        count: stat.count,
        percentage: Math.round(percentage),
        status,
        healthLabel,
        badgeColor,
        color,
      };
    })
    .sort((a, b) => b.amount - a.amount);
});

// 异常交易检测
const anomalies = computed(() => {
  const transactions = getCurrentPeriodTransactions().filter(
    (t) => t.type === 'expense',
  );
  const avgAmount = currentPeriodData.value.avgAmount;

  // 检测: 金额超过平均值3倍的交易
  return transactions
    .filter((t) => t.amountInBase > avgAmount * 3 && avgAmount > 0)
    .map((t) => ({
      id: t.id,
      description: t.description || t.project || '无描述',
      date: dayjs(t.transactionDate).format('YYYY-MM-DD'),
      category: financeStore.getCategoryById(t.categoryId)?.name || '未分类',
      amount: t.amountInBase,
      reason: `金额是平均值的 ${(t.amountInBase / avgAmount).toFixed(1)} 倍`,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
});

// 前后切换
const canGoPrevious = ref(true);
const canGoNext = ref(true);

const previousPeriod = () => {
  switch (timeDimension.value) {
    case 'monthly': {
      selectedMonth.value = selectedMonth.value.subtract(1, 'month');
      break;
    }
    case 'quarterly': {
      const [year, quarter] = selectedQuarter.value.split('-Q');
      const prevQ = Number.parseInt(quarter) - 1;
      selectedQuarter.value =
        prevQ < 1 ? `${Number.parseInt(year) - 1}-Q4` : `${year}-Q${prevQ}`;
      break;
    }
    case 'yearly': {
      selectedYear.value--;
      break;
    }
  }
};

const nextPeriod = () => {
  switch (timeDimension.value) {
    case 'monthly': {
      selectedMonth.value = selectedMonth.value.add(1, 'month');
      break;
    }
    case 'quarterly': {
      const [year, quarter] = selectedQuarter.value.split('-Q');
      const nextQ = Number.parseInt(quarter) + 1;
      selectedQuarter.value =
        nextQ > 4 ? `${Number.parseInt(year) + 1}-Q1` : `${year}-Q${nextQ}`;
      break;
    }
    case 'yearly': {
      selectedYear.value++;
      break;
    }
  }
};

const handleDimensionChange = () => {
  nextTick(() => {
    initCharts();
  });
};

const handleMonthChange = () => {
  nextTick(() => {
    initCharts();
  });
};

const handleQuarterChange = () => {
  nextTick(() => {
    initCharts();
  });
};

const handleYearChange = () => {
  nextTick(() => {
    initCharts();
  });
};

const handleCustomRangeChange = () => {
  nextTick(() => {
    initCharts();
  });
};

// 初始化图表
const initCharts = () => {
  initCashFlowChart();
  initExpenseTreeChart();
};

// 现金流趋势图
const initCashFlowChart = () => {
  if (!cashFlowChart.value) return;

  if (cashFlowChartInstance) {
    cashFlowChartInstance.dispose();
  }

  cashFlowChartInstance = echarts.init(cashFlowChart.value);

  const transactions = getCurrentPeriodTransactions();
  const dateMap = new Map<string, { expense: number; income: number }>();

  transactions.forEach((t) => {
    const date = dayjs(t.transactionDate).format('YYYY-MM-DD');
    const stat = dateMap.get(date) || { income: 0, expense: 0 };
    if (t.type === 'income') {
      stat.income += t.amountInBase;
    } else if (t.type === 'expense') {
      stat.expense += t.amountInBase;
    }
    dateMap.set(date, stat);
  });

  const dates = [...dateMap.keys()].sort();
  const incomeData = dates.map((d) => dateMap.get(d)!.income);
  const expenseData = dates.map((d) => dateMap.get(d)!.expense);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
    },
    legend: {
      data: ['收入', '支出', '净收入'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates.map((d) => dayjs(d).format('MM-DD')),
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}',
      },
    },
    series: [
      {
        name: '收入',
        type: 'line',
        data: incomeData,
        smooth: true,
        itemStyle: { color: '#52c41a' },
        areaStyle: { opacity: 0.3 },
      },
      {
        name: '支出',
        type: 'line',
        data: expenseData,
        smooth: true,
        itemStyle: { color: '#ff4d4f' },
        areaStyle: { opacity: 0.3 },
      },
      {
        name: '净收入',
        type: 'line',
        data: dates.map((d, i) => incomeData[i] - expenseData[i]),
        smooth: true,
        itemStyle: { color: '#1890ff' },
      },
    ],
  };

  cashFlowChartInstance.setOption(option);
};

// 支出结构树图
const initExpenseTreeChart = () => {
  if (!expenseTreeChart.value) return;

  if (expenseTreeChartInstance) {
    expenseTreeChartInstance.dispose();
  }

  expenseTreeChartInstance = echarts.init(expenseTreeChart.value);

  const categoryStats = new Map<number, number>();
  getCurrentPeriodTransactions()
    .filter((t) => t.type === 'expense' && t.categoryId)
    .forEach((t) => {
      const amount = categoryStats.get(t.categoryId!) || 0;
      categoryStats.set(t.categoryId!, amount + t.amountInBase);
    });

  const data = [...categoryStats.entries()]
    .map(([categoryId, amount]) => {
      const category = financeStore.getCategoryById(categoryId);
      return {
        name: `${category?.icon || ''} ${category?.name || '未知'}`,
        value: amount,
      };
    })
    .sort((a, b) => b.value - a.value);

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)',
    },
    series: [
      {
        type: 'treemap',
        data,
        leafDepth: 1,
        label: {
          show: true,
          formatter: '{b}\n¥{c}',
        },
        upperLabel: {
          show: true,
          height: 30,
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2,
        },
        levels: [
          {
            itemStyle: {
              borderColor: '#777',
              borderWidth: 0,
              gapWidth: 1,
            },
            upperLabel: {
              show: false,
            },
          },
          {
            itemStyle: {
              borderColor: '#555',
              borderWidth: 5,
              gapWidth: 1,
            },
            emphasis: {
              itemStyle: {
                borderColor: '#ddd',
              },
            },
          },
        ],
      },
    ],
  };

  expenseTreeChartInstance.setOption(option);
};

// 表格视图相关状态
const tableViewYear = ref<number>(dayjs().year());
const tableViewMode = ref<'category' | 'summary'>('summary');

// 汇总表格列定义
const summaryTableColumns = [
  {
    title: '月份',
    dataIndex: 'month',
    key: 'month',
    width: 100,
    fixed: 'left',
  },
  {
    title: '收入',
    dataIndex: 'income',
    key: 'income',
    width: 150,
    align: 'right',
  },
  {
    title: '支出',
    dataIndex: 'expense',
    key: 'expense',
    width: 150,
    align: 'right',
  },
  { title: '净收入', dataIndex: 'net', key: 'net', width: 150, align: 'right' },
  {
    title: '交易笔数',
    dataIndex: 'count',
    key: 'count',
    width: 100,
    align: 'center',
  },
  {
    title: '储蓄率',
    dataIndex: 'savingsRate',
    key: 'savingsRate',
    width: 100,
    align: 'center',
  },
];

// 分类表格列定义
const categoryTableColumns = computed(() => {
  const expenseCategories = financeStore.expenseCategories || [];
  const columns: any[] = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 100,
      fixed: 'left',
    },
  ];

  // 添加每个分类的列
  expenseCategories.forEach((cat) => {
    columns.push({
      title: `${cat.icon} ${cat.name}`,
      dataIndex: `cat_${cat.id}`,
      key: `cat_${cat.id}`,
      width: 150,
      align: 'right',
    });
  });

  columns.push({
    title: '总计',
    dataIndex: 'total',
    key: 'total',
    width: 150,
    align: 'right',
    fixed: 'right',
  });

  return columns;
});

// 月度汇总数据
const monthlyTableData = computed(() => {
  const year = tableViewYear.value;
  const data: any[] = [];

  for (let month = 1; month <= 12; month++) {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const monthTransactions = financeStore.transactions.filter((t) => {
      return dayjs(t.transactionDate).format('YYYY-MM') === monthStr;
    });

    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amountInBase, 0);

    const expense = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amountInBase, 0);

    const net = income - expense;
    const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0;

    data.push({
      month: `${month}月`,
      income,
      expense,
      net,
      count: monthTransactions.length,
      savingsRate,
    });
  }

  // 添加合计行
  const totalIncome = data.reduce((sum, row) => sum + row.income, 0);
  const totalExpense = data.reduce((sum, row) => sum + row.expense, 0);
  const totalCount = data.reduce((sum, row) => sum + row.count, 0);
  const avgSavingsRate =
    totalIncome > 0
      ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100)
      : 0;

  data.push({
    month: '合计',
    income: totalIncome,
    expense: totalExpense,
    net: totalIncome - totalExpense,
    count: totalCount,
    savingsRate: avgSavingsRate,
  });

  return data;
});

// 月度分类明细数据
const monthlyCategoryData = computed(() => {
  const year = tableViewYear.value;
  const data: any[] = [];
  const expenseCategories = financeStore.expenseCategories || [];

  for (let month = 1; month <= 12; month++) {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const monthTransactions = financeStore.transactions.filter((t) => {
      return (
        dayjs(t.transactionDate).format('YYYY-MM') === monthStr &&
        t.type === 'expense'
      );
    });

    const row: any = {
      month: `${month}月`,
      total: 0,
    };

    // 计算每个分类的支出
    expenseCategories.forEach((cat) => {
      const catExpense = monthTransactions
        .filter((t) => t.categoryId === cat.id)
        .reduce((sum, t) => sum + t.amountInBase, 0);

      if (catExpense > 0) {
        const total = monthTransactions.reduce(
          (sum, t) => sum + t.amountInBase,
          0,
        );
        const percentage =
          total > 0 ? Math.round((catExpense / total) * 100) : 0;
        row[`cat_${cat.id}`] = {
          amount: catExpense,
          percentage,
        };
        row.total += catExpense;
      }
    });

    data.push(row);
  }

  // 添加合计行
  const totalRow: any = {
    month: '合计',
    total: 0,
  };

  expenseCategories.forEach((cat) => {
    const catTotal = data.reduce((sum, row) => {
      return sum + (row[`cat_${cat.id}`]?.amount || 0);
    }, 0);

    if (catTotal > 0) {
      const grandTotal = data.reduce((sum, row) => sum + row.total, 0);
      const percentage =
        grandTotal > 0 ? Math.round((catTotal / grandTotal) * 100) : 0;
      totalRow[`cat_${cat.id}`] = {
        amount: catTotal,
        percentage,
      };
      totalRow.total += catTotal;
    }
  });

  data.push(totalRow);

  return data;
});

// 处理年份变化
const handleTableYearChange = () => {
  // 数据会自动重新计算
};

// 导出Excel
const exportMonthlyTable = () => {
  try {
    const data =
      tableViewMode.value === 'summary'
        ? monthlyTableData.value
        : monthlyCategoryData.value;
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${tableViewYear.value}年数据`);
    XLSX.writeFile(
      wb,
      `财务统计_${tableViewYear.value}年_${tableViewMode.value === 'summary' ? '汇总' : '分类'}.xlsx`,
    );

    notification.success({
      message: '导出成功',
      description: '数据已成功导出为Excel文件',
    });
  } catch {
    notification.error({
      message: '导出失败',
      description: '导出Excel文件时出错，请重试',
    });
  }
};

// 加载数据
onMounted(async () => {
  await financeStore.fetchTransactions();
  await financeStore.fetchCategories();

  nextTick(() => {
    initCharts();
  });
});

// 监听窗口大小变化
window.addEventListener('resize', () => {
  cashFlowChartInstance?.resize();
  expenseTreeChartInstance?.resize();
});
</script>

<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="mb-2 text-3xl font-bold text-gray-900">📊 财务统计分析</h1>
      <p class="text-gray-600">多维度智能分析您的财务数据</p>
    </div>

    <!-- 时间维度选择器 -->
    <Card class="mb-6">
      <Tabs v-model:active-key="timeDimension" @change="handleDimensionChange">
        <TabPane key="monthly" tab="📅 月度分析">
          <div class="flex items-center space-x-4 py-2">
            <Button @click="previousPeriod" :disabled="!canGoPrevious">
              ←
            </Button>
            <DatePicker
              v-model:value="selectedMonth"
              picker="month"
              format="YYYY年MM月"
              @change="handleMonthChange"
              style="width: 200px"
            />
            <Button @click="nextPeriod" :disabled="!canGoNext"> → </Button>
            <span class="text-gray-500">共 {{ currentPeriodData.transactionCount }} 笔交易</span>
          </div>
        </TabPane>
        <TabPane key="quarterly" tab="📊 季度分析">
          <div class="flex items-center space-x-4 py-2">
            <Button @click="previousPeriod" :disabled="!canGoPrevious">
              ←
            </Button>
            <Select
              v-model:value="selectedQuarter"
              style="width: 200px"
              @change="handleQuarterChange"
            >
              <Select.Option
                v-for="quarter in availableQuarters"
                :key="quarter.value"
                :value="quarter.value"
              >
                {{ quarter.label }}
              </Select.Option>
            </Select>
            <Button @click="nextPeriod" :disabled="!canGoNext"> → </Button>
            <span class="text-gray-500">共 {{ currentPeriodData.transactionCount }} 笔交易</span>
          </div>
        </TabPane>
        <TabPane key="yearly" tab="📈 年度分析">
          <div class="flex items-center space-x-4 py-2">
            <Button @click="previousPeriod" :disabled="!canGoPrevious">
              ←
            </Button>
            <Select
              v-model:value="selectedYear"
              style="width: 200px"
              @change="handleYearChange"
            >
              <Select.Option
                v-for="year in availableYears"
                :key="year"
                :value="year"
              >
                {{ year }}年
              </Select.Option>
            </Select>
            <Button @click="nextPeriod" :disabled="!canGoNext"> → </Button>
            <span class="text-gray-500">共 {{ currentPeriodData.transactionCount }} 笔交易</span>
          </div>
        </TabPane>
        <TabPane key="custom" tab="🎯 自定义">
          <div class="flex items-center space-x-4 py-2">
            <RangePicker
              v-model:value="customRange"
              format="YYYY-MM-DD"
              @change="handleCustomRangeChange"
            />
            <span class="text-gray-500">共 {{ currentPeriodData.transactionCount }} 笔交易</span>
          </div>
        </TabPane>
      </Tabs>
    </Card>

    <!-- 智能洞察卡片 -->
    <Card class="mb-6" title="💡 智能洞察">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div
          v-for="insight in smartInsights"
          :key="insight.type"
          class="rounded-lg border p-4"
          :class="insight.alertLevel"
        >
          <div class="mb-2 flex items-start justify-between">
            <span class="text-2xl">{{ insight.icon }}</span>
            <Badge v-if="insight.isAlert" status="error" text="异常" />
          </div>
          <h3 class="mb-2 font-semibold">{{ insight.title }}</h3>
          <p class="mb-3 text-sm text-gray-600">{{ insight.description }}</p>
          <div class="flex items-center justify-between">
            <span class="text-xl font-bold" :class="insight.valueClass">{{
              insight.value
            }}</span>
            <span
              v-if="insight.trend"
              class="text-sm"
              :class="insight.trendClass"
            >
              <template v-if="insight.trend > 0">↗ +{{ insight.trend }}%</template>
              <template v-else>↘ {{ insight.trend }}%</template>
            </span>
          </div>
        </div>
      </div>
    </Card>

    <!-- 关键指标卡片 -->
    <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
      <Card class="text-center transition-shadow hover:shadow-lg">
        <div class="space-y-2">
          <div class="text-3xl">💰</div>
          <p class="text-sm text-gray-500">期间总收入</p>
          <p class="text-2xl font-bold text-green-600">
            ¥{{
              currentPeriodData.totalIncome.toLocaleString('zh-CN', {
                minimumFractionDigits: 2,
              })
            }}
          </p>
          <p
            v-if="comparisonData.incomeTrend !== null"
            class="text-xs"
            :class="
              comparisonData.incomeTrend >= 0
                ? 'text-green-600'
                : 'text-red-600'
            "
          >
            {{ comparisonData.incomeCompareText }}
          </p>
        </div>
      </Card>
      <Card class="text-center transition-shadow hover:shadow-lg">
        <div class="space-y-2">
          <div class="text-3xl">💸</div>
          <p class="text-sm text-gray-500">期间总支出</p>
          <p class="text-2xl font-bold text-red-600">
            ¥{{
              currentPeriodData.totalExpense.toLocaleString('zh-CN', {
                minimumFractionDigits: 2,
              })
            }}
          </p>
          <p
            v-if="comparisonData.expenseTrend !== null"
            class="text-xs"
            :class="
              comparisonData.expenseTrend <= 0
                ? 'text-green-600'
                : 'text-red-600'
            "
          >
            {{ comparisonData.expenseCompareText }}
          </p>
        </div>
      </Card>
      <Card class="text-center transition-shadow hover:shadow-lg">
        <div class="space-y-2">
          <div class="text-3xl">📊</div>
          <p class="text-sm text-gray-500">平均单笔金额</p>
          <p class="text-2xl font-bold text-blue-600">
            ¥{{
              currentPeriodData.avgAmount.toLocaleString('zh-CN', {
                minimumFractionDigits: 2,
              })
            }}
          </p>
          <p class="text-xs text-gray-500">
            支出笔数: {{ currentPeriodData.expenseCount }}
          </p>
        </div>
      </Card>
      <Card class="text-center transition-shadow hover:shadow-lg">
        <div class="space-y-2">
          <div class="text-3xl">🏆</div>
          <p class="text-sm text-gray-500">最大单笔支出</p>
          <p class="text-2xl font-bold text-orange-600">
            ¥{{
              currentPeriodData.maxExpense.toLocaleString('zh-CN', {
                minimumFractionDigits: 2,
              })
            }}
          </p>
          <p
            v-if="currentPeriodData.maxExpenseCategory"
            class="text-xs text-gray-500"
          >
            {{ currentPeriodData.maxExpenseCategory }}
          </p>
        </div>
      </Card>
    </div>

    <!-- 对比分析卡片 -->
    <Card class="mb-6" title="📈 对比分析">
      <Tabs v-model:active-key="comparisonType">
        <TabPane key="mom" tab="环比分析">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div class="rounded-lg bg-blue-50 p-4">
              <p class="mb-2 text-sm text-gray-600">支出环比</p>
              <p
                class="text-2xl font-bold"
                :class="
                  comparisonData.momExpense < 0
                    ? 'text-green-600'
                    : 'text-red-600'
                "
              >
                {{ comparisonData.momExpense >= 0 ? '+' : ''
                }}{{ comparisonData.momExpense }}%
              </p>
            </div>
            <div class="rounded-lg bg-green-50 p-4">
              <p class="mb-2 text-sm text-gray-600">收入环比</p>
              <p
                class="text-2xl font-bold"
                :class="
                  comparisonData.momIncome >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                "
              >
                {{ comparisonData.momIncome >= 0 ? '+' : ''
                }}{{ comparisonData.momIncome }}%
              </p>
            </div>
            <div class="rounded-lg bg-purple-50 p-4">
              <p class="mb-2 text-sm text-gray-600">交易笔数环比</p>
              <p class="text-2xl font-bold text-purple-600">
                {{ comparisonData.momCount >= 0 ? '+' : ''
                }}{{ comparisonData.momCount }}%
              </p>
            </div>
          </div>
        </TabPane>
        <TabPane key="yoy" tab="同比分析">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div class="rounded-lg bg-blue-50 p-4">
              <p class="mb-2 text-sm text-gray-600">支出同比</p>
              <p
                class="text-2xl font-bold"
                :class="
                  comparisonData.yoyExpense < 0
                    ? 'text-green-600'
                    : 'text-red-600'
                "
              >
                {{ comparisonData.yoyExpense >= 0 ? '+' : ''
                }}{{ comparisonData.yoyExpense }}%
              </p>
            </div>
            <div class="rounded-lg bg-green-50 p-4">
              <p class="mb-2 text-sm text-gray-600">收入同比</p>
              <p
                class="text-2xl font-bold"
                :class="
                  comparisonData.yoyIncome >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                "
              >
                {{ comparisonData.yoyIncome >= 0 ? '+' : ''
                }}{{ comparisonData.yoyIncome }}%
              </p>
            </div>
            <div class="rounded-lg bg-purple-50 p-4">
              <p class="mb-2 text-sm text-gray-600">交易笔数同比</p>
              <p class="text-2xl font-bold text-purple-600">
                {{ comparisonData.yoyCount >= 0 ? '+' : ''
                }}{{ comparisonData.yoyCount }}%
              </p>
            </div>
          </div>
        </TabPane>
      </Tabs>
    </Card>

    <!-- 现金流趋势图 -->
    <Card class="mb-6" title="💹 现金流趋势">
      <div ref="cashFlowChart" style="width: 100%; height: 400px"></div>
    </Card>

    <!-- 支出结构树图 -->
    <Card class="mb-6" title="🌳 支出结构分析">
      <div ref="expenseTreeChart" style="width: 100%; height: 500px"></div>
    </Card>

    <!-- 分类健康度评分 -->
    <Card class="mb-6" title="💪 分类健康度评分">
      <div class="space-y-3">
        <div
          v-for="health in categoryHealthScores"
          :key="health.categoryId"
          class="flex items-center justify-between rounded-lg bg-gray-50 p-3"
        >
          <div class="flex items-center space-x-3">
            <span class="text-2xl">{{ health.icon }}</span>
            <div>
              <p class="font-semibold">{{ health.categoryName }}</p>
              <p class="text-xs text-gray-500">
                ¥{{
                  health.amount.toLocaleString('zh-CN', {
                    minimumFractionDigits: 2,
                  })
                }}
                | {{ health.count }}笔
              </p>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <div class="w-32">
              <Progress
                :percent="health.percentage"
                :status="health.status"
                :stroke-color="health.color"
              />
            </div>
            <Badge :color="health.badgeColor" :text="health.healthLabel" />
          </div>
        </div>
      </div>
    </Card>

    <!-- 异常检测 -->
    <Card v-if="anomalies.length > 0" title="⚠️ 异常交易检测" class="mb-6">
      <Alert
        message="发现异常交易"
        :description="`检测到 ${anomalies.length} 笔可能需要关注的交易`"
        type="warning"
        show-icon
        class="mb-4"
      />
      <div class="space-y-2">
        <div
          v-for="anomaly in anomalies"
          :key="anomaly.id"
          class="rounded border-l-4 border-orange-500 bg-orange-50 p-3"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="font-semibold">{{ anomaly.description }}</p>
              <p class="text-sm text-gray-600">
                {{ anomaly.date }} | {{ anomaly.category }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-lg font-bold text-red-600">
                -¥{{
                  anomaly.amount.toLocaleString('zh-CN', {
                    minimumFractionDigits: 2,
                  })
                }}
              </p>
              <p class="text-xs text-orange-600">{{ anomaly.reason }}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>

    <!-- 月度表格视图 -->
    <Card title="📋 月度数据表格" class="mb-6">
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <Select
            v-model:value="tableViewYear"
            style="width: 120px"
            @change="handleTableYearChange"
          >
            <Select.Option
              v-for="year in availableYears"
              :key="year"
              :value="year"
            >
              {{ year }}年
            </Select.Option>
          </Select>
          <Radio.Group v-model:value="tableViewMode" button-style="solid">
            <Radio.Button value="summary">收支汇总</Radio.Button>
            <Radio.Button value="category">分类明细</Radio.Button>
          </Radio.Group>
        </div>
        <Button type="primary" @click="exportMonthlyTable">
          📥 导出Excel
        </Button>
      </div>

      <!-- 汇总视图 -->
      <Table
        v-if="tableViewMode === 'summary'"
        :columns="summaryTableColumns"
        :data-source="monthlyTableData"
        :pagination="false"
        :scroll="{ x: 800 }"
        bordered
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'income'">
            <span class="font-semibold text-green-600">
              ¥{{
                record.income.toLocaleString('zh-CN', {
                  minimumFractionDigits: 2,
                })
              }}
            </span>
          </template>
          <template v-else-if="column.key === 'expense'">
            <span class="font-semibold text-red-600">
              ¥{{
                record.expense.toLocaleString('zh-CN', {
                  minimumFractionDigits: 2,
                })
              }}
            </span>
          </template>
          <template v-else-if="column.key === 'net'">
            <span
              :class="record.net >= 0 ? 'text-green-600' : 'text-red-600'"
              class="font-bold"
            >
              {{ record.net >= 0 ? '+' : '' }}¥{{
                record.net.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
              }}
            </span>
          </template>
          <template v-else-if="column.key === 'savingsRate'">
            <span
              :class="
                record.savingsRate >= 30
                  ? 'text-green-600'
                  : record.savingsRate >= 10
                    ? 'text-orange-600'
                    : 'text-red-600'
              "
            >
              {{ record.savingsRate }}%
            </span>
          </template>
        </template>
      </Table>

      <!-- 分类明细视图 -->
      <Table
        v-else
        :columns="categoryTableColumns"
        :data-source="monthlyCategoryData"
        :pagination="false"
        :scroll="{ x: 1200 }"
        bordered
      >
        <template #bodyCell="{ column, record }">
          <template
            v-if="column.dataIndex !== 'month' && column.dataIndex !== 'total'"
          >
            <div v-if="record[column.dataIndex]">
              <div class="font-semibold">
                ¥{{
                  record[column.dataIndex].amount.toLocaleString('zh-CN', {
                    minimumFractionDigits: 2,
                  })
                }}
              </div>
              <div class="text-xs text-gray-500">
                {{ record[column.dataIndex].percentage }}%
              </div>
            </div>
            <div v-else class="text-gray-400">-</div>
          </template>
          <template v-else-if="column.key === 'total'">
            <span class="font-bold text-red-600">
              ¥{{
                record.total.toLocaleString('zh-CN', {
                  minimumFractionDigits: 2,
                })
              }}
            </span>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>

<style scoped>
.ant-card {
  border-radius: 8px;
}
</style>
