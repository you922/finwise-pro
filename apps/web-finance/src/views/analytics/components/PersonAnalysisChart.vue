<script setup lang="ts">
import type { EChartsOption } from '#/components/charts/useChart';
import type { Person, Transaction } from '#/types/finance';

import { computed, onMounted, ref, watch } from 'vue';

import { useChart } from '#/components/charts/useChart';

interface Props {
  transactions: Transaction[];
  persons: Person[];
  limit?: number;
}

const props = withDefaults(defineProps<Props>(), {
  limit: 10,
});

const chartRef = ref<HTMLDivElement | null>(null);
const { setOptions } = useChart(chartRef);

const chartData = computed(() => {
  const personMap = new Map<string, { expense: number; income: number }>();
  const personNames = new Map<string, string>();

  // 初始化人员名称映射
  props.persons.forEach((person) => {
    personNames.set(person.name, person.name);
  });

  // 统计交易数据
  props.transactions.forEach((transaction) => {
    // 统计付款人数据
    if (transaction.payer) {
      const current = personMap.get(transaction.payer) || {
        income: 0,
        expense: 0,
      };
      if (transaction.type === 'expense') {
        current.expense += transaction.amount;
      }
      personMap.set(transaction.payer, current);
    }

    // 统计收款人数据
    if (transaction.payee) {
      const current = personMap.get(transaction.payee) || {
        income: 0,
        expense: 0,
      };
      if (transaction.type === 'income') {
        current.income += transaction.amount;
      }
      personMap.set(transaction.payee, current);
    }
  });

  // 计算总金额并排序
  const sortedData = [...personMap.entries()]
    .map(([name, data]) => ({
      name,
      income: data.income,
      expense: data.expense,
      total: data.income + data.expense,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, props.limit);

  return {
    names: sortedData.map((item) => item.name),
    income: sortedData.map((item) => item.income),
    expense: sortedData.map((item) => item.expense),
  };
});

const chartOptions = computed<EChartsOption>(() => ({
  title: {
    text: `人员交易统计（前${props.limit}名）`,
    left: 'center',
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
    formatter: (params: any) => {
      let html = `<div style="font-weight: bold">${params[0].name}</div>`;
      params.forEach((item: any) => {
        html += `<div>${item.marker} ${item.seriesName}: ¥${item.value.toFixed(2)}</div>`;
      });
      return html;
    },
  },
  legend: {
    data: ['收入相关', '支出相关'],
    top: 30,
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '15%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: chartData.value.names,
    axisTick: {
      alignWithLabel: true,
    },
    axisLabel: {
      interval: 0,
      rotate: 30,
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
      name: '收入相关',
      type: 'bar',
      stack: 'total',
      data: chartData.value.income,
      itemStyle: {
        color: '#52c41a',
      },
    },
    {
      name: '支出相关',
      type: 'bar',
      stack: 'total',
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
  <div class="person-analysis-chart">
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<style scoped>
.person-analysis-chart {
  width: 100%;
  height: 100%;
}

.chart-container {
  width: 100%;
  height: 400px;
}
</style>
