import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('访问分类统计页面...');
    await page.goto('http://localhost:5666/finance/category-stats');
    await page.waitForTimeout(5000);
    
    // 截图当前状态
    await page.screenshot({ path: 'current-state.png', fullPage: true });
    console.log('\n当前页面截图: current-state.png');
    
    console.log('\n测试快速日期选择按钮...');
    
    // 获取所有Radio.Group
    const quickDateGroup = page.locator('.ant-radio-group').nth(0); // 第一个是快速日期选择
    
    // 检查"本月"是否默认选中
    const monthChecked = await quickDateGroup.locator('.ant-radio-button-wrapper-checked').filter({ hasText: '本月' }).count();
    console.log('1. 本月按钮默认选中:', monthChecked > 0 ? '✅' : '❌');
    
    // 点击"本年"
    await quickDateGroup.locator('.ant-radio-button-wrapper').filter({ hasText: '本年' }).click();
    await page.waitForTimeout(2000);
    
    const yearChecked = await quickDateGroup.locator('.ant-radio-button-wrapper-checked').filter({ hasText: '本年' }).count();
    console.log('2. 切换到本年:', yearChecked > 0 ? '✅' : '❌');
    
    // 点击"今天"
    await quickDateGroup.locator('.ant-radio-button-wrapper').filter({ hasText: '今天' }).click();
    await page.waitForTimeout(2000);
    
    const todayChecked = await quickDateGroup.locator('.ant-radio-button-wrapper-checked').filter({ hasText: '今天' }).count();
    console.log('3. 切换到今天:', todayChecked > 0 ? '✅' : '❌');
    
    console.log('\n测试图表切换...');
    
    // 获取图表切换按钮组 (第三个Radio.Group)
    const chartGroup = page.locator('.ant-radio-group').nth(2);
    
    // 点击柱状图
    await chartGroup.locator('.ant-radio-button-wrapper').filter({ hasText: '柱状图' }).click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'bar-chart-view.png' });
    console.log('4. 柱状图视图: bar-chart-view.png');
    
    // 点击趋势图
    await chartGroup.locator('.ant-radio-button-wrapper').filter({ hasText: '趋势图' }).click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'trend-chart-view.png' });
    console.log('5. 趋势图视图: trend-chart-view.png');
    
    console.log('\n✅ 测试完成！');
    
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    await page.screenshot({ path: 'error-state.png' });
  } finally {
    await browser.close();
  }
})();