import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'ant-design:tool-outlined',
      order: 3,
      title: $t('tools.title'),
    },
    name: 'Tools',
    path: '/tools',
    children: [
      {
        meta: {
          icon: 'ant-design:import-outlined',
          title: $t('tools.import'),
        },
        name: 'DataImport',
        path: 'import',
        component: () => import('#/views/tools/import/index.vue'),
      },
      {
        meta: {
          icon: 'ant-design:export-outlined',
          title: $t('tools.export'),
        },
        name: 'DataExport',
        path: 'export',
        component: () => import('#/views/tools/export/index.vue'),
      },
      {
        meta: {
          icon: 'ant-design:database-outlined',
          title: $t('tools.backup'),
        },
        name: 'DataBackup',
        path: 'backup',
        component: () => import('#/views/tools/backup/index.vue'),
      },
      {
        meta: {
          icon: 'ant-design:calculator-outlined',
          title: $t('tools.budget'),
        },
        name: 'BudgetManagement',
        path: 'budget',
        component: () => import('#/views/tools/budget/index.vue'),
      },
      {
        meta: {
          icon: 'ant-design:tags-outlined',
          title: $t('tools.tags'),
        },
        name: 'TagManagement',
        path: 'tags',
        component: () => import('#/views/tools/tags/index.vue'),
      },
    ],
  },
];

export default routes;