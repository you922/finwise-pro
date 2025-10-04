import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'FinanceDashboard',
    path: '/dashboard-finance',
    alias: ['/finance/dashboard'],
    component: () => import('#/views/finance/dashboard/index.vue'),
    meta: {
      affixTab: true,
      icon: 'mdi:chart-box',
      order: 1,
      title: '📊 财务仪表板',
    },
  },
  {
    name: 'FinanceTransactions',
    path: '/transactions',
    alias: ['/finance/transactions'],
    component: () => import('#/views/finance/transactions/index.vue'),
    meta: {
      icon: 'mdi:swap-horizontal',
      order: 2,
      title: '💰 交易管理',
    },
  },
  {
    name: 'FinanceAccounts',
    path: '/accounts',
    alias: ['/finance/accounts'],
    component: () => import('#/views/finance/accounts/index.vue'),
    meta: {
      icon: 'mdi:account-multiple',
      order: 3,
      title: '🏦 账户管理',
    },
  },
  {
    name: 'FinanceCategories',
    path: '/categories',
    alias: ['/finance/categories'],
    component: () => import('#/views/finance/categories/index.vue'),
    meta: {
      icon: 'mdi:tag-multiple',
      order: 4,
      title: '🏷️ 分类管理',
    },
  },
  {
    name: 'FinanceBudgets',
    path: '/budgets',
    alias: ['/finance/budgets'],
    component: () => import('#/views/finance/budgets/index.vue'),
    meta: {
      icon: 'mdi:target',
      order: 5,
      title: '🎯 预算管理',
    },
  },
  {
    name: 'FinanceStatistics',
    path: '/statistics',
    alias: ['/finance/statistics'],
    component: () => import('#/views/finance/statistics/index.vue'),
    meta: {
      icon: 'mdi:chart-box-outline',
      order: 6,
      title: '📊 财务统计',
    },
  },
  {
    name: 'FinanceReports',
    path: '/reports',
    alias: ['/finance/reports'],
    component: () => import('#/views/finance/reports/index.vue'),
    meta: {
      icon: 'mdi:chart-line',
      order: 7,
      title: '📈 报表分析',
    },
  },
  {
    name: 'FinanceTools',
    path: '/tools',
    alias: ['/finance/tools'],
    component: () => import('#/views/finance/tools/index.vue'),
    meta: {
      icon: 'mdi:tools',
      order: 8,
      title: '🛠️ 财务工具',
    },
  },
  {
    name: 'FinanceSettings',
    path: '/fin-settings',
    alias: ['/finance/settings'],
    component: () => import('#/views/finance/settings/index.vue'),
    meta: {
      icon: 'mdi:cog',
      order: 9,
      title: '⚙️ 系统设置',
    },
  },
];

export default routes;
