<script lang="ts" setup>
import type {
  WorkbenchProjectItem,
  WorkbenchQuickNavItem,
  WorkbenchTodoItem,
  WorkbenchTrendItem,
} from '@vben/common-ui';

import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import {
  AnalysisChartCard,
  WorkbenchHeader,
  WorkbenchProject,
  WorkbenchQuickNav,
  WorkbenchTodo,
  WorkbenchTrends,
} from '@vben/common-ui';
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';
import { openWindow } from '@vben/utils';

import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Row,
  Select,
  Switch,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useFinanceStore } from '#/store/finance';

import AnalyticsVisitsSource from '../analytics/analytics-visits-source.vue';

const userStore = useUserStore();
const financeStore = useFinanceStore();

// 初始化财务数据
onMounted(async () => {
  await financeStore.initializeData();
});

// 快速记账弹窗
const quickAddVisible = ref(false);
const transactionType = ref<'expense' | 'income'>('expense');
const formRef = ref();
const formState = ref({
  currency: 'CNY', // 默认人民币
  quantity: 1, // 数量，默认1
  unitPrice: null, // 单价
  amount: null, // 总金额（自动计算或手动输入）
  weight: null, // 重量（可选）
  weightUnit: 'kg', // 重量单位，默认千克
  category: undefined,
  account: undefined,
  date: null,
  description: '',
});

// 是否使用单价×数量计算模式
const useQuantityMode = ref(false);

// 当前选中的日期类型
const selectedDateType = ref<
  'custom' | 'month' | 'today' | 'week' | 'yesterday'
>('today');

// 字段触摸状态（用于判断是否显示验证提示）
const touchedFields = ref({
  category: false,
  account: false,
  amount: false,
});

// 监听单价和数量变化，自动计算总金额
watch(
  [() => formState.value.unitPrice, () => formState.value.quantity],
  ([unitPrice, quantity]) => {
    if (useQuantityMode.value && unitPrice && quantity) {
      formState.value.amount = unitPrice * quantity;
    }
  },
);

// 切换计算模式
const toggleQuantityMode = (enabled: boolean) => {
  useQuantityMode.value = enabled;
  if (enabled) {
    // 如果当前有金额，反推单价
    if (formState.value.amount && formState.value.quantity) {
      formState.value.unitPrice =
        formState.value.amount / formState.value.quantity;
    }
  } else {
    // 关闭模式时清空单价和数量
    formState.value.quantity = 1;
    formState.value.unitPrice = null;
  }
};

// 计算属性: 当前分类列表
const currentCategories = computed(() => {
  return transactionType.value === 'income'
    ? financeStore.incomeCategories
    : financeStore.expenseCategories;
});

// 计算属性: 根据选择的货币过滤账户
const filteredAccounts = computed(() => {
  return financeStore.getAccountsByCurrency(formState.value.currency);
});

// 计算属性: 获取当前货币符号
const currentCurrencySymbol = computed(() => {
  const currency = financeStore.getCurrencyByCode(formState.value.currency);
  return currency?.symbol || '¥';
});

// 监听货币变化,重置账户选择
watch(
  () => formState.value.currency,
  () => {
    formState.value.account = undefined;
    touchedFields.value.account = true; // 标记账户字段为已触摸
  },
);

// 监听账户变化，保存到localStorage
watch(
  () => formState.value.account,
  (newAccountId) => {
    if (newAccountId && transactionType.value) {
      const storageKey =
        transactionType.value === 'income'
          ? 'lastWorkspaceIncomeAccountId'
          : 'lastWorkspaceExpenseAccountId';
      localStorage.setItem(storageKey, String(newAccountId));
    }
  },
);

// 打开快速记账弹窗
const openQuickAdd = (type: 'expense' | 'income') => {
  transactionType.value = type;
  quickAddVisible.value = true;

  // 读取上次选择的账户
  const storageKey =
    type === 'income'
      ? 'lastWorkspaceIncomeAccountId'
      : 'lastWorkspaceExpenseAccountId';
  const lastAccountId = localStorage.getItem(storageKey);
  const accountId = lastAccountId ? Number(lastAccountId) : undefined;

  // 重置表单，日期默认为今天,货币默认为CNY
  formState.value = {
    currency: 'CNY',
    quantity: 1,
    unitPrice: null,
    amount: null,
    weight: null,
    weightUnit: 'kg',
    category: undefined,
    account: accountId,
    date: dayjs(),
    description: '',
  };

  // 重置计算模式
  useQuantityMode.value = false;

  // 重置触摸状态
  touchedFields.value = {
    category: false,
    account: false,
    amount: false,
  };
};

// 日期快捷方式
const setDate = (type: 'month' | 'today' | 'week' | 'yesterday') => {
  selectedDateType.value = type;
  switch (type) {
    case 'month': {
      formState.value.date = dayjs().startOf('month');
      break;
    }
    case 'today': {
      formState.value.date = dayjs();
      break;
    }
    case 'week': {
      formState.value.date = dayjs().startOf('week');
      break;
    }
    case 'yesterday': {
      formState.value.date = dayjs().subtract(1, 'day');
      break;
    }
  }
};

// 监听日期手动变化，设置为自定义
watch(
  () => formState.value.date,
  (newDate) => {
    if (!newDate) return;

    const today = dayjs();
    const yesterday = dayjs().subtract(1, 'day');
    const weekStart = dayjs().startOf('week');
    const monthStart = dayjs().startOf('month');

    if (newDate.isSame(today, 'day')) {
      selectedDateType.value = 'today';
    } else if (newDate.isSame(yesterday, 'day')) {
      selectedDateType.value = 'yesterday';
    } else if (newDate.isSame(weekStart, 'day')) {
      selectedDateType.value = 'week';
    } else if (newDate.isSame(monthStart, 'day')) {
      selectedDateType.value = 'month';
    } else {
      selectedDateType.value = 'custom';
    }
  },
);

// 获取日期类型对应的颜色
const getDateTypeColor = (type: string) => {
  const colors = {
    today: '#52c41a', // 绿色 - 今天
    yesterday: '#1890ff', // 蓝色 - 昨天
    week: '#722ed1', // 紫色 - 本周
    month: '#fa8c16', // 橙色 - 本月
    custom: '#8c8c8c', // 灰色 - 自定义
  };
  return colors[type] || colors.custom;
};

// 计算属性：检查必填字段是否有错误
const fieldErrors = computed(() => ({
  category: touchedFields.value.category && !formState.value.category,
  account: touchedFields.value.account && !formState.value.account,
  amount:
    touchedFields.value.amount &&
    (!formState.value.amount || formState.value.amount <= 0),
}));

// 提交记账
const handleQuickAdd = async () => {
  try {
    // 标记所有必填字段为已触摸，以便显示验证错误
    touchedFields.value = {
      category: true,
      account: true,
      amount: true,
    };

    await formRef.value?.validate();

    console.log('开始创建交易，表单数据:', formState.value);
    console.log('交易类型:', transactionType.value);

    // 调用API创建交易
    const transaction = await financeStore.createTransaction({
      type: transactionType.value,
      amount: formState.value.amount!,
      currency: formState.value.currency,
      categoryId: formState.value.category || undefined,
      accountId: formState.value.account!,
      transactionDate: formState.value.date.format('YYYY-MM-DD'),
      description: formState.value.description,
    });

    console.log('交易创建成功:', transaction);
    message.success(
      `${transactionType.value === 'income' ? '收入' : '支出'}记录成功！`,
    );
    quickAddVisible.value = false;

    // 重置表单
    formState.value = {
      currency: 'CNY',
      quantity: 1,
      unitPrice: null,
      amount: null,
      weight: null,
      weightUnit: 'kg',
      category: undefined,
      account: undefined,
      date: null,
      description: '',
    };

    // 重置计算模式
    useQuantityMode.value = false;

    // 重置触摸状态
    touchedFields.value = {
      category: false,
      account: false,
      amount: false,
    };
  } catch (error) {
    console.error('创建交易失败:', error);
    console.error('错误详情:', JSON.stringify(error, null, 2));
    if (error?.errorFields) {
      message.error('❌ 请填写所有必填项！');
    } else {
      message.error(`创建交易失败: ${error.message || '未知错误'}`);
    }
  }
};

// 财务管理快捷项目
const projectItems: WorkbenchProjectItem[] = [
  {
    color: '#1890ff',
    content: '查看本月收支情况和财务概览',
    date: new Date().toLocaleDateString(),
    group: '财务管理',
    icon: 'mdi:chart-box',
    title: '财务仪表板',
    url: '/dashboard-finance',
  },
  {
    color: '#52c41a',
    content: '记录和管理所有收入支出交易',
    date: new Date().toLocaleDateString(),
    group: '财务管理',
    icon: 'mdi:swap-horizontal',
    title: '交易管理',
    url: '/transactions',
  },
  {
    color: '#faad14',
    content: '管理银行账户、信用卡等资产',
    date: new Date().toLocaleDateString(),
    group: '财务管理',
    icon: 'mdi:account-multiple',
    title: '账户管理',
    url: '/accounts',
  },
  {
    color: '#722ed1',
    content: '查看和分析各类财务报表',
    date: new Date().toLocaleDateString(),
    group: '数据分析',
    icon: 'mdi:chart-line',
    title: '报表分析',
    url: '/reports',
  },
  {
    color: '#eb2f96',
    content: '设置和监控各项预算目标',
    date: new Date().toLocaleDateString(),
    group: '财务规划',
    icon: 'mdi:target',
    title: '预算管理',
    url: '/budgets',
  },
  {
    color: '#13c2c2',
    content: '管理收支分类标签',
    date: new Date().toLocaleDateString(),
    group: '设置',
    icon: 'mdi:tag-multiple',
    title: '分类管理',
    url: '/categories',
  },
];

// 财务管理快捷导航
const quickNavItems: WorkbenchQuickNavItem[] = [
  {
    color: '#1890ff',
    icon: 'mdi:chart-box',
    title: '财务仪表板',
    url: '/dashboard-finance',
  },
  {
    color: '#52c41a',
    icon: 'mdi:cash-plus',
    title: '添加收入',
    url: 'quick-add-income', // 特殊标识，用于触发弹窗
  },
  {
    color: '#f5222d',
    icon: 'mdi:cash-minus',
    title: '添加支出',
    url: 'quick-add-expense', // 特殊标识，用于触发弹窗
  },
  {
    color: '#faad14',
    icon: 'mdi:bank',
    title: '账户总览',
    url: '/accounts',
  },
  {
    color: '#722ed1',
    icon: 'mdi:chart-line',
    title: '财务报表',
    url: '/reports',
  },
  {
    color: '#13c2c2',
    icon: 'mdi:cog',
    title: '系统设置',
    url: '/fin-settings',
  },
];

const todoItems = ref<WorkbenchTodoItem[]>([
  {
    completed: false,
    content: `记录本月的水电费、房租等固定支出`,
    date: `${new Date().toLocaleDateString()} 18:00:00`,
    title: '录入本月固定支出',
  },
  {
    completed: false,
    content: `查看并调整各类别的预算设置，确保支出在可控范围内`,
    date: `${new Date().toLocaleDateString()} 20:00:00`,
    title: '检查月度预算执行情况',
  },
  {
    completed: true,
    content: `完成本周的收入记录，包括工资和其他收入来源`,
    date: `${new Date().toLocaleDateString()} 10:00:00`,
    title: '记录本周收入',
  },
  {
    completed: false,
    content: `核对银行账户余额，确保系统数据与实际一致`,
    date: `${new Date().toLocaleDateString()} 15:00:00`,
    title: '对账核对',
  },
  {
    completed: false,
    content: `分析上月的支出报表，找出可以节省开支的地方`,
    date: `${new Date().toLocaleDateString()} 16:00:00`,
    title: '生成月度财务报表',
  },
]);
const trendItems: WorkbenchTrendItem[] = [
  {
    avatar: 'svg:avatar-1',
    content: `添加了一笔 <a>餐饮支出</a> ¥128.50`,
    date: '刚刚',
    title: '系统记录',
  },
  {
    avatar: 'svg:avatar-2',
    content: `记录了 <a>工资收入</a> ¥12,000.00`,
    date: '2小时前',
    title: '收入记录',
  },
  {
    avatar: 'svg:avatar-3',
    content: `更新了 <a>餐饮类别</a> 的预算额度`,
    date: '今天 14:30',
    title: '预算调整',
  },
  {
    avatar: 'svg:avatar-4',
    content: `创建了新的 <a>信用卡账户</a> `,
    date: '今天 10:15',
    title: '账户管理',
  },
  {
    avatar: 'svg:avatar-1',
    content: `生成了 <a>月度财务报表</a>`,
    date: '昨天',
    title: '报表生成',
  },
  {
    avatar: 'svg:avatar-2',
    content: `完成了 <a>账户对账</a> 操作`,
    date: '昨天',
    title: '对账记录',
  },
  {
    avatar: 'svg:avatar-3',
    content: `添加了 <a>房租支出</a> ¥3,500.00`,
    date: '2天前',
    title: '支出记录',
  },
  {
    avatar: 'svg:avatar-4',
    content: `设置了 <a>月度预算目标</a>`,
    date: '3天前',
    title: '预算规划',
  },
  {
    avatar: 'svg:avatar-1',
    content: `优化了 <a>支出分类</a> 设置`,
    date: '1周前',
    title: '分类管理',
  },
];

const router = useRouter();

// 导航处理方法
function navTo(nav: WorkbenchProjectItem | WorkbenchQuickNavItem) {
  console.log('navTo被调用:', nav);
  console.log('nav.url:', nav.url);

  // 处理快速记账
  if (nav.url === 'quick-add-income') {
    console.log('打开收入弹窗');
    openQuickAdd('income');
    return;
  }
  if (nav.url === 'quick-add-expense') {
    console.log('打开支出弹窗');
    openQuickAdd('expense');
    return;
  }

  // 处理外部链接
  if (nav.url?.startsWith('http')) {
    openWindow(nav.url);
    return;
  }

  // 处理内部路由
  if (nav.url?.startsWith('/')) {
    router.push(nav.url).catch((error) => {
      console.error('Navigation failed:', error);
    });
  } else {
    console.warn(`Unknown URL for navigation item: ${nav.title} -> ${nav.url}`);
  }
}
</script>

<template>
  <div class="p-5">
    <WorkbenchHeader
      :avatar="userStore.userInfo?.avatar || preferences.app.defaultAvatar"
    >
      <template #title>
        欢迎回来, {{ userStore.userInfo?.realName }}！开始管理您的财务吧 💰
      </template>
      <template #description>
        让每一笔收支都清晰可见，让财务管理更轻松！
      </template>
    </WorkbenchHeader>

    <div class="mt-5 flex flex-col lg:flex-row">
      <div class="mr-4 w-full lg:w-3/5">
        <WorkbenchProject
          :items="projectItems"
          title="财务功能快捷入口"
          @click="navTo"
        />
        <WorkbenchTrends
          :items="trendItems"
          class="mt-5"
          title="最近财务活动"
        />
      </div>
      <div class="w-full lg:w-2/5">
        <WorkbenchQuickNav
          :items="quickNavItems"
          class="mt-5 lg:mt-0"
          title="快捷操作"
          @click="
            (item) => {
              console.log('WorkbenchQuickNav click事件触发:', item);
              navTo(item);
            }
          "
        />
        <WorkbenchTodo :items="todoItems" class="mt-5" title="财务待办事项" />
        <AnalysisChartCard class="mt-5" title="本月收支概览">
          <AnalyticsVisitsSource />
        </AnalysisChartCard>
      </div>
    </div>

    <!-- 快速记账弹窗 -->
    <Modal
      :open="quickAddVisible"
      :title="transactionType === 'income' ? '💰 添加收入' : '💸 添加支出'"
      :width="900"
      @ok="handleQuickAdd"
      @cancel="
        () => {
          quickAddVisible = false;
        }
      "
      @update:open="
        (val) => {
          quickAddVisible = val;
        }
      "
    >
      <Form ref="formRef" :model="formState" layout="vertical" class="mt-4">
        <Row :gutter="16">
          <!-- 分类 -->
          <Col :span="14">
            <Form.Item
              label="分类"
              name="category"
              :rules="[{ required: true, message: '请选择分类' }]"
              :validate-status="fieldErrors.category ? 'error' : ''"
              :help="fieldErrors.category ? '⚠️ 请选择一个分类' : ''"
            >
              <div
                :style="
                  fieldErrors.category
                    ? {
                        border: '2px solid #ff4d4f',
                        borderRadius: '6px',
                        padding: '8px',
                      }
                    : {}
                "
              >
                <Radio.Group
                  v-model:value="formState.category"
                  size="large"
                  button-style="solid"
                  class="category-radio-group"
                  @change="touchedFields.category = true"
                >
                  <Radio.Button
                    v-for="category in currentCategories"
                    :key="category.id"
                    :value="category.id"
                  >
                    {{ category.icon }} {{ category.name }}
                  </Radio.Button>
                </Radio.Group>
              </div>
            </Form.Item>
          </Col>

          <!-- 项目名称 -->
          <Col :span="10">
            <Form.Item label="项目名称" name="description">
              <Input.TextArea
                v-model:value="formState.description"
                placeholder="请输入项目名称..."
                :rows="4"
                style="height: 100%"
              />
            </Form.Item>
          </Col>
        </Row>

        <!-- 货币类型、账户和金额（放在一起） -->
        <div class="mb-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <Row :gutter="16">
            <Col :span="12">
              <div class="mb-4">
                <label class="mb-2 block text-sm font-medium"
                  >货币类型 <span class="text-red-500">*</span></label
                >
                <Radio.Group
                  v-model:value="formState.currency"
                  size="large"
                  button-style="solid"
                  class="currency-radio-group"
                >
                  <Radio.Button
                    v-for="currency in financeStore.currencies"
                    :key="currency.code"
                    :value="currency.code"
                  >
                    {{ currency.symbol }} {{ currency.name }}
                  </Radio.Button>
                </Radio.Group>
              </div>
            </Col>
            <Col :span="12">
              <div class="mb-4 flex items-center justify-between">
                <label class="text-sm font-medium">按数量×单价计算</label>
                <Switch
                  v-model:checked="useQuantityMode"
                  @change="toggleQuantityMode"
                />
              </div>
            </Col>
          </Row>

          <!-- 数量×单价模式 -->
          <Row v-if="useQuantityMode" :gutter="16" class="mb-4">
            <Col :span="8">
              <label class="mb-2 block text-sm font-medium">数量</label>
              <InputNumber
                v-model:value="formState.quantity"
                :min="0.01"
                :precision="2"
                placeholder="数量"
                style="width: 100%"
                size="large"
              />
            </Col>
            <Col :span="8">
              <label class="mb-2 block text-sm font-medium">单价</label>
              <InputNumber
                v-model:value="formState.unitPrice"
                :min="0"
                :precision="2"
                placeholder="单价"
                style="width: 100%"
                size="large"
              >
                <template #addonBefore>{{ currentCurrencySymbol }}</template>
              </InputNumber>
            </Col>
            <Col :span="8">
              <label class="mb-2 block text-sm font-medium">
                总金额 <span class="text-red-500">*</span>
                <span
                  v-if="fieldErrors.amount"
                  class="ml-1 text-xs text-red-500"
                  >⚠️</span
                >
              </label>
              <div
                :style="
                  fieldErrors.amount
                    ? {
                        border: '2px solid #ff4d4f',
                        borderRadius: '6px',
                        padding: '2px',
                      }
                    : {}
                "
              >
                <InputNumber
                  v-model:value="formState.amount"
                  :min="0"
                  :precision="2"
                  placeholder="自动计算"
                  style="width: 100%"
                  size="large"
                  :disabled="true"
                  @blur="touchedFields.amount = true"
                >
                  <template #addonBefore>{{ currentCurrencySymbol }}</template>
                </InputNumber>
              </div>
            </Col>
          </Row>

          <!-- 直接输入金额模式 -->
          <Row v-else :gutter="16" class="mb-4">
            <Col :span="24">
              <label class="mb-2 block text-sm font-medium">
                金额 <span class="text-red-500">*</span>
                <span
                  v-if="fieldErrors.amount"
                  class="ml-2 text-xs text-red-500"
                  >⚠️ 请输入金额</span
                >
              </label>
              <div
                :style="
                  fieldErrors.amount
                    ? {
                        border: '2px solid #ff4d4f',
                        borderRadius: '6px',
                        padding: '2px',
                      }
                    : {}
                "
              >
                <InputNumber
                  v-model:value="formState.amount"
                  :min="0"
                  :precision="2"
                  placeholder="请输入金额"
                  style="width: 100%"
                  size="large"
                  @blur="touchedFields.amount = true"
                >
                  <template #addonBefore>{{ currentCurrencySymbol }}</template>
                </InputNumber>
              </div>
            </Col>
          </Row>

          <!-- 重量（可选） -->
          <Row :gutter="16" class="mb-4">
            <Col :span="16">
              <label class="mb-2 block text-sm font-medium">重量（可选）</label>
              <InputNumber
                v-model:value="formState.weight"
                :min="0"
                :precision="3"
                placeholder="如需记录重量请输入"
                style="width: 100%"
              />
            </Col>
            <Col :span="8">
              <label class="mb-2 block text-sm font-medium">单位</label>
              <Select v-model:value="formState.weightUnit" style="width: 100%">
                <Select.Option value="kg">千克(kg)</Select.Option>
                <Select.Option value="g">克(g)</Select.Option>
                <Select.Option value="t">吨(t)</Select.Option>
                <Select.Option value="lb">磅(lb)</Select.Option>
              </Select>
            </Col>
          </Row>

          <div>
            <label class="mb-2 block text-sm font-medium">
              {{ transactionType === 'income' ? '收入账户' : '支出账户' }}
              <span class="text-red-500">*</span>
              <span v-if="fieldErrors.account" class="ml-2 text-xs text-red-500"
                >⚠️ 请选择账户</span
              >
            </label>
            <div
              :style="
                fieldErrors.account
                  ? {
                      border: '2px solid #ff4d4f',
                      borderRadius: '6px',
                      padding: '8px',
                    }
                  : {}
              "
            >
              <Radio.Group
                v-model:value="formState.account"
                size="large"
                button-style="solid"
                class="account-radio-group"
                @change="touchedFields.account = true"
              >
                <Radio.Button
                  v-for="account in filteredAccounts"
                  :key="account.id"
                  :value="account.id"
                >
                  {{ account.icon }} {{ account.name }}
                </Radio.Button>
              </Radio.Group>
            </div>
          </div>
        </div>

        <!-- 日期 -->
        <Row :gutter="16">
          <Col :span="10">
            <Form.Item label="日期快捷选择">
              <div class="flex flex-col space-y-2">
                <Button
                  :type="selectedDateType === 'today' ? 'primary' : 'default'"
                  :style="{
                    backgroundColor:
                      selectedDateType === 'today'
                        ? getDateTypeColor('today')
                        : undefined,
                    borderColor:
                      selectedDateType === 'today'
                        ? getDateTypeColor('today')
                        : undefined,
                  }"
                  @click="setDate('today')"
                  block
                >
                  今天
                </Button>
                <Button
                  :type="
                    selectedDateType === 'yesterday' ? 'primary' : 'default'
                  "
                  :style="{
                    backgroundColor:
                      selectedDateType === 'yesterday'
                        ? getDateTypeColor('yesterday')
                        : undefined,
                    borderColor:
                      selectedDateType === 'yesterday'
                        ? getDateTypeColor('yesterday')
                        : undefined,
                  }"
                  @click="setDate('yesterday')"
                  block
                >
                  昨天
                </Button>
                <Button
                  :type="selectedDateType === 'week' ? 'primary' : 'default'"
                  :style="{
                    backgroundColor:
                      selectedDateType === 'week'
                        ? getDateTypeColor('week')
                        : undefined,
                    borderColor:
                      selectedDateType === 'week'
                        ? getDateTypeColor('week')
                        : undefined,
                  }"
                  @click="setDate('week')"
                  block
                >
                  本周
                </Button>
                <Button
                  :type="selectedDateType === 'month' ? 'primary' : 'default'"
                  :style="{
                    backgroundColor:
                      selectedDateType === 'month'
                        ? getDateTypeColor('month')
                        : undefined,
                    borderColor:
                      selectedDateType === 'month'
                        ? getDateTypeColor('month')
                        : undefined,
                  }"
                  @click="setDate('month')"
                  block
                >
                  本月
                </Button>
              </div>
            </Form.Item>
          </Col>
          <Col :span="14">
            <Form.Item label="选择日期" name="date">
              <div
                class="date-picker-wrapper"
                :style="{
                  border: `2px solid ${getDateTypeColor(selectedDateType)}`,
                  borderRadius: '6px',
                  padding: '4px',
                }"
              >
                <DatePicker
                  v-model:value="formState.date"
                  placeholder="请选择日期"
                  style="width: 100%"
                  size="large"
                  format="YYYY-MM-DD"
                />
              </div>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  </div>
</template>

<style scoped>
/* 分类、货币和账户按钮组允许换行 */
:deep(.category-radio-group),
:deep(.currency-radio-group),
:deep(.account-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.category-radio-group .ant-radio-button-wrapper),
:deep(.currency-radio-group .ant-radio-button-wrapper),
:deep(.account-radio-group .ant-radio-button-wrapper) {
  margin-right: 0 !important;
  margin-bottom: 0 !important;
  border-radius: 6px !important;
}

:deep(
  .category-radio-group .ant-radio-button-wrapper:not(:first-child)::before
),
:deep(
  .currency-radio-group .ant-radio-button-wrapper:not(:first-child)::before
),
:deep(
  .account-radio-group .ant-radio-button-wrapper:not(:first-child)::before
) {
  display: none;
}
</style>
