<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">💼 投资组合</h1>
      <p class="text-gray-600">实时跟踪投资组合表现，智能分析投资收益</p>
    </div>

    <!-- 组合概览 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card class="text-center">
        <div class="space-y-2">
          <div class="text-3xl">📊</div>
          <p class="text-sm text-gray-500">总市值</p>
          <p class="text-2xl font-bold text-blue-600">¥{{ portfolioStats.totalValue.toLocaleString() }}</p>
        </div>
      </Card>
      <Card class="text-center">
        <div class="space-y-2">
          <div class="text-3xl">📈</div>
          <p class="text-sm text-gray-500">总收益</p>
          <p class="text-2xl font-bold" :class="portfolioStats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ portfolioStats.totalProfit >= 0 ? '+' : '' }}¥{{ portfolioStats.totalProfit.toLocaleString() }}
          </p>
        </div>
      </Card>
      <Card class="text-center">
        <div class="space-y-2">
          <div class="text-3xl">⚡</div>
          <p class="text-sm text-gray-500">收益率</p>
          <p class="text-2xl font-bold" :class="portfolioStats.returnRate >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ portfolioStats.returnRate >= 0 ? '+' : '' }}{{ portfolioStats.returnRate.toFixed(2) }}%
          </p>
        </div>
      </Card>
      <Card class="text-center">
        <div class="space-y-2">
          <div class="text-3xl">🎯</div>
          <p class="text-sm text-gray-500">持仓数量</p>
          <p class="text-2xl font-bold text-purple-600">{{ holdings.length }}</p>
        </div>
      </Card>
    </div>

    <!-- 持仓列表 -->
    <Card title="📋 持仓明细" class="mb-6">
      <template #extra>
        <Button type="primary" @click="showAddHolding = true">➕ 添加持仓</Button>
      </template>

      <div v-if="holdings.length === 0" class="text-center py-12">
        <div class="text-8xl mb-6">💼</div>
        <h3 class="text-xl font-medium text-gray-800 mb-2">暂无投资持仓</h3>
        <p class="text-gray-500 mb-6">开始记录您的投资组合</p>
        <Button type="primary" size="large" @click="showAddHolding = true">
          ➕ 添加第一笔投资
        </Button>
      </div>

      <Table v-else :columns="holdingColumns" :dataSource="holdings" :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'profit'">
            <span :class="record.profit >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
              {{ record.profit >= 0 ? '+' : '' }}¥{{ record.profit.toLocaleString() }}
            </span>
          </template>
          <template v-else-if="column.dataIndex === 'returnRate'">
            <span :class="record.returnRate >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
              {{ record.returnRate >= 0 ? '+' : '' }}{{ record.returnRate.toFixed(2) }}%
            </span>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 投资分析 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card title="📈 收益走势">
        <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div class="text-center">
            <div class="text-4xl mb-2">📊</div>
            <p class="text-gray-600">投资收益趋势图</p>
          </div>
        </div>
      </Card>

      <Card title="🥧 资产配置">
        <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div class="text-center">
            <div class="text-4xl mb-2">🍰</div>
            <p class="text-gray-600">资产配置分布图</p>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Card, Button, Table } from 'ant-design-vue';

defineOptions({ name: 'InvestmentPortfolio' });

const showAddHolding = ref(false);

// 组合统计（空数据）
const portfolioStats = ref({
  totalValue: 0,
  totalProfit: 0,
  returnRate: 0
});

// 持仓列表（空数据）
const holdings = ref([]);

const holdingColumns = [
  { title: '代码', dataIndex: 'symbol', key: 'symbol', width: 100 },
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '持仓量', dataIndex: 'quantity', key: 'quantity', width: 100 },
  { title: '成本价', dataIndex: 'costPrice', key: 'costPrice', width: 100 },
  { title: '现价', dataIndex: 'currentPrice', key: 'currentPrice', width: 100 },
  { title: '盈亏', dataIndex: 'profit', key: 'profit', width: 120 },
  { title: '收益率', dataIndex: 'returnRate', key: 'returnRate', width: 100 }
];
</script>

<style scoped>
.grid { display: grid; }
</style>