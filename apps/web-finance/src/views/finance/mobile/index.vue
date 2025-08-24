<script setup lang="ts">
import { ref } from 'vue';

import { TabPane, Tabs } from 'ant-design-vue';

import MobileBudget from './budget.vue';
import MobileMore from './more.vue';
import MobileStatistics from './statistics.vue';
import TransactionList from './transaction-list.vue';

const activeTab = ref('transactions');
</script>

<template>
  <div class="mobile-finance">
    <Tabs v-model:active-key="activeTab" class="mobile-tabs">
      <TabPane key="transactions" tab="账单">
        <TransactionList />
      </TabPane>

      <TabPane key="statistics" tab="统计">
        <MobileStatistics />
      </TabPane>

      <TabPane key="budget" tab="预算">
        <MobileBudget />
      </TabPane>

      <TabPane key="more" tab="更多">
        <MobileMore />
      </TabPane>
    </Tabs>
  </div>
</template>

<style scoped>
.mobile-finance {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.mobile-tabs {
  display: flex;
  flex: 1;
  flex-direction: column;
}

:deep(.ant-tabs-nav) {
  margin: 0;
  background: #fff;
  box-shadow: 0 2px 8px rgb(0 0 0 / 8%);
}

:deep(.ant-tabs-content) {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

:deep(.ant-tabs-tabpane) {
  height: 100%;
}
</style>
