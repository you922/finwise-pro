import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('1. 直接访问分类统计页面（使用已登录的session）...');
    await page.goto('http://localhost:5666/finance/category-stats', { waitUntil: 'networkidle' });
    
    // 等待一下让页面完全加载
    await page.waitForTimeout(3000);
    
    // 检查是否在登录页面
    const currentUrl = page.url();
    console.log('当前URL:', currentUrl);
    
    if (currentUrl.includes('login')) {
      console.log('2. 需要登录，执行登录...');
      await page.fill('input[placeholder*="账号"]', 'admin');
      await page.fill('input[placeholder*="密码"]', '111111');
      await page.click('button:has-text("登录")');
      
      // 等待跳转
      await page.waitForTimeout(2000);
      
      // 重新访问分类统计页面
      await page.goto('http://localhost:5666/finance/category-stats', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
    }
    
    // 截图
    await page.screenshot({ path: 'category-stats-page.png', fullPage: true });
    console.log('页面截图已保存为 category-stats-page.png');
    
    // 检查页面标题或内容
    const pageContent = await page.content();
    
    if (pageContent.includes('总收入') || pageContent.includes('总支出')) {
      console.log('✅ 分类统计页面加载成功！');
    } else if (pageContent.includes('error') || pageContent.includes('Error')) {
      console.log('❌ 页面有错误');
    } else {
      console.log('⚠️  页面内容未知，请查看截图');
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
  }
})();