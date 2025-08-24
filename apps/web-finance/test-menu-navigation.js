import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false, // 有头模式，方便观察
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 收集错误信息
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  try {
    console.log('开始测试菜单导航...\n');

    // 直接访问主页
    await page.goto('http://localhost:5666/', {
      waitUntil: 'networkidle',
      timeout: 30_000,
    });

    console.log('当前页面:', page.url());

    // 等待页面加载
    await page.waitForTimeout(3000);

    // 截图查看当前状态
    await page.screenshot({
      path: 'test-current-state.png',
      fullPage: true,
    });

    // 检查是否已经登录
    if (page.url().includes('/auth/login')) {
      console.log('需要先登录，请手动登录后重试');
    } else {
      console.log('✓ 已经登录或在主页面\n');

      // 测试菜单列表
      const menuTests = [
        { text: '财务概览', expectedUrl: '/finance/dashboard' },
        { text: '交易管理', expectedUrl: '/finance/transaction' },
        { text: '分类管理', expectedUrl: '/finance/category' },
        { text: '人员管理', expectedUrl: '/finance/person' },
        { text: '贷款管理', expectedUrl: '/finance/loan' },
        { text: '数据概览', expectedUrl: '/analytics/overview' },
      ];

      for (const menu of menuTests) {
        console.log(`\n测试菜单: ${menu.text}`);

        try {
          // 尝试点击菜单
          const menuItem = await page.locator(`text="${menu.text}"`).first();

          if (await menuItem.isVisible()) {
            await menuItem.click();
            await page.waitForTimeout(2000);

            console.log(`✓ 成功点击菜单`);
            console.log(`  当前URL: ${page.url()}`);

            // 检查页面内容
            const pageTitle = await page
              .locator('h1, h2, .page-title, .page-header-title')
              .first()
              .textContent()
              .catch(() => null);
            if (pageTitle) {
              console.log(`  页面标题: ${pageTitle}`);
            }

            // 检查是否有表格
            const tables = await page.locator('.ant-table').count();
            if (tables > 0) {
              console.log(`  ✓ 找到 ${tables} 个表格`);

              // 检查表格是否有数据
              const rows = await page.locator('.ant-table-row').count();
              console.log(`  表格数据行: ${rows}`);
            }

            // 检查是否有图表
            const charts = await page.locator('canvas').count();
            if (charts > 0) {
              console.log(`  ✓ 找到 ${charts} 个图表`);
            }

            // 检查操作按钮
            const buttons = await page.locator('button').count();
            console.log(`  按钮数量: ${buttons}`);

            // 检查是否有错误
            const errorAlerts = await page.locator('.ant-alert-error').count();
            if (errorAlerts > 0) {
              console.log(`  ⚠️  发现 ${errorAlerts} 个错误提示`);
            }

            // 截图
            await page.screenshot({
              path: `test-menu-${menu.text.replaceAll(/\s+/g, '-')}.png`,
              fullPage: true,
            });
          } else {
            // 尝试展开菜单组
            const menuGroups = await page
              .locator('.ant-menu-submenu-title')
              .all();
            for (const group of menuGroups) {
              const groupText = await group.textContent();
              if (
                (groupText && groupText.includes('财务管理')) ||
                groupText.includes('数据分析')
              ) {
                await group.click();
                await page.waitForTimeout(500);

                // 再次尝试点击菜单
                const subMenuItem = await page
                  .locator(`text="${menu.text}"`)
                  .first();
                if (await subMenuItem.isVisible()) {
                  await subMenuItem.click();
                  await page.waitForTimeout(2000);
                  console.log(`✓ 成功点击子菜单`);
                  console.log(`  当前URL: ${page.url()}`);
                  break;
                }
              }
            }
          }
        } catch (error) {
          console.log(`✗ 无法访问菜单: ${error.message}`);
        }
      }
    }

    // 输出错误总结
    console.log('\n========== 错误总结 ==========');
    if (errors.length > 0) {
      errors.forEach((err, index) => {
        console.log(`${index + 1}. ${err}`);
      });
    } else {
      console.log('✓ 没有控制台错误');
    }
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    // 保持浏览器打开以便查看
    console.log('\n测试完成，浏览器将在10秒后关闭...');
    await page.waitForTimeout(10_000);
    await browser.close();
  }
})();
