<template>
  <div class="p-4">
    <PageWrapper title="报表分析" content="全面的财务数据分析与多维度报表">
      <!-- 报表控制面板 -->
      <Card class="mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <Select v-model:value="reportType" style="width: 150px" @change="generateReport">
              <Select.Option value="summary">财务摘要</Select.Option>
              <Select.Option value="cashflow">现金流</Select.Option>
              <Select.Option value="profitloss">损益表</Select.Option>
              <Select.Option value="balance">资产负债</Select.Option>
            </Select>
            <RangePicker v-model:value="reportDateRange" @change="generateReport" />
            <Select v-model:value="reportPeriod" style="width: 120px" @change="generateReport">
              <Select.Option value="daily">按日</Select.Option>
              <Select.Option value="weekly">按周</Select.Option>
              <Select.Option value="monthly">按月</Select.Option>
              <Select.Option value="quarterly">按季</Select.Option>
            </Select>
          </div>
          <div class="flex items-center space-x-2">
            <Button @click="exportReport">
              <Icon icon="mdi:download" class="mr-1" />
              导出Excel
            </Button>
            <Button @click="exportPDF">
              <Icon icon="mdi:file-pdf" class="mr-1" />
              导出PDF
            </Button>
            <Button @click="scheduleReport">
              <Icon icon="mdi:calendar-clock" class="mr-1" />
              定时报表
            </Button>
          </div>
        </div>
      </Card>

      <!-- 关键财务指标 -->
      <Card class="mb-6" title="关键财务指标">
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div v-for="kpi in keyPerformanceIndicators" :key="kpi.name" class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="flex items-center justify-center mb-2">
              <Icon :icon="kpi.icon" :class="kpi.color" class="text-2xl" />
            </div>
            <p class="text-sm text-gray-500 mb-1">{{ kpi.name }}</p>
            <p class="text-xl font-bold">{{ kpi.value }}</p>
            <p class="text-xs" :class="kpi.trend > 0 ? 'text-green-500' : 'text-red-500'">
              {{ kpi.trend > 0 ? '↗' : '↘' }} {{ Math.abs(kpi.trend) }}%
            </p>
          </div>
        </div>
      </Card>

      <!-- 主要报表图表 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="收支流水图">
          <div ref="cashflowChartRef" style="height: 400px"></div>
        </Card>
        
        <Card title="资产变化趋势">
          <div ref="assetTrendRef" style="height: 400px"></div>
        </Card>
      </div>

      <!-- 详细数据表格 -->
      <Card title="详细财务数据">
        <template #extra>
          <Space>
            <Button @click="refreshReport">
              <Icon icon="mdi:refresh" />
            </Button>
            <Button @click="customizeColumns">
              <Icon icon="mdi:view-column" />
              自定义列
            </Button>
          </Space>
        </template>
        
        <Table
          :columns="reportColumns"
          :dataSource="reportData"
          :scroll="{ x: 1000 }"
          :pagination="{
            showSizeChanger: true,
            showQuickJumper: true,
            total: reportData.length,
            showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条记录`
          }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'amount'">
              <span :class="record.amount >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
                {{ formatCurrency(record.amount) }}
              </span>
            </template>
            <template v-else-if="column.dataIndex === 'growth'">
              <Tag :color="record.growth >= 0 ? 'green' : 'red'">
                {{ record.growth >= 0 ? '+' : '' }}{{ record.growth }}%
              </Tag>
            </template>
          </template>
        </Table>
      </Card>

      <!-- 财务健康评分 -->
      <Card class="mt-6" title="财务健康评分">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="text-center">
            <div class="mb-4">
              <Progress 
                type="circle" 
                :percent="financialHealthScore" 
                :stroke-color="getHealthColor(financialHealthScore)"
                :width="120"
                format="%"
              />
            </div>
            <h4 class="font-medium">综合评分</h4>
            <p class="text-2xl font-bold" :class="getHealthTextColor(financialHealthScore)">
              {{ financialHealthScore }}分
            </p>
            <p class="text-sm text-gray-500">{{ getHealthStatus(financialHealthScore) }}</p>
          </div>
          
          <div class="space-y-3">
            <h4 class="font-medium">评分详情</h4>
            <div v-for="detail in healthDetails" :key="detail.category" class="flex items-center justify-between">
              <span class="text-sm">{{ detail.category }}</span>
              <div class="flex items-center space-x-2">
                <Progress :percent="detail.score" size="small" style="width: 80px" />
                <span class="text-sm font-medium">{{ detail.score }}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 class="font-medium mb-3">改进建议</h4>
            <div class="space-y-2">
              <div v-for="tip in improvementTips" :key="tip" class="flex items-start space-x-2">
                <Icon icon="mdi:lightbulb" class="text-yellow-500 mt-0.5" />
                <span class="text-sm text-gray-600">{{ tip }}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </PageWrapper>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import { PageWrapper } from '@vben/common-ui';
import {
  Card, Select, RangePicker, Button, Space, Progress, Tag, Table
} from 'ant-design-vue';
import { Icon } from '@iconify/vue';

defineOptions({ name: 'ReportsAnalytics' });

const reportType = ref('summary');
const reportDateRange = ref();
const reportPeriod = ref('monthly');
const cashflowChartRef = ref();
const assetTrendRef = ref();

// 关键财务指标
const keyPerformanceIndicators = ref([
  {
    name: 'ROI',
    value: '12.5%',
    trend: 8.2,
    icon: 'mdi:trending-up',
    color: 'text-green-500'
  },
  {
    name: '储蓄率',
    value: '35%',
    trend: 5.1,
    icon: 'mdi:piggy-bank',
    color: 'text-blue-500'
  },
  {
    name: '负债率',
    value: '15%',
    trend: -2.3,
    icon: 'mdi:credit-card',
    color: 'text-orange-500'
  },
  {
    name: '流动比率',
    value: '2.8',
    trend: 12.1,
    icon: 'mdi:water',
    color: 'text-cyan-500'
  },
  {
    name: '月均收入',
    value: '¥15,680',
    trend: 6.8,
    icon: 'mdi:cash',
    color: 'text-green-600'
  },
  {
    name: '月均支出',
    value: '¥10,240',
    trend: -4.2,
    icon: 'mdi:cash-minus',
    color: 'text-red-500'
  }
]);

// 财务健康评分
const financialHealthScore = ref(78);

const healthDetails = ref([
  { category: '现金流管理', score: 85 },
  { category: '债务控制', score: 92 },
  { category: '储蓄能力', score: 75 },
  { category: '投资回报', score: 68 },
  { category: '预算执行', score: 80 }
]);

const improvementTips = ref([
  '建议增加投资理财比例以提高资产收益',
  '控制非必要支出，提高储蓄率',
  '考虑分散投资降低风险',
  '建立紧急基金，增强财务安全性'
]);

// 报表数据
const reportColumns = [
  { title: '期间', dataIndex: 'period', key: 'period', width: 100 },
  { title: '收入', dataIndex: 'income', key: 'income', width: 120 },
  { title: '支出', dataIndex: 'expense', key: 'expense', width: 120 },
  { title: '净收入', dataIndex: 'amount', key: 'amount', width: 120 },
  { title: '增长率', dataIndex: 'growth', key: 'growth', width: 100 },
  { title: '累计', dataIndex: 'cumulative', key: 'cumulative', width: 120 }
];

const reportData = ref([
  {
    key: '1',
    period: '2024-12',
    income: 15680,
    expense: 10240,
    amount: 5440,
    growth: 8.5,
    cumulative: 65440
  },
  {
    key: '2',
    period: '2024-11',
    income: 14200,
    expense: 9800,
    amount: 4400,
    growth: -2.1,
    cumulative: 60000
  },
  {
    key: '3',
    period: '2024-10',
    income: 16800,
    expense: 11200,
    amount: 5600,
    growth: 15.2,
    cumulative: 55600
  }
]);

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(amount);
};

const getHealthColor = (score: number) => {
  if (score >= 80) return '#52c41a';
  if (score >= 60) return '#faad14';
  return '#ff4d4f';
};

const getHealthTextColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const getHealthStatus = (score: number) => {
  if (score >= 80) return '财务状况良好';
  if (score >= 60) return '财务状况一般';
  return '需要改善';
};

const generateReport = () => {
  console.log('生成报表:', reportType.value, reportDateRange.value, reportPeriod.value);
};

const exportReport = () => {
  console.log('导出Excel报表');
};

const exportPDF = () => {
  console.log('导出PDF报表');
};

const scheduleReport = () => {
  console.log('设置定时报表');
};

const refreshReport = () => {
  console.log('刷新报表数据');
};

const customizeColumns = () => {
  console.log('自定义表格列');
};

// 初始化图表
const initCashflowChart = () => {
  const chart = echarts.init(cashflowChartRef.value);
  
  const option = {
    title: { text: '月度现金流', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['收入', '支出', '净流量'], bottom: 0 },
    xAxis: {
      type: 'category',
      data: ['7月', '8月', '9月', '10月', '11月', '12月']
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '收入',
        type: 'bar',
        data: [14200, 15300, 16100, 16800, 14200, 15680],
        itemStyle: { color: '#52c41a' }
      },
      {
        name: '支出',
        type: 'bar',
        data: [9800, 10400, 10800, 11200, 9800, 10240],
        itemStyle: { color: '#ff4d4f' }
      },
      {
        name: '净流量',
        type: 'line',
        data: [4400, 4900, 5300, 5600, 4400, 5440],
        itemStyle: { color: '#1890ff' },
        lineStyle: { width: 3 }
      }
    ]
  };
  
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
};

const initAssetTrendChart = () => {
  const chart = echarts.init(assetTrendRef.value);
  
  const option = {
    title: { text: '资产增长趋势', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['7月', '8月', '9月', '10月', '11月', '12月']
    },
    yAxis: { type: 'value' },
    series: [{
      name: '总资产',
      type: 'line',
      data: [420000, 435000, 448000, 465000, 478000, 495000],
      smooth: true,
      itemStyle: { color: '#1890ff' },
      areaStyle: { opacity: 0.3, color: '#1890ff' }
    }]
  };
  
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
};

onMounted(async () => {
  await nextTick();
  initCashflowChart();
  initAssetTrendChart();
});
</script>