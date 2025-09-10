<template>
  <div class="p-4">
    <PageWrapper title="账户管理" content="管理银行账户、电子钱包和投资账户">
      <!-- 账户概览卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card v-for="overview in accountOverview" :key="overview.title" class="text-center">
          <Statistic
            :title="overview.title"
            :value="overview.value"
            :precision="2"
            prefix="¥"
            :value-style="overview.style"
          />
        </Card>
      </div>

      <!-- 账户卡片列表 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card v-for="account in accounts" :key="account.id" class="account-card hover:shadow-lg transition-all">
          <template #title>
            <div class="flex items-center space-x-2">
              <div :class="account.color" class="w-4 h-4 rounded-full"></div>
              <span>{{ account.name }}</span>
            </div>
          </template>
          <template #extra>
            <Dropdown :trigger="['click']">
              <template #overlay>
                <Menu @click="({key}) => handleAccountAction(key, account)">
                  <Menu.Item key="edit">编辑</Menu.Item>
                  <Menu.Item key="transfer">转账</Menu.Item>
                  <Menu.Item key="history">历史</Menu.Item>
                  <Menu.Item key="freeze">冻结</Menu.Item>
                </Menu>
              </template>
              <Button type="text" size="small">
                <Icon icon="mdi:dots-vertical" />
              </Button>
            </Dropdown>
          </template>
          
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">余额</span>
              <span class="text-xl font-bold" :class="account.balance >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ formatCurrency(account.balance) }}
              </span>
            </div>
            
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">账户类型</span>
              <Tag :color="getAccountTypeColor(account.type)">{{ account.type }}</Tag>
            </div>
            
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">状态</span>
              <Tag :color="account.status === 'active' ? 'green' : 'red'">
                {{ account.status === 'active' ? '正常' : '冻结' }}
              </Tag>
            </div>

            <!-- 账户详细信息 -->
            <Collapse ghost>
              <Collapse.Panel key="details" header="详细信息">
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-500">账号</span>
                    <span>{{ account.accountNumber }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">开户日期</span>
                    <span>{{ account.openDate }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">最后更新</span>
                    <span>{{ account.lastUpdate }}</span>
                  </div>
                </div>
              </Collapse.Panel>
            </Collapse>

            <!-- 操作按钮 -->
            <div class="flex space-x-2">
              <Button type="primary" size="small" @click="quickTransfer(account)">
                <Icon icon="mdi:swap-horizontal" class="mr-1" />
                转账
              </Button>
              <Button size="small" @click="viewTransactions(account)">
                <Icon icon="mdi:history" class="mr-1" />
                明细
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <!-- 添加账户按钮 -->
      <Card class="mb-6 text-center border-dashed border-2 hover:border-blue-400 cursor-pointer" @click="showAddAccount = true">
        <div class="py-8">
          <Icon icon="mdi:plus" class="text-4xl text-gray-400 mb-2" />
          <p class="text-gray-500">添加新账户</p>
        </div>
      </Card>

      <!-- 账户分析 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="账户余额趋势">
          <div ref="balanceTrendRef" style="height: 300px"></div>
        </Card>
        
        <Card title="资产分布">
          <div ref="assetDistributionRef" style="height: 300px"></div>
        </Card>
      </div>

      <!-- 添加账户模态框 -->
      <Modal v-model:open="showAddAccount" title="添加新账户" @ok="handleAddAccount">
        <Form :model="newAccountForm" layout="vertical">
          <Form.Item label="账户名称" required>
            <Input v-model:value="newAccountForm.name" placeholder="请输入账户名称" />
          </Form.Item>
          
          <Row :gutter="16">
            <Col :span="12">
              <Form.Item label="账户类型" required>
                <Select v-model:value="newAccountForm.type" placeholder="选择类型">
                  <Select.Option value="savings">储蓄账户</Select.Option>
                  <Select.Option value="checking">支票账户</Select.Option>
                  <Select.Option value="credit">信用卡</Select.Option>
                  <Select.Option value="investment">投资账户</Select.Option>
                  <Select.Option value="ewallet">电子钱包</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="初始余额">
                <InputNumber
                  v-model:value="newAccountForm.balance"
                  :precision="2"
                  style="width: 100%"
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item label="账户编号">
            <Input v-model:value="newAccountForm.accountNumber" placeholder="银行账号或卡号" />
          </Form.Item>
          
          <Form.Item label="备注">
            <Input.TextArea v-model:value="newAccountForm.description" :rows="3" />
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
  Card, Statistic, Dropdown, Menu, Button, Tag, Collapse, Modal,
  Form, Input, Select, Row, Col, InputNumber
} from 'ant-design-vue';
import { Icon } from '@iconify/vue';

defineOptions({ name: 'AccountManagement' });

const showAddAccount = ref(false);
const balanceTrendRef = ref();
const assetDistributionRef = ref();

// 账户数据
const accounts = ref([
  {
    id: '1',
    name: '工商银行储蓄卡',
    type: '储蓄账户',
    balance: 145680.50,
    accountNumber: '6222 **** **** 8888',
    color: 'bg-red-500',
    status: 'active',
    openDate: '2020-03-15',
    lastUpdate: '2024-12-28 14:30'
  },
  {
    id: '2',
    name: '支付宝余额',
    type: '电子钱包',
    balance: 12345.67,
    accountNumber: '138****8888',
    color: 'bg-blue-500',
    status: 'active',
    openDate: '2018-06-20',
    lastUpdate: '2024-12-28 16:45'
  },
  {
    id: '3',
    name: '招商银行信用卡',
    type: '信用卡',
    balance: -5632.10,
    accountNumber: '5555 **** **** 6666',
    color: 'bg-purple-500',
    status: 'active',
    openDate: '2021-09-10',
    lastUpdate: '2024-12-27 20:15'
  },
  {
    id: '4',
    name: '证券投资账户',
    type: '投资账户',
    balance: 298765.43,
    accountNumber: '001234567890',
    color: 'bg-green-500',
    status: 'active',
    openDate: '2022-01-08',
    lastUpdate: '2024-12-28 09:30'
  }
]);

// 新账户表单
const newAccountForm = ref({
  name: '',
  type: '',
  balance: 0,
  accountNumber: '',
  description: ''
});

// 账户概览统计
const accountOverview = computed(() => [
  {
    title: '总资产',
    value: accounts.value.filter(a => a.balance > 0).reduce((sum, a) => sum + a.balance, 0),
    style: { color: '#3f8600' }
  },
  {
    title: '总负债',
    value: Math.abs(accounts.value.filter(a => a.balance < 0).reduce((sum, a) => sum + a.balance, 0)),
    style: { color: '#cf1322' }
  },
  {
    title: '净资产',
    value: accounts.value.reduce((sum, a) => sum + a.balance, 0),
    style: { color: '#1890ff' }
  },
  {
    title: '账户数量',
    value: accounts.value.length,
    style: { color: '#722ed1' }
  }
]);

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(amount);
};

const getAccountTypeColor = (type: string) => {
  const colorMap = {
    '储蓄账户': 'blue',
    '支票账户': 'green',
    '信用卡': 'red',
    '投资账户': 'purple',
    '电子钱包': 'orange'
  };
  return colorMap[type] || 'default';
};

const handleAccountAction = (action: string, account: any) => {
  console.log('账户操作:', action, account);
  switch(action) {
    case 'edit':
      // 编辑账户
      break;
    case 'transfer':
      // 转账
      break;
    case 'history':
      // 查看历史
      break;
    case 'freeze':
      // 冻结账户
      break;
  }
};

const quickTransfer = (account: any) => {
  console.log('快速转账:', account);
};

const viewTransactions = (account: any) => {
  console.log('查看账户明细:', account);
};

const handleAddAccount = () => {
  console.log('添加账户:', newAccountForm.value);
  showAddAccount.value = false;
  // 重置表单
  newAccountForm.value = {
    name: '',
    type: '',
    balance: 0,
    accountNumber: '',
    description: ''
  };
};

// 初始化图表
const initBalanceTrendChart = () => {
  const chart = echarts.init(balanceTrendRef.value);
  
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['总余额'] },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    },
    yAxis: { type: 'value' },
    series: [{
      name: '总余额',
      type: 'line',
      data: [420000, 435000, 448000, 465000, 478000, 495000, 512000, 528000, 545000, 562000, 578000, 595000],
      smooth: true,
      itemStyle: { color: '#1890ff' },
      areaStyle: { opacity: 0.3, color: '#1890ff' }
    }]
  };
  
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
};

const initAssetDistributionChart = () => {
  const chart = echarts.init(assetDistributionRef.value);
  
  const option = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      name: '资产分布',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
      data: [
        { value: 145680, name: '银行储蓄', itemStyle: { color: '#1890ff' } },
        { value: 298765, name: '投资理财', itemStyle: { color: '#52c41a' } },
        { value: 12345, name: '电子钱包', itemStyle: { color: '#faad14' } },
        { value: 5632, name: '信用负债', itemStyle: { color: '#ff4d4f' } }
      ]
    }]
  };
  
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
};

onMounted(async () => {
  await nextTick();
  initBalanceTrendChart();
  initAssetDistributionChart();
});
</script>

<style scoped>
.account-card {
  border-radius: 12px;
}

.account-card:hover {
  border-color: #1890ff;
}
</style>