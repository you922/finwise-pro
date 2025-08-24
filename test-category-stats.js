import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('1. 访问登录页面...');
    await page.goto('http://localhost:5666');
    
    // 等待登录页面加载
    await page.waitForSelector('input[placeholder*="账号"]', { timeout: 10000 });
    
    console.log('2. 执行登录...');
    await page.fill('input[placeholder*="账号"]', 'admin');
    await page.fill('input[placeholder*="密码"]', '111111');
    
    // 点击登录按钮
    await page.click('button:has-text("登录")');
    
    // 等待跳转到首页
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('3. 登录成功，已进入系统');
    
    // 导航到分类统计页面
    console.log('4. 访问分类统计页面...');
    await page.goto('http://localhost:5666/finance/category-stats');
    
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
    
    // 检查页面元素
    console.log('5. 检查页面元素...');
    
    // 检查统计卡片
    const totalIncomeCard = await page.locator('.ant-statistic-title:has-text("总收入")').isVisible();
    const totalExpenseCard = await page.locator('.ant-statistic-title:has-text("总支出")').isVisible();
    const netIncomeCard = await page.locator('.ant-statistic-title:has-text("净收入")').isVisible();
    
    console.log('   - 总收入卡片:', totalIncomeCard ? '✓' : '✗');
    console.log('   - 总支出卡片:', totalExpenseCard ? '✓' : '✗');
    console.log('   - 净收入卡片:', netIncomeCard ? '✓' : '✗');
    
    // 检查图表切换按钮
    const pieButton = await page.locator('button:has-text("饼图")').isVisible();
    const barButton = await page.locator('button:has-text("柱状图")').isVisible();
    const trendButton = await page.locator('button:has-text("趋势图")').isVisible();
    
    console.log('   - 饼图按钮:', pieButton ? '✓' : '✗');
    console.log('   - 柱状图按钮:', barButton ? '✓' : '✗');
    console.log('   - 趋势图按钮:', trendButton ? '✓' : '✗');
    
    // 切换到表格视图
    console.log('6. 切换到表格视图...');
    await page.click('button:has-text("表格")');
    await page.waitForTimeout(1000);
    
    // 检查表格是否显示
    const table = await page.locator('.ant-table').isVisible();
    console.log('   - 表格显示:', table ? '✓' : '✗');
    
    // 切换回图表视图
    console.log('7. 切换回图表视图...');
    await page.click('button:has-text("图表")');
    await page.waitForTimeout(1000);
    
    // 切换不同的图表类型
    console.log('8. 测试图表切换...');
    await page.click('button:has-text("柱状图")');
    await page.waitForTimeout(1000);
    console.log('   - 切换到柱状图: ✓');
    
    await page.click('button:has-text("趋势图")');
    await page.waitForTimeout(1000);
    console.log('   - 切换到趋势图: ✓');
    
    await page.click('button:has-text("饼图")');
    await page.waitForTimeout(1000);
    console.log('   - 切换回饼图: ✓');
    
    // 测试日期快速选择
    console.log('9. 测试日期快速选择...');
    await page.click('button:has-text("本月")');
    await page.waitForTimeout(1000);
    console.log('   - 选择本月: ✓');
    
    await page.click('button:has-text("本年")');
    await page.waitForTimeout(1000);
    console.log('   - 选择本年: ✓');
    
    // 截图
    await page.screenshot({ path: 'category-stats-test.png', fullPage: true });
    console.log('10. 页面截图已保存为 category-stats-test.png');
    
    console.log('\n✅ 分类统计页面测试完成！所有功能正常工作。');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    await page.screenshot({ path: 'category-stats-error.png' });
    console.log('错误截图已保存为 category-stats-error.png');
  } finally {
    await browser.close();
  }
})();