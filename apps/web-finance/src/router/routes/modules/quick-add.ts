import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'ant-design:plus-circle-outlined',
      order: 1,
      title: '记一笔',
    },
    name: 'QuickAdd',
    path: '/quick-add',
    redirect: '/quick-add/index',
    children: [
      {
        name: 'QuickAddPage',
        path: 'index',
        component: () => import('#/views/finance/quick-add/index.vue'),
        meta: {
          hideInMenu: true,
          title: '记一笔',
        },
      },
    ],
  },
];

export default routes;