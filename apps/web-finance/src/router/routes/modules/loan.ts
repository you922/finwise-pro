import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      hideChildrenInMenu: true,
      icon: 'ant-design:bank-outlined',
      order: 5,
      title: '贷款管理',
    },
    name: 'LoanManagement',
    path: '/loan',
    children: [
      {
        name: 'LoanPage',
        path: '',
        component: () => import('#/views/finance/loan/index.vue'),
        meta: {
          title: '贷款管理',
        },
      },
    ],
  },
];

export default routes;