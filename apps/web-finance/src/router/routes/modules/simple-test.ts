import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      ignoreAccess: true, // 忽略权限检查
      hideInMenu: true,
      icon: 'lucide:test-tube',
      order: -998,
      title: 'API功能测试',
    },
    name: 'SimpleTest',
    path: '/simple-test',
    component: () => import('#/views/simple-test.vue'),
  },
];

export default routes;