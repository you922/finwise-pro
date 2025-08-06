import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    slowMo: 100
  });

  const page = await browser.newPage();

  try {
    console.log('1. 访问系统...');
    await page.goto('http://localhost:5667');
    await page.waitForTimeout(2000);
    
    console.log('2. 当前URL:', page.url());
    
    // 直接导航到交易页面
    console.log('3. 访问交易管理页面...');
    await page.goto('http://localhost:5667/finance/transaction');
    await page.waitForTimeout(2000);
    
    // 截图
    await page.screenshot({ path: 'transaction-page.png', fullPage: true });
    console.log('4. 截图已保存为 transaction-page.png');
    
    // 查找新建按钮
    const buttons = await page.locator('button').all();
    console.log(`5. 找到 ${buttons.length} 个按钮`);
    
    for (const button of buttons) {
      const text = await button.textContent();
      console.log(`   按钮: ${text}`);
    }
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await browser.close();
    console.log('测试完成');
  }
})();