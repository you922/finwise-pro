<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Card, Col, Row, Statistic } from 'ant-design-vue';

import { useTransactionStore } from '#/store/modules/transaction';

const router = useRouter();
const transactionStore = useTransactionStore();

const loading = ref(false);

// 计算属性
const totalIncome = computed(() => transactionStore.statistics.totalIncome);
const totalExpense = computed(() => transactionStore.statistics.totalExpense);
const balance = computed(() => transactionStore.statistics.balance);

// 快捷导航
const quickNavItems = [
  {
    title: '新建交易',
    icon: 'ant-design:plus-circle-outlined',
    color: '#1890ff',
    onClick: () => router.push('/finance/transaction?action=create'),
  },
  {
    title: '查看报表',
    icon: 'ant-design:bar-chart-outlined',
    color: '#52c41a',
    onClick: () => router.push('/analytics/overview'),
  },
  {
    title: '贷款管理',
    icon: 'ant-design:bank-outlined',
    color: '#722ed1',
    onClick: () => router.push('/finance/loan'),
  },
  {
    title: '数据导入',
    icon: 'ant-design:import-outlined',
    color: '#fa8c16',
    onClick: () => router.push('/tools/import'),
  },
];

// 获取统计数据
async function fetchStatistics() {
  loading.value = true;
  try {
    await transactionStore.fetchStatistics();
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchStatistics();
});
</script>

<template>
  <div class="p-4">
    <!-- 统计卡片 -->
    <Row :gutter="16" class="mb-4">
      <Col :lg="8" :md="12" :sm="24">
        <Card>
          <Statistic
            :loading="loading"
            :precision="2"
            prefix="¥"
            :value="totalIncome"
            :value-style="{ color: '#52c41a' }"
            title="总收入"
          />
        </Card>
      </Col>
      <Col :lg="8" :md="12" :sm="24">
        <Card>
          <Statistic
            :loading="loading"
            :precision="2"
            prefix="¥"
            :value="totalExpense"
            :value-style="{ color: '#ff4d4f' }"
            title="总支出"
          />
        </Card>
      </Col>
      <Col :lg="8" :md="12" :sm="24">
        <Card>
          <Statistic
            :loading="loading"
            :precision="2"
            prefix="¥"
            :value="balance"
            :value-style="{ color: balance >= 0 ? '#1890ff' : '#ff4d4f' }"
            title="余额"
          />
        </Card>
      </Col>
    </Row>

    <!-- 快捷操作 -->
    <Card class="mb-4" title="快捷操作">
      <Row :gutter="16">
        <Col
          v-for="item in quickNavItems"
          :key="item.title"
          :lg="6"
          :md="12"
          :sm="24"
        >
          <Card
            class="cursor-pointer text-center hover:shadow-lg transition-shadow"
            hoverable
            @click="item.onClick"
          >
            <component
              :is="item.icon"
              :style="{ fontSize: '48px', color: item.color }"
            />
            <div class="mt-2 text-base">{{ item.title }}</div>
          </Card>
        </Col>
      </Row>
    </Card>

    <!-- 最近交易和图表区域 -->
    <Row :gutter="16">
      <Col :lg="12" :md="24">
        <Card title="最近交易">
          <div class="text-center text-gray-500 py-8">
            开发中...
          </div>
        </Card>
      </Col>
      <Col :lg="12" :md="24">
        <Card title="收支趋势">
          <div class="text-center text-gray-500 py-8">
            开发中...
          </div>
        </Card>
      </Col>
    </Row>
  </div>
</template>