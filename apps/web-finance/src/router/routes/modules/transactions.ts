import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'ant-design:unordered-list-outlined',
      order: 2,
      title: '交易记录',
    },
    name: 'Transactions',
    path: '/transactions',
    redirect: '/transactions/list',
    children: [
      {
        name: 'TransactionsPage',
        path: 'list',
        component: () => import('#/views/finance/transaction/index.vue'),
        meta: {
          hideInMenu: true,
          title: '交易记录',
        },
      },
    ],
  },
];

export default routes;