<template>
  <div class="budget-management">
    <Card>
      <template #title>
        <Space>
          <span>预算管理</span>
          <Select
            v-model:value="selectedPeriod"
            style="width: 120px"
            @change="handlePeriodChange"
          >
            <SelectOption value="current">当前月</SelectOption>
            <SelectOption value="custom">自定义</SelectOption>
          </Select>
          <DatePicker
            v-if="selectedPeriod === 'custom'"
            v-model:value="selectedMonth"
            picker="month"
            format="YYYY年MM月"
            @change="fetchBudgetData"
          />
        </Space>
      </template>
      
      <template #extra>
        <Button type="primary" @click="showBudgetSetting(null)">
          <PlusOutlined /> 设置预算
        </Button>
      </template>
      
      <div class="budget-overview">
        <Row :gutter="16">
          <Col :span="8">
            <Statistic
              title="月度预算总额"
              :value="totalBudget"
              :precision="2"
              prefix="¥"
              :valueStyle="{ color: '#1890ff' }"
            />
          </Col>
          <Col :span="8">
            <Statistic
              title="已使用金额"
              :value="totalSpent"
              :precision="2"
              prefix="¥"
              :valueStyle="{ color: totalSpent > totalBudget ? '#f5222d' : '#52c41a' }"
            />
          </Col>
          <Col :span="8">
            <Statistic
              title="剩余预算"
              :value="totalRemaining"
              :precision="2"
              prefix="¥"
              :valueStyle="{ color: totalRemaining < 0 ? '#f5222d' : '#52c41a' }"
            />
          </Col>
        </Row>
      </div>
      
      <Divider />
      
      <div class="budget-list">
        <List
          :dataSource="budgetStats"
          :loading="loading"
        >
          <template #renderItem="{ item }">
            <ListItem>
              <ListItemMeta>
                <template #title>
                  <Space>
                    <span>{{ getCategoryName(item.budget.categoryId) }}</span>
                    <Tag :color="item.budget.period === 'yearly' ? 'purple' : 'blue'">
                      {{ item.budget.period === 'yearly' ? '年度' : '月度' }}
                    </Tag>
                  </Space>
                </template>
                <template #description>
                  <Space>
                    <span>预算: ¥{{ item.budget.amount.toFixed(2) }}</span>
                    <Divider type="vertical" />
                    <span>已用: ¥{{ item.spent.toFixed(2) }}</span>
                    <Divider type="vertical" />
                    <span>剩余: ¥{{ item.remaining.toFixed(2) }}</span>
                    <Divider type="vertical" />
                    <span>{{ item.transactions }} 笔交易</span>
                  </Space>
                </template>
              </ListItemMeta>
              
              <template #actions>
                <Space>
                  <Progress
                    :percent="item.percentage"
                    :strokeColor="getProgressColor(item.percentage)"
                    :format="percent => `${percent}%`"
                    style="width: 120px"
                  />
                  <Button
                    type="link"
                    size="small"
                    @click="showTransactions(item.budget.categoryId)"
                  >
                    查看明细
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    @click="showBudgetSetting(item.budget)"
                  >
                    编辑
                  </Button>
                  <Popconfirm
                    title="确定要删除这个预算吗？"
                    @confirm="handleDelete(item.budget.id)"
                  >
                    <Button type="link" size="small" danger>
                      删除
                    </Button>
                  </Popconfirm>
                </Space>
              </template>
            </ListItem>
          </template>
          
          <template #empty>
            <Empty description="暂未设置预算">
              <Button type="primary" @click="showBudgetSetting(null)">
                立即设置
              </Button>
            </Empty>
          </template>
        </List>
      </div>
    </Card>
    
    <!-- 预算设置弹窗 -->
    <BudgetSetting
      v-model:visible="budgetSettingVisible"
      :budget="editingBudget"
      @success="handleBudgetSuccess"
    />
    
    <!-- 交易明细抽屉 -->
    <Drawer
      v-model:open="transactionDrawerVisible"
      title="交易明细"
      width="800"
      placement="right"
    >
      <List
        :dataSource="categoryTransactions"
        :pagination="{ pageSize: 10 }"
      >
        <template #renderItem="{ item }">
          <ListItem>
            <ListItemMeta>
              <template #title>
                <Space>
                  <span>{{ item.description || getCategoryName(item.categoryId) }}</span>
                  <Tag :color="item.amount > 0 ? 'red' : 'green'">
                    {{ item.currency }} {{ Math.abs(item.amount).toFixed(2) }}
                  </Tag>
                </Space>
              </template>
              <template #description>
                <Space>
                  <span>{{ dayjs(item.date).format('YYYY-MM-DD') }}</span>
                  <Divider type="vertical" />
                  <span>{{ item.project || '-' }}</span>
                  <Divider type="vertical" />
                  <span>{{ item.payer || '-' }} → {{ item.payee || '-' }}</span>
                </Space>
              </template>
            </ListItemMeta>
          </ListItem>
        </template>
      </List>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import type { Budget, BudgetStats, Transaction } from '#/types/finance';

import { PlusOutlined } from '@ant-design/icons-vue';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Drawer,
  Empty,
  List,
  ListItem,
  ListItemMeta,
  Popconfirm,
  Progress,
  Row,
  Select,
  SelectOption,
  Space,
  Statistic,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs, { Dayjs } from 'dayjs';
import { computed, onMounted, ref } from 'vue';

import { useBudgetStore } from '#/store/modules/budget';
import { useCategoryStore } from '#/store/modules/category';
import { useTransactionStore } from '#/store/modules/transaction';

import BudgetSetting from './components/budget-setting.vue';

const budgetStore = useBudgetStore();
const categoryStore = useCategoryStore();
const transactionStore = useTransactionStore();

const loading = ref(false);
const selectedPeriod = ref<'current' | 'custom'>('current');
const selectedMonth = ref<Dayjs>(dayjs());
const budgetSettingVisible = ref(false);
const editingBudget = ref<Budget | null>(null);
const transactionDrawerVisible = ref(false);
const selectedCategoryId = ref<string>('');

const budgetStats = ref<BudgetStats[]>([]);

const totalBudget = computed(() =>
  budgetStats.value.reduce((sum, stat) => sum + stat.budget.amount, 0)
);

const totalSpent = computed(() =>
  budgetStats.value.reduce((sum, stat) => sum + stat.spent, 0)
);

const totalRemaining = computed(() => totalBudget.value - totalSpent.value);

const categoryTransactions = computed(() => {
  if (!selectedCategoryId.value) return [];
  
  const year = selectedMonth.value.year();
  const month = selectedMonth.value.month() + 1;
  
  return transactionStore.transactions.filter((t) => {
    const date = dayjs(t.date);
    return (
      t.type === 'expense' &&
      t.categoryId === selectedCategoryId.value &&
      date.year() === year &&
      date.month() + 1 === month
    );
  });
});

const getCategoryName = (categoryId: string) => {
  const category = categoryStore.categories.find((c) => c.id === categoryId);
  return category ? `${category.icon || ''} ${category.name}` : '未知分类';
};

const getProgressColor = (percentage: number) => {
  if (percentage >= 100) return '#f5222d';
  if (percentage >= 80) return '#faad14';
  return '#52c41a';
};

const handlePeriodChange = () => {
  if (selectedPeriod.value === 'current') {
    selectedMonth.value = dayjs();
  }
  fetchBudgetData();
};

const fetchBudgetData = async () => {
  loading.value = true;
  try {
    await budgetStore.fetchBudgets();
    await transactionStore.fetchTransactions();
    
    const year = selectedMonth.value.year();
    const month = selectedMonth.value.month() + 1;
    
    // 获取指定月份的预算
    const monthBudgets = budgetStore.budgets.filter(
      (b) =>
        b.year === year &&
        (b.period === 'yearly' || (b.period === 'monthly' && b.month === month))
    );
    
    // 计算每个预算的统计信息
    budgetStats.value = monthBudgets.map((budget) =>
      budgetStore.calculateBudgetStats(budget, transactionStore.transactions)
    );
  } finally {
    loading.value = false;
  }
};

const showBudgetSetting = (budget: Budget | null) => {
  editingBudget.value = budget;
  budgetSettingVisible.value = true;
};

const handleBudgetSuccess = () => {
  fetchBudgetData();
};

const showTransactions = (categoryId: string) => {
  selectedCategoryId.value = categoryId;
  transactionDrawerVisible.value = true;
};

const handleDelete = async (id: string) => {
  try {
    await budgetStore.deleteBudget(id);
    message.success('预算删除成功');
    fetchBudgetData();
  } catch (error) {
    message.error('删除预算失败');
  }
};

onMounted(() => {
  fetchBudgetData();
});
</script>

<style scoped>
.budget-management {
  padding: 16px;
}

.budget-overview {
  margin-bottom: 24px;
}

.budget-list {
  margin-top: 16px;
}

:deep(.ant-list-item) {
  padding: 16px 0;
}

:deep(.ant-list-item-meta) {
  align-items: center;
}

:deep(.ant-list-item-action) {
  margin-left: 48px;
}
</style>