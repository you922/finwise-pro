<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">🧾 税务管理</h1>
      <p class="text-gray-600">个人所得税计算、申报和税务优化建议</p>
    </div>

    <!-- 税务概览 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card class="text-center">
        <div class="space-y-2">
          <div class="text-3xl">💰</div>
          <p class="text-sm text-gray-500">年度收入</p>
          <p class="text-2xl font-bold text-blue-600">¥{{ taxStats.yearlyIncome.toLocaleString() }}</p>
        </div>
      </Card>
      <Card class="text-center">
        <div class="space-y-2">
          <div class="text-3xl">🧾</div>
          <p class="text-sm text-gray-500">已缴税额</p>
          <p class="text-2xl font-bold text-red-600">¥{{ taxStats.paidTax.toLocaleString() }}</p>
        </div>
      </Card>
      <Card class="text-center">
        <div class="space-y-2">
          <div class="text-3xl">💡</div>
          <p class="text-sm text-gray-500">可节税</p>
          <p class="text-2xl font-bold text-green-600">¥{{ taxStats.potentialSaving.toLocaleString() }}</p>
        </div>
      </Card>
      <Card class="text-center">
        <div class="space-y-2">
          <div class="text-3xl">📅</div>
          <p class="text-sm text-gray-500">申报状态</p>
          <Tag :color="taxStats.filingStatus === 'completed' ? 'green' : 'orange'">
            {{ taxStats.filingStatus === 'completed' ? '已申报' : '待申报' }}
          </Tag>
        </div>
      </Card>
    </div>

    <!-- 税务工具 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <Card title="🧮 个税计算器">
        <div class="space-y-4">
          <Input placeholder="月收入" />
          <Input placeholder="专项扣除" />
          <Input placeholder="专项附加扣除" />
          <Button type="primary" block>计算个税</Button>
        </div>
      </Card>

      <Card title="📊 纳税分析">
        <div class="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
          <div class="text-center">
            <div class="text-3xl mb-2">📈</div>
            <p class="text-gray-600">税负分析图</p>
          </div>
        </div>
      </Card>

      <Card title="💡 节税建议">
        <div v-if="taxTips.length === 0" class="text-center py-6">
          <div class="text-3xl mb-2">💡</div>
          <p class="text-gray-500">暂无节税建议</p>
        </div>
        <div v-else class="space-y-3">
          <div v-for="tip in taxTips" :key="tip.id" class="p-3 bg-blue-50 rounded-lg">
            <p class="text-sm font-medium text-blue-800">{{ tip.title }}</p>
            <p class="text-xs text-blue-600">{{ tip.description }}</p>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Card, Tag, Input, Button } from 'ant-design-vue';

defineOptions({ name: 'TaxManagement' });

// 税务统计（空数据）
const taxStats = ref({
  yearlyIncome: 0,
  paidTax: 0,
  potentialSaving: 0,
  filingStatus: 'pending'
});

// 节税建议（空数据）
const taxTips = ref([]);
</script>

<style scoped>
.grid { display: grid; }
</style>