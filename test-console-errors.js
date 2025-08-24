import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // 监听控制台消息
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('浏览器错误:', msg.text());
    }
  });
  
  // 监听页面错误
  page.on('pageerror', error => {
    console.log('页面错误:', error.message);
  });
  
  try {
    console.log('访问分类统计页面...');
    await page.goto('http://localhost:5666/finance/category-stats');
    
    // 等待页面加载
    await page.waitForTimeout(5000);
    
    // 获取控制台错误
    const errors = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('.error-message, .ant-result-title');
      return Array.from(errorElements).map(el => el.textContent);
    });
    
    if (errors.length > 0) {
      console.log('页面错误信息:', errors);
    }
    
    // 截图
    await page.screenshot({ path: 'console-check.png' });
    console.log('截图保存为 console-check.png');
    
  } catch (error) {
    console.error('测试失败:', error.message);
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();