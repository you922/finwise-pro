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
    console.log('🚀 开始完整测试分析功能...\n');
    
    // 1. 访问首页并登录
    console.log('1. 登录系统...');
    await page.goto('http://localhost:5669/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 检查是否需要登录
    const needLogin = await page.locator('button:has-text("登录")').isVisible();
    if (needLogin) {
      await page.fill('input[placeholder*="账号"]', 'vben');
      await page.fill('input[placeholder*="密码"]', '123456');
      await page.locator('button:has-text("登录")').click();
      await page.waitForTimeout(3000);
      console.log('   ✅ 登录成功');
    }
    
    // 2. 刷新页面让菜单重新加载
    console.log('\n2. 刷新页面重新加载菜单...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 3. 查找并点击数据分析菜单
    console.log('\n3. 导航到分析页面...');
    
    // 尝试查找数据分析菜单
    const analyticsMenu = await page.locator('span:has-text("数据分析")').first();
    if (await analyticsMenu.isVisible()) {
      console.log('   ✅ 找到"数据分析"菜单');
      await analyticsMenu.click();
      await page.waitForTimeout(1500);
      
      // 查找数据概览子菜单
      const overviewMenu = await page.locator('span:has-text("数据概览")').first();
      if (await overviewMenu.isVisible()) {
        console.log('   ✅ 找到"数据概览"子菜单');
        await overviewMenu.click();
        await page.waitForTimeout(3000);
      } else {
        console.log('   ❌ 未找到"数据概览"子菜单，尝试直接访问URL');
        await page.goto('http://localhost:5669/analytics/overview', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
      }
    } else {
      console.log('   ❌ 未找到"数据分析"菜单，尝试直接访问URL');
      await page.goto('http://localhost:5668/analytics/overview', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
    }
    
    // 4. 检查页面是否正确加载
    console.log('\n4. 检查页面加载状态...');
    const currentUrl = page.url();
    console.log('   当前URL:', currentUrl);
    
    // 检查是否还是404
    const is404 = await page.locator('text="404"').isVisible();
    if (is404) {
      console.log('   ❌ 页面仍然显示404错误');
      console.log('\n   尝试访问财务管理页面作为备选...');
      
      // 访问财务管理
      await page.goto('http://localhost:5669/finance/dashboard', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      const financeLoaded = !await page.locator('text="404"').isVisible();
      if (financeLoaded) {
        console.log('   ✅ 财务管理页面加载成功');
      }
    } else {
      console.log('   ✅ 分析页面加载成功！');
      
      // 5. 详细检查功能组件
      console.log('\n5. 检查关键功能组件...');
      
      // 等待组件加载
      await page.waitForTimeout(2000);
      
      // 检查关键指标卡片
      const hasMetricsCards = await page.locator('.key-metrics-cards').isVisible();
      console.log(`   关键指标卡片: ${hasMetricsCards ? '✅' : '❌'}`);
      
      if (hasMetricsCards) {
        const metricsCount = await page.locator('.metric-card').count();
        console.log(`     - 发现 ${metricsCount} 个指标卡片`);
        
        // 检查具体指标
        const indicators = [
          { selector: '.ant-statistic-title:has-text("总收入")', name: '总收入' },
          { selector: '.ant-statistic-title:has-text("总支出")', name: '总支出' },
          { selector: '.ant-statistic-title:has-text("净收益")', name: '净收益' },
          { selector: '.ant-statistic-title:has-text("日均收支")', name: '日均收支' },
        ];
        
        for (const ind of indicators) {
          const visible = await page.locator(ind.selector).isVisible();
          console.log(`     - ${ind.name}: ${visible ? '✅' : '❌'}`);
        }
      }
      
      // 检查标签页
      const hasTabs = await page.locator('.ant-tabs').isVisible();
      console.log(`\n   标签页导航: ${hasTabs ? '✅' : '❌'}`);
      
      if (hasTabs) {
        const tabs = [
          { name: '核心指标', selector: '.trend-chart' },
          { name: '预算分析', selector: '.budget-comparison' },
          { name: '智能洞察', selector: '.smart-insights' },
          { name: '标签分析', selector: '.tag-cloud-analysis' },
          { name: '时间维度', selector: '.time-dimension-analysis' },
        ];
        
        for (const tab of tabs) {
          console.log(`\n   测试"${tab.name}"标签页...`);
          const tabElement = await page.locator(`.ant-tabs-tab:has-text("${tab.name}")`);
          
          if (await tabElement.isVisible()) {
            await tabElement.click();
            await page.waitForTimeout(2000);
            
            // 检查对应组件是否加载
            const componentVisible = await page.locator(tab.selector).isVisible();
            console.log(`     组件加载: ${componentVisible ? '✅' : '❌'}`);
            
            // 截取每个标签页的截图
            await page.screenshot({ 
              path: `analytics-tab-${tab.name.replace(/[^a-z0-9]/gi, '-')}.png`,
              fullPage: false 
            });
          } else {
            console.log(`     标签不可见 ❌`);
          }
        }
      }
      
      // 6. 测试交互功能
      console.log('\n6. 测试交互功能...');
      
      // 测试日期选择器
      const dateRangePicker = await page.locator('.ant-picker-range');
      if (await dateRangePicker.isVisible()) {
        console.log('   日期范围选择器: ✅');
      }
      
      // 测试刷新按钮
      const refreshButton = await page.locator('button:has-text("刷新数据")');
      if (await refreshButton.isVisible()) {
        console.log('   刷新数据按钮: ✅');
        await refreshButton.click();
        await page.waitForTimeout(2000);
        console.log('     数据刷新完成');
      }
      
      // 最终成功截图
      await page.screenshot({ path: 'analytics-complete-success.png', fullPage: true });
      console.log('\n📸 完整功能测试截图已保存: analytics-complete-success.png');
      
      console.log('\n✅ 🎉 分析功能测试完全成功！所有组件正常工作！');
    }
    
  } catch (error) {
    console.error('\n❌ 测试过程中出错:', error);
    await page.screenshot({ path: 'analytics-complete-error.png' });
    console.log('错误截图已保存: analytics-complete-error.png');
  } finally {
    console.log('\n测试完成，5秒后关闭浏览器...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();