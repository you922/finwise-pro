import { initPreferences } from '@vben/preferences';
import { unmountGlobalLoading } from '@vben/utils';

import { overridesPreferences } from './preferences';
import './custom.css';

/**
 * 应用初始化完成之后再进行页面加载渲染
 */
async function initApplication() {
  // name用于指定项目唯一标识
  // 用于区分不同项目的偏好设置以及存储数据的key前缀以及其他一些需要隔离的数据
  const env = import.meta.env.PROD ? 'prod' : 'dev';
  const appVersion = import.meta.env.VITE_APP_VERSION;
  const namespace = `${import.meta.env.VITE_APP_NAMESPACE}-${appVersion}-${env}`;

  // app偏好设置初始化
  await initPreferences({
    namespace,
    overrides: overridesPreferences,
  });

  // 启动应用并挂载
  // vue应用主要逻辑及视图
  const { bootstrap } = await import('./bootstrap');
  await bootstrap(namespace);

  // 移除并销毁loading
  unmountGlobalLoading();
}

initApplication();

// Flatten FinWise Pro menu globally
function flattenFinWiseProMenu() {
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
}

// Wait for DOM to be ready, then run the flatten function
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Run multiple times with delays to catch menu rendering
    setTimeout(() => flattenFinWiseProMenu(), 500);
    setTimeout(() => flattenFinWiseProMenu(), 1000);
    setTimeout(() => flattenFinWiseProMenu(), 2000);
    setTimeout(() => flattenFinWiseProMenu(), 3000);
  });
} else {
  // DOM is already loaded
  setTimeout(() => flattenFinWiseProMenu(), 500);
  setTimeout(() => flattenFinWiseProMenu(), 1000);
  setTimeout(() => flattenFinWiseProMenu(), 2000);
  setTimeout(() => flattenFinWiseProMenu(), 3000);
}

// Watch for DOM changes
setTimeout(() => {
  const observer = new MutationObserver(() => {
    setTimeout(flattenFinWiseProMenu, 100);
  });

  const body = document.body;
  if (body) {
    observer.observe(body, {
      childList: true,
      subtree: true
    });
  }
}, 500);
