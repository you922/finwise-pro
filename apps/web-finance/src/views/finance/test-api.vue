<script setup lang="ts">
import { ref } from 'vue';

import { Button, Card, message, Space } from 'ant-design-vue';

import { getCategoryList } from '#/api/finance/category';
import { getPersonList } from '#/api/finance/person';
import {
  createTransaction,
  getTransactionList,
} from '#/api/finance/transaction';

const result = ref<any>(null);
const error = ref<string>('');

async function testCategories() {
  try {
    error.value = '';
    console.log('测试分类API...');
    const data = await getCategoryList();
    result.value = data;
    message.success('分类API测试成功');
  } catch (error_: any) {
    error.value = error_.message;
    console.error('分类API失败:', error_);
    message.error('分类API测试失败');
  }
}

async function testPersons() {
  try {
    error.value = '';
    console.log('测试人员API...');
    const data = await getPersonList();
    result.value = data;
    message.success('人员API测试成功');
  } catch (error_: any) {
    error.value = error_.message;
    console.error('人员API失败:', error_);
    message.error('人员API测试失败');
  }
}

async function testTransactions() {
  try {
    error.value = '';
    console.log('测试交易API...');
    const data = await getTransactionList({ page: 1, pageSize: 10 });
    result.value = data;
    message.success('交易API测试成功');
  } catch (error_: any) {
    error.value = error_.message;
    console.error('交易API失败:', error_);
    message.error('交易API测试失败');
  }
}

async function testCreateTransaction() {
  try {
    error.value = '';
    console.log('测试创建交易...');
    const newTransaction = {
      type: 'expense' as const,
      amount: 99.99,
      categoryId: 'cat-1',
      currency: 'CNY',
      date: '2025-08-05',
      description: 'API测试交易',
      status: 'completed' as const,
      tags: [],
    };
    const data = await createTransaction(newTransaction);
    result.value = data;
    message.success('创建交易成功');
  } catch (error_: any) {
    error.value = error_.message;
    console.error('创建交易失败:', error_);
    message.error('创建交易失败');
  }
}
</script>

<template>
  <div class="p-4">
    <Card title="API测试页面">
      <Space direction="vertical" style="width: 100%">
        <Button @click="testCategories">测试分类API</Button>
        <Button @click="testPersons">测试人员API</Button>
        <Button @click="testTransactions">测试交易API</Button>
        <Button @click="testCreateTransaction">测试创建交易</Button>

        <div v-if="result" class="mt-4">
          <pre>{{ JSON.stringify(result, null, 2) }}</pre>
        </div>

        <div v-if="error" class="mt-4 text-red-500">错误: {{ error }}</div>
      </Space>
    </Card>
  </div>
</template>
