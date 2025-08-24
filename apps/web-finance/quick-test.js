import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false, // 有头模式，方便观察
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('快速测试导入导出功能...\n');

  try {
    // 直接访问交易管理页面
    console.log('访问交易管理页面...');
    await page.goto('http://localhost:5666/finance/transaction');

    // 等待页面加载
    await page.waitForTimeout(3000);

    // 截图
    await page.screenshot({ path: 'transaction-page.png' });
    console.log('页面截图已保存为 transaction-page.png');

    // 测试导出CSV
    console.log('\n尝试导出CSV...');
    try {
      const exportBtn = page.locator('button:has-text("导出数据")');
      if (await exportBtn.isVisible()) {
        await exportBtn.click();
        await page.waitForTimeout(500);

        // 点击CSV导出
        await page.locator('text="导出为CSV"').click();
        console.log('CSV导出操作已触发');
      } else {
        console.log('导出按钮未找到');
      }
    } catch {
      console.log('导出功能可能需要登录');
    }

    console.log('\n测试完成！');
  } catch (error) {
    console.error('测试失败:', error.message);
  }

  // 保持浏览器打开20秒供查看
  console.log('\n浏览器将在20秒后关闭...');
  await page.waitForTimeout(20_000);
  await browser.close();
})();
