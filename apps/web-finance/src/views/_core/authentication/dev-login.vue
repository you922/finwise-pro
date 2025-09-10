<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          🎉 TokenRecords
        </h1>
        <p class="text-gray-600">财务管理系统</p>
      </div>

      <div class="space-y-6">
        <button @click="autoLogin" :disabled="loading"
                class="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center">
          <span v-if="loading" class="mr-2">🔄</span>
          {{ loading ? '正在登录...' : '🚀 开发者一键登录' }}
        </button>

        <div class="text-center">
          <p class="text-sm text-gray-500">开发环境自动认证</p>
        </div>

        <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-600 text-sm">{{ error }}</p>
        </div>

        <div class="text-center space-y-2">
          <p class="text-xs text-gray-400">或者访问标准版本：</p>
          <a href="http://localhost:5667/" target="_blank" 
             class="inline-block px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-sm">
            🌟 Vben Admin 标准版
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAccessStore, useUserStore } from '@vben/stores';
import { preferences } from '@vben/preferences';

defineOptions({ name: 'DevLogin' });

const router = useRouter();
const accessStore = useAccessStore();
const userStore = useUserStore();

const loading = ref(false);
const error = ref('');

const autoLogin = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    console.log('🔧 开始自动登录...');
    
    // 设置访问令牌
    accessStore.setAccessToken('dev-mock-token-12345');
    
    // 设置用户信息
    userStore.setUserInfo({
      id: 'dev-user-001',
      username: 'admin',
      realName: 'TokenRecords 管理员',
      avatar: '',
      roles: ['admin', 'finance', 'user'],
      homePath: preferences.app.defaultHomePath,
    });
    
    // 设置权限码
    accessStore.setAccessCodes(['*']);
    
    // 标记访问已检查
    accessStore.setIsAccessChecked(true);
    
    console.log('✅ 自动登录成功');
    
    // 跳转到首页
    await router.push(preferences.app.defaultHomePath);
    
  } catch (err) {
    error.value = `登录失败: ${err.message}`;
    console.error('❌ 自动登录失败:', err);
  } finally {
    loading.value = false;
  }
};

// 页面加载时自动尝试登录
autoLogin();
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}
</style>