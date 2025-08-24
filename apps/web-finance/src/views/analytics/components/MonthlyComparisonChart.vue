<script setup lang="ts">
import type { EChartsOption } from '#/components/charts/useChart';
import type { Transaction } from '#/types/finance';

import { computed, onMounted, ref, watch } from 'vue';

import dayjs from 'dayjs';

import { useChart } from '#/components/charts/useChart';

interface Props {
  transactions: Transaction[];
  year: number;
}

const props = defineProps<Props>();

const chartRef = ref<HTMLDivElement | null>(null);
const { setOptions } = useChart(chartRef);

const chartData = computed(() => {
  const months = [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月',
  ];
  const incomeData = Array.from({ length: 12 }).fill(0);
  const expenseData = Array.from({ length: 12 }).fill(0);
  const netData = Array.from({ length: 12 }).fill(0);

  // 统计每月数据
  props.transactions.forEach((transaction) => {
    const date = dayjs(transaction.date);
    if (date.year() === props.year) {
      const monthIndex = date.month(); // 0-11

      if (transaction.type === 'income') {
        incomeData[monthIndex] += transaction.amount;
      } else {
        expenseData[monthIndex] += transaction.amount;
      }
    }
  });

  // 计算净收入
  for (let i = 0; i < 12; i++) {
    netData[i] = incomeData[i] - expenseData[i];
  }

  return {
    months,
    income: incomeData,
    expense: expenseData,
    net: netData,
  };
});

const chartOptions = computed<EChartsOption>(() => ({
  title: {
    text: `${props.year}年月度收支对比`,
    left: 'center',
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      crossStyle: {
        color: '#999',
      },
    },
    formatter: (params: any) => {
      let html = `<div style="font-weight: bold">${params[0].name}</div>`;
      params.forEach((item: any) => {
        const value = item.value.toFixed(2);
        const prefix =
          item.seriesName === '净收入' && item.value > 0 ? '+' : '';
        html += `<div>${item.marker} ${item.seriesName}: ${prefix}¥${value}</div>`;
      });
      return html;
    },
  },
  toolbox: {
    feature: {
      dataView: { show: true, readOnly: false },
      magicType: { show: true, type: ['line', 'bar'] },
      restore: { show: true },
      saveAsImage: { show: true },
    },
  },
  legend: {
    data: ['收入', '支出', '净收入'],
    top: 30,
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },
  xAxis: [
    {
      type: 'category',
      data: chartData.value.months,
      axisPointer: {
        type: 'shadow',
      },
    },
  ],
  yAxis: [
    {
      type: 'value',
      name: '金额',
      axisLabel: {
        formatter: '¥{value}',
      },
    },
  ],
  series: [
    {
      name: '收入',
      type: 'bar',
      data: chartData.value.income,
      itemStyle: {
        color: '#52c41a',
      },
    },
    {
      name: '支出',
      type: 'bar',
      data: chartData.value.expense,
      itemStyle: {
        color: '#ff4d4f',
      },
    },
    {
      name: '净收入',
      type: 'line',
      data: chartData.value.net,
      itemStyle: {
        color: '#1890ff',
      },
      lineStyle: {
        width: 3,
      },
      symbol: 'circle',
      symbolSize: 8,
    },
  ],
}));

watch(chartOptions, (options) => {
  setOptions(options);
});

onMounted(() => {
  setOptions(chartOptions.value);
});
</script>

<template>
  <div class="monthly-comparison-chart">
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<style scoped>
.monthly-comparison-chart {
  width: 100%;
  height: 100%;
}

.chart-container {
  width: 100%;
  height: 400px;
}
</style>
