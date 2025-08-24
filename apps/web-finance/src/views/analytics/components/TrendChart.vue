<script setup lang="ts">
import type { EChartsOption } from '#/components/charts/useChart';
import type { Transaction } from '#/types/finance';

import { computed, onMounted, ref, watch } from 'vue';

import dayjs from 'dayjs';

import { useChart } from '#/components/charts/useChart';

interface Props {
  transactions: Transaction[];
  dateRange: [string, string];
  groupBy?: 'day' | 'month' | 'week';
}

const props = withDefaults(defineProps<Props>(), {
  groupBy: 'day',
});

const chartRef = ref<HTMLDivElement | null>(null);
const { setOptions } = useChart(chartRef);

const chartData = computed(() => {
  const [startDate, endDate] = props.dateRange;
  const start = dayjs(startDate);
  const end = dayjs(endDate);

  // 生成日期序列
  const dates: string[] = [];
  const incomeMap = new Map<string, number>();
  const expenseMap = new Map<string, number>();

  let current = start;
  while (current.isBefore(end) || current.isSame(end)) {
    const dateKey = getDateKey(current);
    dates.push(dateKey);
    incomeMap.set(dateKey, 0);
    expenseMap.set(dateKey, 0);

    // 根据分组方式调整日期增量
    if (props.groupBy === 'day') {
      current = current.add(1, 'day');
    } else if (props.groupBy === 'week') {
      current = current.add(1, 'week');
    } else {
      current = current.add(1, 'month');
    }
  }

  // 统计交易数据
  props.transactions.forEach((transaction) => {
    const date = dayjs(transaction.date);
    if (
      date.isAfter(start.subtract(1, 'day')) &&
      date.isBefore(end.add(1, 'day'))
    ) {
      const dateKey = getDateKey(date);

      if (transaction.type === 'income') {
        incomeMap.set(
          dateKey,
          (incomeMap.get(dateKey) || 0) + transaction.amount,
        );
      } else {
        expenseMap.set(
          dateKey,
          (expenseMap.get(dateKey) || 0) + transaction.amount,
        );
      }
    }
  });

  return {
    dates,
    income: dates.map((date) => incomeMap.get(date) || 0),
    expense: dates.map((date) => expenseMap.get(date) || 0),
  };
});

function getDateKey(date: dayjs.Dayjs): string {
  if (props.groupBy === 'day') {
    return date.format('MM-DD');
  } else if (props.groupBy === 'week') {
    return `第${date.week()}周`;
  } else {
    return date.format('YYYY-MM');
  }
}

const chartOptions = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
    formatter: (params: any) => {
      const date = params[0].name;
      let html = `<div style="font-weight: bold">${date}</div>`;
      params.forEach((item: any) => {
        html += `<div>${item.marker} ${item.seriesName}: ¥${item.value.toFixed(2)}</div>`;
      });
      return html;
    },
  },
  legend: {
    data: ['收入', '支出'],
    top: 0,
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: chartData.value.dates,
    axisTick: {
      alignWithLabel: true,
    },
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
  <div class="trend-chart">
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<style scoped>
.trend-chart {
  width: 100%;
  height: 100%;
}

.chart-container {
  width: 100%;
  height: 400px;
}
</style>
