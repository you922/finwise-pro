import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('1. 访问新端口的系统...');
    await page.goto('http://localhost:5670');
    await page.waitForTimeout(3000);
    
    // 检查是否需要登录
    if (page.url().includes('login')) {
      console.log('2. 执行登录...');
      await page.fill('input[placeholder*="账号"]', 'admin');
      await page.fill('input[placeholder*="密码"]', '111111');
      await page.click('button:has-text("登录")');
      await page.waitForTimeout(5000);
    }
    
    console.log('3. 检查菜单结构...');
    
    // 获取所有菜单文本
    const menuTexts = await page.locator('.ant-menu-title-content').allTextContents();
    console.log('\n当前菜单项:');
    menuTexts.forEach((text, index) => {
      console.log(`   ${index + 1}. ${text}`);
    });
    
    // 截图
    await page.screenshot({ path: 'final-menu-structure.png', fullPage: true });
    console.log('\n截图保存为: final-menu-structure.png');
    
    console.log('\n✅ 完成！');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    await page.screenshot({ path: 'final-error.png' });
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();