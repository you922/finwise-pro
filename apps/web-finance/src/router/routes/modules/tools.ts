import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'ant-design:tool-outlined',
      order: 6,
      title: '系统工具',
    },
    name: 'SystemTools',
    path: '/tools',
    children: [
      {
        meta: {
          icon: 'ant-design:import-outlined',
          title: '数据导入',
        },
        name: 'DataImport',
        path: 'import',
        component: () => import('#/views/tools/import/index.vue'),
      },
      {
        meta: {
          icon: 'ant-design:export-outlined',
          title: '数据导出',
        },
        name: 'DataExport',
        path: 'export',
        component: () => import('#/views/tools/export/index.vue'),
      },
      {
        meta: {
          icon: 'ant-design:cloud-download-outlined',
          title: '备份恢复',
        },
        name: 'BackupRestore',
        path: 'backup',
        component: () => import('#/views/tools/backup/index.vue'),
      },
      {
        meta: {
          icon: 'ant-design:mobile-outlined',
          title: '移动版',
          hideInMenu: true,
        },
        name: 'MobileFinance',
        path: 'mobile',
        component: () => import('#/views/finance/mobile/index.vue'),
      },
      {
        meta: {
          icon: 'ant-design:bug-outlined',
          title: 'API测试',
          hideInMenu: true,
        },
        name: 'TestAPI',
        path: 'test-api',
        component: () => import('#/views/finance/test-api.vue'),
      },
    ],
  },
];

export default routes;
