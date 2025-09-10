<template>
  <div class="p-4">
    <PageWrapper title="预算管理" content="设置和监控各类别的预算执行情况">
      <!-- 预算概览 -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card v-for="overview in budgetOverview" :key="overview.title" class="text-center">
          <Statistic
            :title="overview.title"
            :value="overview.value"
            :precision="2"
            :prefix="overview.prefix"
            :suffix="overview.suffix"
            :value-style="overview.style"
          />
        </Card>
      </div>

      <!-- 预算执行情况 -->
      <Card class="mb-6" title="本月预算执行情况">
        <template #extra>
          <Space>
            <Button @click="showAddBudget = true" type="primary">
              <Icon icon="mdi:plus" class="mr-1" />
              新增预算
            </Button>
            <Select v-model:value="selectedPeriod" style="width: 120px">
              <Select.Option value="current">本月</Select.Option>
              <Select.Option value="last">上月</Select.Option>
              <Select.Option value="year">本年</Select.Option>
            </Select>
          </Space>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="budget in budgets" :key="budget.id" class="p-4 border border-gray-200 rounded-lg relative">
            <!-- 预算卡片头部 -->
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center space-x-2">
                <Icon :icon="budget.icon" :class="budget.iconColor" class="text-lg" />
                <span class="font-medium">{{ budget.category }}</span>
              </div>
              <Dropdown :trigger="['click']">
                <template #overlay>
                  <Menu @click="({key}) => handleBudgetAction(key, budget)">
                    <Menu.Item key="edit">编辑</Menu.Item>
                    <Menu.Item key="adjust">调整额度</Menu.Item>
                    <Menu.Item key="history">历史记录</Menu.Item>
                    <Menu.Item key="delete">删除</Menu.Item>
                  </Menu>
                </template>
                <Button type="text" size="small">
                  <Icon icon="mdi:dots-vertical" />
                </Button>
              </Dropdown>
            </div>

            <!-- 预算进度 -->
            <div class="mb-3">
              <div class="flex justify-between text-sm mb-1">
                <span>已用: {{ formatCurrency(budget.spent) }}</span>
                <span>预算: {{ formatCurrency(budget.limit) }}</span>
              </div>
              <Progress
                :percent="budget.percentage"
                :stroke-color="getProgressColor(budget.percentage)"
                :show-info="false"
              />
              <div class="flex justify-between text-xs text-gray-500 mt-1">
                <span>{{ budget.percentage.toFixed(1) }}%</span>
                <span :class="budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ budget.remaining >= 0 ? '剩余' : '超支' }}: {{ formatCurrency(Math.abs(budget.remaining)) }}
                </span>
              </div>
            </div>

            <!-- 预警状态 -->
            <div v-if="budget.percentage > 90" class="absolute top-2 right-2">
              <Tag color="red" size="small">
                <Icon icon="mdi:alert" class="mr-1" />
                预警
              </Tag>
            </div>
            <div v-else-if="budget.percentage > 75" class="absolute top-2 right-2">
              <Tag color="orange" size="small">
                <Icon icon="mdi:alert-outline" class="mr-1" />
                注意
              </Tag>
            </div>

            <!-- 本月变化 -->
            <div class="flex justify-between text-xs">
              <span class="text-gray-500">本月变化</span>
              <span :class="budget.monthlyChange >= 0 ? 'text-red-500' : 'text-green-500'">
                {{ budget.monthlyChange >= 0 ? '+' : '' }}{{ budget.monthlyChange.toFixed(1) }}%
              </span>
            </div>
          </div>
        </div>
      </Card>

      <!-- 预算分析图表 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="预算执行趋势">
          <div ref="budgetTrendRef" style="height: 350px"></div>
        </Card>
        
        <Card title="预算分布">
          <div ref="budgetDistributionRef" style="height: 350px"></div>
        </Card>
      </div>

      <!-- 预算建议 -->
      <Card title="智能预算建议">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="suggestion in budgetSuggestions" :key="suggestion.id" 
               class="p-4 border border-gray-200 rounded-lg">
            <div class="flex items-start space-x-3">
              <Icon :icon="suggestion.icon" :class="suggestion.iconColor" class="text-xl mt-1" />
              <div class="flex-1">
                <h4 class="font-medium mb-1">{{ suggestion.title }}</h4>
                <p class="text-sm text-gray-600 mb-2">{{ suggestion.description }}</p>
                <div class="flex items-center justify-between">
                  <Tag :color="suggestion.priority === 'high' ? 'red' : suggestion.priority === 'medium' ? 'orange' : 'blue'">
                    {{ suggestion.priority === 'high' ? '高优先级' : suggestion.priority === 'medium' ? '中优先级' : '低优先级' }}
                  </Tag>
                  <Button type="link" size="small">采纳建议</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- 添加预算模态框 -->
      <Modal v-model:open="showAddBudget" title="新增预算" @ok="handleAddBudget">
        <Form :model="newBudgetForm" layout="vertical">
          <Form.Item label="预算分类" required>
            <Select v-model:value="newBudgetForm.category" placeholder="选择分类">
              <Select.Option value="餐饮">餐饮</Select.Option>
              <Select.Option value="交通">交通</Select.Option>
              <Select.Option value="购物">购物</Select.Option>
              <Select.Option value="娱乐">娱乐</Select.Option>
            </Select>
          </Form.Item>
          
          <Row :gutter="16">
            <Col :span="12">
              <Form.Item label="预算金额" required>
                <InputNumber
                  v-model:value="newBudgetForm.amount"
                  :precision="2"
                  style="width: 100%"
                  placeholder="请输入预算金额"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="预算周期" required>
                <Select v-model:value="newBudgetForm.period">
                  <Select.Option value="monthly">按月</Select.Option>
                  <Select.Option value="quarterly">按季度</Select.Option>
                  <Select.Option value="yearly">按年</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item label="预警阈值">
            <Slider
              v-model:value="newBudgetForm.alertThreshold"
              :min="50"
              :max="100"
              :marks="{ 50: '50%', 75: '75%', 90: '90%', 100: '100%' }"
            />
          </Form.Item>
          
          <Form.Item label="自动调整">
            <Switch v-model:checked="newBudgetForm.autoAdjust" />
            <span class="ml-2 text-sm text-gray-500">根据历史数据自动调整预算</span>
          </Form.Item>
        </Form>
      </Modal>
    </PageWrapper>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import { PageWrapper } from '@vben/common-ui';
import {
  Card, Statistic, Button, Space, Select, Progress, Tag, Dropdown, Menu,
  Modal, Form, InputNumber, Row, Col, Slider, Switch
} from 'ant-design-vue';
import { Icon } from '@iconify/vue';

defineOptions({ name: 'BudgetManagement' });

const showAddBudget = ref(false);
const selectedPeriod = ref('current');
const budgetTrendRef = ref();
const budgetDistributionRef = ref();

// 预算数据
const budgets = ref([
  {
    id: '1',
    category: '餐饮',
    icon: 'mdi:food',
    iconColor: 'text-orange-500',
    limit: 3000,
    spent: 2450,
    remaining: 550,
    percentage: 81.7,
    monthlyChange: 12.5
  },
  {
    id: '2',
    category: '交通',
    icon: 'mdi:car',
    iconColor: 'text-blue-500',
    limit: 1000,
    spent: 890,
    remaining: 110,
    percentage: 89,
    monthlyChange: -5.2
  },
  {
    id: '3',
    category: '娱乐',
    icon: 'mdi:gamepad-variant',
    iconColor: 'text-purple-500',
    limit: 1500,
    spent: 1680,
    remaining: -180,
    percentage: 112,
    monthlyChange: 25.8
  }
]);

// 预算概览
const budgetOverview = computed(() => [
  {
    title: '总预算',
    value: budgets.value.reduce((sum, b) => sum + b.limit, 0),
    prefix: '¥',
    style: { color: '#1890ff' }
  },
  {
    title: '已使用',
    value: budgets.value.reduce((sum, b) => sum + b.spent, 0),
    prefix: '¥',
    style: { color: '#faad14' }
  },
  {
    title: '剩余预算',
    value: budgets.value.reduce((sum, b) => sum + b.remaining, 0),
    prefix: '¥',
    style: { color: '#52c41a' }
  },
  {
    title: '执行率',
    value: (budgets.value.reduce((sum, b) => sum + b.percentage, 0) / budgets.value.length),
    suffix: '%',
    style: { color: '#722ed1' }
  }
]);

// 预算建议
const budgetSuggestions = ref([
  {
    id: '1',
    title: '餐饮支出建议优化',
    description: '您的餐饮支出较上月增加12.5%，建议控制外卖频率，多选择自己做饭。',
    icon: 'mdi:lightbulb',
    iconColor: 'text-yellow-500',
    priority: 'medium'
  },
  {
    id: '2',
    title: '娱乐预算超支警告',
    description: '娱乐分类已超预算12%，建议减少非必要的娱乐开支。',
    icon: 'mdi:alert',
    iconColor: 'text-red-500',
    priority: 'high'
  },
  {
    id: '3',
    title: '交通费用节省良好',
    description: '交通费用比预算节省5.2%，可以考虑将节省的预算调配到其他分类。',
    icon: 'mdi:check-circle',
    iconColor: 'text-green-500',
    priority: 'low'
  }
]);

// 新预算表单
const newBudgetForm = ref({
  category: '',
  amount: 0,
  period: 'monthly',
  alertThreshold: 80,
  autoAdjust: false
});

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(amount);
};

const getProgressColor = (percentage: number) => {
  if (percentage > 100) return '#ff4d4f';
  if (percentage > 90) return '#faad14';
  return '#52c41a';
};

const handleBudgetAction = (action: string, budget: any) => {
  console.log('预算操作:', action, budget);
};

const handleAddBudget = () => {
  console.log('添加预算:', newBudgetForm.value);
  showAddBudget.value = false;
};

const initBudgetTrendChart = () => {
  const chart = echarts.init(budgetTrendRef.value);
  
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['预算', '实际支出'] },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '预算',
        type: 'bar',
        data: [5500, 5500, 5500, 5500, 5500, 5500],
        itemStyle: { color: '#91d5ff' }
      },
      {
        name: '实际支出',
        type: 'bar',
        data: [4800, 5200, 5800, 4900, 5400, 6020],
        itemStyle: { color: '#1890ff' }
      }
    ]
  };
  
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
};

const initBudgetDistributionChart = () => {
  const chart = echarts.init(budgetDistributionRef.value);
  
  const option = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      name: '预算分布',
      type: 'pie',
      radius: '70%',
      center: ['60%', '50%'],
      data: budgets.value.map(budget => ({
        value: budget.limit,
        name: budget.category,
        itemStyle: { color: budget.category === '餐饮' ? '#ff7875' : budget.category === '交通' ? '#40a9ff' : '#b37feb' }
      }))
    }]
  };
  
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
};

onMounted(async () => {
  await nextTick();
  initBudgetTrendChart();
  initBudgetDistributionChart();
});
</script>