<script setup lang="ts">
import type { EChartsOption } from '#/components/charts/useChart';
import type { Category, Transaction, TransactionType } from '#/types/finance';

import { computed, onMounted, ref, watch } from 'vue';

import { useChart } from '#/components/charts/useChart';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  type: TransactionType;
}

const props = defineProps<Props>();

const chartRef = ref<HTMLDivElement | null>(null);
const { setOptions } = useChart(chartRef);

const chartData = computed(() => {
  // 统计各分类的金额
  const categoryMap = new Map<string, number>();
  const categoryNames = new Map<string, string>();

  // 初始化分类名称映射
  props.categories.forEach((cat) => {
    categoryNames.set(cat.id, cat.name);
  });

  // 统计交易数据
  props.transactions
    .filter((t) => t.type === props.type)
    .forEach((transaction) => {
      const current = categoryMap.get(transaction.categoryId) || 0;
      categoryMap.set(transaction.categoryId, current + transaction.amount);
    });

  // 转换为图表数据格式
  const data = [...categoryMap.entries()]
    .map(([categoryId, amount]) => ({
      name: categoryNames.get(categoryId) || '未知分类',
      value: amount,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  return data;
});

const chartOptions = computed<EChartsOption>(() => ({
  title: {
    text: props.type === 'income' ? '收入分类分布' : '支出分类分布',
    left: 'center',
  },
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: ¥{c} ({d}%)',
  },
  legend: {
    orient: 'vertical',
    left: 'left',
    top: '10%',
    type: 'scroll',
  },
  series: [
    {
      name: props.type === 'income' ? '收入' : '支出',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
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
          fontSize: '16',
          fontWeight: 'bold',
          formatter: '{b}\n¥{c}',
        },
      },
      labelLine: {
        show: false,
      },
      data: chartData.value,
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
  <div class="category-pie-chart">
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<style scoped>
.category-pie-chart {
  width: 100%;
  height: 100%;
}

.chart-container {
  width: 100%;
  height: 400px;
}
</style>
