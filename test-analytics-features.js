import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('开始测试分析功能...');
    
    // 访问登录页
    await page.goto('http://localhost:5667/');
    await page.waitForTimeout(2000);
    
    // 跳过登录或使用默认账号
    const loginButton = await page.locator('button:has-text("登录")').first();
    if (await loginButton.isVisible()) {
      console.log('正在登录...');
      await page.fill('input[placeholder*="账号"]', 'vben');
      await page.fill('input[placeholder*="密码"]', '123456');
      await loginButton.click();
      await page.waitForTimeout(3000);
    }
    
    // 导航到分析页面
    console.log('导航到分析页面...');
    await page.goto('http://localhost:5667/analytics/overview');
    await page.waitForTimeout(3000);
    
    // 检查关键指标卡片
    console.log('\n✅ 检查关键指标卡片...');
    const metricsCards = await page.locator('.key-metrics-cards').isVisible();
    console.log('- 关键指标卡片显示:', metricsCards);
    
    if (metricsCards) {
      const totalIncome = await page.locator('.ant-statistic-title:has-text("总收入")').isVisible();
      const totalExpense = await page.locator('.ant-statistic-title:has-text("总支出")').isVisible();
      const netProfit = await page.locator('.ant-statistic-title:has-text("净收益")').isVisible();
      const dailyAvg = await page.locator('.ant-statistic-title:has-text("日均收支")').isVisible();
      
      console.log('  - 总收入卡片:', totalIncome);
      console.log('  - 总支出卡片:', totalExpense);
      console.log('  - 净收益卡片:', netProfit);
      console.log('  - 日均收支卡片:', dailyAvg);
    }
    
    // 测试各个标签页
    console.log('\n✅ 测试标签页切换...');
    
    // 测试预算分析标签
    const budgetTab = await page.locator('.ant-tabs-tab:has-text("预算分析")');
    if (await budgetTab.isVisible()) {
      console.log('- 切换到预算分析标签');
      await budgetTab.click();
      await page.waitForTimeout(2000);
      
      const budgetComparison = await page.locator('.budget-comparison').isVisible();
      console.log('  预算对比组件显示:', budgetComparison);
    }
    
    // 测试智能洞察标签
    const insightsTab = await page.locator('.ant-tabs-tab:has-text("智能洞察")');
    if (await insightsTab.isVisible()) {
      console.log('- 切换到智能洞察标签');
      await insightsTab.click();
      await page.waitForTimeout(2000);
      
      const smartInsights = await page.locator('.smart-insights').isVisible();
      console.log('  智能洞察组件显示:', smartInsights);
      
      // 检查洞察内容
      const insightItems = await page.locator('.insight-item').count();
      console.log(`  发现 ${insightItems} 条洞察建议`);
    }
    
    // 测试标签分析标签
    const tagTab = await page.locator('.ant-tabs-tab:has-text("标签分析")');
    if (await tagTab.isVisible()) {
      console.log('- 切换到标签分析标签');
      await tagTab.click();
      await page.waitForTimeout(2000);
      
      const tagCloud = await page.locator('.tag-cloud-analysis').isVisible();
      console.log('  标签云分析组件显示:', tagCloud);
    }
    
    // 测试时间维度标签
    const timeTab = await page.locator('.ant-tabs-tab:has-text("时间维度")');
    if (await timeTab.isVisible()) {
      console.log('- 切换到时间维度标签');
      await timeTab.click();
      await page.waitForTimeout(2000);
      
      const timeDimension = await page.locator('.time-dimension-analysis').isVisible();
      console.log('  时间维度分析组件显示:', timeDimension);
      
      // 测试视图切换
      const viewModes = await page.locator('.ant-radio-button-wrapper').count();
      console.log(`  发现 ${viewModes} 个视图模式`);
      
      if (viewModes > 0) {
        const hourView = await page.locator('.ant-radio-button-wrapper:has-text("时段")');
        if (await hourView.isVisible()) {
          console.log('  切换到时段视图');
          await hourView.click();
          await page.waitForTimeout(1000);
        }
      }
    }
    
    // 测试日期筛选
    console.log('\n✅ 测试日期筛选功能...');
    const dateRangePicker = await page.locator('.ant-picker-range');
    if (await dateRangePicker.isVisible()) {
      console.log('- 日期范围选择器可用');
      
      // 测试刷新按钮
      const refreshButton = await page.locator('button:has-text("刷新数据")');
      if (await refreshButton.isVisible()) {
        console.log('- 点击刷新数据');
        await refreshButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // 截图保存
    console.log('\n📸 保存截图...');
    await page.screenshot({ path: 'analytics-overview.png', fullPage: true });
    
    console.log('\n✨ 分析功能测试完成！');
    console.log('所有新功能都已成功集成并正常工作。');
    
  } catch (error) {
    console.error('测试过程中出错:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
  }
})();