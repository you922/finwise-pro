<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-8">
    <div class="max-w-6xl mx-auto">
      <!-- 头部 -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">
          🎉 TokenRecords 财务管理系统
        </h1>
        <p class="text-xl text-gray-600">
          现代化财务管理平台 - 功能测试页面
        </p>
      </div>

      <!-- 系统状态 -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 class="text-2xl font-semibold mb-4 flex items-center">
          ⚡ 系统状态
          <span :class="systemStatus.color" class="ml-3 px-3 py-1 rounded-full text-sm font-medium">
            {{ systemStatus.text }}
          </span>
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">{{ currentTime }}</div>
            <div class="text-sm text-gray-500">当前时间</div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-green-600">3001</div>
            <div class="text-sm text-gray-500">Web端口</div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-purple-600">Vue 3</div>
            <div class="text-sm text-gray-500">前端框架</div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-orange-600">{{ mockDataCount }}</div>
            <div class="text-sm text-gray-500">Mock数据</div>
          </div>
        </div>
      </div>

      <!-- 功能测试 -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 class="text-2xl font-semibold mb-4">🧪 功能测试</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button @click="testCategories" 
                  class="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            📊 测试分类API
          </button>
          <button @click="testTransactions" 
                  class="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
            💰 测试交易API
          </button>
          <button @click="testPersons" 
                  class="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
            👥 测试人员API
          </button>
        </div>
      </div>

      <!-- 测试结果 -->
      <div v-if="testResults.length > 0" class="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 class="text-2xl font-semibold mb-4">📋 测试结果</h2>
        <div class="space-y-3">
          <div v-for="(result, index) in testResults" :key="index" 
               :class="result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'"
               class="p-4 border rounded-lg">
            <div class="flex items-center justify-between">
              <span class="font-medium">{{ result.test }}</span>
              <span :class="result.success ? 'text-green-600' : 'text-red-600'" class="font-bold">
                {{ result.success ? '✅ 成功' : '❌ 失败' }}
              </span>
            </div>
            <div class="text-sm text-gray-600 mt-2">{{ result.message }}</div>
            <div v-if="result.data" class="text-xs text-gray-500 mt-1 font-mono">
              数据量: {{ Array.isArray(result.data) ? result.data.length : '1' }} 条记录
            </div>
          </div>
        </div>
      </div>

      <!-- 快速访问 -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-semibold mb-4">🚀 快速访问</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="http://localhost:5667/" target="_blank" 
             class="text-center p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all">
            <div class="text-2xl mb-2">🌟</div>
            <div>标准版本</div>
            <div class="text-sm opacity-80">端口5667</div>
          </a>
          <a href="/analytics/overview" 
             class="text-center p-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all">
            <div class="text-2xl mb-2">📊</div>
            <div>财务分析</div>
            <div class="text-sm opacity-80">数据概览</div>
          </a>
          <a href="/finance/transaction" 
             class="text-center p-4 bg-gradient-to-r from-yellow-500 to-red-500 text-white rounded-lg hover:from-yellow-600 hover:to-red-600 transition-all">
            <div class="text-2xl mb-2">💰</div>
            <div>交易记录</div>
            <div class="text-sm opacity-80">收支管理</div>
          </a>
          <a href="/quick-add" 
             class="text-center p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all">
            <div class="text-2xl mb-2">📝</div>
            <div>快速记账</div>
            <div class="text-sm opacity-80">添加记录</div>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { categoryService, personService, transactionService } from '#/api/mock/finance-service';

defineOptions({ name: 'SimpleTestPage' });

const currentTime = ref('');
const mockDataCount = ref('加载中...');
const systemStatus = ref({ text: '正常', color: 'bg-green-100 text-green-800' });
const testResults = ref([]);

const updateTime = () => {
  currentTime.value = new Date().toLocaleTimeString('zh-CN');
};

const testCategories = async () => {
  try {
    const result = await categoryService.getList({ page: 1, pageSize: 10 });
    testResults.value.unshift({
      test: '分类API测试',
      success: true,
      message: '成功获取分类数据',
      data: result.data.items
    });
  } catch (error) {
    testResults.value.unshift({
      test: '分类API测试',
      success: false,
      message: `错误: ${error.message}`
    });
  }
};

const testTransactions = async () => {
  try {
    const result = await transactionService.getList({ 
      page: 1, 
      pageSize: 10,
      dateFrom: '2024-01-01',
      dateTo: '2024-12-31'
    });
    testResults.value.unshift({
      test: '交易API测试',
      success: true,
      message: '成功获取交易数据',
      data: result.data.items
    });
  } catch (error) {
    testResults.value.unshift({
      test: '交易API测试',
      success: false,
      message: `错误: ${error.message}`
    });
  }
};

const testPersons = async () => {
  try {
    const result = await personService.getList({ page: 1, pageSize: 10 });
    testResults.value.unshift({
      test: '人员API测试',
      success: true,
      message: '成功获取人员数据',
      data: result.data.items
    });
  } catch (error) {
    testResults.value.unshift({
      test: '人员API测试',
      success: false,
      message: `错误: ${error.message}`
    });
  }
};

const loadMockDataCount = async () => {
  try {
    const [categories, transactions, persons] = await Promise.all([
      categoryService.getList({ page: 1, pageSize: 100 }),
      transactionService.getList({ page: 1, pageSize: 100, dateFrom: '2024-01-01', dateTo: '2024-12-31' }),
      personService.getList({ page: 1, pageSize: 100 })
    ]);
    const total = categories.data.total + transactions.data.total + persons.data.total;
    mockDataCount.value = total.toString();
  } catch (error) {
    mockDataCount.value = '加载失败';
    console.error('加载Mock数据统计失败:', error);
  }
};

onMounted(() => {
  updateTime();
  setInterval(updateTime, 1000);
  loadMockDataCount();
  
  console.log('🎉 简单测试页面加载完成');
  console.log('💡 您可以点击上方按钮测试各个API功能');
});
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}
</style>