<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">📈 报表分析</h1>
      <p class="text-gray-600">全面的财务数据分析与报表</p>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card title="📊 现金流分析">
        <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div class="text-center">
            <div class="text-4xl mb-2">📈</div>
            <p class="text-gray-600">现金流趋势图</p>
          </div>
        </div>
      </Card>
      
      <Card title="🥧 支出分析">
        <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div class="text-center">
            <div class="text-4xl mb-2">🍰</div>
            <p class="text-gray-600">支出分布图</p>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Card } from 'ant-design-vue';
defineOptions({ name: 'ReportsAnalytics' });
</script>

<style scoped>
.grid { display: grid; }
</style>