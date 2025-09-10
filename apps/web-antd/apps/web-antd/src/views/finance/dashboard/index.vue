<template>
  <div class="p-4">
    <PageWrapper title="财务仪表板" content="全面的财务数据概览与实时监控">
      <!-- 核心指标卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card v-for="metric in keyMetrics" :key="metric.title" class="hover:shadow-lg transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 mb-1">{{ metric.title }}</p>
              <p class="text-2xl font-bold" :class="metric.color">{{ metric.value }}</p>
              <p class="text-xs" :class="metric.trend > 0 ? 'text-green-500' : 'text-red-500'">
                {{ metric.trend > 0 ? '↗' : '↘' }} {{ Math.abs(metric.trend) }}%
              </p>
            </div>
            <div :class="metric.iconBg" class="w-12 h-12 rounded-lg flex items-center justify-center">
              <Icon :icon="metric.icon" class="text-xl text-white" />
            </div>
          </div>
        </Card>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 收支趋势图 -->
        <Card class="lg:col-span-2" title="收支趋势分析">
          <template #extra>
            <RangePicker v-model:value="dateRange" @change="updateCharts" />
          </template>
          <div ref="trendChartRef" style="height: 350px"></div>
        </Card>

        <!-- 支出分类饼图 -->
        <Card title="支出分类分布">
          <div ref="expenseChartRef" style="height: 350px"></div>
        </Card>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <!-- 最近交易 -->
        <Card title="最近交易记录">
          <template #extra>
            <Button type="link" @click="$router.push('/finance/transactions')">查看全部</Button>
          </template>
          <Table
            :columns="transactionColumns"
            :dataSource="recentTransactions"
            :pagination="false"
            size="small"
          />
        </Card>

        <!-- 账户余额 -->
        <Card title="账户余额">
          <template #extra>
            <Button type="link" @click="$router.push('/finance/accounts')">管理账户</Button>
          </template>
          <div class="space-y-3">
            <div v-for="account in accounts" :key="account.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div class="flex items-center space-x-3">
                <div :class="account.color" class="w-3 h-3 rounded-full"></div>
                <span class="font-medium">{{ account.name }}</span>
              </div>
              <div class="text-right">
                <p class="font-semibold" :class="account.balance >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ formatCurrency(account.balance) }}
                </p>
                <p class="text-xs text-gray-500">{{ account.type }}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <!-- 预算进度 -->
      <Card class="mt-6" title="本月预算执行情况">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="budget in budgets" :key="budget.category" class="p-4 border border-gray-200 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium">{{ budget.category }}</span>
              <span class="text-sm text-gray-500">{{ budget.spent }} / {{ budget.limit }}</span>
            </div>
            <Progress
              :percent="budget.percentage"
              :stroke-color="budget.percentage > 90 ? '#ff4d4f' : budget.percentage > 70 ? '#faad14' : '#52c41a'"
            />
            <div class="flex justify-between mt-1 text-xs text-gray-500">
              <span>已用: {{ formatCurrency(budget.spentAmount) }}</span>
              <span>剩余: {{ formatCurrency(budget.remaining) }}</span>
            </div>
          </div>
        </div>
      </Card>

      <!-- 财务目标 -->
      <Card class="mt-6" title="财务目标">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="goal in financialGoals" :key="goal.title" class="p-4 border border-gray-200 rounded-lg">
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-medium">{{ goal.title }}</h4>
              <Tag :color="goal.status === 'completed' ? 'green' : goal.status === 'in_progress' ? 'blue' : 'orange'">
                {{ goal.statusText }}
              </Tag>
            </div>
            <Progress :percent="goal.progress" />
            <div class="mt-2 text-sm text-gray-600">
              <p>目标: {{ formatCurrency(goal.target) }}</p>
              <p>当前: {{ formatCurrency(goal.current) }}</p>
              <p>剩余时间: {{ goal.timeLeft }}</p>
            </div>
          </div>
        </div>
      </Card>
    </PageWrapper>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, nextTick } from 'vue';
import * as echarts from 'echarts';
import { PageWrapper } from '@vben/common-ui';
import { Card, Table, Button, Progress, Tag, RangePicker } from 'ant-design-vue';
import { Icon } from '@iconify/vue';

defineOptions({ name: 'FinanceDashboard' });

const trendChartRef = ref();
const expenseChartRef = ref();
const dateRange = ref();

// 核心指标
const keyMetrics = ref([
  {
    title: '总资产',
    value: '¥1,234,567',
    trend: 12.5,
    color: 'text-blue-600',
    icon: 'mdi:bank',
    iconBg: 'bg-blue-500'
  },
  {
    title: '本月收入',
    value: '¥45,680',
    trend: 8.2,
    color: 'text-green-600',
    icon: 'mdi:trending-up',
    iconBg: 'bg-green-500'
  },
  {
    title: '本月支出',
    value: '¥23,450',
    trend: -5.1,
    color: 'text-red-600',
    icon: 'mdi:trending-down',
    iconBg: 'bg-red-500'
  },
  {
    title: '净利润',
    value: '¥22,230',
    trend: 15.3,
    color: 'text-purple-600',
    icon: 'mdi:chart-line',
    iconBg: 'bg-purple-500'
  }
]);

// 最近交易
const transactionColumns = [
  { title: '时间', dataIndex: 'date', key: 'date' },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '分类', dataIndex: 'category', key: 'category' },
  { title: '金额', dataIndex: 'amount', key: 'amount' },
];

const recentTransactions = ref([
  {
    key: '1',
    date: '2024-12-28',
    description: '超市购物',
    category: '生活费用',
    amount: '¥-156.80'
  },
  {
    key: '2',
    date: '2024-12-28',
    description: '工资收入',
    category: '薪资',
    amount: '¥12,000.00'
  },
  {
    key: '3',
    date: '2024-12-27',
    description: '餐饮消费',
    category: '生活费用',
    amount: '¥-89.50'
  },
  {
    key: '4',
    date: '2024-12-27',
    description: '投资收益',
    category: '投资',
    amount: '¥+850.00'
  }
]);

// 账户信息
const accounts = ref([
  {
    id: '1',
    name: '工商银行储蓄卡',
    balance: 45680.50,
    type: '储蓄账户',
    color: 'bg-blue-500'
  },
  {
    id: '2',
    name: '支付宝余额',
    balance: 12345.67,
    type: '电子钱包',
    color: 'bg-blue-400'
  },
  {
    id: '3',
    name: '投资理财账户',
    balance: 98765.43,
    type: '投资账户',
    color: 'bg-green-500'
  },
  {
    id: '4',
    name: '信用卡（招商银行）',
    balance: -5632.10,
    type: '信用账户',
    color: 'bg-red-500'
  }
]);

// 预算数据
const budgets = ref([
  {
    category: '餐饮',
    spent: '1,234',
    limit: '2,000',
    spentAmount: 1234,
    remaining: 766,
    percentage: 61.7
  },
  {
    category: '交通',
    spent: '856',
    limit: '1,000',
    spentAmount: 856,
    remaining: 144,
    percentage: 85.6
  },
  {
    category: '娱乐',
    spent: '1,890',
    limit: '1,500',
    spentAmount: 1890,
    remaining: -390,
    percentage: 126
  },
  {
    category: '购物',
    spent: '2,456',
    limit: '3,000',
    spentAmount: 2456,
    remaining: 544,
    percentage: 81.9
  }
]);

// 财务目标
const financialGoals = ref([
  {
    title: '紧急基金',
    target: 100000,
    current: 65000,
    progress: 65,
    status: 'in_progress',
    statusText: '进行中',
    timeLeft: '3个月'
  },
  {
    title: '买房首付',
    target: 500000,
    current: 280000,
    progress: 56,
    status: 'in_progress',
    statusText: '进行中',
    timeLeft: '18个月'
  },
  {
    title: '度假基金',
    target: 20000,
    current: 20000,
    progress: 100,
    status: 'completed',
    statusText: '已完成',
    timeLeft: '已达成'
  },
  {
    title: '退休储蓄',
    target: 1000000,
    current: 120000,
    progress: 12,
    status: 'pending',
    statusText: '计划中',
    timeLeft: '15年'
  }
]);

// 格式化货币
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(amount);
};

// 初始化图表
const initTrendChart = () => {
  const chart = echarts.init(trendChartRef.value);
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['收入', '支出', '净收入']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}'
      }
    },
    series: [
      {
        name: '收入',
        type: 'line',
        data: [8200, 9320, 9010, 9340, 12900, 13300, 13900, 14200, 15100, 15600, 16200, 16800],
        smooth: true,
        itemStyle: { color: '#52c41a' },
        areaStyle: { opacity: 0.3, color: '#52c41a' }
      },
      {
        name: '支出',
        type: 'line',
        data: [6200, 7120, 7350, 7890, 8200, 8650, 9100, 9400, 9800, 10200, 10600, 11000],
        smooth: true,
        itemStyle: { color: '#ff4d4f' },
        areaStyle: { opacity: 0.3, color: '#ff4d4f' }
      },
      {
        name: '净收入',
        type: 'bar',
        data: [2000, 2200, 1660, 1450, 4700, 4650, 4800, 4800, 5300, 5400, 5600, 5800],
        itemStyle: { color: '#1890ff' }
      }
    ]
  };
  
  chart.setOption(option);
  
  // 响应式
  window.addEventListener('resize', () => chart.resize());
};

const initExpenseChart = () => {
  const chart = echarts.init(expenseChartRef.value);
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '支出分布',
        type: 'pie',
        radius: '70%',
        center: ['60%', '50%'],
        data: [
          { value: 3500, name: '餐饮', itemStyle: { color: '#ff7875' } },
          { value: 2800, name: '交通', itemStyle: { color: '#40a9ff' } },
          { value: 2100, name: '购物', itemStyle: { color: '#36cfc9' } },
          { value: 1500, name: '娱乐', itemStyle: { color: '#ffc53d' } },
          { value: 1200, name: '医疗', itemStyle: { color: '#b37feb' } },
          { value: 900, name: '其他', itemStyle: { color: '#95de64' } }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };
  
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
};

const updateCharts = () => {
  // 更新图表数据（这里可以根据日期范围重新获取数据）
  console.log('更新图表数据:', dateRange.value);
};

onMounted(async () => {
  await nextTick();
  initTrendChart();
  initExpenseChart();
});
</script>

<style scoped>
.grid {
  display: grid;
}
</style>