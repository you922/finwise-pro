# TokenRecords 财务管理系统 (VbenAdmin 版本)

基于 VbenAdmin 框架构建的现代化财务管理系统，提供完整的收支记录、分类管理、人员管理和贷款管理功能。

## 功能特性

### 核心功能
- **交易管理**：记录和管理所有收支交易，支持多币种、多状态管理
- **分类管理**：灵活的收支分类体系，支持自定义分类
- **人员管理**：管理交易相关人员，支持多角色（付款人、收款人、借款人、出借人）
- **贷款管理**：完整的贷款和还款记录管理，自动计算还款进度

### 技术特性
- **现代化技术栈**：Vue 3 + TypeScript + Vite + Pinia + Ant Design Vue
- **本地存储**：使用 IndexedDB 进行数据持久化，支持离线使用
- **Mock API**：完整的 Mock 数据服务，方便开发和测试
- **响应式设计**：适配各种屏幕尺寸
- **国际化支持**：内置中文语言包，可扩展多语言

## 快速开始

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
pnpm dev:finance
```

### 访问系统
- 开发地址：http://localhost:5666/
- 默认账号：vben
- 默认密码：123456

## 项目结构

```
src/
├── api/                 # API 接口
│   ├── finance/        # 财务相关 API
│   └── mock/           # Mock 数据服务
├── store/              # 状态管理
│   └── modules/        # 业务模块
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数
│   ├── db.ts          # IndexedDB 工具
│   └── data-migration.ts # 数据迁移工具
├── views/              # 页面组件
│   ├── finance/       # 财务管理页面
│   ├── analytics/     # 统计分析页面
│   └── tools/         # 系统工具页面
├── router/            # 路由配置
└── locales/           # 国际化配置
```

## 数据存储

系统使用 IndexedDB 作为本地存储方案，支持：
- 自动数据持久化
- 事务支持
- 索引查询
- 数据备份和恢复

### 数据迁移
如果您有旧版本的数据（存储在 localStorage），系统会在启动时自动检测并迁移到新的存储系统。

## 开发指南

### 添加新功能
1. 在 `types/finance.ts` 中定义数据类型
2. 在 `api/finance/` 中创建 API 接口
3. 在 `store/modules/` 中创建状态管理
4. 在 `views/` 中创建页面组件
5. 在 `router/routes/modules/` 中配置路由

### Mock 数据
Mock 数据服务位于 `api/mock/finance-service.ts`，可以根据需要修改初始数据或添加新的 Mock 接口。

## 测试

运行 Playwright 测试：
```bash
node test-finance-system.js
```

## 部署

### 构建生产版本
```bash
pnpm build:finance
```

构建产物将生成在 `dist` 目录中。

## 技术支持

- VbenAdmin 文档：https://doc.vben.pro/
- Vue 3 文档：https://cn.vuejs.org/
- Ant Design Vue：https://antdv.com/

## 许可证

MIT