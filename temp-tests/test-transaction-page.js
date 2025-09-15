import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
  });

  const page = await browser.newPage();

  // 监听控制台消息
  page.on('console', (msg) => {
    console.log(`[${msg.type()}]`, msg.text());
  });

  // 监听页面错误
  page.on('pageerror', (error) => {
    console.log('[PAGE ERROR]', error.message);
  });

  try {
    console.log('1. 访问系统...');
    await page.goto('http://localhost:5667');
    await page.waitForTimeout(2000);

    console.log('2. 测试API页面...');
    await page.goto('http://localhost:5667/finance/test-api');
    await page.waitForTimeout(2000);

    // 测试分类API
    console.log('3. 测试分类API...');
    const categoryBtn = await page.locator('button:has-text("测试分类API")');
    await categoryBtn.click();
    await page.waitForTimeout(2000);

    // 检查结果
    const preElement = await page.locator('pre');
    if (await preElement.isVisible()) {
      const content = await preElement.textContent();
      console.log('分类API结果:', `${content?.slice(0, 100)}...`);
    }

    // 测试交易页面
    console.log('4. 访问交易管理页面...');
    await page.goto('http://localhost:5667/finance/transaction');
    await page.waitForTimeout(3000);

    // 检查是否还在加载
    const spinners = await page.locator('.ant-spin').count();
    console.log(`找到 ${spinners} 个加载指示器`);

    // 检查表格是否加载
    const table = await page.locator('.ant-table');
    if (await table.isVisible()) {
      console.log('✅ 表格已加载');

      // 统计行数
      const rows = await page.locator('.ant-table-tbody tr').count();
      console.log(`表格中有 ${rows} 行数据`);
    } else {
      console.log('❌ 表格未加载');
    }

    // 检查新建按钮
    const createBtn = await page.locator('button:has-text("新建交易")');
    if (await createBtn.isVisible()) {
      console.log('✅ 新建交易按钮存在');

      // 点击新建按钮
      await createBtn.click();
      await page.waitForTimeout(1000);

      // 检查弹窗
      const modal = await page.locator('.ant-modal');
      if (await modal.isVisible()) {
        console.log('✅ 新建交易弹窗已打开');

        // 关闭弹窗
        await page.locator('.ant-modal-close').click();
      }
    }

    // 截图
    await page.screenshot({
      path: 'transaction-page-test.png',
      fullPage: true,
    });
    console.log('截图已保存');

    console.log('\n测试完成！');
  } catch (error) {
    console.error('测试失败:', error);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
    console.log('浏览器已关闭');
  }
})();
