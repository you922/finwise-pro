import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('1. 访问分类统计页面...');
    await page.goto('http://localhost:5666/finance/category-stats', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 检查当前URL
    const currentUrl = page.url();
    console.log('当前URL:', currentUrl);
    
    if (currentUrl.includes('login')) {
      console.log('需要登录...');
      await page.fill('input[placeholder*="账号"]', 'admin');
      await page.fill('input[placeholder*="密码"]', '111111');
      await page.click('button:has-text("登录")');
      await page.waitForTimeout(2000);
      await page.goto('http://localhost:5666/finance/category-stats', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
    }
    
    console.log('\n2. 测试快速日期选择...');
    
    // 测试"本月"按钮选中状态
    const monthButtonClass = await page.locator('button:has-text("本月")').getAttribute('class');
    console.log('   - 本月按钮默认选中:', monthButtonClass?.includes('ant-radio-button-checked') ? '✓' : '✗');
    
    // 点击"本年"
    await page.click('button:has-text("本年")');
    await page.waitForTimeout(1000);
    const yearButtonClass = await page.locator('button:has-text("本年")').getAttribute('class');
    console.log('   - 本年按钮选中:', yearButtonClass?.includes('ant-radio-button-checked') ? '✓' : '✗');
    
    // 点击"今天"
    await page.click('button:has-text("今天")');
    await page.waitForTimeout(1000);
    const todayButtonClass = await page.locator('button:has-text("今天")').getAttribute('class');
    console.log('   - 今天按钮选中:', todayButtonClass?.includes('ant-radio-button-checked') ? '✓' : '✗');
    
    console.log('\n3. 测试图表切换和数据显示...');
    
    // 切换到柱状图
    await page.click('button:has-text("柱状图")');
    await page.waitForTimeout(2000);
    
    // 检查柱状图是否显示
    const barChartVisible = await page.locator('div[style*="height: 500px"]:visible canvas').count();
    console.log('   - 柱状图显示:', barChartVisible > 0 ? '✓' : '✗');
    
    // 截图柱状图
    await page.screenshot({ path: 'bar-chart.png' });
    console.log('   - 柱状图截图: bar-chart.png');
    
    // 切换到趋势图
    await page.click('button:has-text("趋势图")');
    await page.waitForTimeout(2000);
    
    // 检查趋势图是否显示
    const trendChartVisible = await page.locator('div[style*="height: 500px"]:visible canvas').count();
    console.log('   - 趋势图显示:', trendChartVisible > 0 ? '✓' : '✗');
    
    // 截图趋势图
    await page.screenshot({ path: 'trend-chart.png' });
    console.log('   - 趋势图截图: trend-chart.png');
    
    // 切换回饼图
    await page.click('button:has-text("饼图")');
    await page.waitForTimeout(2000);
    
    const pieChartVisible = await page.locator('div[style*="height: 500px"]:visible canvas').count();
    console.log('   - 饼图显示:', pieChartVisible > 0 ? '✓' : '✗');
    
    // 最终截图
    await page.screenshot({ path: 'final-category-stats.png', fullPage: true });
    console.log('\n✅ 测试完成！最终截图: final-category-stats.png');
    
  } catch (error) {
    console.error('测试失败:', error.message);
    await page.screenshot({ path: 'test-error.png' });
  } finally {
    await browser.close();
  }
})();