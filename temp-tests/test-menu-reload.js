import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    // 清除所有存储
    storageState: undefined
  });
  const page = await context.newPage();
  
  try {
    console.log('1. 清除缓存并访问系统...');
    
    // 先访问登录页
    await page.goto('http://localhost:5666/auth/login');
    await page.waitForTimeout(2000);
    
    console.log('2. 执行登录...');
    await page.fill('input[placeholder*="账号"]', 'admin');
    await page.fill('input[placeholder*="密码"]', '111111');
    await page.click('button:has-text("登录")');
    
    // 等待跳转
    await page.waitForTimeout(3000);
    
    console.log('3. 刷新页面以加载新菜单...');
    await page.reload();
    await page.waitForTimeout(3000);
    
    console.log('\n4. 检查新菜单结构...');
    
    // 展开所有折叠的菜单
    const collapsedMenus = await page.locator('.ant-layout-sider-collapsed').count();
    if (collapsedMenus > 0) {
      console.log('   展开侧边栏...');
      await page.click('.ant-layout-sider-trigger');
      await page.waitForTimeout(1000);
    }
    
    // 截图当前菜单状态
    await page.screenshot({ path: 'current-menu-state.png', fullPage: true });
    console.log('   当前菜单截图: current-menu-state.png');
    
    // 检查菜单文本
    const menuTexts = await page.locator('.ant-menu-title-content').allTextContents();
    console.log('\n5. 当前显示的菜单项:');
    menuTexts.forEach((text, index) => {
      console.log(`   ${index + 1}. ${text}`);
    });
    
    console.log('\n✅ 检查完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    await page.screenshot({ path: 'reload-error.png' });
  } finally {
    await browser.close();
  }
})();