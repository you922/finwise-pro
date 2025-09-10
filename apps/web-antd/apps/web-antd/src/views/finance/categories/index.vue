<template>
  <div class="p-4">
    <PageWrapper title="分类管理" content="管理收支分类，支持层级结构和自定义图标">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 分类树结构 -->
        <Card title="分类结构">
          <template #extra>
            <Button type="primary" @click="showAddCategory = true">
              <Icon icon="mdi:plus" class="mr-1" />
              新增分类
            </Button>
          </template>
          
          <Tree
            :tree-data="categoryTree"
            :draggable="true"
            :block-node="true"
            @drop="onDrop"
          >
            <template #title="{ title, icon, count, amount }">
              <div class="flex items-center justify-between w-full">
                <div class="flex items-center space-x-2">
                  <Icon :icon="icon" class="text-lg" />
                  <span>{{ title }}</span>
                  <Tag size="small">{{ count }}笔</Tag>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="text-sm text-gray-500">{{ formatCurrency(amount) }}</span>
                  <Dropdown :trigger="['click']">
                    <template #overlay>
                      <Menu @click="({key}) => handleCategoryAction(key, { title, icon, count, amount })">
                        <Menu.Item key="edit">编辑</Menu.Item>
                        <Menu.Item key="addChild">添加子分类</Menu.Item>
                        <Menu.Item key="setBudget">设置预算</Menu.Item>
                        <Menu.Item key="delete">删除</Menu.Item>
                      </Menu>
                    </template>
                    <Button type="text" size="small">
                      <Icon icon="mdi:dots-vertical" />
                    </Button>
                  </Dropdown>
                </div>
              </div>
            </template>
          </Tree>
        </Card>

        <!-- 分类统计 -->
        <Card title="分类统计">
          <div class="space-y-4">
            <!-- 收入分类 -->
            <div>
              <h4 class="font-medium text-green-600 mb-3 flex items-center">
                <Icon icon="mdi:trending-up" class="mr-2" />
                收入分类 TOP 5
              </h4>
              <div class="space-y-2">
                <div v-for="item in incomeStats" :key="item.category" class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div class="flex items-center space-x-2">
                    <Icon :icon="item.icon" class="text-green-600" />
                    <span>{{ item.category }}</span>
                  </div>
                  <div class="text-right">
                    <p class="font-semibold text-green-600">{{ formatCurrency(item.amount) }}</p>
                    <p class="text-xs text-gray-500">{{ item.count }}笔交易</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 支出分类 -->
            <div>
              <h4 class="font-medium text-red-600 mb-3 flex items-center">
                <Icon icon="mdi:trending-down" class="mr-2" />
                支出分类 TOP 5
              </h4>
              <div class="space-y-2">
                <div v-for="item in expenseStats" :key="item.category" class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div class="flex items-center space-x-2">
                    <Icon :icon="item.icon" class="text-red-600" />
                    <span>{{ item.category }}</span>
                  </div>
                  <div class="text-right">
                    <p class="font-semibold text-red-600">{{ formatCurrency(item.amount) }}</p>
                    <p class="text-xs text-gray-500">{{ item.count }}笔交易</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <!-- 分类使用分析 -->
      <Card class="mt-6" title="分类使用分析">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div ref="categoryUsageRef" style="height: 350px"></div>
          <div ref="categoryTrendRef" style="height: 350px"></div>
        </div>
      </Card>

      <!-- 添加分类模态框 -->
      <Modal v-model:open="showAddCategory" title="新增分类" @ok="handleAddCategory">
        <Form :model="newCategoryForm" layout="vertical">
          <Form.Item label="分类名称" required>
            <Input v-model:value="newCategoryForm.name" placeholder="请输入分类名称" />
          </Form.Item>
          
          <Row :gutter="16">
            <Col :span="12">
              <Form.Item label="分类类型" required>
                <Select v-model:value="newCategoryForm.type" placeholder="选择类型">
                  <Select.Option value="income">收入分类</Select.Option>
                  <Select.Option value="expense">支出分类</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="父级分类">
                <TreeSelect
                  v-model:value="newCategoryForm.parent"
                  :tree-data="categoryTreeSelect"
                  placeholder="选择父级分类（可选）"
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row :gutter="16">
            <Col :span="12">
              <Form.Item label="图标">
                <Input v-model:value="newCategoryForm.icon" placeholder="mdi:food">
                  <template #addonAfter>
                    <Icon :icon="newCategoryForm.icon || 'mdi:help'" />
                  </template>
                </Input>
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="颜色">
                <ColorPicker v-model:value="newCategoryForm.color" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item label="月度预算">
            <InputNumber
              v-model:value="newCategoryForm.monthlyBudget"
              :precision="2"
              style="width: 100%"
              placeholder="设置月度预算（可选）"
            />
          </Form.Item>
          
          <Form.Item label="描述">
            <Input.TextArea v-model:value="newCategoryForm.description" :rows="3" />
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
  Card, Button, Tree, Tag, Dropdown, Menu, Modal, Form, Input,
  Select, Row, Col, TreeSelect, InputNumber, ColorPicker
} from 'ant-design-vue';
import { Icon } from '@iconify/vue';

defineOptions({ name: 'CategoryManagement' });

const showAddCategory = ref(false);
const categoryUsageRef = ref();
const categoryTrendRef = ref();

// 分类树数据
const categoryTree = ref([
  {
    title: '收入',
    key: 'income-root',
    icon: 'mdi:trending-up',
    children: [
      { title: '工资收入', key: 'salary', icon: 'mdi:account-cash', count: 12, amount: 144000 },
      { title: '投资收益', key: 'investment', icon: 'mdi:chart-line', count: 8, amount: 25600 },
      { title: '兼职收入', key: 'parttime', icon: 'mdi:briefcase', count: 5, amount: 8500 },
      { title: '其他收入', key: 'other-income', icon: 'mdi:plus-circle', count: 3, amount: 2400 }
    ]
  },
  {
    title: '支出',
    key: 'expense-root',
    icon: 'mdi:trending-down',
    children: [
      {
        title: '生活费用',
        key: 'living',
        icon: 'mdi:home',
        children: [
          { title: '餐饮', key: 'food', icon: 'mdi:food', count: 45, amount: 6750 },
          { title: '交通', key: 'transport', icon: 'mdi:car', count: 23, amount: 2890 },
          { title: '住房', key: 'housing', icon: 'mdi:home-city', count: 1, amount: 3500 }
        ]
      },
      {
        title: '娱乐消费',
        key: 'entertainment',
        icon: 'mdi:gamepad-variant',
        children: [
          { title: '电影', key: 'movies', icon: 'mdi:movie', count: 8, amount: 680 },
          { title: '游戏', key: 'games', icon: 'mdi:gamepad', count: 5, amount: 450 },
          { title: '旅游', key: 'travel', icon: 'mdi:airplane', count: 2, amount: 5600 }
        ]
      }
    ]
  }
]);

// 收入统计
const incomeStats = ref([
  { category: '工资收入', icon: 'mdi:account-cash', amount: 144000, count: 12 },
  { category: '投资收益', icon: 'mdi:chart-line', amount: 25600, count: 8 },
  { category: '兼职收入', icon: 'mdi:briefcase', amount: 8500, count: 5 },
  { category: '其他收入', icon: 'mdi:plus-circle', amount: 2400, count: 3 }
]);

// 支出统计
const expenseStats = ref([
  { category: '餐饮', icon: 'mdi:food', amount: 6750, count: 45 },
  { category: '旅游', icon: 'mdi:airplane', amount: 5600, count: 2 },
  { category: '住房', icon: 'mdi:home-city', amount: 3500, count: 1 },
  { category: '交通', icon: 'mdi:car', amount: 2890, count: 23 },
  { category: '电影', icon: 'mdi:movie', amount: 680, count: 8 }
]);

// 新分类表单
const newCategoryForm = ref({
  name: '',
  type: 'expense',
  parent: '',
  icon: 'mdi:folder',
  color: '#1890ff',
  monthlyBudget: 0,
  description: ''
});

const categoryTreeSelect = computed(() => {
  // 转换分类树为TreeSelect格式
  return [];
});

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(amount);
};

const onDrop = (info: any) => {
  console.log('分类拖拽:', info);
};

const handleCategoryAction = (action: string, category: any) => {
  console.log('分类操作:', action, category);
};

const handleAddCategory = () => {
  console.log('添加分类:', newCategoryForm.value);
  showAddCategory.value = false;
};

const initCategoryUsageChart = () => {
  const chart = echarts.init(categoryUsageRef.value);
  
  const option = {
    title: { text: '分类使用频率', left: 'center' },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: '70%',
      data: expenseStats.value.map(item => ({
        value: item.count,
        name: item.category
      }))
    }]
  };
  
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
};

const initCategoryTrendChart = () => {
  const chart = echarts.init(categoryTrendRef.value);
  
  const option = {
    title: { text: '分类支出趋势', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '餐饮',
        type: 'line',
        data: [1200, 1350, 1100, 1400, 1250, 1680],
        smooth: true
      },
      {
        name: '交通',
        type: 'line', 
        data: [450, 500, 480, 520, 480, 570],
        smooth: true
      }
    ]
  };
  
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
};

onMounted(async () => {
  await nextTick();
  initCategoryUsageChart();
  initCategoryTrendChart();
});
</script>

<style scoped>
:deep(.ant-tree-node-content-wrapper) {
  width: 100%;
}
</style>