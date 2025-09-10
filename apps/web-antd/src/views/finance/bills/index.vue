<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">🔔 账单提醒</h1>
      <p class="text-gray-600">智能账单管理，从此不错过任何缴费</p>
    </div>

    <!-- 今日提醒 -->
    <Card class="mb-6" title="📅 今日待缴账单">
      <div v-if="todayBills.length === 0" class="text-center py-8">
        <div class="text-6xl mb-4">✅</div>
        <p class="text-green-600 font-medium">今天没有待缴账单</p>
        <p class="text-sm text-gray-500">享受无忧的一天</p>
      </div>
      <div v-else class="space-y-3">
        <div v-for="bill in todayBills" :key="bill.id" class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <span class="text-2xl">{{ bill.emoji }}</span>
              <div>
                <p class="font-medium text-red-800">{{ bill.name }}</p>
                <p class="text-sm text-red-600">今天到期 · ¥{{ bill.amount.toLocaleString() }}</p>
              </div>
            </div>
            <div class="flex space-x-2">
              <Button type="primary" size="small">立即缴费</Button>
              <Button size="small">延期</Button>
            </div>
          </div>
        </div>
      </div>
    </Card>

    <!-- 账单管理 -->
    <Card title="📋 账单管理" class="mb-6">
      <template #extra>
        <Button type="primary" @click="showAddBill = true">➕ 添加账单</Button>
      </template>

      <div v-if="allBills.length === 0" class="text-center py-12">
        <div class="text-8xl mb-6">📱</div>
        <h3 class="text-xl font-medium text-gray-800 mb-2">暂无账单记录</h3>
        <p class="text-gray-500 mb-6">添加您的常用账单，系统将自动提醒</p>
        <Button type="primary" size="large" @click="showAddBill = true">
          ➕ 添加第一个账单
        </Button>
      </div>

      <div v-else class="space-y-4">
        <div v-for="bill in allBills" :key="bill.id" class="p-4 border border-gray-200 rounded-lg">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <span class="text-2xl">{{ bill.emoji }}</span>
              <div>
                <p class="font-medium">{{ bill.name }}</p>
                <p class="text-sm text-gray-500">{{ bill.provider }} · 每{{ bill.cycle }}缴费</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-semibold">¥{{ bill.amount.toLocaleString() }}</p>
              <p class="text-sm text-gray-500">下次: {{ bill.nextDue }}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>

    <!-- 账单统计 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card title="📊 月度账单统计">
        <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div class="text-center">
            <div class="text-4xl mb-2">📈</div>
            <p class="text-gray-600">月度账单趋势</p>
          </div>
        </div>
      </Card>

      <Card title="⏰ 提醒设置">
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span>提前提醒天数</span>
            <InputNumber v-model:value="reminderSettings.daysBefore" :min="1" :max="30" />
          </div>
          <div class="flex justify-between items-center">
            <span>短信提醒</span>
            <Switch v-model:checked="reminderSettings.smsEnabled" />
          </div>
          <div class="flex justify-between items-center">
            <span>邮件提醒</span>
            <Switch v-model:checked="reminderSettings.emailEnabled" />
          </div>
          <div class="flex justify-between items-center">
            <span>应用通知</span>
            <Switch v-model:checked="reminderSettings.pushEnabled" />
          </div>
          <Button type="primary" block @click="saveReminderSettings">保存设置</Button>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Card, Button, InputNumber, Switch } from 'ant-design-vue';

defineOptions({ name: 'BillReminders' });

const showAddBill = ref(false);

// 今日账单（空数据）
const todayBills = ref([]);

// 所有账单（空数据）
const allBills = ref([]);

// 提醒设置
const reminderSettings = ref({
  daysBefore: 3,
  smsEnabled: true,
  emailEnabled: false,
  pushEnabled: true
});

const saveReminderSettings = () => {
  console.log('保存提醒设置:', reminderSettings.value);
};
</script>

<style scoped>
.grid { display: grid; }
</style>