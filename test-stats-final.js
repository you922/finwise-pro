import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('1. 访问分类统计页面...');
    await page.goto('http://localhost:5666/finance/category-stats');
    await page.waitForTimeout(5000); // 给更多时间加载
    
    // 检查是否需要登录
    if (page.url().includes('login')) {
      console.log('需要登录...');
      await page.fill('input[placeholder*="账号"]', 'admin');
      await page.fill('input[placeholder*="密码"]', '111111');
      await page.click('button:has-text("登录")');
      await page.waitForTimeout(3000);
      await page.goto('http://localhost:5666/finance/category-stats');
      await page.waitForTimeout(5000);
    }
    
    console.log('\n2. 检查页面元素...');
    
    // 等待页面完全加载
    await page.waitForSelector('.ant-card', { timeout: 10000 });
    
    // 检查快速选择按钮组
    const radioGroup = await page.locator('.ant-radio-group').first().isVisible();
    console.log('   - 快速选择按钮组:', radioGroup ? '✓' : '✗');
    
    // 检查选中状态（使用Ant Design的选中类）
    const checkedButton = await page.locator('.ant-radio-button-wrapper-checked').textContent();
    console.log('   - 当前选中:', checkedButton || '无');
    
    console.log('\n3. 测试快速日期切换...');
    
    // 点击"本年"
    const yearButton = page.locator('.ant-radio-button-wrapper').filter({ hasText: '本年' });
    await yearButton.click();
    await page.waitForTimeout(2000);
    
    const yearChecked = await page.locator('.ant-radio-button-wrapper-checked').filter({ hasText: '本年' }).count();
    console.log('   - 本年按钮选中:', yearChecked > 0 ? '✓' : '✗');
    
    // 点击"今天"
    const todayButton = page.locator('.ant-radio-button-wrapper').filter({ hasText: '今天' });
    await todayButton.click();
    await page.waitForTimeout(2000);
    
    const todayChecked = await page.locator('.ant-radio-button-wrapper-checked').filter({ hasText: '今天' }).count();
    console.log('   - 今天按钮选中:', todayChecked > 0 ? '✓' : '✗');
    
    console.log('\n4. 测试图表切换...');
    
    // 切换到柱状图
    await page.locator('.ant-radio-button-wrapper').filter({ hasText: '柱状图' }).click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-bar-chart.png' });
    console.log('   - 柱状图截图: test-bar-chart.png');
    
    // 切换到趋势图
    await page.locator('.ant-radio-button-wrapper').filter({ hasText: '趋势图' }).click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-trend-chart.png' });
    console.log('   - 趋势图截图: test-trend-chart.png');
    
    // 切换到表格视图
    await page.locator('.ant-radio-button-wrapper').filter({ hasText: '表格' }).click();
    await page.waitForTimeout(2000);
    
    const tableVisible = await page.locator('.ant-table').isVisible();
    console.log('   - 表格视图:', tableVisible ? '✓' : '✗');
    
    // 最终全页截图
    await page.screenshot({ path: 'category-stats-final.png', fullPage: true });
    console.log('\n✅ 所有测试完成！');
    
  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    await page.screenshot({ path: 'test-error-final.png' });
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();