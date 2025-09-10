<template>
  <div class="p-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          {{ isEnglish ? 'FinWise Pro Dashboard' : '💎 FinWise Pro 仪表板' }}
        </h1>
        <p class="text-gray-600">
          {{ isEnglish ? 'Comprehensive financial data overview and real-time monitoring' : '智能财务数据概览与实时监控' }}
        </p>
      </div>
      <div class="flex items-center space-x-3">
        <Select v-model:value="currentLanguage" style="width: 120px" @change="changeLanguage">
          <Select.Option value="zh-CN">🇨🇳 中文</Select.Option>
          <Select.Option value="en-US">🇺🇸 English</Select.Option>
        </Select>
        <Button @click="toggleTheme" :type="isDark ? 'primary' : 'default'">
          {{ isDark ? '🌙' : '☀️' }} {{ isEnglish ? 'Theme' : '主题' }}
        </Button>
        <Button type="primary" @click="refreshData" :loading="refreshing">
          🔄 {{ isEnglish ? 'Refresh' : '刷新' }}
        </Button>
      </div>
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
        <div class="space-y-4">
          <div class="flex items-center space-x-4">
            <Button type="primary" size="small">本年</Button>
            <Button size="small">本月</Button>
            <Button size="small">近3月</Button>
            <Button size="small">近半年</Button>
          </div>
          <div class="h-80 bg-gray-50 rounded-lg flex items-center justify-center">
            <div class="text-center">
              <div class="text-4xl mb-2">📊</div>
              <p class="text-gray-600">收支趋势图表</p>
              <p class="text-sm text-gray-500">实时数据可视化</p>
            </div>
          </div>
        </div>
      </Card>

      <!-- 支出分类饼图 -->
      <Card title="🥧 支出分类分布">
        <div class="h-80 bg-gray-50 rounded-lg flex items-center justify-center">
          <div class="text-center">
            <div class="text-4xl mb-2">🍰</div>
            <p class="text-gray-600">支出分类分析</p>
            <p class="text-sm text-gray-500">分类占比统计</p>
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
              <span class="text-lg">{{ account.emoji }}</span>
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
    <Modal v-model:open="showIncomeModal" :title="isEnglish ? '💰 Quick Add Income' : '💰 快速添加收入'" @ok="submitIncome">
      <Form :model="quickIncomeForm" layout="vertical">
        <Form.Item :label="isEnglish ? 'Amount' : '金额'" required>
          <InputNumber v-model:value="quickIncomeForm.amount" :precision="2" style="width: 100%" :placeholder="isEnglish ? 'Enter amount' : '请输入金额'" size="large" />
        </Form.Item>
        <Form.Item :label="isEnglish ? 'Description' : '描述'">
          <Input v-model:value="quickIncomeForm.description" :placeholder="isEnglish ? 'Income description...' : '收入描述...'" />
        </Form.Item>
        <Form.Item :label="isEnglish ? 'Category' : '分类'">
          <Select v-model:value="quickIncomeForm.category" :placeholder="isEnglish ? 'Select category' : '选择分类'" style="width: 100%">
            <Select.Option value="salary">{{ isEnglish ? 'Salary' : '工资' }}</Select.Option>
            <Select.Option value="bonus">{{ isEnglish ? 'Bonus' : '奖金' }}</Select.Option>
            <Select.Option value="investment">{{ isEnglish ? 'Investment' : '投资收益' }}</Select.Option>
            <Select.Option value="other">{{ isEnglish ? 'Other' : '其他' }}</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>

    <!-- 快速添加支出模态框 -->
    <Modal v-model:open="showExpenseModal" :title="isEnglish ? '💸 Quick Add Expense' : '💸 快速添加支出'" @ok="submitExpense">
      <Form :model="quickExpenseForm" layout="vertical">
        <Form.Item :label="isEnglish ? 'Amount' : '金额'" required>
          <InputNumber v-model:value="quickExpenseForm.amount" :precision="2" style="width: 100%" :placeholder="isEnglish ? 'Enter amount' : '请输入金额'" size="large" />
        </Form.Item>
        <Form.Item :label="isEnglish ? 'Description' : '描述'">
          <Input v-model:value="quickExpenseForm.description" :placeholder="isEnglish ? 'Expense description...' : '支出描述...'" />
        </Form.Item>
        <Form.Item :label="isEnglish ? 'Category' : '分类'">
          <Select v-model:value="quickExpenseForm.category" :placeholder="isEnglish ? 'Select category' : '选择分类'" style="width: 100%">
            <Select.Option value="food">{{ isEnglish ? 'Food & Dining' : '餐饮' }}</Select.Option>
            <Select.Option value="transport">{{ isEnglish ? 'Transportation' : '交通' }}</Select.Option>
            <Select.Option value="shopping">{{ isEnglish ? 'Shopping' : '购物' }}</Select.Option>
            <Select.Option value="entertainment">{{ isEnglish ? 'Entertainment' : '娱乐' }}</Select.Option>
            <Select.Option value="other">{{ isEnglish ? 'Other' : '其他' }}</Select.Option>
          </Select>
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
import { ref, computed, onMounted } from 'vue';
import { Card, Button, Select, Modal, Form, InputNumber, Input, notification } from 'ant-design-vue';

defineOptions({ name: 'FinanceDashboard' });

// 简化主题状态管理
const isDark = ref(false);
const currentLanguage = ref('zh-CN');
const refreshing = ref(false);
const showIncomeModal = ref(false);
const showExpenseModal = ref(false);
const showAccountModal = ref(false);

// 多语言支持
const isEnglish = computed(() => currentLanguage.value === 'en-US');

// 快速添加表单
const quickIncomeForm = ref({
  amount: null,
  description: '',
  category: '',
  account: ''
});

const quickExpenseForm = ref({
  amount: null,
  description: '',
  category: '',
  account: ''
});

const quickAccountForm = ref({
  name: '',
  type: 'savings',
  initialBalance: 0
});

// 核心指标 - 动态多语言
const keyMetrics = computed(() => [
  {
    title: isEnglish.value ? 'Total Assets' : '总资产',
    value: '¥0.00',
    trend: 0,
    color: 'text-blue-600',
    iconEmoji: '🏦',
    iconBg: 'bg-blue-500'
  },
  {
    title: isEnglish.value ? 'Monthly Income' : '本月收入',
    value: '¥0.00',
    trend: 0,
    color: 'text-green-600',
    iconEmoji: '📈',
    iconBg: 'bg-green-500'
  },
  {
    title: isEnglish.value ? 'Monthly Expense' : '本月支出',
    value: '¥0.00',
    trend: 0,
    color: 'text-red-600',
    iconEmoji: '📉',
    iconBg: 'bg-red-500'
  },
  {
    title: isEnglish.value ? 'Net Profit' : '净利润',
    value: '¥0.00',
    trend: 0,
    color: 'text-purple-600',
    iconEmoji: '💎',
    iconBg: 'bg-purple-500'
  }
]);

// 数据存储（清空状态）
const recentTransactions = ref([]);
const accounts = ref([]);

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
  showIncomeModal.value = true;
};

const quickAddExpense = () => {
  showExpenseModal.value = true;
};

const addAccount = () => {
  showAccountModal.value = true;
};

const submitIncome = () => {
  console.log('添加收入:', quickIncomeForm.value);
  notification.success({
    message: isEnglish.value ? 'Income Added' : '收入已添加',
    description: isEnglish.value ? 'Income record has been saved' : '收入记录已保存'
  });
  showIncomeModal.value = false;
  resetIncomeForm();
};

const submitExpense = () => {
  console.log('添加支出:', quickExpenseForm.value);
  notification.success({
    message: isEnglish.value ? 'Expense Added' : '支出已添加',
    description: isEnglish.value ? 'Expense record has been saved' : '支出记录已保存'
  });
  showExpenseModal.value = false;
  resetExpenseForm();
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

const resetIncomeForm = () => {
  quickIncomeForm.value = { amount: null, description: '', category: '', account: '' };
};

const resetExpenseForm = () => {
  quickExpenseForm.value = { amount: null, description: '', category: '', account: '' };
};

const resetAccountForm = () => {
  quickAccountForm.value = { name: '', type: 'savings', initialBalance: 0 };
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(amount);
};

onMounted(() => {
  console.log('FinWise Pro Dashboard 加载完成');
});
</script>

<style scoped>
.grid {
  display: grid;
}
</style>