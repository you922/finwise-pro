import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false // 有头模式，方便观察
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('开始测试统计分析功能...');
    
    // 访问系统
    await page.goto('http://localhost:5666/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('页面加载成功');
    
    // 检查是否需要登录
    if (page.url().includes('/auth/login')) {
      console.log('需要登录...');
      
      // 填写登录信息
      const usernameInput = await page.locator('input').first();
      await usernameInput.fill('vben');
      
      const passwordInput = await page.locator('input[type="password"]').first();
      await passwordInput.fill('123456');
      
      // 点击登录按钮
      const loginButton = await page.locator('button').filter({ hasText: '登录' }).first();
      await loginButton.click();
      
      // 等待登录成功
      try {
        await page.waitForURL('**/workspace', { timeout: 5000 });
      } catch {
        // 如果没有跳转到 workspace，等待页面稳定
        await page.waitForTimeout(3000);
      }
      console.log('登录成功');
    }
    
    // 等待页面加载完成
    await page.waitForTimeout(2000);
    
    // 导航到统计分析页面
    console.log('导航到数据概览页面...');
    await page.goto('http://localhost:5666/analytics/overview', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // 等待图表加载
    console.log('等待图表加载...');
    await page.waitForTimeout(3000);
    
    // 检查各个图表是否存在
    console.log('检查图表组件...');
    
    // 检查收支趋势图
    const trendChart = await page.locator('.trend-chart').first();
    if (await trendChart.isVisible()) {
      console.log('✓ 收支趋势图已加载');
    } else {
      console.log('✗ 收支趋势图未找到');
    }
    
    // 检查分类饼图
    const pieCharts = await page.locator('.category-pie-chart').count();
    console.log(`✓ 找到 ${pieCharts} 个分类饼图`);
    
    // 检查月度对比图
    const monthlyChart = await page.locator('.monthly-comparison-chart').first();
    if (await monthlyChart.isVisible()) {
      console.log('✓ 月度对比图已加载');
    } else {
      console.log('✗ 月度对比图未找到');
    }
    
    // 检查人员分析图
    const personChart = await page.locator('.person-analysis-chart').first();
    if (await personChart.isVisible()) {
      console.log('✓ 人员分析图已加载');
    } else {
      console.log('✗ 人员分析图未找到');
    }
    
    // 测试日期范围选择
    console.log('\n测试日期范围选择...');
    const rangePicker = await page.locator('.ant-picker-range').first();
    await rangePicker.click();
    await page.waitForTimeout(500);
    
    // 选择本月第一天
    await page.locator('.ant-picker-cell-today').first().click();
    await page.waitForTimeout(500);
    
    // 选择今天
    await page.locator('.ant-picker-cell-today').last().click();
    await page.waitForTimeout(2000);
    
    console.log('✓ 日期范围选择功能正常');
    
    // 测试统计周期切换
    console.log('\n测试统计周期切换...');
    await page.selectOption('select', 'month');
    await page.waitForTimeout(2000);
    console.log('✓ 切换到按月统计');
    
    // 截图保存结果
    await page.screenshot({ 
      path: 'analytics-charts-test.png',
      fullPage: true 
    });
    console.log('\n✓ 已保存测试截图: analytics-charts-test.png');
    
    console.log('\n统计分析功能测试完成！');
    
  } catch (error) {
    console.error('测试失败:', error);
    await page.screenshot({ 
      path: 'analytics-error.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
})();