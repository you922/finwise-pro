import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      ignoreAccess: true, // 忽略权限检查
      icon: 'lucide:home',
      order: -999, // 最高优先级
      title: '首页',
    },
    name: 'Home',
    path: '/home',
    component: () => import('#/views/home.vue'),
  },
];

export default routes;