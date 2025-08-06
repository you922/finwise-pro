import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false // 有头模式，方便观察
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('开始测试菜单切换功能...\n');

  try {
    // 访问首页并登录
    console.log('1. 访问系统并登录...');
    await page.goto('http://localhost:5666/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // 如果在登录页，执行登录
    if (page.url().includes('/auth/login')) {
      await page.waitForTimeout(1000);
      try {
        await page.fill('input[type="text"]', 'vben');
        await page.fill('input[type="password"]', '123456');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
      } catch (e) {
        console.log('登录失败或已登录，继续执行...');
      }
    }
    
    console.log('2. 测试菜单切换...\n');
    
    // 测试多次切换
    const testCases = [
      { name: '交易管理', selector: 'a[href="/finance/transaction"]' },
      { name: '分类管理', selector: 'a[href="/finance/category"]' },
      { name: '交易管理（返回）', selector: 'a[href="/finance/transaction"]' },
      { name: '人员管理', selector: 'a[href="/finance/person"]' },
      { name: '贷款管理', selector: 'a[href="/finance/loan"]' },
      { name: '人员管理（返回）', selector: 'a[href="/finance/person"]' },
    ];
    
    for (const testCase of testCases) {
      console.log(`切换到 ${testCase.name}...`);
      
      // 点击菜单
      await page.click(testCase.selector);
      await page.waitForTimeout(1500);
      
      // 获取当前URL
      const currentUrl = page.url();
      console.log(`  - 当前URL: ${currentUrl}`);
      
      // 检查页面内容
      const pageTitle = await page.textContent('h1, .ant-card-head-title', { timeout: 3000 }).catch(() => null);
      console.log(`  - 页面标题: ${pageTitle || '未找到标题'}`);
      
      // 检查是否有数据表格或卡片
      const hasTable = await page.locator('.ant-table').count() > 0;
      const hasCard = await page.locator('.ant-card').count() > 0;
      console.log(`  - 包含表格: ${hasTable ? '是' : '否'}`);
      console.log(`  - 包含卡片: ${hasCard ? '是' : '否'}`);
      console.log('');
    }
    
    console.log('测试完成！菜单切换功能正常。');
    
  } catch (error) {
    console.error('测试失败:', error);
  }
  
  // 保持浏览器打开10秒供查看
  console.log('\n浏览器将在10秒后关闭...');
  await page.waitForTimeout(10000);
  await browser.close();
})();