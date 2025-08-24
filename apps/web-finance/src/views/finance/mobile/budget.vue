<script setup lang="ts">
import type { Dayjs } from 'dayjs';

import type { Budget, BudgetStats } from '#/types/finance';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  LeftOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons-vue';
import {
  Button,
  DatePicker,
  Drawer,
  message,
  Modal,
  Progress,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useBudgetStore } from '#/store/modules/budget';
import { useCategoryStore } from '#/store/modules/category';
import { useTransactionStore } from '#/store/modules/transaction';

import BudgetSetting from '../budget/components/budget-setting.vue';

const router = useRouter();
const budgetStore = useBudgetStore();
const categoryStore = useCategoryStore();
const transactionStore = useTransactionStore();

const selectedMonth = ref<Dayjs>(dayjs());
const budgetStats = ref<BudgetStats[]>([]);
const detailDrawerVisible = ref(false);
const selectedBudgetStat = ref<BudgetStats | null>(null);
const budgetSettingVisible = ref(false);
const editingBudget = ref<Budget | null>(null);

const totalBudget = computed(() =>
  budgetStats.value.reduce((sum, stat) => sum + stat.budget.amount, 0),
);

const totalSpent = computed(() =>
  budgetStats.value.reduce((sum, stat) => sum + stat.spent, 0),
);

const totalRemaining = computed(() => totalBudget.value - totalSpent.value);

const budgetProgress = computed(() => {
  if (totalBudget.value === 0) return 0;
  return Math.min(
    100,
    Math.round((totalSpent.value / totalBudget.value) * 100),
  );
});

const progressColor = computed(() => {
  if (budgetProgress.value >= 100) return '#f5222d';
  if (budgetProgress.value >= 80) return '#faad14';
  return '#52c41a';
});

const selectedCategoryName = computed(() => {
  if (!selectedBudgetStat.value) return '';
  return getCategoryName(selectedBudgetStat.value.budget.categoryId);
});

const dailyBudget = computed(() => {
  if (!selectedBudgetStat.value) return 0;
  const daysInMonth = selectedMonth.value.daysInMonth();
  return selectedBudgetStat.value.budget.amount / daysInMonth;
});

const dailySpent = computed(() => {
  if (!selectedBudgetStat.value) return 0;
  const daysPassed = dayjs().date();
  return selectedBudgetStat.value.spent / daysPassed;
});

const getCategoryName = (categoryId: string) => {
  const category = categoryStore.categories.find((c) => c.id === categoryId);
  return category?.name || '未知分类';
};

const getCategoryIcon = (categoryId: string) => {
  const category = categoryStore.categories.find((c) => c.id === categoryId);
  return category?.icon || '📁';
};

const getProgressColor = (percentage: number) => {
  if (percentage >= 100) return '#f5222d';
  if (percentage >= 80) return '#faad14';
  return '#52c41a';
};

const formatProgress = (percent: number) => {
  return `${percent}%`;
};

const changeMonth = (diff: number) => {
  selectedMonth.value = selectedMonth.value.add(diff, 'month');
  fetchBudgetData();
};

const fetchBudgetData = async () => {
  await budgetStore.fetchBudgets();
  await transactionStore.fetchTransactions();

  const year = selectedMonth.value.year();
  const month = selectedMonth.value.month() + 1;

  // 获取指定月份的预算
  const monthBudgets = budgetStore.budgets.filter(
    (b) =>
      b.year === year &&
      (b.period === 'yearly' || (b.period === 'monthly' && b.month === month)),
  );

  // 计算每个预算的统计信息
  budgetStats.value = monthBudgets.map((budget) =>
    budgetStore.calculateBudgetStats(budget, transactionStore.transactions),
  );
};

const showBudgetDetail = (stat: BudgetStats) => {
  selectedBudgetStat.value = stat;
  detailDrawerVisible.value = true;
};

const showBudgetSetting = (budget: Budget | null) => {
  editingBudget.value = budget;
  budgetSettingVisible.value = true;
};

const handleBudgetSuccess = () => {
  fetchBudgetData();
};

const showTransactions = () => {
  // 跳转到交易列表页面，带上筛选条件
  router.push({
    name: 'Transaction',
    query: {
      categoryId: selectedBudgetStat.value?.budget.categoryId,
      month: selectedMonth.value.format('YYYY-MM'),
    },
  });
};

const deleteBudget = () => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这个预算吗？',
    onOk: async () => {
      if (selectedBudgetStat.value) {
        await budgetStore.deleteBudget(selectedBudgetStat.value.budget.id);
        message.success('预算删除成功');
        detailDrawerVisible.value = false;
        fetchBudgetData();
      }
    },
  });
};

onMounted(() => {
  fetchBudgetData();
});
</script>

<template>
  <div class="mobile-budget">
    <!-- 月份选择 -->
    <div class="month-selector">
      <Button type="text" @click="changeMonth(-1)">
        <LeftOutlined />
      </Button>
      <DatePicker
        v-model:value="selectedMonth"
        picker="month"
        format="YYYY年MM月"
        style="flex: 1; text-align: center"
        :bordered="false"
        @change="fetchBudgetData"
      />
      <Button type="text" @click="changeMonth(1)">
        <RightOutlined />
      </Button>
    </div>

    <!-- 预算总览 -->
    <div class="budget-summary">
      <div class="summary-chart">
        <Progress
          type="circle"
          :percent="budgetProgress"
          :stroke-color="progressColor"
          :format="formatProgress"
        />
      </div>
      <div class="summary-info">
        <div class="info-item">
          <span class="label">预算总额</span>
          <span class="value">¥{{ totalBudget.toFixed(2) }}</span>
        </div>
        <div class="info-item">
          <span class="label">已使用</span>
          <span class="value expense">¥{{ totalSpent.toFixed(2) }}</span>
        </div>
        <div class="info-item">
          <span class="label">剩余</span>
          <span class="value" :class="{ danger: totalRemaining < 0 }">
            ¥{{ Math.abs(totalRemaining).toFixed(2) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 分类预算列表 -->
    <div class="budget-list">
      <div
        v-for="stat in budgetStats"
        :key="stat.budget.id"
        class="budget-item"
      >
        <div class="budget-header">
          <div class="category-info">
            <span class="category-icon">{{
              getCategoryIcon(stat.budget.categoryId)
            }}</span>
            <span class="category-name">{{
              getCategoryName(stat.budget.categoryId)
            }}</span>
          </div>
          <div class="budget-actions">
            <Button type="text" size="small" @click="showBudgetDetail(stat)">
              详情
            </Button>
          </div>
        </div>

        <div class="budget-progress">
          <div class="progress-info">
            <span class="spent">¥{{ stat.spent.toFixed(2) }}</span>
            <span class="total">/ ¥{{ stat.budget.amount.toFixed(2) }}</span>
          </div>
          <Progress
            :percent="stat.percentage"
            :stroke-color="getProgressColor(stat.percentage)"
            :show-info="false"
            size="small"
          />
          <div class="progress-footer">
            <span class="remaining">
              剩余 ¥{{ Math.max(0, stat.remaining).toFixed(2) }}
            </span>
            <span class="percentage">{{ stat.percentage }}%</span>
          </div>
        </div>
      </div>

      <!-- 添加预算按钮 -->
      <div class="add-budget-card" @click="showBudgetSetting(null)">
        <PlusOutlined />
        <span>设置预算</span>
      </div>
    </div>

    <!-- 预算详情抽屉 -->
    <Drawer
      v-model:open="detailDrawerVisible"
      :title="`${selectedCategoryName} - 预算详情`"
      placement="bottom"
      height="70%"
    >
      <div v-if="selectedBudgetStat" class="budget-detail">
        <!-- 预算信息 -->
        <div class="detail-section">
          <h4>预算信息</h4>
          <div class="detail-item">
            <span class="label">预算金额</span>
            <span class="value"
              >¥{{ selectedBudgetStat.budget.amount.toFixed(2) }}</span
            >
          </div>
          <div class="detail-item">
            <span class="label">已使用</span>
            <span class="value"
              >¥{{ selectedBudgetStat.spent.toFixed(2) }}</span
            >
          </div>
          <div class="detail-item">
            <span class="label">剩余</span>
            <span
              class="value"
              :class="{ danger: selectedBudgetStat.remaining < 0 }"
            >
              ¥{{ Math.abs(selectedBudgetStat.remaining).toFixed(2) }}
            </span>
          </div>
          <div class="detail-item">
            <span class="label">交易笔数</span>
            <span class="value">{{ selectedBudgetStat.transactions }} 笔</span>
          </div>
        </div>

        <!-- 日均信息 -->
        <div class="detail-section">
          <h4>日均分析</h4>
          <div class="daily-info">
            <div class="daily-item">
              <span class="label">日均预算</span>
              <span class="value">¥{{ dailyBudget.toFixed(2) }}</span>
            </div>
            <div class="daily-item">
              <span class="label">日均支出</span>
              <span class="value">¥{{ dailySpent.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="detail-actions">
          <Button block @click="showTransactions">查看交易明细</Button>
          <Button block @click="showBudgetSetting(selectedBudgetStat.budget)">
            编辑预算
          </Button>
          <Button block danger @click="deleteBudget">删除预算</Button>
        </div>
      </div>
    </Drawer>

    <!-- 预算设置 -->
    <BudgetSetting
      v-model:visible="budgetSettingVisible"
      :budget="editingBudget"
      @success="handleBudgetSuccess"
    />
  </div>
</template>

<style scoped>
.mobile-budget {
  min-height: 100%;
  padding-bottom: 20px;
  background: #f5f5f5;
}

.month-selector {
  display: flex;
  align-items: center;
  padding: 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgb(0 0 0 / 8%);
}

.budget-summary {
  display: flex;
  gap: 20px;
  align-items: center;
  padding: 16px;
  margin: 12px;
  background: #fff;
  border-radius: 8px;
}

.summary-chart {
  flex-shrink: 0;
}

.summary-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.info-item .label {
  font-size: 12px;
  color: #8c8c8c;
}

.info-item .value {
  font-size: 16px;
  font-weight: 500;
  color: #262626;
}

.info-item .value.expense {
  color: #f5222d;
}

.info-item .value.danger {
  color: #f5222d;
}

.budget-list {
  padding: 0 12px;
}

.budget-item {
  padding: 16px;
  margin-bottom: 12px;
  background: #fff;
  border-radius: 8px;
}

.budget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.category-info {
  display: flex;
  gap: 8px;
  align-items: center;
}

.category-icon {
  font-size: 20px;
}

.category-name {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.budget-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-info {
  display: flex;
  gap: 4px;
  align-items: baseline;
}

.progress-info .spent {
  font-size: 16px;
  font-weight: 500;
  color: #262626;
}

.progress-info .total {
  font-size: 12px;
  color: #8c8c8c;
}

.progress-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.progress-footer .remaining {
  color: #8c8c8c;
}

.progress-footer .percentage {
  font-weight: 500;
  color: #1890ff;
}

.add-budget-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  padding: 24px;
  color: #8c8c8c;
  cursor: pointer;
  background: #fff;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  transition: all 0.3s;
}

.add-budget-card:active {
  transform: scale(0.98);
}

.add-budget-card:hover {
  color: #1890ff;
  border-color: #1890ff;
}

.budget-detail {
  padding: 12px 0;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.detail-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item .label {
  font-size: 14px;
  color: #8c8c8c;
}

.detail-item .value {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.detail-item .value.danger {
  color: #f5222d;
}

.daily-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.daily-item {
  padding: 12px;
  text-align: center;
  background: #f5f5f5;
  border-radius: 8px;
}

.daily-item .label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: #8c8c8c;
}

.daily-item .value {
  font-size: 16px;
  font-weight: 500;
  color: #262626;
}

.detail-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}
</style>
