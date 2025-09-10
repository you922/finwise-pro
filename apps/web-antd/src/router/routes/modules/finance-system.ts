import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'mdi:bank',
      order: 1,
      title: '💎 FinWise Pro',
    },
    name: 'FinWisePro',
    path: '/finance',
    children: [
      {
        name: 'FinanceDashboard',
        path: 'dashboard',
        component: () => import('#/views/finance/dashboard/index.vue'),
        meta: {
          affixTab: true,
          icon: 'mdi:chart-box',
          title: '📊 财务仪表板',
        },
      },
      {
        name: 'TransactionManagement',
        path: 'transactions',
        component: () => import('#/views/finance/transactions/index.vue'),
        meta: {
          icon: 'mdi:swap-horizontal',
          title: '💰 交易管理',
        },
      },
      {
        name: 'AccountManagement',
        path: 'accounts',
        component: () => import('#/views/finance/accounts/index.vue'),
        meta: {
          icon: 'mdi:account-multiple',
          title: '🏦 账户管理',
        },
      },
      {
        name: 'CategoryManagement',
        path: 'categories',
        component: () => import('#/views/finance/categories/index.vue'),
        meta: {
          icon: 'mdi:tag-multiple',
          title: '🏷️ 分类管理',
        },
      },
      {
        name: 'BudgetManagement',
        path: 'budgets',
        component: () => import('#/views/finance/budgets/index.vue'),
        meta: {
          icon: 'mdi:target',
          title: '🎯 预算管理',
        },
      },
      {
        name: 'ReportsAnalytics',
        path: 'reports',
        component: () => import('#/views/finance/reports/index.vue'),
        meta: {
          icon: 'mdi:chart-line',
          title: '📈 报表分析',
        },
      },
      {
        name: 'FinanceTools',
        path: 'tools',
        component: () => import('#/views/finance/tools/index.vue'),
        meta: {
          icon: 'mdi:tools',
          title: '🛠️ 财务工具',
        },
      },
      {
        name: 'FinanceSettings',
        path: 'settings',
        component: () => import('#/views/finance/settings/index.vue'),
        meta: {
          icon: 'mdi:cog',
          title: '⚙️ 系统设置',
        },
      },
    ],
  },
];

export default routes;