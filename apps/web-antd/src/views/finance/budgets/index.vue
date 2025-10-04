<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">🎯 预算管理</h1>
      <p class="text-gray-600">设置和监控各类别的预算执行情况</p>
    </div>
    
    <div v-if="budgets.length === 0" class="text-center py-12">
      <div class="text-8xl mb-6">🎯</div>
      <h3 class="text-xl font-medium text-gray-800 mb-2">暂无预算设置</h3>
      <p class="text-gray-500 mb-6">设置预算帮助您更好地控制支出</p>
      <Button type="primary" size="large" @click="openAddBudgetModal">
        ➕ 设置第一个预算
      </Button>
    </div>
    
    <div v-else>
      <!-- 预算概览统计 -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card class="text-center">
          <div class="space-y-2">
            <div class="text-3xl">💰</div>
            <p class="text-sm text-gray-500">总预算</p>
            <p class="text-xl font-bold text-blue-600">{{ formatCurrency(totalBudget) }}</p>
          </div>
        </Card>
        <Card class="text-center">
          <div class="space-y-2">
            <div class="text-3xl">📊</div>
            <p class="text-sm text-gray-500">已使用</p>
            <p class="text-xl font-bold text-orange-600">{{ formatCurrency(totalSpent) }}</p>
          </div>
        </Card>
        <Card class="text-center">
          <div class="space-y-2">
            <div class="text-3xl">🎯</div>
            <p class="text-sm text-gray-500">剩余预算</p>
            <p class="text-xl font-bold text-green-600">{{ formatCurrency(totalRemaining) }}</p>
          </div>
        </Card>
        <Card class="text-center">
          <div class="space-y-2">
            <div class="text-3xl">⚡</div>
            <p class="text-sm text-gray-500">执行率</p>
            <p class="text-xl font-bold text-purple-600">{{ averageUsage.toFixed(1) }}%</p>
          </div>
        </Card>
      </div>

      <!-- 预算卡片列表 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card v-for="budget in budgets" :key="budget.id" class="relative hover:shadow-lg transition-shadow">
          <template #title>
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="text-xl">{{ budget.emoji }}</span>
                <span>{{ budget.category }}</span>
              </div>
              <Dropdown :trigger="['click']">
                <template #overlay>
                  <Menu>
                    <Menu.Item @click="editBudget(budget)">✏️ 编辑</Menu.Item>
                    <Menu.Item @click="adjustBudget(budget)">📊 调整额度</Menu.Item>
                    <Menu.Item @click="viewHistory(budget)">📈 历史记录</Menu.Item>
                    <Menu.Item @click="deleteBudget(budget)" class="text-red-600">🗑️ 删除</Menu.Item>
                  </Menu>
                </template>
                <Button type="text" size="small">⚙️</Button>
              </Dropdown>
            </div>
          </template>

          <!-- 预算进度 -->
          <div class="space-y-4">
            <div class="text-center">
              <p class="text-2xl font-bold" :class="getAmountColor(budget.percentage)">
                {{ formatCurrencyWithCode(budget.spent, budget.currency) }} / {{ formatCurrencyWithCode(budget.limit, budget.currency) }}
              </p>
              <p class="text-sm text-gray-500">已用 / 预算</p>
            </div>

            <Progress 
              :percent="budget.percentage" 
              :stroke-color="getProgressColor(budget.percentage)"
            />

            <div class="flex justify-between text-sm">
              <span :class="budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ budget.remaining >= 0 ? '剩余' : '超支' }}: {{ formatCurrencyWithCode(Math.abs(budget.remaining), budget.currency) }}
              </span>
              <span class="text-gray-500">{{ budget.percentage.toFixed(1) }}%</span>
            </div>

            <!-- 预算状态标签 -->
            <div class="text-center">
              <Tag v-if="budget.percentage > 100" color="red">
                🚨 预算超支
              </Tag>
              <Tag v-else-if="budget.percentage > 90" color="orange">
                ⚠️ 接近上限
              </Tag>
              <Tag v-else-if="budget.percentage > 75" color="blue">
                ℹ️ 使用正常
              </Tag>
              <Tag v-else color="green">
                ✅ 控制良好
              </Tag>
            </div>

            <!-- 月度趋势 -->
            <div v-if="budget.monthlyTrend" class="text-center">
              <p class="text-xs text-gray-500">相比上月</p>
              <p :class="budget.monthlyTrend >= 0 ? 'text-red-500' : 'text-green-500'" class="font-medium">
                {{ budget.monthlyTrend >= 0 ? '↗️' : '↘️' }} {{ Math.abs(budget.monthlyTrend).toFixed(1) }}%
              </p>
            </div>
          </div>
        </Card>

        <!-- 添加预算卡片 -->
        <Card class="border-2 border-dashed border-gray-300 hover:border-blue-400 cursor-pointer transition-all" @click="openAddBudgetModal">
          <div class="text-center py-12">
            <div class="text-6xl mb-4">➕</div>
            <h3 class="font-medium text-gray-800">添加新预算</h3>
            <p class="text-sm text-gray-500">为分类设置预算控制</p>
          </div>
        </Card>
      </div>
    </div>

    <!-- 添加预算模态框 -->
    <Modal 
      v-model:open="showAddModal" 
      title="➕ 设置新预算" 
      @ok="submitBudget"
      @cancel="cancelAdd"
      width="500px"
    >
      <Form ref="formRef" :model="budgetForm" :rules="rules" layout="vertical">
        <Form.Item label="预算分类" name="category" required>
          <Select v-model:value="budgetForm.category" placeholder="选择分类" size="large" @change="handleCategoryChange">
            <Select.Option value="food">🍽️ 餐饮</Select.Option>
            <Select.Option value="transport">🚗 交通</Select.Option>
            <Select.Option value="shopping">🛒 购物</Select.Option>
            <Select.Option value="entertainment">🎮 娱乐</Select.Option>
            <Select.Option value="medical">🏥 医疗</Select.Option>
            <Select.Option value="housing">🏠 住房</Select.Option>
            <Select.Option value="education">📚 教育</Select.Option>
            <Select.Option value="travel">✈️ 旅游</Select.Option>
            <Select.Option value="CUSTOM">➕ 自定义分类</Select.Option>
          </Select>
        </Form.Item>

        <!-- 自定义分类输入 -->
        <div v-if="budgetForm.category === 'CUSTOM'" class="mb-4">
          <Row :gutter="16">
            <Col :span="12">
              <Form.Item label="分类名称" required>
                <Input v-model:value="budgetForm.customCategoryName" placeholder="请输入分类名称，如: 宝贝用品、理财等" />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="分类图标" required>
                <Input v-model:value="budgetForm.customCategoryIcon" placeholder="请输入图标，如: 👶, 💹 等" />
              </Form.Item>
            </Col>
          </Row>
        </div>
        
        <Row :gutter="16">
          <Col :span="8">
            <Form.Item label="预算金额" name="limit" required>
              <InputNumber
                v-model:value="budgetForm.limit"
                :precision="2"
                style="width: 100%"
                placeholder="0.00"
                :min="0"
                size="large"
              />
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item label="金额币种" name="currency" required>
              <Select v-model:value="budgetForm.currency" placeholder="选择币种" size="large" @change="handleCurrencyChange">
                <Select.Option value="CNY">🇨🇳 人民币</Select.Option>
                <Select.Option value="USD">🇺🇸 美元</Select.Option>
                <Select.Option value="EUR">🇪🇺 欧元</Select.Option>
                <Select.Option value="JPY">🇯🇵 日元</Select.Option>
                <Select.Option value="GBP">🇬🇧 英镑</Select.Option>
                <Select.Option value="HKD">🇭🇰 港币</Select.Option>
                <Select.Option value="KRW">🇰🇷 韩元</Select.Option>
                <Select.Option value="CUSTOM">➕ 自定义币种</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item label="预算周期" name="period" required>
              <Select v-model:value="budgetForm.period" size="large">
                <Select.Option value="monthly">📅 按月</Select.Option>
                <Select.Option value="weekly">📆 按周</Select.Option>
                <Select.Option value="quarterly">📋 按季度</Select.Option>
                <Select.Option value="yearly">🗓️ 按年</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <!-- 自定义币种输入 -->
        <div v-if="budgetForm.currency === 'CUSTOM'" class="mb-4">
          <Row :gutter="16">
            <Col :span="12">
              <Form.Item label="币种代码" required>
                <Input v-model:value="budgetForm.customCurrencyCode" placeholder="如: THB, AUD 等" style="text-transform: uppercase" />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="币种名称" required>
                <Input v-model:value="budgetForm.customCurrencyName" placeholder="如: 泰铢, 澳元 等" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Form.Item label="预警阈值">
          <div class="space-y-2">
            <Slider
              v-model:value="budgetForm.alertThreshold"
              :min="50"
              :max="100"
              :step="5"
              :marks="{ 50: '50%', 75: '75%', 90: '90%', 100: '100%' }"
            />
            <p class="text-sm text-gray-500">当支出达到预算的 {{ budgetForm.alertThreshold }}% 时发出预警</p>
          </div>
        </Form.Item>

        <Form.Item label="预算描述">
          <Input.TextArea 
            v-model:value="budgetForm.description" 
            :rows="3" 
            placeholder="预算用途和目标..."
          />
        </Form.Item>

        <Form.Item label="预算设置">
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span>自动续期</span>
              <Switch v-model:checked="budgetForm.autoRenew" />
            </div>
            <div class="flex justify-between items-center">
              <span>超支提醒</span>
              <Switch v-model:checked="budgetForm.overspendAlert" />
            </div>
            <div class="flex justify-between items-center">
              <span>每日提醒</span>
              <Switch v-model:checked="budgetForm.dailyReminder" />
            </div>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Card, Progress, Button, Modal, Form, Input, Select, Row, Col,
  InputNumber, Slider, Switch, Tag, notification, Dropdown, Menu
} from 'ant-design-vue';

import { useFinanceStore } from '#/store/finance';

defineOptions({ name: 'BudgetManagement' });

const financeStore = useFinanceStore();
const budgets = computed(() => financeStore.budgets.filter(b => !b.isDeleted));
const showAddModal = ref(false);
const formRef = ref();

// 表单数据
const budgetForm = ref({
  category: '',
  customCategoryName: '',
  customCategoryIcon: '',
  limit: null,
  currency: 'CNY',
  customCurrencyCode: '',
  customCurrencyName: '',
  period: 'monthly',
  alertThreshold: 80,
  description: '',
  autoRenew: true,
  overspendAlert: true,
  dailyReminder: false
});

// 表单验证规则
const rules = {
  category: [
    { required: true, message: '请选择预算分类', trigger: 'change' }
  ],
  limit: [
    { required: true, message: '请输入预算金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '预算金额必须大于0', trigger: 'blur' }
  ],
  currency: [
    { required: true, message: '请选择币种', trigger: 'change' }
  ],
  period: [
    { required: true, message: '请选择预算周期', trigger: 'change' }
  ]
};

// 计算属性
const totalBudget = computed(() => {
  return budgets.value.reduce((sum, budget) => sum + budget.limit, 0);
});

const totalSpent = computed(() => {
  return budgets.value.reduce((sum, budget) => sum + budget.spent, 0);
});

const totalRemaining = computed(() => {
  return budgets.value.reduce((sum, budget) => sum + budget.remaining, 0);
});

const averageUsage = computed(() => {
  if (budgets.value.length === 0) return 0;
  return budgets.value.reduce((sum, budget) => sum + budget.percentage, 0) / budgets.value.length;
});

// 功能方法
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(amount);
};

const formatCurrencyWithCode = (amount: number, currencyCode: string) => {
  // 如果是自定义币种（包含括号），直接显示数字 + 币种代码
  if (currencyCode && currencyCode.includes('(')) {
    return `${amount.toLocaleString()} ${currencyCode}`;
  }
  
  // 对于标准币种，使用格式化
  try {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currencyCode || 'CNY'
    }).format(amount);
  } catch {
    // 如果币种代码不被支持，则直接显示数字 + 代码
    return `${amount.toLocaleString()} ${currencyCode || 'CNY'}`;
  }
};

const getProgressColor = (percentage: number) => {
  if (percentage > 100) return '#ff4d4f';
  if (percentage > 90) return '#faad14';
  if (percentage > 75) return '#1890ff';
  return '#52c41a';
};

const getAmountColor = (percentage: number) => {
  if (percentage > 100) return 'text-red-600';
  if (percentage > 90) return 'text-orange-600';
  if (percentage > 75) return 'text-blue-600';
  return 'text-green-600';
};

const getCategoryEmoji = (category: string) => {
  const emojiMap = {
    'food': '🍽️',
    'transport': '🚗',
    'shopping': '🛒',
    'entertainment': '🎮',
    'medical': '🏥',
    'housing': '🏠',
    'education': '📚',
    'travel': '✈️'
  };
  return emojiMap[category] || '🎯';
};

const getCategoryName = (category: string) => {
  const nameMap = {
    'food': '餐饮',
    'transport': '交通',
    'shopping': '购物',
    'entertainment': '娱乐',
    'medical': '医疗',
    'housing': '住房',
    'education': '教育',
    'travel': '旅游'
  };
  return nameMap[category] || category;
};

const openAddBudgetModal = () => {
  showAddModal.value = true;
  resetForm();
};

const submitBudget = async () => {
  try {
    // 表单验证
    await formRef.value.validate();

    // 处理自定义字段
    const finalCategory = budgetForm.value.category === 'CUSTOM'
      ? budgetForm.value.customCategoryName
      : getCategoryName(budgetForm.value.category);

    const finalEmoji = budgetForm.value.category === 'CUSTOM'
      ? budgetForm.value.customCategoryIcon
      : getCategoryEmoji(budgetForm.value.category);

    const finalCurrency = budgetForm.value.currency === 'CUSTOM'
      ? `${budgetForm.value.customCurrencyCode} (${budgetForm.value.customCurrencyName})`
      : budgetForm.value.currency;

    // 检查分类是否已有预算
    const existingBudget = budgets.value.find(b => b.category === finalCategory);
    if (existingBudget) {
      notification.error({
        message: '添加失败',
        description: '该分类已存在预算设置'
      });
      return;
    }

    // 创建新预算
    await financeStore.createBudget({
      category: finalCategory,
      emoji: finalEmoji,
      limit: budgetForm.value.limit,
      currency: finalCurrency,
      spent: 0,
      remaining: budgetForm.value.limit,
      percentage: 0,
      period: budgetForm.value.period,
      alertThreshold: budgetForm.value.alertThreshold,
      description: budgetForm.value.description,
      autoRenew: budgetForm.value.autoRenew,
      overspendAlert: budgetForm.value.overspendAlert,
      dailyReminder: budgetForm.value.dailyReminder,
      monthlyTrend: 0,
    });

    notification.success({
      message: '预算设置成功',
      description: `${finalCategory} 预算已成功创建`
    });

    // 关闭模态框
    showAddModal.value = false;
    resetForm();

  } catch (error) {
    console.error('表单验证失败:', error);
    notification.error({
      message: '添加失败',
      description: '请检查表单信息是否正确'
    });
  }
};

const cancelAdd = () => {
  showAddModal.value = false;
  resetForm();
};

const resetForm = () => {
  budgetForm.value = {
    category: '',
    customCategoryName: '',
    customCategoryIcon: '',
    limit: null,
    currency: 'CNY',
    customCurrencyCode: '',
    customCurrencyName: '',
    period: 'monthly',
    alertThreshold: 80,
    description: '',
    autoRenew: true,
    overspendAlert: true,
    dailyReminder: false
  };
};

const handleCategoryChange = (category: string) => {
  console.log('分类选择:', category);
  if (category !== 'CUSTOM') {
    budgetForm.value.customCategoryName = '';
    budgetForm.value.customCategoryIcon = '';
  }
};

const handleCurrencyChange = (currency: string) => {
  console.log('币种选择:', currency);
  if (currency !== 'CUSTOM') {
    budgetForm.value.customCurrencyCode = '';
    budgetForm.value.customCurrencyName = '';
  }
};

// 预算操作方法
const editBudget = (budget: any) => {
  console.log('编辑预算:', budget);
  notification.info({
    message: '编辑预算',
    description: `编辑 ${budget.category} 预算设置`
  });
};

const adjustBudget = (budget: any) => {
  console.log('调整预算额度:', budget);
  notification.info({
    message: '调整额度',
    description: `调整 ${budget.category} 预算额度`
  });
};

const viewHistory = (budget: any) => {
  console.log('查看预算历史:', budget);
  notification.info({
    message: '历史记录',
    description: `查看 ${budget.category} 预算历史`
  });
};

const deleteBudget = async (budget: any) => {
  console.log('删除预算:', budget);
  await financeStore.deleteBudget(budget.id);
  notification.success({
    message: '预算已删除',
    description: `${budget.category} 预算已删除`
  });
};

onMounted(async () => {
  await financeStore.fetchBudgets();
});
</script>

<style scoped>
.grid { display: grid; }
</style>