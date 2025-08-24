import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false,
    devtools: true, // 打开开发者工具
  });

  const page = await browser.newPage();

  // 监听控制台消息
  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      console.log(`[${type.toUpperCase()}]`, msg.text());
    }
  });

  // 监听页面错误
  page.on('pageerror', (error) => {
    console.log('[PAGE ERROR]', error.message);
  });

  // 监听请求失败
  page.on('requestfailed', (request) => {
    console.log(
      '[REQUEST FAILED]',
      request.url(),
      request.failure()?.errorText,
    );
  });

  try {
    console.log('访问系统...');
    await page.goto('http://localhost:5667', { waitUntil: 'networkidle' });

    console.log('等待3秒...');
    await page.waitForTimeout(3000);

    console.log('访问交易管理页面...');
    await page.goto('http://localhost:5667/finance/transaction', {
      waitUntil: 'networkidle',
    });

    console.log('等待5秒观察控制台...');
    await page.waitForTimeout(5000);

    // 检查是否有加载指示器
    const loading = await page.locator('.ant-spin').count();
    console.log(`找到 ${loading} 个加载指示器`);

    // 截图
    await page.screenshot({ path: 'transaction-loading.png', fullPage: true });
    console.log('截图已保存');
  } catch (error) {
    console.error('错误:', error);
  } finally {
    console.log('保持浏览器打开，按Ctrl+C退出...');
    await page.waitForTimeout(30_000);
    await browser.close();
  }
})();
