<script lang="ts" setup>
import type {
  WorkbenchProjectItem,
  WorkbenchQuickNavItem,
  WorkbenchTodoItem,
  WorkbenchTrendItem,
} from '@vben/common-ui';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  AnalysisChartCard,
  WorkbenchHeader,
  WorkbenchProject,
  WorkbenchQuickNav,
  WorkbenchTodo,
  WorkbenchTrends,
} from '@vben/common-ui';
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';
import { openWindow } from '@vben/utils';

import AnalyticsVisitsSource from '../analytics/analytics-visits-source.vue';

const userStore = useUserStore();

// 财务管理相关的快捷项目
const projectItems: WorkbenchProjectItem[] = [
  {
    color: '#1890ff',
    content: '快速记录日常收支交易',
    date: new Date().toISOString().split('T')[0],
    group: '财务管理',
    icon: 'ant-design:swap-outlined',
    title: '交易管理',
    url: '/finance/transaction',
  },
  {
    color: '#52c41a',
    content: '查看财务统计和分析报表',
    date: new Date().toISOString().split('T')[0],
    group: '统计分析',
    icon: 'ant-design:bar-chart-outlined',
    title: '统计报表',
    url: '/analytics/overview',
  },
  {
    color: '#722ed1',
    content: '管理贷款和还款记录',
    date: new Date().toISOString().split('T')[0],
    group: '财务管理',
    icon: 'ant-design:bank-outlined',
    title: '贷款管理',
    url: '/finance/loan',
  },
  {
    color: '#fa8c16',
    content: '分类管理让记账更清晰',
    date: new Date().toISOString().split('T')[0],
    group: '财务管理',
    icon: 'ant-design:appstore-outlined',
    title: '分类管理',
    url: '/finance/category',
  },
  {
    color: '#13c2c2',
    content: '管理交易相关人员信息',
    date: new Date().toISOString().split('T')[0],
    group: '财务管理',
    icon: 'ant-design:team-outlined',
    title: '人员管理',
    url: '/finance/person',
  },
  {
    color: '#eb2f96',
    content: '数据导入导出和备份',
    date: new Date().toISOString().split('T')[0],
    group: '系统工具',
    icon: 'ant-design:tool-outlined',
    title: '系统工具',
    url: '/tools/import',
  },
];

// 财务管理系统快捷导航
const quickNavItems: WorkbenchQuickNavItem[] = [
  {
    color: '#1890ff',
    icon: 'ant-design:plus-circle-outlined',
    title: '新建交易',
    url: '/finance/transaction',
  },
  {
    color: '#52c41a',
    icon: 'ant-design:dashboard-outlined',
    title: '财务仪表板',
    url: '/finance/dashboard',
  },
  {
    color: '#722ed1',
    icon: 'ant-design:line-chart-outlined',
    title: '趋势分析',
    url: '/analytics/trends',
  },
  {
    color: '#fa8c16',
    icon: 'ant-design:file-text-outlined',
    title: '月度报表',
    url: '/analytics/reports/monthly',
  },
  {
    color: '#13c2c2',
    icon: 'ant-design:import-outlined',
    title: '数据导入',
    url: '/tools/import',
  },
  {
    color: '#eb2f96',
    icon: 'ant-design:database-outlined',
    title: '数据备份',
    url: '/tools/backup',
  },
];

const todoItems = ref<WorkbenchTodoItem[]>([
  {
    completed: false,
    content: `记录本月的所有收支交易，确保账目清晰。`,
    date: new Date().toISOString(),
    title: '完成本月记账',
  },
  {
    completed: false,
    content: `检查所有逾期贷款，及时跟进还款情况。`,
    date: new Date().toISOString(),
    title: '贷款到期提醒',
  },
  {
    completed: false,
    content: `生成上月财务报表，分析收支情况。`,
    date: new Date().toISOString(),
    title: '月度财务分析',
  },
  {
    completed: false,
    content: `备份本月所有财务数据，确保数据安全。`,
    date: new Date().toISOString(),
    title: '数据备份',
  },
  {
    completed: false,
    content: `检查并更新所有交易分类，保持分类体系清晰。`,
    date: new Date().toISOString(),
    title: '分类整理',
  },
]);
const trendItems: WorkbenchTrendItem[] = [
  {
    avatar: 'svg:avatar-1',
    content: `在 <a>开源组</a> 创建了项目 <a>Vue</a>`,
    date: '刚刚',
    title: '威廉',
  },
  {
    avatar: 'svg:avatar-2',
    content: `关注了 <a>威廉</a> `,
    date: '1个小时前',
    title: '艾文',
  },
  {
    avatar: 'svg:avatar-3',
    content: `发布了 <a>个人动态</a> `,
    date: '1天前',
    title: '克里斯',
  },
  {
    avatar: 'svg:avatar-4',
    content: `发表文章 <a>如何编写一个Vite插件</a> `,
    date: '2天前',
    title: 'Vben',
  },
  {
    avatar: 'svg:avatar-1',
    content: `回复了 <a>杰克</a> 的问题 <a>如何进行项目优化？</a>`,
    date: '3天前',
    title: '皮特',
  },
  {
    avatar: 'svg:avatar-2',
    content: `关闭了问题 <a>如何运行项目</a> `,
    date: '1周前',
    title: '杰克',
  },
  {
    avatar: 'svg:avatar-3',
    content: `发布了 <a>个人动态</a> `,
    date: '1周前',
    title: '威廉',
  },
  {
    avatar: 'svg:avatar-4',
    content: `推送了代码到 <a>Github</a>`,
    date: '2021-04-01 20:00',
    title: '威廉',
  },
  {
    avatar: 'svg:avatar-4',
    content: `发表文章 <a>如何编写使用 Admin Vben</a> `,
    date: '2021-03-01 20:00',
    title: 'Vben',
  },
];

const router = useRouter();

// 这是一个示例方法，实际项目中需要根据实际情况进行调整
// This is a sample method, adjust according to the actual project requirements
function navTo(nav: WorkbenchProjectItem | WorkbenchQuickNavItem) {
  if (nav.url?.startsWith('http')) {
    openWindow(nav.url);
    return;
  }
  if (nav.url?.startsWith('/')) {
    router.push(nav.url).catch((error) => {
      console.error('Navigation failed:', error);
    });
  } else {
    console.warn(`Unknown URL for navigation item: ${nav.title} -> ${nav.url}`);
  }
}
</script>

<template>
  <div class="p-5">
    <WorkbenchHeader
      :avatar="userStore.userInfo?.avatar || preferences.app.defaultAvatar"
    >
      <template #title>
        早安, {{ userStore.userInfo?.realName }}, 开始您一天的工作吧！
      </template>
      <template #description> 今日晴，20℃ - 32℃！ </template>
    </WorkbenchHeader>

    <div class="mt-5 flex flex-col lg:flex-row">
      <div class="mr-4 w-full lg:w-3/5">
        <WorkbenchProject :items="projectItems" title="财务模块" @click="navTo" />
        <WorkbenchTrends :items="trendItems" class="mt-5" title="最新动态" />
      </div>
      <div class="w-full lg:w-2/5">
        <WorkbenchQuickNav
          :items="quickNavItems"
          class="mt-5 lg:mt-0"
          title="快捷导航"
          @click="navTo"
        />
        <WorkbenchTodo :items="todoItems" class="mt-5" title="待办事项" />
        <AnalysisChartCard class="mt-5" title="访问来源">
          <AnalyticsVisitsSource />
        </AnalysisChartCard>
      </div>
    </div>
  </div>
</template>
