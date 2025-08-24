import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 监听控制台错误
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('浏览器控制台错误:', msg.text());
    }
  });

  try {
    console.log('🚀 开始测试新的分析功能...\n');
    
    // 1. 访问首页并登录
    console.log('1. 登录系统...');
    await page.goto('http://localhost:5668/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const needLogin = await page.locator('button:has-text("登录")').isVisible();
    if (needLogin) {
      await page.fill('input[placeholder*="账号"]', 'vben');
      await page.fill('input[placeholder*="密码"]', '123456');
      await page.locator('button:has-text("登录")').click();
      await page.waitForTimeout(3000);
      console.log('   ✅ 登录成功');
    }
    
    // 2. 导航到分析页面
    console.log('\n2. 导航到分析页面...');
    
    // 尝试通过菜单导航
    const analyticsMenu = await page.locator('span:has-text("数据分析")').first();
    if (await analyticsMenu.isVisible()) {
      console.log('   点击数据分析菜单');
      await analyticsMenu.click();
      await page.waitForTimeout(1000);
      
      const overviewMenu = await page.locator('span:has-text("数据概览")').first();
      if (await overviewMenu.isVisible()) {
        console.log('   点击数据概览子菜单');
        await overviewMenu.click();
        await page.waitForTimeout(3000);
      }
    } else {
      // 直接导航
      console.log('   直接访问分析页面URL');
      await page.goto('http://localhost:5668/analytics/overview', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
    }
    
    // 3. 检查页面是否正确加载
    console.log('\n3. 检查页面加载状态...');
    const currentUrl = page.url();
    console.log('   当前URL:', currentUrl);
    
    const is404 = await page.locator('text="404"').isVisible();
    if (is404) {
      console.log('   ❌ 页面显示404错误');
      
      // 截图保存错误状态
      await page.screenshot({ path: 'analytics-404-error.png', fullPage: true });
      console.log('   错误截图已保存: analytics-404-error.png');
      
      // 尝试返回首页再重新导航
      console.log('\n4. 尝试从首页重新导航...');
      await page.goto('http://localhost:5668/workspace', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
    } else {
      console.log('   ✅ 页面加载成功');
      
      // 4. 检查关键功能组件
      console.log('\n4. 检查关键功能组件...');
      
      // 检查关键指标卡片
      const hasMetricsCards = await page.locator('.key-metrics-cards').isVisible();
      console.log(`   关键指标卡片: ${hasMetricsCards ? '✅' : '❌'}`);
      
      if (hasMetricsCards) {
        const metricsCount = await page.locator('.metric-card').count();
        console.log(`     - 发现 ${metricsCount} 个指标卡片`);
      }
      
      // 检查标签页
      const hasTabs = await page.locator('.ant-tabs').isVisible();
      console.log(`   标签页导航: ${hasTabs ? '✅' : '❌'}`);
      
      if (hasTabs) {
        const tabCount = await page.locator('.ant-tabs-tab').count();
        console.log(`     - 发现 ${tabCount} 个标签页`);
        
        // 测试每个标签页
        const tabs = [
          { name: '预算分析', selector: '.budget-comparison' },
          { name: '智能洞察', selector: '.smart-insights' },
          { name: '标签分析', selector: '.tag-cloud-analysis' },
          { name: '时间维度', selector: '.time-dimension-analysis' },
        ];
        
        for (const tab of tabs) {
          const tabElement = await page.locator(`.ant-tabs-tab:has-text("${tab.name}")`);
          if (await tabElement.isVisible()) {
            console.log(`\n   测试 ${tab.name} 标签页...`);
            await tabElement.click();
            await page.waitForTimeout(2000);
            
            const componentVisible = await page.locator(tab.selector).isVisible();
            console.log(`     组件显示: ${componentVisible ? '✅' : '❌'}`);
          }
        }
      }
      
      // 5. 测试数据刷新功能
      console.log('\n5. 测试数据刷新...');
      const refreshButton = await page.locator('button:has-text("刷新数据")');
      if (await refreshButton.isVisible()) {
        console.log('   点击刷新按钮');
        await refreshButton.click();
        await page.waitForTimeout(2000);
        console.log('   ✅ 数据刷新完成');
      }
      
      // 成功截图
      await page.screenshot({ path: 'analytics-success.png', fullPage: true });
      console.log('\n📸 功能测试截图已保存: analytics-success.png');
    }
    
    console.log('\n✨ 测试完成！');
    
  } catch (error) {
    console.error('\n❌ 测试过程中出错:', error);
    await page.screenshot({ path: 'analytics-error.png' });
    console.log('错误截图已保存: analytics-error.png');
  } finally {
    await page.waitForTimeout(5000); // 等待5秒让用户查看
    await browser.close();
  }
})();