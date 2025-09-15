import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('访问系统...');
    await page.goto('http://localhost:5670');
    
    // 等待页面加载
    await page.waitForTimeout(5000);
    
    // 尝试获取当前URL
    console.log('当前URL:', page.url());
    
    // 如果在登录页，执行登录
    if (page.url().includes('login')) {
      console.log('需要登录...');
      
      // 等待登录表单出现
      await page.waitForSelector('input[type="text"]', { timeout: 5000 });
      
      // 使用更通用的选择器
      const usernameInput = await page.locator('input[type="text"]').first();
      const passwordInput = await page.locator('input[type="password"]').first();
      const loginButton = await page.locator('button[type="submit"]').first();
      
      await usernameInput.fill('admin');
      await passwordInput.fill('111111');
      await loginButton.click();
      
      await page.waitForTimeout(5000);
    }
    
    console.log('检查菜单...');
    
    // 获取所有菜单文本
    const menuTexts = await page.locator('.ant-menu-title-content').allTextContents();
    
    console.log('\n当前菜单:');
    menuTexts.forEach((text, i) => {
      console.log(`${i+1}. ${text}`);
    });
    
    // 截图
    await page.screenshot({ path: 'simple-menu-test.png', fullPage: true });
    console.log('\n截图: simple-menu-test.png');
    
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();