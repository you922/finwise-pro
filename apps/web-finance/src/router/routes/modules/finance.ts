import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'ant-design:dollar-outlined',
      order: 1,
      title: $t('finance.title'),
    },
    name: 'Finance',
    path: '/finance',
    children: [
      {
        meta: {
          icon: 'ant-design:home-outlined',
          title: $t('finance.dashboard'),
        },
        name: 'FinanceDashboard',
        path: 'dashboard',
        component: () => import('#/views/finance/dashboard/index.vue'),
      },
      {
        meta: {
          icon: 'ant-design:swap-outlined',
          title: $t('finance.transaction'),
        },
        name: 'Transaction',
        path: 'transaction',
        component: () => import('#/views/finance/transaction/index.vue'),
      },
      {
        meta: {
          icon: 'ant-design:appstore-outlined',
          title: $t('finance.category'),
        },
        name: 'Category',
        path: 'category',
        component: () => import('#/views/finance/category/index.vue'),
      },
      {
        meta: {
          icon: 'ant-design:team-outlined',
          title: $t('finance.person'),
        },
        name: 'Person',
        path: 'person',
        component: () => import('#/views/finance/person/index.vue'),
      },
      {
        meta: {
          icon: 'ant-design:bank-outlined',
          title: $t('finance.loan'),
        },
        name: 'Loan',
        path: 'loan',
        component: () => import('#/views/finance/loan/index.vue'),
      },
      {
        meta: {
          icon: 'ant-design:tag-outlined',
          title: $t('finance.tag'),
        },
        name: 'Tag',
        path: 'tag',
        component: () => import('#/views/finance/tag/index.vue'),
      },
      {
        meta: {
          icon: 'ant-design:wallet-outlined',
          title: $t('finance.budget'),
        },
        name: 'Budget',
        path: 'budget',
        component: () => import('#/views/finance/budget/index.vue'),
      },
      {
        meta: {
          icon: 'ant-design:mobile-outlined',
          title: $t('finance.mobile'),
          hideInMenu: true, // 在桌面端菜单中隐藏
        },
        name: 'MobileFinance',
        path: 'mobile',
        component: () => import('#/views/finance/mobile/index.vue'),
      },
      {
        meta: {
          icon: 'ant-design:bug-outlined',
          title: 'API测试',
        },
        name: 'TestAPI',
        path: 'test-api',
        component: () => import('#/views/finance/test-api.vue'),
      },
    ],
  },
];

export default routes;