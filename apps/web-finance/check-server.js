import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false, // 有头模式，方便观察
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 监听控制台消息
  page.on('console', (msg) => {
    console.log(`浏览器控制台 [${msg.type()}]:`, msg.text());
  });

  // 监听页面错误
  page.on('pageerror', (error) => {
    console.error('页面错误:', error.message);
  });

  try {
    console.log('正在访问 http://localhost:5666/ ...\n');

    const response = await page.goto('http://localhost:5666/', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    console.log('响应状态:', response?.status());
    console.log('当前URL:', page.url());

    // 等待页面加载
    await page.waitForTimeout(3000);

    // 截图查看页面状态
    await page.screenshot({
      path: 'server-check.png',
      fullPage: true,
    });
    console.log('\n已保存截图: server-check.png');

    // 检查页面内容
    const title = await page.title();
    console.log('页面标题:', title);

    // 检查是否有错误信息
    const bodyText = await page.locator('body').textContent();
    console.log('\n页面内容预览:');
    console.log(`${bodyText.slice(0, 500)}...`);

    // 保持浏览器打开10秒以便查看
    console.log('\n浏览器将在10秒后关闭...');
    await page.waitForTimeout(10_000);
  } catch (error) {
    console.error('访问失败:', error.message);

    // 尝试获取更多错误信息
    if (error.message.includes('ERR_CONNECTION_REFUSED')) {
      console.log('\n服务器可能未启动或端口错误');
      console.log('检查端口 5666 是否被占用...');
    }
  } finally {
    await browser.close();
  }
})();
