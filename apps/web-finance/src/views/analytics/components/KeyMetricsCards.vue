<script setup lang="ts">
import type { Transaction } from '#/types/finance';

import { computed } from 'vue';

import { Card, Col, Row, Statistic } from 'ant-design-vue';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BankOutlined,
  MoneyCollectOutlined,
  PayCircleOutlined,
  TrendingUpOutlined,
} from '@ant-design/icons-vue';
import dayjs from 'dayjs';

interface Props {
  transactions: Transaction[];
  dateRange: [string, string];
  previousPeriodTransactions?: Transaction[];
}

const props = defineProps<Props>();

// 计算当前期间的统计数据
const currentMetrics = computed(() => {
  const income = props.transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expense = props.transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = income - expense;
  
  // 计算天数
  const days = dayjs(props.dateRange[1]).diff(dayjs(props.dateRange[0]), 'day') + 1;
  const avgDaily = balance / days;
  
  // 找出最大单笔
  const maxIncome = Math.max(
    0,
    ...props.transactions
      .filter((t) => t.type === 'income')
      .map((t) => t.amount)
  );
  
  const maxExpense = Math.max(
    0,
    ...props.transactions
      .filter((t) => t.type === 'expense')
      .map((t) => t.amount)
  );
  
  return {
    income,
    expense,
    balance,
    avgDaily,
    maxIncome,
    maxExpense,
    transactionCount: props.transactions.length,
    days,
  };
});

// 计算同比环比数据
const comparisonMetrics = computed(() => {
  if (!props.previousPeriodTransactions?.length) {
    return null;
  }
  
  const prevIncome = props.previousPeriodTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const prevExpense = props.previousPeriodTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const incomeChange = prevIncome ? ((currentMetrics.value.income - prevIncome) / prevIncome) * 100 : 0;
  const expenseChange = prevExpense ? ((currentMetrics.value.expense - prevExpense) / prevExpense) * 100 : 0;
  
  return {
    incomeChange,
    expenseChange,
  };
});

// 格式化金额
const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// 获取趋势颜色
const getTrendColor = (value: number, isExpense = false) => {
  if (value === 0) return '#8c8c8c';
  if (isExpense) {
    return value > 0 ? '#ff4d4f' : '#52c41a';
  }
  return value > 0 ? '#52c41a' : '#ff4d4f';
};
</script>

<template>
  <div class="key-metrics-cards">
    <Row :gutter="[16, 16]">
      <!-- 总收入 -->
      <Col :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
        <Card class="metric-card">
          <Statistic
            :title="'总收入'"
            :value="currentMetrics.income"
            :precision="2"
            :prefix="'¥'"
            :value-style="{ color: '#52c41a' }"
          >
            <template #prefix>
              <MoneyCollectOutlined />
            </template>
            <template #suffix v-if="comparisonMetrics">
              <span :style="{ fontSize: '14px', color: getTrendColor(comparisonMetrics.incomeChange) }">
                <ArrowUpOutlined v-if="comparisonMetrics.incomeChange > 0" />
                <ArrowDownOutlined v-else-if="comparisonMetrics.incomeChange < 0" />
                {{ Math.abs(comparisonMetrics.incomeChange).toFixed(1) }}%
              </span>
            </template>
          </Statistic>
          <div class="metric-sub-info">
            最大单笔: {{ formatAmount(currentMetrics.maxIncome) }}
          </div>
        </Card>
      </Col>

      <!-- 总支出 -->
      <Col :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
        <Card class="metric-card">
          <Statistic
            :title="'总支出'"
            :value="currentMetrics.expense"
            :precision="2"
            :prefix="'¥'"
            :value-style="{ color: '#ff4d4f' }"
          >
            <template #prefix>
              <PayCircleOutlined />
            </template>
            <template #suffix v-if="comparisonMetrics">
              <span :style="{ fontSize: '14px', color: getTrendColor(comparisonMetrics.expenseChange, true) }">
                <ArrowUpOutlined v-if="comparisonMetrics.expenseChange > 0" />
                <ArrowDownOutlined v-else-if="comparisonMetrics.expenseChange < 0" />
                {{ Math.abs(comparisonMetrics.expenseChange).toFixed(1) }}%
              </span>
            </template>
          </Statistic>
          <div class="metric-sub-info">
            最大单笔: {{ formatAmount(currentMetrics.maxExpense) }}
          </div>
        </Card>
      </Col>

      <!-- 净收益 -->
      <Col :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
        <Card class="metric-card">
          <Statistic
            :title="'净收益'"
            :value="currentMetrics.balance"
            :precision="2"
            :prefix="'¥'"
            :value-style="{ color: currentMetrics.balance >= 0 ? '#52c41a' : '#ff4d4f' }"
          >
            <template #prefix>
              <BankOutlined />
            </template>
          </Statistic>
          <div class="metric-sub-info">
            收支比: {{ currentMetrics.expense ? (currentMetrics.income / currentMetrics.expense).toFixed(2) : '∞' }}
          </div>
        </Card>
      </Col>

      <!-- 日均收支 -->
      <Col :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
        <Card class="metric-card">
          <Statistic
            :title="'日均收支'"
            :value="currentMetrics.avgDaily"
            :precision="2"
            :prefix="'¥'"
            :value-style="{ color: currentMetrics.avgDaily >= 0 ? '#52c41a' : '#ff4d4f' }"
          >
            <template #prefix>
              <TrendingUpOutlined />
            </template>
          </Statistic>
          <div class="metric-sub-info">
            {{ currentMetrics.days }}天 · {{ currentMetrics.transactionCount }}笔交易
          </div>
        </Card>
      </Col>
    </Row>
  </div>
</template>

<style scoped>
.metric-card {
  height: 100%;
  transition: all 0.3s;
}

.metric-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.metric-sub-info {
  margin-top: 8px;
  font-size: 12px;
  color: #8c8c8c;
  border-top: 1px solid #f0f0f0;
  padding-top: 8px;
}

:deep(.ant-statistic-title) {
  font-size: 14px;
  margin-bottom: 8px;
  color: #595959;
}

:deep(.ant-statistic-content) {
  font-size: 24px;
}

:deep(.ant-statistic-content-prefix) {
  margin-right: 4px;
}

:deep(.ant-statistic-content-suffix) {
  margin-left: 8px;
  font-size: 14px;
}
</style>