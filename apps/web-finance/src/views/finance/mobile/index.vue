<template>
  <div class="mobile-finance">
    <Tabs v-model:activeKey="activeTab" class="mobile-tabs">
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

<script setup lang="ts">
import { Tabs, TabPane } from 'ant-design-vue';
import { ref } from 'vue';

import TransactionList from './transaction-list.vue';
import MobileStatistics from './statistics.vue';
import MobileBudget from './budget.vue';
import MobileMore from './more.vue';

const activeTab = ref('transactions');
</script>

<style scoped>
.mobile-finance {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.mobile-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
}

:deep(.ant-tabs-nav) {
  background: #fff;
  margin: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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