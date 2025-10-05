import { defineOverridesPreferences } from '@vben/preferences';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    name: 'Vben Admin Antd', // 固定网站名称，不随语言改变
    locale: 'zh-CN', // 默认语言为中文
    theme: 'dark', // 默认深色主题
    defaultHomePath: '/workspace', // 设置默认首页为workspace
  },
  sidebar: {
    collapsed: false, // 侧边栏默认展开
    expandOnHover: false, // 禁用悬停展开
    enable: true, // 启用侧边栏
    width: 230, // 设置侧边栏宽度
    collapsedWidth: 230, // 收起时的宽度也设为正常宽度，防止收起
    extraCollapse: false, // 禁用额外的收起功能
    collapsedButton: false, // 禁用折叠按钮
  },
});
