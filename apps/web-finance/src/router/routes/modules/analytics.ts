import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'ant-design:bar-chart-outlined',
      order: 2,
      title: $t('analytics.title'),
    },
    name: 'Analytics',
    path: '/analytics',
    children: [
      {
        meta: {
          icon: 'ant-design:dashboard-outlined',
          title: $t('analytics.overview'),
        },
        name: 'AnalyticsOverview',
        path: 'overview',
        component: () => import('#/views/analytics/overview/index.vue'),
      },
      {
        meta: {
          icon: 'ant-design:line-chart-outlined',
          title: $t('analytics.trends'),
        },
        name: 'AnalyticsTrends',
        path: 'trends',
        component: () => import('#/views/analytics/trends/index.vue'),
      },
      {
        meta: {
          icon: 'ant-design:file-text-outlined',
          title: $t('analytics.reports'),
        },
        name: 'AnalyticsReports',
        path: 'reports',
        children: [
          {
            meta: {
              title: $t('analytics.reports.daily'),
            },
            name: 'DailyReport',
            path: 'daily',
            component: () => import('#/views/analytics/reports/daily.vue'),
          },
          {
            meta: {
              title: $t('analytics.reports.monthly'),
            },
            name: 'MonthlyReport',
            path: 'monthly',
            component: () => import('#/views/analytics/reports/monthly.vue'),
          },
          {
            meta: {
              title: $t('analytics.reports.yearly'),
            },
            name: 'YearlyReport',
            path: 'yearly',
            component: () => import('#/views/analytics/reports/yearly.vue'),
          },
          {
            meta: {
              title: $t('analytics.reports.custom'),
            },
            name: 'CustomReport',
            path: 'custom',
            component: () => import('#/views/analytics/reports/custom.vue'),
          },
        ],
      },
    ],
  },
];

export default routes;
