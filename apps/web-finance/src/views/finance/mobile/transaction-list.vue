<script setup lang="ts">
import type { Dayjs } from 'dayjs';

import type { Transaction } from '#/types/finance';

import { computed, onMounted, ref } from 'vue';

import { FilterOutlined, PlusOutlined } from '@ant-design/icons-vue';
import {
  Button,
  DatePicker,
  Divider,
  Drawer,
  Empty,
  Form,
  FormItem,
  InputNumber,
  message,
  Modal,
  Radio,
  Select,
  SelectOption,
  Space,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useCategoryStore } from '#/store/modules/category';
import { useTagStore } from '#/store/modules/tag';
import { useTransactionStore } from '#/store/modules/transaction';

import QuickAdd from './quick-add.vue';

const { RadioGroup, RadioButton } = Radio;

interface TransactionGroup {
  date: string;
  transactions: Transaction[];
  income: number;
  expense: number;
}

const categoryStore = useCategoryStore();
const tagStore = useTagStore();
const transactionStore = useTransactionStore();

const selectedMonth = ref<Dayjs>(dayjs());
const showFilterDrawer = ref(false);
const showTransactionDetail = ref(false);
const showQuickAdd = ref(false);
const selectedTransaction = ref<null | Transaction>(null);

const filters = ref({
  type: '',
  categoryId: '',
  tags: [] as string[],
  minAmount: undefined as number | undefined,
  maxAmount: undefined as number | undefined,
});

const categories = computed(() => categoryStore.categories);
const tags = computed(() => tagStore.tags);

const filteredTransactions = computed(() => {
  let transactions = transactionStore.transactions.filter((t) => {
    const date = dayjs(t.date);
    return (
      date.year() === selectedMonth.value.year() &&
      date.month() === selectedMonth.value.month()
    );
  });

  if (filters.value.type) {
    transactions = transactions.filter((t) => t.type === filters.value.type);
  }

  if (filters.value.categoryId) {
    transactions = transactions.filter(
      (t) => t.categoryId === filters.value.categoryId,
    );
  }

  if (filters.value.tags.length > 0) {
    transactions = transactions.filter((t) =>
      t.tags?.some((tag) => filters.value.tags.includes(tag)),
    );
  }

  if (filters.value.minAmount !== undefined) {
    transactions = transactions.filter(
      (t) => t.amount >= filters.value.minAmount!,
    );
  }

  if (filters.value.maxAmount !== undefined) {
    transactions = transactions.filter(
      (t) => t.amount <= filters.value.maxAmount!,
    );
  }

  return transactions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
});

const groupedTransactions = computed(() => {
  const groups: Record<string, TransactionGroup> = {};

  filteredTransactions.value.forEach((transaction) => {
    const date = transaction.date;
    if (!groups[date]) {
      groups[date] = {
        date,
        transactions: [],
        income: 0,
        expense: 0,
      };
    }

    groups[date].transactions.push(transaction);
    if (transaction.type === 'income') {
      groups[date].income += transaction.amount;
    } else {
      groups[date].expense += transaction.amount;
    }
  });

  return Object.values(groups).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
});

const monthSummary = computed(() => {
  const summary = { income: 0, expense: 0, balance: 0 };

  filteredTransactions.value.forEach((t) => {
    if (t.type === 'income') {
      summary.income += t.amount;
    } else {
      summary.expense += t.amount;
    }
  });

  summary.balance = summary.income - summary.expense;
  return summary;
});

const getCategoryName = (categoryId: string) => {
  const category = categoryStore.categories.find((c) => c.id === categoryId);
  return category?.name || '未知分类';
};

const getCategoryIcon = (categoryId: string) => {
  const category = categoryStore.categories.find((c) => c.id === categoryId);
  return category?.icon || '📁';
};

const getTagName = (tagId: string) => {
  return tagStore.tagMap.get(tagId)?.name || '';
};

const getTagNames = (tagIds: string[]) => {
  return tagIds.map((id) => getTagName(id)).filter(Boolean);
};

const getTagColor = (tagId: string) => {
  return tagStore.tagMap.get(tagId)?.color || '#1890ff';
};

const formatGroupDate = (date: string) => {
  const d = dayjs(date);
  const today = dayjs();
  const yesterday = dayjs().subtract(1, 'day');

  if (d.isSame(today, 'day')) {
    return '今天';
  } else if (d.isSame(yesterday, 'day')) {
    return '昨天';
  } else {
    return d.format('MM月DD日 星期') + '日一二三四五六'.charAt(d.day());
  }
};

const filterOption = (input: string, option: any) => {
  return option.children?.[1]?.toLowerCase().includes(input.toLowerCase());
};

const handleMonthChange = () => {
  // 月份改变时重新加载数据
};

const handleTransactionClick = (transaction: Transaction) => {
  selectedTransaction.value = transaction;
  showTransactionDetail.value = true;
};

const applyFilters = () => {
  showFilterDrawer.value = false;
};

const resetFilters = () => {
  filters.value = {
    type: '',
    categoryId: '',
    tags: [],
    minAmount: undefined,
    maxAmount: undefined,
  };
};

const editTransaction = () => {
  // TODO: 实现编辑功能
  message.info('编辑功能开发中');
};

const deleteTransaction = () => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这条交易记录吗？',
    onOk: async () => {
      if (selectedTransaction.value) {
        await transactionStore.deleteTransaction(selectedTransaction.value.id);
        message.success('删除成功');
        showTransactionDetail.value = false;
      }
    },
  });
};

const handleQuickAddSaved = () => {
  showQuickAdd.value = false;
};

onMounted(async () => {
  await transactionStore.fetchTransactions();
  await categoryStore.fetchCategories();
  await tagStore.fetchTags();
});
</script>

<template>
  <div class="mobile-transaction-list">
    <!-- 头部统计 -->
    <div class="summary-card">
      <div class="summary-item">
        <div class="summary-label">本月支出</div>
        <div class="summary-value expense">
          ¥{{ monthSummary.expense.toFixed(2) }}
        </div>
      </div>
      <div class="summary-item">
        <div class="summary-label">本月收入</div>
        <div class="summary-value income">
          ¥{{ monthSummary.income.toFixed(2) }}
        </div>
      </div>
      <div class="summary-item">
        <div class="summary-label">结余</div>
        <div class="summary-value">¥{{ monthSummary.balance.toFixed(2) }}</div>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filter-bar">
      <Button @click="showFilterDrawer = true">
        <FilterOutlined /> 筛选
      </Button>
      <DatePicker
        v-model:value="selectedMonth"
        picker="month"
        format="YYYY年MM月"
        style="flex: 1"
        @change="handleMonthChange"
      />
    </div>

    <!-- 交易列表 -->
    <div class="transaction-groups">
      <div
        v-for="group in groupedTransactions"
        :key="group.date"
        class="transaction-group"
      >
        <div class="group-header">
          <span class="group-date">{{ formatGroupDate(group.date) }}</span>
          <span class="group-total">
            支出: ¥{{ group.expense.toFixed(2) }} 收入: ¥{{
              group.income.toFixed(2)
            }}
          </span>
        </div>

        <div class="transaction-items">
          <div
            v-for="transaction in group.transactions"
            :key="transaction.id"
            class="transaction-item"
            @click="handleTransactionClick(transaction)"
          >
            <div class="transaction-icon">
              {{ getCategoryIcon(transaction.categoryId) }}
            </div>
            <div class="transaction-info">
              <div class="transaction-title">
                {{
                  transaction.description ||
                  getCategoryName(transaction.categoryId)
                }}
              </div>
              <div class="transaction-meta">
                <span>{{ getCategoryName(transaction.categoryId) }}</span>
                <span v-if="transaction.tags?.length">
                  · {{ getTagNames(transaction.tags).join(', ') }}
                </span>
              </div>
            </div>
            <div class="transaction-amount" :class="[transaction.type]">
              {{ transaction.type === 'income' ? '+' : '-' }}¥{{
                transaction.amount.toFixed(2)
              }}
            </div>
          </div>
        </div>
      </div>

      <Empty
        v-if="groupedTransactions.length === 0"
        description="暂无交易记录"
      />
    </div>

    <!-- 悬浮按钮 -->
    <div class="floating-button" @click="showQuickAdd = true">
      <PlusOutlined />
    </div>

    <!-- 筛选抽屉 -->
    <Drawer
      v-model:open="showFilterDrawer"
      title="筛选条件"
      placement="bottom"
      height="70%"
    >
      <Form layout="vertical">
        <FormItem label="交易类型">
          <RadioGroup v-model:value="filters.type" button-style="solid">
            <RadioButton value="">全部</RadioButton>
            <RadioButton value="expense">支出</RadioButton>
            <RadioButton value="income">收入</RadioButton>
          </RadioGroup>
        </FormItem>

        <FormItem label="分类">
          <Select
            v-model:value="filters.categoryId"
            placeholder="选择分类"
            allow-clear
            show-search
            :filter-option="filterOption"
          >
            <SelectOption value="">全部分类</SelectOption>
            <SelectOption
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.icon }} {{ category.name }}
            </SelectOption>
          </Select>
        </FormItem>

        <FormItem label="标签">
          <Select
            v-model:value="filters.tags"
            mode="multiple"
            placeholder="选择标签"
            allow-clear
          >
            <SelectOption v-for="tag in tags" :key="tag.id" :value="tag.id">
              <Tag :color="tag.color">{{ tag.name }}</Tag>
            </SelectOption>
          </Select>
        </FormItem>

        <FormItem label="金额范围">
          <Space>
            <InputNumber
              v-model:value="filters.minAmount"
              :min="0"
              placeholder="最小金额"
              style="width: 120px"
            />
            <span>-</span>
            <InputNumber
              v-model:value="filters.maxAmount"
              :min="0"
              placeholder="最大金额"
              style="width: 120px"
            />
          </Space>
        </FormItem>

        <Space style="justify-content: flex-end; width: 100%">
          <Button @click="resetFilters">重置</Button>
          <Button type="primary" @click="applyFilters">应用</Button>
        </Space>
      </Form>
    </Drawer>

    <!-- 交易详情 -->
    <Drawer
      v-model:open="showTransactionDetail"
      :title="selectedTransaction?.description || '交易详情'"
      placement="bottom"
      height="60%"
    >
      <div v-if="selectedTransaction" class="transaction-detail">
        <div class="detail-item">
          <span class="detail-label">金额</span>
          <span class="detail-value" :class="[selectedTransaction.type]">
            {{ selectedTransaction.type === 'income' ? '+' : '-' }}¥{{
              selectedTransaction.amount.toFixed(2)
            }}
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">分类</span>
          <span class="detail-value">
            {{ getCategoryIcon(selectedTransaction.categoryId) }}
            {{ getCategoryName(selectedTransaction.categoryId) }}
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">日期</span>
          <span class="detail-value">{{
            dayjs(selectedTransaction.date).format('YYYY年MM月DD日')
          }}</span>
        </div>
        <div v-if="selectedTransaction.tags?.length" class="detail-item">
          <span class="detail-label">标签</span>
          <span class="detail-value">
            <Tag
              v-for="tagId in selectedTransaction.tags"
              :key="tagId"
              :color="getTagColor(tagId)"
              style="margin-right: 4px"
            >
              {{ getTagName(tagId) }}
            </Tag>
          </span>
        </div>
        <div v-if="selectedTransaction.project" class="detail-item">
          <span class="detail-label">项目</span>
          <span class="detail-value">{{ selectedTransaction.project }}</span>
        </div>
        <div v-if="selectedTransaction.payer" class="detail-item">
          <span class="detail-label">付款人</span>
          <span class="detail-value">{{ selectedTransaction.payer }}</span>
        </div>
        <div v-if="selectedTransaction.payee" class="detail-item">
          <span class="detail-label">收款人</span>
          <span class="detail-value">{{ selectedTransaction.payee }}</span>
        </div>

        <Divider />

        <Space style="justify-content: space-between; width: 100%">
          <Button type="primary" @click="editTransaction">编辑</Button>
          <Button danger @click="deleteTransaction">删除</Button>
        </Space>
      </div>
    </Drawer>

    <!-- 快速记账 -->
    <teleport to="body">
      <QuickAdd
        v-if="showQuickAdd"
        @close="showQuickAdd = false"
        @saved="handleQuickAddSaved"
      />
    </teleport>
  </div>
</template>

<style scoped>
.mobile-transaction-list {
  min-height: 100vh;
  padding-bottom: 80px;
  background: #f5f5f5;
}

.summary-card {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 16px;
  background: #fff;
  box-shadow: 0 2px 8px rgb(0 0 0 / 8%);
}

.summary-item {
  text-align: center;
}

.summary-label {
  margin-bottom: 4px;
  font-size: 12px;
  color: #8c8c8c;
}

.summary-value {
  font-size: 18px;
  font-weight: 500;
  color: #262626;
}

.summary-value.income {
  color: #52c41a;
}

.summary-value.expense {
  color: #f5222d;
}

.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.transaction-groups {
  padding: 12px;
}

.transaction-group {
  margin-bottom: 12px;
  overflow: hidden;
  background: #fff;
  border-radius: 8px;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  font-size: 12px;
  background: #fafafa;
}

.group-date {
  font-weight: 500;
  color: #262626;
}

.group-total {
  color: #8c8c8c;
}

.transaction-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-item:active {
  background: #f5f5f5;
}

.transaction-icon {
  margin-right: 12px;
  font-size: 24px;
}

.transaction-info {
  flex: 1;
  min-width: 0;
}

.transaction-title {
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  color: #262626;
  white-space: nowrap;
}

.transaction-meta {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #8c8c8c;
  white-space: nowrap;
}

.transaction-amount {
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
}

.transaction-amount.income {
  color: #52c41a;
}

.transaction-amount.expense {
  color: #262626;
}

.floating-button {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  font-size: 24px;
  color: #fff;
  cursor: pointer;
  background: #1890ff;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgb(24 144 255 / 40%);
}

.floating-button:active {
  transform: scale(0.95);
}

.transaction-detail {
  padding: 12px 0;
}

.detail-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 14px;
  color: #8c8c8c;
}

.detail-value {
  font-size: 14px;
  color: #262626;
  text-align: right;
}

.detail-value.income {
  font-size: 18px;
  font-weight: 500;
  color: #52c41a;
}

.detail-value.expense {
  font-size: 18px;
  font-weight: 500;
  color: #262626;
}
</style>
