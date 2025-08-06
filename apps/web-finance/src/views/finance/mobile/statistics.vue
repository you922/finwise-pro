<template>
  <div class="mobile-statistics">
    <!-- 时间选择器 -->
    <div class="period-selector">
      <RadioGroup v-model:value="period" buttonStyle="solid" size="small">
        <RadioButton value="week">本周</RadioButton>
        <RadioButton value="month">本月</RadioButton>
        <RadioButton value="year">本年</RadioButton>
        <RadioButton value="custom">自定义</RadioButton>
      </RadioGroup>
    </div>
    
    <!-- 自定义日期范围 -->
    <div v-if="period === 'custom'" class="custom-range">
      <RangePicker
        v-model:value="customRange"
        style="width: 100%"
        @change="fetchStatistics"
      />
    </div>
    
    <!-- 总览卡片 -->
    <div class="overview-cards">
      <div class="overview-card income">
        <div class="card-label">总收入</div>
        <div class="card-value">¥{{ statistics.totalIncome.toFixed(2) }}</div>
        <div class="card-count">{{ statistics.incomeCount }} 笔</div>
      </div>
      <div class="overview-card expense">
        <div class="card-label">总支出</div>
        <div class="card-value">¥{{ statistics.totalExpense.toFixed(2) }}</div>
        <div class="card-count">{{ statistics.expenseCount }} 笔</div>
      </div>
      <div class="overview-card balance">
        <div class="card-label">结余</div>
        <div class="card-value">¥{{ statistics.balance.toFixed(2) }}</div>
        <div class="card-trend" :class="{ positive: statistics.balance > 0 }">
          {{ statistics.balance > 0 ? '盈余' : '赤字' }}
        </div>
      </div>
    </div>
    
    <!-- 图表切换 -->
    <div class="chart-tabs">
      <Tabs v-model:activeKey="chartType">
        <TabPane key="category" tab="分类统计">
          <div class="chart-container">
            <div ref="categoryChartRef" class="chart"></div>
          </div>
          
          <!-- 分类排行 -->
          <div class="category-ranking">
            <div class="ranking-header">
              <span>支出排行</span>
              <span>金额</span>
            </div>
            <div
              v-for="(item, index) in categoryRanking"
              :key="item.categoryId"
              class="ranking-item"
            >
              <div class="ranking-info">
                <span class="ranking-index">{{ index + 1 }}</span>
                <span class="category-icon">{{ item.icon }}</span>
                <span class="category-name">{{ item.name }}</span>
              </div>
              <div class="ranking-amount">
                <span>¥{{ item.amount.toFixed(2) }}</span>
                <span class="percentage">{{ item.percentage }}%</span>
              </div>
            </div>
          </div>
        </TabPane>
        
        <TabPane key="trend" tab="趋势分析">
          <div class="chart-container">
            <div ref="trendChartRef" class="chart"></div>
          </div>
        </TabPane>
        
        <TabPane key="daily" tab="每日统计">
          <div class="daily-statistics">
            <div class="daily-average">
              <div class="average-item">
                <div class="average-label">日均支出</div>
                <div class="average-value">¥{{ dailyAverage.expense.toFixed(2) }}</div>
              </div>
              <div class="average-item">
                <div class="average-label">日均收入</div>
                <div class="average-value">¥{{ dailyAverage.income.toFixed(2) }}</div>
              </div>
            </div>
            
            <div ref="dailyChartRef" class="chart"></div>
          </div>
        </TabPane>
      </Tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Dayjs } from 'dayjs';
import type { EChartsOption } from 'echarts';

import { DatePicker, Radio, Tabs, TabPane } from 'ant-design-vue';
import dayjs from 'dayjs';
import * as echarts from 'echarts';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

import { useCategoryStore } from '#/store/modules/category';
import { useTransactionStore } from '#/store/modules/transaction';

const { RangePicker } = DatePicker;
const { RadioGroup, RadioButton } = Radio;

const categoryStore = useCategoryStore();
const transactionStore = useTransactionStore();

const period = ref<'week' | 'month' | 'year' | 'custom'>('month');
const customRange = ref<[Dayjs, Dayjs]>([dayjs().startOf('month'), dayjs()]);
const chartType = ref('category');

const categoryChartRef = ref<HTMLDivElement>();
const trendChartRef = ref<HTMLDivElement>();
const dailyChartRef = ref<HTMLDivElement>();

let categoryChart: echarts.ECharts | null = null;
let trendChart: echarts.ECharts | null = null;
let dailyChart: echarts.ECharts | null = null;

const dateRange = computed(() => {
  const now = dayjs();
  switch (period.value) {
    case 'week':
      return [now.startOf('week'), now.endOf('week')];
    case 'month':
      return [now.startOf('month'), now.endOf('month')];
    case 'year':
      return [now.startOf('year'), now.endOf('year')];
    case 'custom':
      return customRange.value;
    default:
      return [now.startOf('month'), now.endOf('month')];
  }
});

const filteredTransactions = computed(() => {
  const [start, end] = dateRange.value;
  return transactionStore.transactions.filter((t) => {
    const date = dayjs(t.date);
    return date.isAfter(start.subtract(1, 'day')) && date.isBefore(end.add(1, 'day'));
  });
});

const statistics = computed(() => {
  const stats = {
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    incomeCount: 0,
    expenseCount: 0,
  };

  filteredTransactions.value.forEach((t) => {
    if (t.type === 'income') {
      stats.totalIncome += t.amount;
      stats.incomeCount++;
    } else {
      stats.totalExpense += t.amount;
      stats.expenseCount++;
    }
  });

  stats.balance = stats.totalIncome - stats.totalExpense;
  return stats;
});

const categoryRanking = computed(() => {
  const categoryMap = new Map<string, { amount: number; count: number }>();

  filteredTransactions.value
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const current = categoryMap.get(t.categoryId) || { amount: 0, count: 0 };
      current.amount += t.amount;
      current.count++;
      categoryMap.set(t.categoryId, current);
    });

  const totalExpense = statistics.value.totalExpense || 1;

  return Array.from(categoryMap.entries())
    .map(([categoryId, data]) => {
      const category = categoryStore.categories.find((c) => c.id === categoryId);
      return {
        categoryId,
        name: category?.name || '未知分类',
        icon: category?.icon || '📁',
        amount: data.amount,
        count: data.count,
        percentage: Math.round((data.amount / totalExpense) * 100),
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);
});

const dailyAverage = computed(() => {
  const days = dateRange.value[1].diff(dateRange.value[0], 'day') + 1;
  return {
    income: statistics.value.totalIncome / days,
    expense: statistics.value.totalExpense / days,
  };
});

const initCategoryChart = () => {
  if (!categoryChartRef.value) return;

  categoryChart = echarts.init(categoryChartRef.value);
  const data = categoryRanking.value.slice(0, 5);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: data.map((item) => ({
          value: item.amount,
          name: item.name,
        })),
      },
    ],
  };

  categoryChart.setOption(option);
};

const initTrendChart = () => {
  if (!trendChartRef.value) return;

  trendChart = echarts.init(trendChartRef.value);

  // 生成趋势数据
  const days = dateRange.value[1].diff(dateRange.value[0], 'day') + 1;
  const dates: string[] = [];
  const incomeData: number[] = [];
  const expenseData: number[] = [];

  for (let i = 0; i < days; i++) {
    const date = dateRange.value[0].add(i, 'day').format('YYYY-MM-DD');
    dates.push(dayjs(date).format('MM-DD'));

    const dayTransactions = filteredTransactions.value.filter(
      (t) => t.date === date
    );

    const income = dayTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = dayTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    incomeData.push(income);
    expenseData.push(expense);
  }

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
    },
    legend: {
      data: ['收入', '支出'],
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
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
        smooth: true,
        itemStyle: {
          color: '#52c41a',
        },
        areaStyle: {
          opacity: 0.3,
        },
        data: incomeData,
      },
      {
        name: '支出',
        type: 'line',
        smooth: true,
        itemStyle: {
          color: '#f5222d',
        },
        areaStyle: {
          opacity: 0.3,
        },
        data: expenseData,
      },
    ],
  };

  trendChart.setOption(option);
};

const initDailyChart = () => {
  if (!dailyChartRef.value) return;

  dailyChart = echarts.init(dailyChartRef.value);

  // 生成每日数据
  const dayOfWeekData = Array(7).fill(0).map(() => ({ income: 0, expense: 0, count: 0 }));
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  filteredTransactions.value.forEach((t) => {
    const dayOfWeek = dayjs(t.date).day();
    if (t.type === 'income') {
      dayOfWeekData[dayOfWeek].income += t.amount;
    } else {
      dayOfWeekData[dayOfWeek].expense += t.amount;
    }
    dayOfWeekData[dayOfWeek].count++;
  });

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      data: ['收入', '支出'],
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: dayNames,
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
        type: 'bar',
        itemStyle: {
          color: '#52c41a',
        },
        data: dayOfWeekData.map((d) => d.income),
      },
      {
        name: '支出',
        type: 'bar',
        itemStyle: {
          color: '#f5222d',
        },
        data: dayOfWeekData.map((d) => d.expense),
      },
    ],
  };

  dailyChart.setOption(option);
};

const fetchStatistics = () => {
  // 刷新图表
  setTimeout(() => {
    if (chartType.value === 'category') {
      initCategoryChart();
    } else if (chartType.value === 'trend') {
      initTrendChart();
    } else if (chartType.value === 'daily') {
      initDailyChart();
    }
  }, 100);
};

const handleResize = () => {
  categoryChart?.resize();
  trendChart?.resize();
  dailyChart?.resize();
};

watch([period, chartType], fetchStatistics);

onMounted(async () => {
  await transactionStore.fetchTransactions();
  await categoryStore.fetchCategories();
  
  window.addEventListener('resize', handleResize);
  fetchStatistics();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  categoryChart?.dispose();
  trendChart?.dispose();
  dailyChart?.dispose();
});
</script>

<style scoped>
.mobile-statistics {
  background: #f5f5f5;
  min-height: 100%;
  padding: 12px;
}

.period-selector {
  background: #fff;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
  display: flex;
  justify-content: center;
}

.custom-range {
  background: #fff;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.overview-card {
  background: #fff;
  padding: 12px 8px;
  border-radius: 8px;
  text-align: center;
}

.overview-card.income {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  color: #fff;
}

.overview-card.expense {
  background: linear-gradient(135deg, #f5222d 0%, #ff4d4f 100%);
  color: #fff;
}

.overview-card.balance {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  color: #fff;
}

.card-label {
  font-size: 12px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.card-value {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 2px;
}

.card-count,
.card-trend {
  font-size: 11px;
  opacity: 0.8;
}

.chart-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 0;
}

:deep(.ant-tabs-nav) {
  margin: 0;
  padding: 0 12px;
}

.chart-container {
  padding: 12px;
}

.chart {
  width: 100%;
  height: 250px;
}

.category-ranking {
  padding: 0 12px 12px;
}

.ranking-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #8c8c8c;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.ranking-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.ranking-item:last-child {
  border-bottom: none;
}

.ranking-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ranking-index {
  width: 20px;
  text-align: center;
  font-size: 12px;
  color: #8c8c8c;
}

.category-icon {
  font-size: 18px;
}

.category-name {
  font-size: 14px;
  color: #262626;
}

.ranking-amount {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ranking-amount span:first-child {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.percentage {
  font-size: 12px;
  color: #8c8c8c;
}

.daily-statistics {
  padding: 12px;
}

.daily-average {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.average-item {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
}

.average-label {
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.average-value {
  font-size: 16px;
  font-weight: 500;
  color: #262626;
}
</style>