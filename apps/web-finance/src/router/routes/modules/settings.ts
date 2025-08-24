import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'ant-design:setting-outlined',
      order: 4,
      title: '设置',
    },
    name: 'Settings',
    path: '/settings',
    children: [
      {
        meta: {
          icon: 'ant-design:appstore-outlined',
          title: '分类管理',
        },
        name: 'CategorySettings',
        path: 'category',
        component: () => import('#/views/finance/category/index.vue'),
      },
      {
        meta: {
          icon: 'ant-design:wallet-outlined',
          title: '预算设置',
        },
        name: 'BudgetSettings',
        path: 'budget',
        component: () => import('#/views/finance/budget/index.vue'),
      },
      {
        meta: {
          icon: 'ant-design:tag-outlined',
          title: '标签管理',
        },
        name: 'TagSettings',
        path: 'tag',
        component: () => import('#/views/finance/tag/index.vue'),
      },
      {
        meta: {
          icon: 'ant-design:team-outlined',
          title: '人员管理',
        },
        name: 'PersonSettings',
        path: 'person',
        component: () => import('#/views/finance/person/index.vue'),
      },
    ],
  },
];

export default routes;