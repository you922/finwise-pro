import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';

import { resetStaticRoutes } from '@vben/utils';

import { createRouterGuard } from './guard';
import { routes } from './routes';

/**
 *  @zh_CN 创建vue-router实例
 */
const router = createRouter({
  history:
    import.meta.env.VITE_ROUTER_HISTORY === 'hash'
      ? createWebHashHistory(import.meta.env.VITE_BASE)
      : createWebHistory(import.meta.env.VITE_BASE),
  // 应该添加到路由的初始路由列表。
  routes,
  scrollBehavior: (to, _from, savedPosition) => {
    if (savedPosition) {
      return savedPosition;
    }
    return to.hash ? { behavior: 'smooth', el: to.hash } : { left: 0, top: 0 };
  },
  // 是否应该禁止尾部斜杠。
  // strict: true,
});

const resetRoutes = () => resetStaticRoutes(router, routes);

// 创建路由守卫
createRouterGuard(router);

// Flatten FinWise Pro menu after each route change
router.afterEach(() => {
  const flattenFinWiseProMenu = () => {
    const submenus = document.querySelectorAll('.vben-sub-menu');
    let finwiseMenu: Element | null = null;

    submenus.forEach((menu) => {
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
    if (
      (finwiseMenu as HTMLElement).dataset.hideFinwise === 'true'
    )
      return;

    // Move all children to the parent menu
    const children = [...childrenUL.children];
    children.forEach((child) => {
      finwiseMenu.before(child);
    });

    // Mark for hiding via CSS and hide directly
    (finwiseMenu as HTMLElement).dataset.hideFinwise = 'true';
    (finwiseMenu as HTMLElement).style.display = 'none';
  };

  // Run multiple times to catch menu rendering
  setTimeout(flattenFinWiseProMenu, 100);
  setTimeout(flattenFinWiseProMenu, 300);
  setTimeout(flattenFinWiseProMenu, 500);
  setTimeout(flattenFinWiseProMenu, 1000);
  setTimeout(flattenFinWiseProMenu, 2000);
});

export { resetRoutes, router };
