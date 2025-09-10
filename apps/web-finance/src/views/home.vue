<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">
          🎉 TokenRecords 财务管理系统
        </h1>
        <p class="text-xl text-gray-600">
          欢迎使用基于 Vben Admin 的现代化财务管理平台
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-lg p-6">
          <div class="text-center">
            <div class="text-3xl mb-4">📊</div>
            <h3 class="text-lg font-semibold mb-2">财务分析</h3>
            <p class="text-gray-600 text-sm mb-4">查看收支统计和趋势分析</p>
            <button @click="navigate('/analytics/overview')" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              进入分析
            </button>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-lg p-6">
          <div class="text-center">
            <div class="text-3xl mb-4">💰</div>
            <h3 class="text-lg font-semibold mb-2">交易记录</h3>
            <p class="text-gray-600 text-sm mb-4">管理收入和支出记录</p>
            <button @click="navigate('/finance/transaction')" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              查看交易
            </button>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-lg p-6">
          <div class="text-center">
            <div class="text-3xl mb-4">📝</div>
            <h3 class="text-lg font-semibold mb-2">快速记账</h3>
            <p class="text-gray-600 text-sm mb-4">快速添加收支记录</p>
            <button @click="navigate('/quick-add')" class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              开始记账
            </button>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-lg p-6">
          <div class="text-center">
            <div class="text-3xl mb-4">👥</div>
            <h3 class="text-lg font-semibold mb-2">人员管理</h3>
            <p class="text-gray-600 text-sm mb-4">管理付款人和收款人</p>
            <button @click="navigate('/finance/person')" class="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600">
              管理人员
            </button>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-lg p-6">
          <div class="text-center">
            <div class="text-3xl mb-4">🏷️</div>
            <h3 class="text-lg font-semibold mb-2">分类设置</h3>
            <p class="text-gray-600 text-sm mb-4">设置收支分类</p>
            <button @click="navigate('/finance/category')" class="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">
              设置分类
            </button>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-lg p-6">
          <div class="text-center">
            <div class="text-3xl mb-4">⚙️</div>
            <h3 class="text-lg font-semibold mb-2">系统设置</h3>
            <p class="text-gray-600 text-sm mb-4">配置系统参数</p>
            <button @click="navigate('/settings')" class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
              系统设置
            </button>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-bold mb-4">系统信息</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div class="text-2xl font-bold text-blue-600">{{ currentTime }}</div>
            <div class="text-sm text-gray-600">当前时间</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-green-600">正常</div>
            <div class="text-sm text-gray-600">系统状态</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-purple-600">Vue 3</div>
            <div class="text-sm text-gray-600">前端框架</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-orange-600">Vben</div>
            <div class="text-sm text-gray-600">管理模板</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

defineOptions({ name: 'HomePage' });

const router = useRouter();
const currentTime = ref('');

const navigate = (path: string) => {
  router.push(path);
};

const updateTime = () => {
  currentTime.value = new Date().toLocaleString('zh-CN');
};

onMounted(() => {
  updateTime();
  setInterval(updateTime, 1000);
});
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}
</style>