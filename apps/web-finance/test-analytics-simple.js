import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false, // 有头模式，方便观察
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('开始简单测试统计分析页面...');

    // 直接访问统计分析页面
    await page.goto('http://localhost:5666/analytics/overview', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    console.log('页面URL:', page.url());

    // 等待页面加载
    await page.waitForTimeout(5000);

    // 截图查看页面状态
    await page.screenshot({
      path: 'analytics-page-state.png',
      fullPage: true,
    });
    console.log('已保存页面截图: analytics-page-state.png');

    // 检查是否有错误信息
    const errorMessages = await page.locator('.ant-message-error').count();
    if (errorMessages > 0) {
      console.log(`发现 ${errorMessages} 个错误信息`);
    }

    // 检查页面标题
    const pageTitle = await page
      .locator('h1, .page-header-title')
      .first()
      .textContent();
    console.log('页面标题:', pageTitle);

    // 检查是否有卡片组件
    const cards = await page.locator('.ant-card').count();
    console.log(`找到 ${cards} 个卡片组件`);

    // 检查是否有canvas元素（图表通常渲染在canvas中）
    const canvasElements = await page.locator('canvas').count();
    console.log(`找到 ${canvasElements} 个canvas元素（图表）`);

    // 查看控制台日志
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('浏览器控制台错误:', msg.text());
      }
    });

    console.log('\n测试完成！');
  } catch (error) {
    console.error('测试失败:', error);
    await page.screenshot({
      path: 'analytics-error-simple.png',
      fullPage: true,
    });
  } finally {
    // 等待用户查看
    await page.waitForTimeout(10_000);
    await browser.close();
  }
})();
