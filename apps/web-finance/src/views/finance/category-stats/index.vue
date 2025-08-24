<script lang="ts" setup>
import type { Category } from '#/types/finance';

import { computed, onMounted, reactive, ref, watch, nextTick } from 'vue';

import {
  BarChartOutlined,
  CalendarOutlined,
  DollarOutlined,
  PercentageOutlined,
  PieChartOutlined,
  RiseOutlined,
} from '@ant-design/icons-vue';
import {
  Card,
  Col,
  DatePicker,
  message,
  Progress,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
} from 'ant-design-vue';
import type { ColumnsType } from 'ant-design-vue/es/table';
import * as echarts from 'echarts/core';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components';
import { PieChart, BarChart, LineChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  PieChart,
  BarChart,
  LineChart,
  CanvasRenderer,
]);
import dayjs from 'dayjs';

import { useCategoryStore } from '#/store/modules/category';
import { getCategoryStatistics } from '#/api/finance';

const { RangePicker } = DatePicker;

// Store
const categoryStore = useCategoryStore();

// State
const loading = ref(false);
const dateRange = ref<[any, any]>([
  dayjs().startOf('month'),
  dayjs().endOf('month'),
]);
const viewType = ref<'table' | 'chart'>('chart');
const chartType = ref<'pie' | 'bar' | 'trend'>('pie');
const transactionType = ref<'all' | 'income' | 'expense'>('all');
const quickDateType = ref('month'); // 记录当前选中的快速日期类型

// 统计数据
const statsData = ref<any>({
  categories: [],
  totalIncome: 0,
  totalExpense: 0,
  categoryStats: [],
});

// 图表实例
const pieChartRef = ref<HTMLDivElement>();
const barChartRef = ref<HTMLDivElement>();
const trendChartRef = ref<HTMLDivElement>();
let pieChartInstance: echarts.ECharts | null = null;
let barChartInstance: echarts.ECharts | null = null;
let trendChartInstance: echarts.ECharts | null = null;

// 计算属性
const filteredStats = computed(() => {
  const stats = statsData.value.categoryStats || [];
  if (transactionType.value === 'all') {
    return stats;
  }
  return stats.filter((item: any) => item.type === transactionType.value);
});

const tableColumns: ColumnsType = [
  {
    title: '分类',
    dataIndex: 'categoryName',
    key: 'categoryName',
    width: 200,
    customRender: ({ record }) => {
      return `${record.icon || ''} ${record.categoryName}`;
    },
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 80,
    align: 'center',
    customRender: ({ text }) => {
      return text === 'income' ? '收入' : '支出';
    },
  },
  {
    title: '交易笔数',
    dataIndex: 'count',
    key: 'count',
    width: 100,
    align: 'center',
    sorter: (a: any, b: any) => a.count - b.count,
  },
  {
    title: '总金额',
    dataIndex: 'amount',
    key: 'amount',
    width: 150,
    align: 'right',
    sorter: (a: any, b: any) => a.amount - b.amount,
    customRender: ({ text }) => {
      return `¥ ${text.toLocaleString()}`;
    },
  },
  {
    title: '占比',
    dataIndex: 'percentage',
    key: 'percentage',
    width: 120,
    align: 'center',
    sorter: (a: any, b: any) => a.percentage - b.percentage,
    customRender: ({ text }) => {
      return `${text}%`;
    },
  },
  {
    title: '平均金额',
    dataIndex: 'average',
    key: 'average',
    width: 150,
    align: 'right',
    customRender: ({ record }) => {
      const avg = record.amount / record.count;
      return `¥ ${avg.toFixed(2)}`;
    },
  },
  {
    title: '趋势',
    dataIndex: 'trend',
    key: 'trend',
    width: 100,
    align: 'center',
    customRender: ({ record }) => {
      const trend = record.trend || 0;
      const icon = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';
      return `${icon} ${Math.abs(trend)}%`;
    },
  },
];

// 加载统计数据
async function loadStatistics() {
  loading.value = true;
  try {
    const [startDate, endDate] = dateRange.value;
    const params = {
      dateFrom: startDate.format('YYYY-MM-DD'),
      dateTo: endDate.format('YYYY-MM-DD'),
    };
    
    const result = await getCategoryStatistics(params);
    statsData.value = result;
    
    // 更新图表
    updateCharts();
  } catch (error) {
    console.error('加载统计数据失败:', error);
    message.error('加载统计数据失败');
  } finally {
    loading.value = false;
  }
}

// 更新图表
function updateCharts() {
  if (chartType.value === 'pie') {
    updatePieChart();
  } else if (chartType.value === 'bar') {
    updateBarChart();
  } else if (chartType.value === 'trend') {
    updateTrendChart();
  }
}

// 更新饼图
function updatePieChart() {
  if (!pieChartRef.value) return;
  
  if (!pieChartInstance) {
    pieChartInstance = echarts.init(pieChartRef.value);
  }
  
  const data = filteredStats.value.map((item: any) => ({
    name: `${item.icon} ${item.categoryName}`,
    value: item.amount,
    itemStyle: {
      color: item.type === 'income' ? '#52c41a' : '#ff4d4f',
    },
  }));
  
  const option = {
    title: {
      text: '分类支出占比',
      left: 'center',
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center',
    },
    series: [
      {
        name: '分类',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data,
      },
    ],
  };
  
  pieChartInstance.setOption(option);
}

// 更新柱状图
function updateBarChart() {
  if (!barChartRef.value) return;
  
  if (!barChartInstance) {
    barChartInstance = echarts.init(barChartRef.value);
  }
  
  const categories = filteredStats.value.map((item: any) => item.categoryName);
  const amounts = filteredStats.value.map((item: any) => item.amount);
  const counts = filteredStats.value.map((item: any) => item.count);
  
  const option = {
    title: {
      text: '分类金额对比',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      data: ['金额', '笔数'],
      top: 30,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        interval: 0,
        rotate: 45,
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '金额',
        position: 'left',
        axisLabel: {
          formatter: '¥{value}',
        },
      },
      {
        type: 'value',
        name: '笔数',
        position: 'right',
      },
    ],
    series: [
      {
        name: '金额',
        type: 'bar',
        data: amounts,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' },
          ]),
        },
      },
      {
        name: '笔数',
        type: 'line',
        yAxisIndex: 1,
        data: counts,
        itemStyle: {
          color: '#ff9800',
        },
      },
    ],
  };
  
  barChartInstance.setOption(option);
}

// 更新趋势图
function updateTrendChart() {
  if (!trendChartRef.value) return;
  
  if (!trendChartInstance) {
    trendChartInstance = echarts.init(trendChartRef.value);
  }
  
  // 这里模拟趋势数据，实际应该从API获取
  const dates = [];
  const incomeData = [];
  const expenseData = [];
  
  for (let i = 30; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day');
    dates.push(date.format('MM-DD'));
    incomeData.push(Math.floor(Math.random() * 5000) + 1000);
    expenseData.push(Math.floor(Math.random() * 3000) + 500);
  }
  
  const option = {
    title: {
      text: '收支趋势',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['收入', '支出'],
      top: 30,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}',
      },
    },
    series: [
      {
        name: '收入',
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: {
          width: 0,
        },
        showSymbol: false,
        areaStyle: {
          opacity: 0.8,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgb(82, 196, 26)' },
            { offset: 1, color: 'rgb(82, 196, 26, 0.1)' },
          ]),
        },
        emphasis: {
          focus: 'series',
        },
        data: incomeData,
      },
      {
        name: '支出',
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: {
          width: 0,
        },
        showSymbol: false,
        areaStyle: {
          opacity: 0.8,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgb(255, 77, 79)' },
            { offset: 1, color: 'rgb(255, 77, 79, 0.1)' },
          ]),
        },
        emphasis: {
          focus: 'series',
        },
        data: expenseData,
      },
    ],
  };
  
  trendChartInstance.setOption(option);
}

// 日期范围变化
function handleDateRangeChange() {
  loadStatistics();
}

// 快速选择日期
function handleQuickDate(type: string) {
  quickDateType.value = type;
  const now = dayjs();
  switch (type) {
    case 'today':
      dateRange.value = [now.startOf('day'), now.endOf('day')];
      break;
    case 'week':
      dateRange.value = [now.startOf('week'), now.endOf('week')];
      break;
    case 'month':
      dateRange.value = [now.startOf('month'), now.endOf('month')];
      break;
    case 'quarter':
      dateRange.value = [now.startOf('quarter'), now.endOf('quarter')];
      break;
    case 'year':
      dateRange.value = [now.startOf('year'), now.endOf('year')];
      break;
  }
  loadStatistics();
}

// 监听图表类型变化
watch(chartType, () => {
  nextTick(() => {
    updateCharts();
  });
});

// 监听交易类型变化
watch(transactionType, () => {
  updateCharts();
});

// 初始化
onMounted(async () => {
  await categoryStore.fetchCategories();
  await loadStatistics();
  
  // 监听窗口大小变化，重新绘制图表
  window.addEventListener('resize', () => {
    pieChartInstance?.resize();
    barChartInstance?.resize();
    trendChartInstance?.resize();
  });
});
</script>

<template>
  <div class="p-4">
    <!-- 顶部筛选区域 -->
    <Card class="mb-4">
      <Row :gutter="16" align="middle">
        <Col :span="8">
          <Space>
            <CalendarOutlined />
            <RangePicker
              v-model:value="dateRange"
              format="YYYY-MM-DD"
              @change="handleDateRangeChange"
            />
          </Space>
        </Col>
        <Col :span="8">
          <Space>
            <span>快速选择：</span>
            <Radio.Group v-model:value="quickDateType" button-style="solid" size="small">
              <Radio.Button value="today" @click="handleQuickDate('today')">今天</Radio.Button>
              <Radio.Button value="week" @click="handleQuickDate('week')">本周</Radio.Button>
              <Radio.Button value="month" @click="handleQuickDate('month')">本月</Radio.Button>
              <Radio.Button value="quarter" @click="handleQuickDate('quarter')">本季</Radio.Button>
              <Radio.Button value="year" @click="handleQuickDate('year')">本年</Radio.Button>
            </Radio.Group>
          </Space>
        </Col>
        <Col :span="8">
          <Space style="float: right">
            <span>类型：</span>
            <Select v-model:value="transactionType" style="width: 100px">
              <Select.Option value="all">全部</Select.Option>
              <Select.Option value="income">收入</Select.Option>
              <Select.Option value="expense">支出</Select.Option>
            </Select>
            <Radio.Group v-model:value="viewType" button-style="solid">
              <Radio.Button value="chart">
                <PieChartOutlined /> 图表
              </Radio.Button>
              <Radio.Button value="table">
                <BarChartOutlined /> 表格
              </Radio.Button>
            </Radio.Group>
          </Space>
        </Col>
      </Row>
    </Card>

    <!-- 统计概览 -->
    <Row :gutter="16" class="mb-4">
      <Col :span="8">
        <Card>
          <Statistic
            title="总收入"
            :value="statsData.totalIncome"
            :precision="2"
            prefix="¥"
            :value-style="{ color: '#52c41a' }"
          >
            <template #suffix>
              <RiseOutlined />
            </template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="8">
        <Card>
          <Statistic
            title="总支出"
            :value="statsData.totalExpense"
            :precision="2"
            prefix="¥"
            :value-style="{ color: '#ff4d4f' }"
          >
            <template #suffix>
              <DollarOutlined />
            </template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="8">
        <Card>
          <Statistic
            title="净收入"
            :value="statsData.totalIncome - statsData.totalExpense"
            :precision="2"
            prefix="¥"
            :value-style="{ 
              color: statsData.totalIncome - statsData.totalExpense >= 0 ? '#52c41a' : '#ff4d4f' 
            }"
          >
            <template #suffix>
              <PercentageOutlined />
            </template>
          </Statistic>
        </Card>
      </Col>
    </Row>

    <!-- 主要内容区域 -->
    <Card>
      <Spin :spinning="loading">
        <!-- 图表视图 -->
        <div v-if="viewType === 'chart'">
          <Radio.Group v-model:value="chartType" button-style="solid" class="mb-4">
            <Radio.Button value="pie">饼图</Radio.Button>
            <Radio.Button value="bar">柱状图</Radio.Button>
            <Radio.Button value="trend">趋势图</Radio.Button>
          </Radio.Group>
          
          <div v-show="chartType === 'pie'" ref="pieChartRef" style="height: 500px"></div>
          <div v-show="chartType === 'bar'" ref="barChartRef" style="height: 500px"></div>
          <div v-show="chartType === 'trend'" ref="trendChartRef" style="height: 500px"></div>
        </div>

        <!-- 表格视图 -->
        <div v-else>
          <Table
            :columns="tableColumns"
            :data-source="filteredStats"
            :pagination="{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 个分类`,
            }"
            row-key="categoryId"
          />
        </div>
      </Spin>
    </Card>
  </div>
</template>

<style scoped>
:deep(.ant-statistic-content) {
  font-size: 24px;
  font-weight: 600;
}
</style>