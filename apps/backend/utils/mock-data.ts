export interface UserInfo {
  id: number;
  password: string;
  realName: string;
  roles: string[];
  username: string;
  homePath?: string;
}

export const MOCK_USERS: UserInfo[] = [
  {
    id: 0,
    password: '123456',
    realName: 'Vben',
    roles: ['super'],
    username: 'vben',
  },
  {
    id: 1,
    password: '123456',
    realName: 'Admin',
    roles: ['admin'],
    username: 'admin',
    homePath: '/workspace',
  },
  {
    id: 2,
    password: '123456',
    realName: 'Jack',
    roles: ['user'],
    username: 'jack',
    homePath: '/workspace',
  },
];

export const MOCK_CODES = [
  // super
  {
    codes: ['AC_100100', 'AC_100110', 'AC_100120', 'AC_100010'],
    username: 'vben',
  },
  {
    // admin
    codes: ['AC_100010', 'AC_100020', 'AC_100030'],
    username: 'admin',
  },
  {
    // user
    codes: ['AC_1000001', 'AC_1000002'],
    username: 'jack',
  },
];

const dashboardMenus = [
  {
    meta: {
      order: -1,
      title: 'page.dashboard.title',
    },
    name: 'Dashboard',
    path: '/dashboard',
    redirect: '/workspace',
    children: [
      {
        name: 'Workspace',
        path: '/workspace',
        component: '/dashboard/workspace/index',
        meta: {
          affixTab: true,
          title: 'page.dashboard.workspace',
        },
      },
    ],
  },
];

const analyticsMenus = [
  {
    meta: {
      order: 2,
      title: '数据分析',
      icon: 'ant-design:bar-chart-outlined',
    },
    name: 'Analytics',
    path: '/analytics',
    redirect: '/analytics/overview',
    children: [
      {
        name: 'AnalyticsOverview',
        path: '/analytics/overview',
        component: '/analytics/overview/index',
        meta: {
          title: '数据概览',
          icon: 'ant-design:dashboard-outlined',
        },
      },
      {
        name: 'AnalyticsTrends',
        path: '/analytics/trends',
        component: '/analytics/trends/index',
        meta: {
          title: '趋势分析',
          icon: 'ant-design:line-chart-outlined',
        },
      },
      {
        name: 'AnalyticsReports',
        path: '/analytics/reports',
        meta: {
          title: '报表',
          icon: 'ant-design:file-text-outlined',
        },
        children: [
          {
            name: 'DailyReport',
            path: '/analytics/reports/daily',
            component: '/analytics/reports/daily',
            meta: {
              title: '日报表',
            },
          },
          {
            name: 'MonthlyReport',
            path: '/analytics/reports/monthly',
            component: '/analytics/reports/monthly',
            meta: {
              title: '月报表',
            },
          },
          {
            name: 'YearlyReport',
            path: '/analytics/reports/yearly',
            component: '/analytics/reports/yearly',
            meta: {
              title: '年报表',
            },
          },
          {
            name: 'CustomReport',
            path: '/analytics/reports/custom',
            component: '/analytics/reports/custom',
            meta: {
              title: '自定义报表',
            },
          },
        ],
      },
    ],
  },
];

const financeMenus = [
  {
    name: 'FinanceDashboard',
    path: '/dashboard-finance',
    component: '/finance/dashboard/index',
    meta: {
      order: 1,
      title: '📊 财务仪表板',
      icon: 'mdi:chart-box',
    },
  },
  {
    name: 'FinanceTransactions',
    path: '/transactions',
    component: '/finance/transactions/index',
    meta: {
      order: 2,
      title: '💰 交易管理',
      icon: 'mdi:swap-horizontal',
    },
  },
  {
    name: 'FinanceAccounts',
    path: '/accounts',
    component: '/finance/accounts/index',
    meta: {
      order: 3,
      title: '🏦 账户管理',
      icon: 'mdi:account-multiple',
    },
  },
  {
    name: 'FinanceCategories',
    path: '/categories',
    component: '/finance/categories/index',
    meta: {
      order: 4,
      title: '🏷️ 分类管理',
      icon: 'mdi:tag-multiple',
    },
  },
  {
    name: 'FinanceBudgets',
    path: '/budgets',
    component: '/finance/budgets/index',
    meta: {
      order: 5,
      title: '🎯 预算管理',
      icon: 'mdi:target',
    },
  },
  {
    name: 'ReportsAnalytics',
    path: '/reports',
    component: '/finance/reports/index',
    meta: {
      order: 6,
      title: '📈 报表分析',
      icon: 'mdi:chart-line',
    },
  },
  {
    name: 'FinanceTools',
    path: '/tools',
    component: '/finance/tools/index',
    meta: {
      order: 7,
      title: '🛠️ 财务工具',
      icon: 'mdi:tools',
    },
  },
  {
    name: 'FinanceSettings',
    path: '/fin-settings',
    component: '/finance/settings/index',
    meta: {
      order: 8,
      title: '⚙️ 系统设置',
      icon: 'mdi:cog',
    },
  },
];

const createDemosMenus = (role: 'admin' | 'super' | 'user') => {
  const roleWithMenus = {
    admin: {
      component: '/demos/access/admin-visible',
      meta: {
        icon: 'mdi:button-cursor',
        title: 'demos.access.adminVisible',
      },
      name: 'AccessAdminVisibleDemo',
      path: '/demos/access/admin-visible',
    },
    super: {
      component: '/demos/access/super-visible',
      meta: {
        icon: 'mdi:button-cursor',
        title: 'demos.access.superVisible',
      },
      name: 'AccessSuperVisibleDemo',
      path: '/demos/access/super-visible',
    },
    user: {
      component: '/demos/access/user-visible',
      meta: {
        icon: 'mdi:button-cursor',
        title: 'demos.access.userVisible',
      },
      name: 'AccessUserVisibleDemo',
      path: '/demos/access/user-visible',
    },
  };

  return [
    {
      meta: {
        icon: 'ic:baseline-view-in-ar',
        keepAlive: true,
        order: 1000,
        title: 'demos.title',
      },
      name: 'Demos',
      path: '/demos',
      redirect: '/demos/access',
      children: [
        {
          name: 'AccessDemos',
          path: '/demosaccess',
          meta: {
            icon: 'mdi:cloud-key-outline',
            title: 'demos.access.backendPermissions',
          },
          redirect: '/demos/access/page-control',
          children: [
            {
              name: 'AccessPageControlDemo',
              path: '/demos/access/page-control',
              component: '/demos/access/index',
              meta: {
                icon: 'mdi:page-previous-outline',
                title: 'demos.access.pageAccess',
              },
            },
            {
              name: 'AccessButtonControlDemo',
              path: '/demos/access/button-control',
              component: '/demos/access/button-control',
              meta: {
                icon: 'mdi:button-cursor',
                title: 'demos.access.buttonControl',
              },
            },
            {
              name: 'AccessMenuVisible403Demo',
              path: '/demos/access/menu-visible-403',
              component: '/demos/access/menu-visible-403',
              meta: {
                authority: ['no-body'],
                icon: 'mdi:button-cursor',
                menuVisibleWithForbidden: true,
                title: 'demos.access.menuVisible403',
              },
            },
            roleWithMenus[role],
          ],
        },
      ],
    },
  ];
};

export const MOCK_MENUS = [
  {
    menus: [
      ...dashboardMenus,
      ...analyticsMenus,
      ...financeMenus,
      ...createDemosMenus('super'),
    ],
    username: 'vben',
  },
  {
    menus: [
      ...dashboardMenus,
      ...analyticsMenus,
      ...financeMenus,
      ...createDemosMenus('admin'),
    ],
    username: 'admin',
  },
  {
    menus: [
      ...dashboardMenus,
      ...analyticsMenus,
      ...financeMenus,
      ...createDemosMenus('user'),
    ],
    username: 'jack',
  },
];

export const MOCK_MENU_LIST = [
  {
    id: 1,
    name: 'Workspace',
    status: 1,
    type: 'menu',
    icon: 'mdi:dashboard',
    path: '/workspace',
    component: '/dashboard/workspace/index',
    meta: {
      icon: 'carbon:workspace',
      title: 'page.dashboard.workspace',
      affixTab: true,
      order: 0,
    },
  },
  {
    id: 2,
    meta: {
      icon: 'carbon:settings',
      order: 9997,
      title: 'system.title',
      badge: 'new',
      badgeType: 'normal',
      badgeVariants: 'primary',
    },
    status: 1,
    type: 'catalog',
    name: 'System',
    path: '/system',
    children: [
      {
        id: 201,
        pid: 2,
        path: '/system/menu',
        name: 'SystemMenu',
        authCode: 'System:Menu:List',
        status: 1,
        type: 'menu',
        meta: {
          icon: 'carbon:menu',
          title: 'system.menu.title',
        },
        component: '/system/menu/list',
        children: [
          {
            id: 20_101,
            pid: 201,
            name: 'SystemMenuCreate',
            status: 1,
            type: 'button',
            authCode: 'System:Menu:Create',
            meta: { title: 'common.create' },
          },
          {
            id: 20_102,
            pid: 201,
            name: 'SystemMenuEdit',
            status: 1,
            type: 'button',
            authCode: 'System:Menu:Edit',
            meta: { title: 'common.edit' },
          },
          {
            id: 20_103,
            pid: 201,
            name: 'SystemMenuDelete',
            status: 1,
            type: 'button',
            authCode: 'System:Menu:Delete',
            meta: { title: 'common.delete' },
          },
        ],
      },
      {
        id: 202,
        pid: 2,
        path: '/system/dept',
        name: 'SystemDept',
        status: 1,
        type: 'menu',
        authCode: 'System:Dept:List',
        meta: {
          icon: 'carbon:container-services',
          title: 'system.dept.title',
        },
        component: '/system/dept/list',
        children: [
          {
            id: 20_401,
            pid: 201,
            name: 'SystemDeptCreate',
            status: 1,
            type: 'button',
            authCode: 'System:Dept:Create',
            meta: { title: 'common.create' },
          },
          {
            id: 20_402,
            pid: 201,
            name: 'SystemDeptEdit',
            status: 1,
            type: 'button',
            authCode: 'System:Dept:Edit',
            meta: { title: 'common.edit' },
          },
          {
            id: 20_403,
            pid: 201,
            name: 'SystemDeptDelete',
            status: 1,
            type: 'button',
            authCode: 'System:Dept:Delete',
            meta: { title: 'common.delete' },
          },
        ],
      },
    ],
  },
  {
    id: 9,
    meta: {
      badgeType: 'dot',
      order: 9998,
      title: 'demos.vben.title',
      icon: 'carbon:data-center',
    },
    name: 'Project',
    path: '/vben-admin',
    type: 'catalog',
    status: 1,
    children: [
      {
        id: 901,
        pid: 9,
        name: 'VbenDocument',
        path: '/vben-admin/document',
        component: 'IFrameView',
        type: 'embedded',
        status: 1,
        meta: {
          icon: 'carbon:book',
          iframeSrc: 'https://doc.vben.pro',
          title: 'demos.vben.document',
        },
      },
      {
        id: 902,
        pid: 9,
        name: 'VbenGithub',
        path: '/vben-admin/github',
        component: 'IFrameView',
        type: 'link',
        status: 1,
        meta: {
          icon: 'carbon:logo-github',
          link: 'https://github.com/vbenjs/vue-vben-admin',
          title: 'Github',
        },
      },
      {
        id: 903,
        pid: 9,
        name: 'VbenAntdv',
        path: '/vben-admin/antdv',
        component: 'IFrameView',
        type: 'link',
        status: 0,
        meta: {
          icon: 'carbon:hexagon-vertical-solid',
          badgeType: 'dot',
          link: 'https://ant.vben.pro',
          title: 'demos.vben.antdv',
        },
      },
    ],
  },
  {
    id: 10,
    component: '_core/about/index',
    type: 'menu',
    status: 1,
    meta: {
      icon: 'lucide:copyright',
      order: 9999,
      title: 'demos.vben.about',
    },
    name: 'About',
    path: '/about',
  },
];

export function getMenuIds(menus: any[]) {
  const ids: number[] = [];
  menus.forEach((item) => {
    ids.push(item.id);
    if (item.children && item.children.length > 0) {
      ids.push(...getMenuIds(item.children));
    }
  });
  return ids;
}

// ==================== 财务管理数据 ====================

// 货币类型
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  isBase: boolean;
  isActive: boolean;
}

export const MOCK_CURRENCIES: Currency[] = [
  {
    code: 'CNY',
    name: '人民币',
    symbol: '¥',
    isBase: true,
    isActive: true,
  },
  {
    code: 'THB',
    name: '泰铢',
    symbol: '฿',
    isBase: false,
    isActive: true,
  },
  {
    code: 'USD',
    name: '美元',
    symbol: '$',
    isBase: false,
    isActive: true,
  },
];

// 汇率历史记录
export interface ExchangeRate {
  id: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  date: string;
  source: 'api' | 'manual' | 'system';
}

export const MOCK_EXCHANGE_RATES: ExchangeRate[] = [
  // CNY 作为基准货币
  {
    id: 1,
    fromCurrency: 'CNY',
    toCurrency: 'CNY',
    rate: 1,
    date: '2025-10-03',
    source: 'system',
  },
  {
    id: 2,
    fromCurrency: 'CNY',
    toCurrency: 'THB',
    rate: 5,
    date: '2025-10-03',
    source: 'api',
  },
  {
    id: 3,
    fromCurrency: 'CNY',
    toCurrency: 'USD',
    rate: 0.14,
    date: '2025-10-03',
    source: 'api',
  },

  // THB 换算
  {
    id: 4,
    fromCurrency: 'THB',
    toCurrency: 'CNY',
    rate: 0.2,
    date: '2025-10-03',
    source: 'api',
  },
  {
    id: 5,
    fromCurrency: 'THB',
    toCurrency: 'THB',
    rate: 1,
    date: '2025-10-03',
    source: 'system',
  },
  {
    id: 6,
    fromCurrency: 'THB',
    toCurrency: 'USD',
    rate: 0.028,
    date: '2025-10-03',
    source: 'api',
  },

  // USD 换算
  {
    id: 7,
    fromCurrency: 'USD',
    toCurrency: 'CNY',
    rate: 7.14,
    date: '2025-10-03',
    source: 'api',
  },
  {
    id: 8,
    fromCurrency: 'USD',
    toCurrency: 'THB',
    rate: 35.7,
    date: '2025-10-03',
    source: 'api',
  },
  {
    id: 9,
    fromCurrency: 'USD',
    toCurrency: 'USD',
    rate: 1,
    date: '2025-10-03',
    source: 'system',
  },
];

// 分类
export interface Category {
  id: number;
  userId: null | number; // null 表示系统预设
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  sortOrder: number;
  isSystem: boolean;
  isActive: boolean;
}

export const MOCK_CATEGORIES: Category[] = [
  // 支出分类
  {
    id: 1,
    userId: null,
    name: '餐饮',
    type: 'expense',
    icon: '🍜',
    color: '#ff6b6b',
    sortOrder: 1,
    isSystem: true,
    isActive: true,
  },
  {
    id: 2,
    userId: null,
    name: '交通',
    type: 'expense',
    icon: '🚗',
    color: '#4ecdc4',
    sortOrder: 2,
    isSystem: true,
    isActive: true,
  },
  {
    id: 3,
    userId: null,
    name: '购物',
    type: 'expense',
    icon: '🛍️',
    color: '#95e1d3',
    sortOrder: 3,
    isSystem: true,
    isActive: true,
  },
  {
    id: 4,
    userId: null,
    name: '娱乐',
    type: 'expense',
    icon: '🎮',
    color: '#f38181',
    sortOrder: 4,
    isSystem: true,
    isActive: true,
  },
  {
    id: 5,
    userId: null,
    name: '软件订阅',
    type: 'expense',
    icon: '💻',
    color: '#aa96da',
    sortOrder: 5,
    isSystem: true,
    isActive: true,
  },
  {
    id: 6,
    userId: null,
    name: '投资支出',
    type: 'expense',
    icon: '📊',
    color: '#fcbad3',
    sortOrder: 6,
    isSystem: true,
    isActive: true,
  },
  {
    id: 7,
    userId: null,
    name: '医疗健康',
    type: 'expense',
    icon: '🏥',
    color: '#a8d8ea',
    sortOrder: 7,
    isSystem: true,
    isActive: true,
  },
  {
    id: 8,
    userId: null,
    name: '房租房贷',
    type: 'expense',
    icon: '🏠',
    color: '#ffcccc',
    sortOrder: 8,
    isSystem: true,
    isActive: true,
  },
  {
    id: 9,
    userId: null,
    name: '教育',
    type: 'expense',
    icon: '📚',
    color: '#ffd3b6',
    sortOrder: 9,
    isSystem: true,
    isActive: true,
  },
  {
    id: 10,
    userId: null,
    name: '其他支出',
    type: 'expense',
    icon: '📝',
    color: '#dfe4ea',
    sortOrder: 99,
    isSystem: true,
    isActive: true,
  },

  // 收入分类
  {
    id: 11,
    userId: null,
    name: '工资',
    type: 'income',
    icon: '💼',
    color: '#38ada9',
    sortOrder: 1,
    isSystem: true,
    isActive: true,
  },
  {
    id: 12,
    userId: null,
    name: '奖金',
    type: 'income',
    icon: '🎁',
    color: '#78e08f',
    sortOrder: 2,
    isSystem: true,
    isActive: true,
  },
  {
    id: 13,
    userId: null,
    name: '投资收益',
    type: 'income',
    icon: '📈',
    color: '#079992',
    sortOrder: 3,
    isSystem: true,
    isActive: true,
  },
  {
    id: 14,
    userId: null,
    name: '副业收入',
    type: 'income',
    icon: '💡',
    color: '#60a3bc',
    sortOrder: 4,
    isSystem: true,
    isActive: true,
  },
  {
    id: 15,
    userId: null,
    name: '其他收入',
    type: 'income',
    icon: '💰',
    color: '#82ccdd',
    sortOrder: 99,
    isSystem: true,
    isActive: true,
  },
];

// 账户
export interface Account {
  id: number;
  userId: number;
  name: string;
  type:
    | 'alipay'
    | 'bank'
    | 'cash'
    | 'credit_card'
    | 'investment'
    | 'virtual_wallet'
    | 'wechat';
  currency: string;
  balance: number;
  icon: string;
  color: string;
  isActive: boolean;
}

export const MOCK_ACCOUNTS: Account[] = [
  // CNY 账户
  {
    id: 1,
    userId: 1,
    name: '支付宝',
    type: 'alipay',
    currency: 'CNY',
    balance: 5280.5,
    icon: '💙',
    color: '#1677ff',
    isActive: true,
  },
  {
    id: 2,
    userId: 1,
    name: '微信钱包',
    type: 'wechat',
    currency: 'CNY',
    balance: 1520.3,
    icon: '💚',
    color: '#07c160',
    isActive: true,
  },
  {
    id: 3,
    userId: 1,
    name: '中国银行',
    type: 'bank',
    currency: 'CNY',
    balance: 12_500,
    icon: '🏦',
    color: '#c41e3a',
    isActive: true,
  },
  {
    id: 4,
    userId: 1,
    name: '人民币现金',
    type: 'cash',
    currency: 'CNY',
    balance: 800,
    icon: '💵',
    color: '#52c41a',
    isActive: true,
  },

  // THB 账户
  {
    id: 5,
    userId: 1,
    name: '泰铢现金',
    type: 'cash',
    currency: 'THB',
    balance: 15_000,
    icon: '💵',
    color: '#faad14',
    isActive: true,
  },
  {
    id: 6,
    userId: 1,
    name: '泰国银行',
    type: 'bank',
    currency: 'THB',
    balance: 48_000,
    icon: '🏦',
    color: '#722ed1',
    isActive: true,
  },

  // USD 账户
  {
    id: 7,
    userId: 1,
    name: '美金现金',
    type: 'cash',
    currency: 'USD',
    balance: 500,
    icon: '💵',
    color: '#13c2c2',
    isActive: true,
  },
  {
    id: 8,
    userId: 1,
    name: 'PayPal',
    type: 'bank',
    currency: 'USD',
    balance: 1250,
    icon: '💳',
    color: '#0070ba',
    isActive: true,
  },

  // 虚拟钱包
  {
    id: 9,
    userId: 1,
    name: 'USDT钱包',
    type: 'virtual_wallet',
    currency: 'USD',
    balance: 3000,
    icon: '💎',
    color: '#26a17b',
    isActive: true,
  },
  {
    id: 10,
    userId: 1,
    name: 'BTC钱包',
    type: 'virtual_wallet',
    currency: 'USD',
    balance: 0.05,
    icon: '₿',
    color: '#f7931a',
    isActive: true,
  },

  // 投资账户
  {
    id: 11,
    userId: 1,
    name: '证券账户',
    type: 'investment',
    currency: 'CNY',
    balance: 25_000,
    icon: '📊',
    color: '#eb2f96',
    isActive: true,
  },

  // 信用卡
  {
    id: 12,
    userId: 1,
    name: '招商银行信用卡',
    type: 'credit_card',
    currency: 'CNY',
    balance: -3500,
    icon: '💳',
    color: '#f5222d',
    isActive: true,
  },
];

// 交易记录
export interface Transaction {
  id: number;
  userId: number;
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  currency: string;
  exchangeRateToBase: number;
  amountInBase: number;
  categoryId: null | number;
  accountId: number;
  transactionDate: string;
  description: string;
  createdAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

interface TransactionSeed {
  type: Transaction['type'];
  amount: number;
  currency: string;
  categoryId: null | number;
  accountId: number;
  transactionDate: string;
  description: string;
}

function getExchangeRateToBase(currency: string) {
  const rate = MOCK_EXCHANGE_RATES.find(
    (item) => item.fromCurrency === currency && item.toCurrency === 'CNY',
  );
  return rate?.rate ?? 1;
}

function normalizeAmount(value: number) {
  return Number(value.toFixed(2));
}

const TRANSACTION_SEEDS: TransactionSeed[] = [
  {
    type: 'income',
    amount: 12_800,
    currency: 'CNY',
    categoryId: 11,
    accountId: 3,
    transactionDate: '2025-10-08',
    description: '十月工资入账',
  },
  {
    type: 'income',
    amount: 2800,
    currency: 'CNY',
    categoryId: 12,
    accountId: 3,
    transactionDate: '2025-10-18',
    description: '季度绩效奖金',
  },
  {
    type: 'income',
    amount: 460,
    currency: 'USD',
    categoryId: 13,
    accountId: 9,
    transactionDate: '2025-10-21',
    description: '股票分红（USD）',
  },
  {
    type: 'expense',
    amount: 3850,
    currency: 'CNY',
    categoryId: 8,
    accountId: 3,
    transactionDate: '2025-10-05',
    description: '十月房租支出',
  },
  {
    type: 'expense',
    amount: 248.4,
    currency: 'CNY',
    categoryId: 1,
    accountId: 1,
    transactionDate: '2025-10-07',
    description: '家庭聚餐消费',
  },
  {
    type: 'expense',
    amount: 612.5,
    currency: 'CNY',
    categoryId: 3,
    accountId: 2,
    transactionDate: '2025-10-11',
    description: '大型超市购物',
  },
  {
    type: 'expense',
    amount: 420,
    currency: 'CNY',
    categoryId: 4,
    accountId: 2,
    transactionDate: '2025-10-14',
    description: '娱乐活动（电影+KTV）',
  },
  {
    type: 'expense',
    amount: 1350,
    currency: 'CNY',
    categoryId: 7,
    accountId: 3,
    transactionDate: '2025-10-19',
    description: '体检及医疗支出',
  },
  {
    type: 'expense',
    amount: 92.6,
    currency: 'CNY',
    categoryId: 2,
    accountId: 1,
    transactionDate: '2025-10-22',
    description: '共享单车与地铁',
  },
  {
    type: 'expense',
    amount: 168,
    currency: 'CNY',
    categoryId: 5,
    accountId: 4,
    transactionDate: '2025-10-25',
    description: '云服务与软件订阅',
  },
  {
    type: 'income',
    amount: 4500,
    currency: 'USD',
    categoryId: 14,
    accountId: 9,
    transactionDate: '2025-09-10',
    description: '驻外项目服务费',
  },
  {
    type: 'income',
    amount: 12_650,
    currency: 'CNY',
    categoryId: 11,
    accountId: 3,
    transactionDate: '2025-09-08',
    description: '九月工资入账',
  },
  {
    type: 'expense',
    amount: 3720,
    currency: 'CNY',
    categoryId: 8,
    accountId: 3,
    transactionDate: '2025-09-05',
    description: '九月房租支出',
  },
  {
    type: 'expense',
    amount: 520.8,
    currency: 'CNY',
    categoryId: 1,
    accountId: 1,
    transactionDate: '2025-09-09',
    description: '中秋家庭聚餐',
  },
  {
    type: 'expense',
    amount: 980,
    currency: 'CNY',
    categoryId: 6,
    accountId: 11,
    transactionDate: '2025-09-15',
    description: '指数基金定投',
  },
  {
    type: 'expense',
    amount: 312,
    currency: 'CNY',
    categoryId: 3,
    accountId: 2,
    transactionDate: '2025-09-18',
    description: '电商平台日常用品',
  },
  {
    type: 'expense',
    amount: 1500,
    currency: 'CNY',
    categoryId: 9,
    accountId: 3,
    transactionDate: '2025-09-20',
    description: '孩子辅导课程',
  },
  {
    type: 'expense',
    amount: 108.6,
    currency: 'CNY',
    categoryId: 2,
    accountId: 2,
    transactionDate: '2025-09-22',
    description: '地铁月度充值',
  },
  {
    type: 'expense',
    amount: 65,
    currency: 'THB',
    categoryId: 1,
    accountId: 5,
    transactionDate: '2025-09-26',
    description: '曼谷街头小吃',
  },
  {
    type: 'expense',
    amount: 210,
    currency: 'USD',
    categoryId: 5,
    accountId: 8,
    transactionDate: '2025-09-28',
    description: '年度生产力工具订阅',
  },
  {
    type: 'income',
    amount: 12_580,
    currency: 'CNY',
    categoryId: 11,
    accountId: 3,
    transactionDate: '2025-08-08',
    description: '八月工资入账',
  },
  {
    type: 'income',
    amount: 2150,
    currency: 'CNY',
    categoryId: 13,
    accountId: 11,
    transactionDate: '2025-08-16',
    description: '理财产品收益',
  },
  {
    type: 'income',
    amount: 320,
    currency: 'USD',
    categoryId: 15,
    accountId: 9,
    transactionDate: '2025-08-24',
    description: '海外二手交易收入',
  },
  {
    type: 'expense',
    amount: 3680,
    currency: 'CNY',
    categoryId: 8,
    accountId: 3,
    transactionDate: '2025-08-05',
    description: '八月房租支出',
  },
  {
    type: 'expense',
    amount: 452.3,
    currency: 'CNY',
    categoryId: 1,
    accountId: 1,
    transactionDate: '2025-08-07',
    description: '工作日餐饮',
  },
  {
    type: 'expense',
    amount: 275.4,
    currency: 'CNY',
    categoryId: 4,
    accountId: 2,
    transactionDate: '2025-08-12',
    description: '家庭周末娱乐',
  },
  {
    type: 'expense',
    amount: 860,
    currency: 'CNY',
    categoryId: 6,
    accountId: 11,
    transactionDate: '2025-08-15',
    description: '基金定投计划',
  },
  {
    type: 'expense',
    amount: 1999,
    currency: 'CNY',
    categoryId: 3,
    accountId: 3,
    transactionDate: '2025-08-18',
    description: '家用电器采购',
  },
  {
    type: 'expense',
    amount: 145,
    currency: 'CNY',
    categoryId: 2,
    accountId: 2,
    transactionDate: '2025-08-20',
    description: '外出交通打车',
  },
  {
    type: 'expense',
    amount: 72,
    currency: 'USD',
    categoryId: 5,
    accountId: 8,
    transactionDate: '2025-08-23',
    description: '云服务增值包',
  },
  {
    type: 'income',
    amount: 12_480,
    currency: 'CNY',
    categoryId: 11,
    accountId: 3,
    transactionDate: '2025-07-08',
    description: '七月工资入账',
  },
  {
    type: 'expense',
    amount: 3680,
    currency: 'CNY',
    categoryId: 8,
    accountId: 3,
    transactionDate: '2025-07-05',
    description: '七月房租支出',
  },
  {
    type: 'expense',
    amount: 1299,
    currency: 'CNY',
    categoryId: 3,
    accountId: 1,
    transactionDate: '2025-07-12',
    description: '暑期家庭购物',
  },
  {
    type: 'expense',
    amount: 420,
    currency: 'CNY',
    categoryId: 4,
    accountId: 2,
    transactionDate: '2025-07-18',
    description: '亲子乐园娱乐',
  },
  {
    type: 'expense',
    amount: 960,
    currency: 'CNY',
    categoryId: 9,
    accountId: 3,
    transactionDate: '2025-07-22',
    description: '暑期培训课程',
  },
  {
    type: 'income',
    amount: 1800,
    currency: 'CNY',
    categoryId: 14,
    accountId: 2,
    transactionDate: '2025-07-25',
    description: '副业项目结算',
  },
  {
    type: 'expense',
    amount: 288,
    currency: 'THB',
    categoryId: 1,
    accountId: 5,
    transactionDate: '2025-07-27',
    description: '泰国商务餐饮',
  },
  {
    type: 'income',
    amount: 520,
    currency: 'USD',
    categoryId: 13,
    accountId: 9,
    transactionDate: '2025-07-30',
    description: '海外理财收益',
  },
];

export const MOCK_TRANSACTIONS: Transaction[] = TRANSACTION_SEEDS.map(
  (seed, index) => {
    const exchangeRate = getExchangeRateToBase(seed.currency);
    const amountInBase = normalizeAmount(seed.amount * exchangeRate);

    return {
      id: index + 1,
      userId: 1,
      type: seed.type,
      amount: normalizeAmount(seed.amount),
      currency: seed.currency,
      exchangeRateToBase: normalizeAmount(exchangeRate),
      amountInBase,
      categoryId: seed.categoryId,
      accountId: seed.accountId,
      transactionDate: seed.transactionDate,
      description: seed.description,
      createdAt: `${seed.transactionDate}T09:00:00.000Z`,
    };
  },
);

// 预算管理
export interface Budget {
  id: number;
  userId: number;
  category: string;
  categoryId?: number;
  emoji: string;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  currency: string;
  period: 'monthly' | 'quarterly' | 'weekly' | 'yearly';
  alertThreshold: number;
  description?: string;
  autoRenew: boolean;
  overspendAlert: boolean;
  dailyReminder: boolean;
  monthlyTrend?: number;
  createdAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export const MOCK_BUDGETS: Budget[] = [];
