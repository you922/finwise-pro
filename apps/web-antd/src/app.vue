<script lang="ts" setup>
import { computed, onMounted, watch } from 'vue';

import { useAntdDesignTokens } from '@vben/hooks';
import { preferences, usePreferences } from '@vben/preferences';

import { App, ConfigProvider, theme } from 'ant-design-vue';

import { antdLocale } from '#/locales';

defineOptions({ name: 'App' });

const { isDark } = usePreferences();
const { tokens } = useAntdDesignTokens();

const tokenTheme = computed(() => {
  const algorithm = isDark.value
    ? [theme.darkAlgorithm]
    : [theme.defaultAlgorithm];

  // antd 紧凑模式算法
  if (preferences.app.compact) {
    algorithm.push(theme.compactAlgorithm);
  }

  return {
    algorithm,
    token: tokens,
  };
});

// Function to flatten FinWise Pro menu
const flattenFinWiseProMenu = () => {
  const submenus = document.querySelectorAll('.vben-sub-menu');
  let finwiseMenu: Element | null = null;

  submenus.forEach(menu => {
    const titleEl = menu.querySelector('.vben-sub-menu-content__title');
    if (titleEl?.textContent?.includes('FinWise Pro')) {
      finwiseMenu = menu;
    }
  });

  if (!finwiseMenu) return;

  const parentMenu = finwiseMenu.parentElement;
  const childrenUL = finwiseMenu.querySelector('.vben-menu');

  if (!childrenUL || !parentMenu) return;

  // Check if already processed
  if ((finwiseMenu as HTMLElement).getAttribute('data-hide-finwise') === 'true') return;

  // Move all children to the parent menu
  const children = Array.from(childrenUL.children);
  children.forEach(child => {
    parentMenu.insertBefore(child, finwiseMenu);
  });

  // Mark for hiding via CSS and hide directly
  (finwiseMenu as HTMLElement).setAttribute('data-hide-finwise', 'true');
  (finwiseMenu as HTMLElement).style.display = 'none';
};

// Run on mount and watch for route changes
onMounted(() => {
  // 强制修复sidebar设置，防止被用户UI操作覆盖
  const fixSidebarPreferences = () => {
    const prefsKey = Object.keys(localStorage).find(k => k.includes('preferences') && !k.includes('locale') && !k.includes('theme'));
    if (prefsKey) {
      try {
        const prefs = JSON.parse(localStorage.getItem(prefsKey) || '{}');
        if (prefs.value?.sidebar) {
          // 强制设置侧边栏为展开状态
          prefs.value.sidebar.collapsed = false;
          prefs.value.sidebar.expandOnHover = false;
          prefs.value.sidebar.collapsedButton = false;
          prefs.value.sidebar.collapsedWidth = 230;
          localStorage.setItem(prefsKey, JSON.stringify(prefs));
        }
      } catch(e) {
        console.error('Failed to fix sidebar preferences:', e);
      }
    }
  };

  // 立即执行一次
  fixSidebarPreferences();

  // Run multiple times with increasing delays to catch menu rendering
  const delays = [100, 300, 500, 1000, 1500, 2000, 2500, 3000, 4000, 5000];
  delays.forEach(delay => {
    setTimeout(flattenFinWiseProMenu, delay);
  });

  // Watch for DOM changes (when menu is re-rendered)
  const observer = new MutationObserver(() => {
    setTimeout(flattenFinWiseProMenu, 200);
  });

  // Observe the body for menu changes
  setTimeout(() => {
    const body = document.body;
    if (body) {
      observer.observe(body, {
        childList: true,
        subtree: true
      });
    }
  }, 100);

  // 防止侧边栏自动收起
  setTimeout(() => {
    const preventSidebarCollapse = () => {
      const sidebar = document.querySelector('[class*="sidebar"]') || document.querySelector('aside');

      if (!sidebar) return;

      // 创建MutationObserver监听class和style变化
      const sidebarObserver = new MutationObserver(() => {
        const currentWidth = window.getComputedStyle(sidebar).width;
        // 如果宽度小于200px，说明可能被收起了，强制恢复
        if (parseInt(currentWidth) < 200) {
          (sidebar as HTMLElement).style.width = '230px';
        }
      });

      // 开始观察
      sidebarObserver.observe(sidebar, {
        attributes: true,
        attributeFilter: ['class', 'style']
      });

      // 强制设置初始宽度
      (sidebar as HTMLElement).style.width = '230px';
    };

    // 延迟执行，等待侧边栏渲染
    setTimeout(preventSidebarCollapse, 500);
    setTimeout(preventSidebarCollapse, 1000);
    setTimeout(preventSidebarCollapse, 2000);
  }, 200);
});
</script>

<template>
  <ConfigProvider :locale="antdLocale" :theme="tokenTheme">
    <App>
      <RouterView />
    </App>
  </ConfigProvider>
</template>

<style>
/* Styles can be added here if needed */
</style>
