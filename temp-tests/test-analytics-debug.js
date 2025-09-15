import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true // 打开开发者工具
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 监听控制台消息
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('浏览器控制台错误:', msg.text());
    }
  });

  // 监听页面错误
  page.on('pageerror', error => {
    console.error('页面错误:', error.message);
  });

  // 监听响应
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`请求失败: ${response.url()} - 状态码: ${response.status()}`);
    }
  });

  try {
    console.log('开始调试分析功能...\n');
    
    // 1. 首先访问首页
    console.log('1. 访问首页...');
    await page.goto('http://localhost:5667/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 检查是否需要登录
    const needLogin = await page.locator('button:has-text("登录")').isVisible();
    if (needLogin) {
      console.log('   需要登录，使用默认账号...');
      await page.fill('input[placeholder*="账号"]', 'vben');
      await page.fill('input[placeholder*="密码"]', '123456');
      await page.locator('button:has-text("登录")').click();
      await page.waitForTimeout(3000);
    }
    
    // 2. 检查菜单
    console.log('\n2. 检查菜单结构...');
    const analyticsMenu = await page.locator('span:has-text("数据分析")').first();
    if (await analyticsMenu.isVisible()) {
      console.log('   ✅ 找到"数据分析"菜单');
      await analyticsMenu.click();
      await page.waitForTimeout(1000);
      
      // 查找数据概览子菜单
      const overviewMenu = await page.locator('span:has-text("数据概览")').first();
      if (await overviewMenu.isVisible()) {
        console.log('   ✅ 找到"数据概览"子菜单');
        await overviewMenu.click();
        await page.waitForTimeout(2000);
      } else {
        console.log('   ❌ 未找到"数据概览"子菜单');
      }
    } else {
      console.log('   ❌ 未找到"数据分析"菜单');
    }
    
    // 3. 检查当前URL
    console.log('\n3. 检查当前页面...');
    const currentUrl = page.url();
    console.log('   当前URL:', currentUrl);
    
    // 4. 直接导航到分析页面
    console.log('\n4. 直接访问分析页面...');
    await page.goto('http://localhost:5667/analytics/overview', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 检查是否404
    const is404 = await page.locator('text="404"').isVisible();
    if (is404) {
      console.log('   ❌ 页面返回404错误');
      
      // 检查可用的路由
      console.log('\n5. 尝试其他路由...');
      const testRoutes = [
        '/finance/dashboard',
        '/finance/transaction',
        '/dashboard/analytics',
        '/analytics',
      ];
      
      for (const route of testRoutes) {
        await page.goto(`http://localhost:5667${route}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        const hasError = await page.locator('text="404"').isVisible();
        console.log(`   ${route}: ${hasError ? '❌ 404' : '✅ 成功'}`);
      }
    } else {
      console.log('   ✅ 页面加载成功');
      
      // 检查组件是否加载
      console.log('\n6. 检查组件加载...');
      const components = [
        { selector: '.key-metrics-cards', name: '关键指标卡片' },
        { selector: '.ant-tabs', name: '标签页' },
        { selector: '.budget-comparison', name: '预算对比' },
        { selector: '.smart-insights', name: '智能洞察' },
        { selector: '.tag-cloud-analysis', name: '标签云' },
        { selector: '.time-dimension-analysis', name: '时间维度' },
      ];
      
      for (const comp of components) {
        const isVisible = await page.locator(comp.selector).isVisible();
        console.log(`   ${comp.name}: ${isVisible ? '✅' : '❌'}`);
      }
    }
    
    // 7. 获取页面内容检查
    console.log('\n7. 页面内容检查...');
    const pageTitle = await page.title();
    console.log('   页面标题:', pageTitle);
    
    const bodyText = await page.locator('body').textContent();
    if (bodyText.includes('数据概览')) {
      console.log('   ✅ 找到"数据概览"文本');
    }
    if (bodyText.includes('关键指标')) {
      console.log('   ✅ 找到"关键指标"相关内容');
    }
    
    // 截图
    await page.screenshot({ path: 'analytics-debug.png', fullPage: true });
    console.log('\n📸 调试截图已保存: analytics-debug.png');
    
  } catch (error) {
    console.error('\n❌ 调试过程中出错:', error);
    await page.screenshot({ path: 'error-debug.png' });
  } finally {
    console.log('\n按任意键关闭浏览器...');
    await page.waitForTimeout(10000); // 等待10秒让开发者查看
    await browser.close();
  }
})();