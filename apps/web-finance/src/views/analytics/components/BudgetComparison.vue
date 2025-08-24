<script setup lang="ts">
import type { Budget, Category, Transaction } from '#/types/finance';
import type { EChartsOption } from '#/components/charts/useChart';

import { computed, onMounted, ref, watch } from 'vue';

import { Card, Progress, Tag, Empty, Alert } from 'ant-design-vue';
import { WarningOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons-vue';

import { useChart } from '#/components/charts/useChart';
import { budgetApi } from '#/api/finance';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  month: string; // YYYY-MM
}

const props = defineProps<Props>();

const chartRef = ref<HTMLDivElement | null>(null);
const { setOptions } = useChart(chartRef);
const budgets = ref<Budget[]>([]);
const loading = ref(false);

// 获取预算数据
const fetchBudgets = async () => {
  loading.value = true;
  try {
    const [year, month] = props.month.split('-');
    const result = await budgetApi.getList({
      year: parseInt(year),
      month: parseInt(month),
      page: 1,
      pageSize: 100,
    });
    budgets.value = result.data.items || [];
  } catch (error) {
    console.error('Failed to fetch budgets:', error);
    budgets.value = [];
  } finally {
    loading.value = false;
  }
};

// 计算预算执行情况
const budgetExecution = computed(() => {
  if (!budgets.value.length) return [];
  
  const categoryMap = new Map(props.categories.map(c => [c.id, c]));
  const expenseByCategory = new Map<string, number>();
  
  // 统计各分类的实际支出
  props.transactions
    .filter(t => t.type === 'expense' && t.categoryId)
    .forEach(t => {
      const current = expenseByCategory.get(t.categoryId) || 0;
      expenseByCategory.set(t.categoryId, current + t.amount);
    });
  
  // 计算每个预算的执行情况
  return budgets.value.map(budget => {
    const category = categoryMap.get(budget.categoryId);
    const actual = expenseByCategory.get(budget.categoryId) || 0;
    const percentage = budget.amount > 0 ? (actual / budget.amount) * 100 : 0;
    const remaining = budget.amount - actual;
    
    return {
      id: budget.id,
      categoryId: budget.categoryId,
      categoryName: category?.name || '未知分类',
      categoryIcon: category?.icon,
      budgetAmount: budget.amount,
      actualAmount: actual,
      remaining,
      percentage: Math.min(percentage, 200), // 最大显示200%
      status: percentage <= 80 ? 'safe' : percentage <= 100 ? 'warning' : 'danger',
      overBudget: actual > budget.amount,
    };
  }).sort((a, b) => b.percentage - a.percentage);
});

// 汇总统计
const summary = computed(() => {
  const totalBudget = budgetExecution.value.reduce((sum, item) => sum + item.budgetAmount, 0);
  const totalActual = budgetExecution.value.reduce((sum, item) => sum + item.actualAmount, 0);
  const overBudgetCount = budgetExecution.value.filter(item => item.overBudget).length;
  const safeCount = budgetExecution.value.filter(item => item.status === 'safe').length;
  
  return {
    totalBudget,
    totalActual,
    totalPercentage: totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0,
    overBudgetCount,
    safeCount,
    totalCount: budgetExecution.value.length,
  };
});

// 图表配置
const chartOptions = computed<EChartsOption>(() => {
  const data = budgetExecution.value.slice(0, 10); // 显示前10个
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: any) => {
        const item = params[0];
        const budget = data[item.dataIndex];
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${budget.categoryName}</div>
            <div>预算: ¥${budget.budgetAmount.toFixed(2)}</div>
            <div>实际: ¥${budget.actualAmount.toFixed(2)}</div>
            <div>执行率: ${budget.percentage.toFixed(1)}%</div>
            <div style="color: ${budget.overBudget ? '#ff4d4f' : '#52c41a'}">
              ${budget.overBudget ? '超支' : '剩余'}: ¥${Math.abs(budget.remaining).toFixed(2)}
            </div>
          </div>
        `;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      max: 150,
      axisLabel: {
        formatter: '{value}%',
      },
      splitLine: {
        lineStyle: {
          type: 'dashed',
        },
      },
    },
    yAxis: {
      type: 'category',
      data: data.map(item => item.categoryName).reverse(),
      axisLabel: {
        width: 80,
        overflow: 'truncate',
      },
    },
    series: [
      {
        name: '执行率',
        type: 'bar',
        data: data.map(item => ({
          value: item.percentage,
          itemStyle: {
            color: item.percentage <= 80 ? '#52c41a' : 
                   item.percentage <= 100 ? '#faad14' : '#ff4d4f',
          },
        })).reverse(),
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
        },
        markLine: {
          data: [
            {
              xAxis: 100,
              label: {
                formatter: '预算线',
              },
              lineStyle: {
                color: '#ff4d4f',
                type: 'dashed',
              },
            },
          ],
        },
      },
    ],
  };
});

// 获取状态图标
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'safe':
      return CheckCircleOutlined;
    case 'warning':
      return WarningOutlined;
    case 'danger':
      return CloseCircleOutlined;
    default:
      return null;
  }
};

// 获取状态颜色
const getStatusColor = (status: string) => {
  switch (status) {
    case 'safe':
      return '#52c41a';
    case 'warning':
      return '#faad14';
    case 'danger':
      return '#ff4d4f';
    default:
      return '#d9d9d9';
  }
};

// 格式化金额
const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

onMounted(() => {
  fetchBudgets();
});

watch(() => props.month, () => {
  fetchBudgets();
});

watch(chartOptions, (options) => {
  setOptions(options);
});
</script>

<template>
  <div class="budget-comparison">
    <!-- 汇总信息 -->
    <Alert
      v-if="summary.totalCount > 0"
      :type="summary.totalPercentage <= 80 ? 'success' : summary.totalPercentage <= 100 ? 'warning' : 'error'"
      :message="`预算总执行率: ${summary.totalPercentage.toFixed(1)}%`"
      show-icon
      class="mb-4"
    >
      <template #description>
        <div class="flex items-center gap-4 text-sm">
          <span>总预算: {{ formatAmount(summary.totalBudget) }}</span>
          <span>已支出: {{ formatAmount(summary.totalActual) }}</span>
          <span>{{ summary.safeCount }}项安全</span>
          <span v-if="summary.overBudgetCount > 0" class="text-red-500">
            {{ summary.overBudgetCount }}项超支
          </span>
        </div>
      </template>
    </Alert>

    <!-- 图表 -->
    <Card v-if="budgetExecution.length > 0" class="mb-4">
      <div ref="chartRef" style="height: 400px;"></div>
    </Card>

    <!-- 详细列表 -->
    <div v-if="budgetExecution.length > 0" class="budget-list">
      <div
        v-for="item in budgetExecution"
        :key="item.id"
        class="budget-item"
      >
        <div class="budget-header">
          <div class="flex items-center gap-2">
            <span class="category-icon">{{ item.categoryIcon || '📊' }}</span>
            <span class="category-name">{{ item.categoryName }}</span>
            <Tag :color="getStatusColor(item.status)">
              <component :is="getStatusIcon(item.status)" />
              {{ item.status === 'safe' ? '正常' : item.status === 'warning' ? '警告' : '超支' }}
            </Tag>
          </div>
          <div class="budget-amount">
            <span class="actual">{{ formatAmount(item.actualAmount) }}</span>
            <span class="separator">/</span>
            <span class="budget">{{ formatAmount(item.budgetAmount) }}</span>
          </div>
        </div>
        <Progress
          :percent="item.percentage"
          :stroke-color="getStatusColor(item.status)"
          :format="percent => `${percent.toFixed(1)}%`"
        />
        <div class="budget-footer">
          <span v-if="!item.overBudget" class="remaining safe">
            剩余: {{ formatAmount(item.remaining) }}
          </span>
          <span v-else class="remaining danger">
            超支: {{ formatAmount(Math.abs(item.remaining)) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <Empty
      v-else-if="!loading"
      description="暂无预算数据"
      :image="Empty.PRESENTED_IMAGE_SIMPLE"
    >
      <template #extra>
        <div class="text-gray-500">
          请先在预算管理中设置本月预算
        </div>
      </template>
    </Empty>
  </div>
</template>

<style scoped>
.budget-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.budget-item {
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fff;
  transition: all 0.3s;
}

.budget-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.budget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.category-icon {
  font-size: 20px;
}

.category-name {
  font-weight: 500;
  color: #262626;
}

.budget-amount {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 14px;
}

.budget-amount .actual {
  font-weight: 600;
  color: #262626;
}

.budget-amount .separator {
  color: #8c8c8c;
}

.budget-amount .budget {
  color: #8c8c8c;
}

.budget-footer {
  margin-top: 8px;
  font-size: 12px;
}

.remaining {
  padding: 2px 8px;
  border-radius: 4px;
}

.remaining.safe {
  color: #52c41a;
  background: #f6ffed;
}

.remaining.danger {
  color: #ff4d4f;
  background: #fff2f0;
}
</style>