<script setup lang="ts">
import type { Transaction } from '#/types/finance';
import type { EChartsOption } from '#/components/charts/useChart';

import { computed, ref, watch } from 'vue';

import { Card, Radio, RadioGroup, Statistic, Row, Col } from 'ant-design-vue';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  FieldTimeOutlined,
  BarChartOutlined,
} from '@ant-design/icons-vue';
import dayjs from 'dayjs';

import { useChart } from '#/components/charts/useChart';

interface Props {
  transactions: Transaction[];
  type?: 'all' | 'income' | 'expense';
}

const props = withDefaults(defineProps<Props>(), {
  type: 'expense',
});

const chartRef = ref<HTMLDivElement | null>(null);
const heatmapRef = ref<HTMLDivElement | null>(null);
const { setOptions: setChartOptions } = useChart(chartRef);
const { setOptions: setHeatmapOptions } = useChart(heatmapRef);

const viewMode = ref<'weekday' | 'hour' | 'month' | 'quarter'>('weekday');

// 过滤交易
const filteredTransactions = computed(() => {
  return props.transactions.filter(t => {
    if (props.type === 'income') return t.type === 'income';
    if (props.type === 'expense') return t.type === 'expense';
    return true;
  });
});

// 工作日vs周末分析
const weekdayAnalysis = computed(() => {
  const weekdayData = { amount: 0, count: 0, days: new Set<string>() };
  const weekendData = { amount: 0, count: 0, days: new Set<string>() };
  
  filteredTransactions.value.forEach(t => {
    const date = dayjs(t.date);
    const dayOfWeek = date.day();
    const dateStr = date.format('YYYY-MM-DD');
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendData.amount += t.amount;
      weekendData.count++;
      weekendData.days.add(dateStr);
    } else {
      weekdayData.amount += t.amount;
      weekdayData.count++;
      weekdayData.days.add(dateStr);
    }
  });
  
  const weekdayAvg = weekdayData.days.size > 0 ? weekdayData.amount / weekdayData.days.size : 0;
  const weekendAvg = weekendData.days.size > 0 ? weekendData.amount / weekendData.days.size : 0;
  
  return {
    weekday: {
      total: weekdayData.amount,
      count: weekdayData.count,
      average: weekdayAvg,
      days: weekdayData.days.size,
    },
    weekend: {
      total: weekendData.amount,
      count: weekendData.count,
      average: weekendAvg,
      days: weekendData.days.size,
    },
  };
});

// 按星期几统计
const dayOfWeekData = computed(() => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const data = new Array(7).fill(0).map(() => ({ amount: 0, count: 0 }));
  
  filteredTransactions.value.forEach(t => {
    const dayIndex = dayjs(t.date).day();
    data[dayIndex].amount += t.amount;
    data[dayIndex].count++;
  });
  
  return {
    categories: days,
    amounts: data.map(d => d.amount),
    counts: data.map(d => d.count),
    averages: data.map(d => d.count > 0 ? d.amount / d.count : 0),
  };
});

// 按小时统计
const hourlyData = computed(() => {
  const hours = new Array(24).fill(0).map((_, i) => `${i}:00`);
  const data = new Array(24).fill(0).map(() => ({ amount: 0, count: 0 }));
  
  filteredTransactions.value.forEach(t => {
    // 假设交易有时间字段，如果没有则随机分配
    const hour = t.time ? parseInt(t.time.split(':')[0]) : Math.floor(Math.random() * 24);
    data[hour].amount += t.amount;
    data[hour].count++;
  });
  
  return {
    categories: hours,
    amounts: data.map(d => d.amount),
    counts: data.map(d => d.count),
    averages: data.map(d => d.count > 0 ? d.amount / d.count : 0),
  };
});

// 按月份统计
const monthlyData = computed(() => {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const data = new Array(12).fill(0).map(() => ({ amount: 0, count: 0 }));
  
  filteredTransactions.value.forEach(t => {
    const monthIndex = dayjs(t.date).month();
    data[monthIndex].amount += t.amount;
    data[monthIndex].count++;
  });
  
  return {
    categories: months,
    amounts: data.map(d => d.amount),
    counts: data.map(d => d.count),
    averages: data.map(d => d.count > 0 ? d.amount / d.count : 0),
  };
});

// 按季度统计
const quarterlyData = computed(() => {
  const quarters = ['第一季度', '第二季度', '第三季度', '第四季度'];
  const data = new Array(4).fill(0).map(() => ({ amount: 0, count: 0 }));
  
  filteredTransactions.value.forEach(t => {
    const quarterIndex = Math.floor(dayjs(t.date).month() / 3);
    data[quarterIndex].amount += t.amount;
    data[quarterIndex].count++;
  });
  
  return {
    categories: quarters,
    amounts: data.map(d => d.amount),
    counts: data.map(d => d.count),
    averages: data.map(d => d.count > 0 ? d.amount / d.count : 0),
  };
});

// 获取当前图表数据
const currentChartData = computed(() => {
  switch (viewMode.value) {
    case 'weekday':
      return dayOfWeekData.value;
    case 'hour':
      return hourlyData.value;
    case 'month':
      return monthlyData.value;
    case 'quarter':
      return quarterlyData.value;
    default:
      return dayOfWeekData.value;
  }
});

// 主图表配置
const chartOptions = computed<EChartsOption>(() => {
  const data = currentChartData.value;
  const typeLabel = props.type === 'income' ? '收入' : props.type === 'expense' ? '支出' : '交易';
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: any) => {
        const index = params[0].dataIndex;
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${data.categories[index]}</div>
            <div>总${typeLabel}: ¥${data.amounts[index].toFixed(2)}</div>
            <div>交易次数: ${data.counts[index]}笔</div>
            <div>平均金额: ¥${data.averages[index].toFixed(2)}</div>
          </div>
        `;
      },
    },
    legend: {
      data: [`总${typeLabel}`, '交易次数'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.categories,
      axisLabel: {
        rotate: viewMode.value === 'hour' ? 45 : 0,
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '金额(元)',
        axisLabel: {
          formatter: '¥{value}',
        },
      },
      {
        type: 'value',
        name: '次数',
        axisLabel: {
          formatter: '{value}笔',
        },
      },
    ],
    series: [
      {
        name: `总${typeLabel}`,
        type: 'bar',
        data: data.amounts,
        itemStyle: {
          color: props.type === 'income' ? '#52c41a' : '#ff4d4f',
        },
        label: {
          show: viewMode.value !== 'hour',
          position: 'top',
          formatter: (params: any) => `¥${params.value.toFixed(0)}`,
        },
      },
      {
        name: '交易次数',
        type: 'line',
        yAxisIndex: 1,
        data: data.counts,
        itemStyle: {
          color: '#1890ff',
        },
        lineStyle: {
          width: 2,
        },
        symbol: 'circle',
        symbolSize: 6,
      },
    ],
  };
});

// 热力图数据
const heatmapData = computed(() => {
  const dayMap = new Map<string, number>();
  const hourMap = new Map<number, number>();
  
  filteredTransactions.value.forEach(t => {
    const date = dayjs(t.date);
    const dayOfWeek = date.day();
    const hour = t.time ? parseInt(t.time.split(':')[0]) : Math.floor(Math.random() * 24);
    
    const key = `${dayOfWeek}-${hour}`;
    dayMap.set(key, (dayMap.get(key) || 0) + t.amount);
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
  });
  
  const data: any[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const key = `${day}-${hour}`;
      data.push([hour, day, dayMap.get(key) || 0]);
    }
  }
  
  return data;
});

// 热力图配置
const heatmapOptions = computed<EChartsOption>(() => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const hours = new Array(24).fill(0).map((_, i) => `${i}:00`);
  
  return {
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        const hour = params.data[0];
        const day = params.data[1];
        const value = params.data[2];
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold;">${days[day]} ${hours[hour]}</div>
            <div>金额: ¥${value.toFixed(2)}</div>
          </div>
        `;
      },
    },
    grid: {
      height: '70%',
      top: '10%',
    },
    xAxis: {
      type: 'category',
      data: hours,
      splitArea: {
        show: true,
      },
      axisLabel: {
        rotate: 45,
      },
    },
    yAxis: {
      type: 'category',
      data: days,
      splitArea: {
        show: true,
      },
    },
    visualMap: {
      min: 0,
      max: Math.max(...heatmapData.value.map(d => d[2])),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      inRange: {
        color: ['#f0f0f0', '#ffeda0', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026'],
      },
    },
    series: [
      {
        name: '消费热力图',
        type: 'heatmap',
        data: heatmapData.value,
        label: {
          show: false,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };
});

// 格式化金额
const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

watch(chartOptions, (options) => {
  setChartOptions(options);
});

watch(heatmapOptions, (options) => {
  setHeatmapOptions(options);
});
</script>

<template>
  <div class="time-dimension-analysis">
    <!-- 工作日vs周末统计卡片 -->
    <Row :gutter="16" class="mb-4">
      <Col :span="12">
        <Card>
          <Statistic
            title="工作日平均消费"
            :value="weekdayAnalysis.weekday.average"
            :precision="2"
            prefix="¥"
            :value-style="{ color: '#1890ff' }"
          >
            <template #suffix>
              <span style="font-size: 14px; color: #8c8c8c;">
                /天 ({{ weekdayAnalysis.weekday.days }}天)
              </span>
            </template>
          </Statistic>
          <div class="stat-footer">
            总计: {{ formatAmount(weekdayAnalysis.weekday.total) }} · {{ weekdayAnalysis.weekday.count }}笔
          </div>
        </Card>
      </Col>
      
      <Col :span="12">
        <Card>
          <Statistic
            title="周末平均消费"
            :value="weekdayAnalysis.weekend.average"
            :precision="2"
            prefix="¥"
            :value-style="{ color: '#52c41a' }"
          >
            <template #suffix>
              <span style="font-size: 14px; color: #8c8c8c;">
                /天 ({{ weekdayAnalysis.weekend.days }}天)
              </span>
            </template>
          </Statistic>
          <div class="stat-footer">
            总计: {{ formatAmount(weekdayAnalysis.weekend.total) }} · {{ weekdayAnalysis.weekend.count }}笔
          </div>
        </Card>
      </Col>
    </Row>
    
    <!-- 时间维度图表 -->
    <Card title="时间模式分析">
      <template #extra>
        <RadioGroup v-model:value="viewMode" button-style="solid">
          <Radio value="weekday">
            <CalendarOutlined /> 星期
          </Radio>
          <Radio value="hour">
            <ClockCircleOutlined /> 时段
          </Radio>
          <Radio value="month">
            <FieldTimeOutlined /> 月份
          </Radio>
          <Radio value="quarter">
            <BarChartOutlined /> 季度
          </Radio>
        </RadioGroup>
      </template>
      
      <div ref="chartRef" style="height: 400px;"></div>
    </Card>
    
    <!-- 消费热力图 -->
    <Card title="消费时间热力图" class="mt-4">
      <template #extra>
        <span class="text-gray-500">显示一周内各时段的消费分布</span>
      </template>
      
      <div ref="heatmapRef" style="height: 400px;"></div>
    </Card>
  </div>
</template>

<style scoped>
.time-dimension-analysis {
  width: 100%;
}

.stat-footer {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
  color: #8c8c8c;
}

:deep(.ant-statistic-title) {
  font-size: 14px;
  color: #595959;
}

:deep(.ant-statistic-content) {
  font-size: 24px;
}

:deep(.ant-radio-group) {
  font-size: 13px;
}

:deep(.ant-radio-button-wrapper) {
  padding: 0 12px;
  height: 28px;
  line-height: 26px;
}
</style>