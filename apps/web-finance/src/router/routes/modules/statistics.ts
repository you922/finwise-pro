import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'ant-design:bar-chart-outlined',
      order: 3,
      title: '统计分析',
    },
    name: 'Statistics',
    path: '/statistics',
    children: [
      {
        meta: {
          icon: 'ant-design:pie-chart-outlined',
          title: '分类统计',
        },
        name: 'CategoryStats',
        path: 'category',
        component: () => import('#/views/finance/category-stats/index.vue'),
      },
      {
        meta: {
          icon: 'ant-design:line-chart-outlined',
          title: '趋势分析',
        },
        name: 'TrendAnalysis',
        path: 'trend',
        component: () => import('#/views/analytics/trends/index.vue'),
      },
      {
        meta: {
          icon: 'ant-design:calendar-outlined',
          title: '月度报表',
        },
        name: 'MonthlyReport',
        path: 'monthly',
        component: () => import('#/views/analytics/reports/monthly.vue'),
      },
      {
        meta: {
          icon: 'ant-design:fund-outlined',
          title: '年度总结',
        },
        name: 'YearlyReport',
        path: 'yearly',
        component: () => import('#/views/analytics/reports/yearly.vue'),
      },
    ],
  },
];

export default routes;