<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import TransactionForm from '../transaction/components/transaction-form.vue';

const router = useRouter();
const showForm = ref(true);

// 处理保存成功
function handleSuccess() {
  message.success('记账成功！');
  // 跳转到交易记录页面
  router.push('/transactions');
}

// 处理取消
function handleCancel() {
  showForm.value = false;
  // 返回上一页或首页
  router.back();
}

// 页面加载时自动打开新建表单
onMounted(() => {
  showForm.value = true;
});
</script>

<template>
  <div class="quick-add-page">
    <TransactionForm 
      v-model:open="showForm"
      @success="handleSuccess"
      @cancel="handleCancel"
    />
    
    <div class="placeholder-content">
      <h2>快速记账</h2>
      <p>记录每一笔收支，管理您的财务生活</p>
    </div>
  </div>
</template>

<style scoped>
.quick-add-page {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-content {
  text-align: center;
  color: #999;
}

.placeholder-content h2 {
  font-size: 24px;
  margin-bottom: 16px;
  color: #666;
}
</style>