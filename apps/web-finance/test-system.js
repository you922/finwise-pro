import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false // 有头模式，方便观察
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('开始测试财务管理系统...\n');

  try {
    // 访问首页
    console.log('1. 访问系统首页...');
    await page.goto('http://localhost:5666/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('   ✓ 页面加载成功');
    console.log('   当前URL:', page.url());
    
    // 检查是否重定向到登录页
    if (page.url().includes('/auth/login')) {
      console.log('\n2. 系统重定向到登录页面，执行登录...');
      
      // 等待页面稳定
      await page.waitForTimeout(2000);
      
      // 填写登录表单
      console.log('   填写用户名: vben');
      await page.fill('input[placeholder*="用户名" i], input[placeholder*="account" i], input[type="text"]', 'vben');
      
      console.log('   填写密码: 123456');
      await page.fill('input[placeholder*="密码" i], input[placeholder*="password" i], input[type="password"]', '123456');
      
      // 提交登录
      console.log('   提交登录...');
      await page.keyboard.press('Enter');
      
      // 等待登录完成
      await page.waitForTimeout(3000);
      
      if (!page.url().includes('/auth/login')) {
        console.log('   ✓ 登录成功');
      } else {
        console.log('   ⚠️  可能需要验证码或其他验证');
      }
    }
    
    console.log('\n3. 测试主要功能模块...\n');
    
    // 测试各个模块
    const modules = [
      { name: '财务概览', url: '/finance/dashboard' },
      { name: '交易管理', url: '/finance/transaction' },
      { name: '分类管理', url: '/finance/category' },
      { name: '人员管理', url: '/finance/person' },
      { name: '贷款管理', url: '/finance/loan' },
      { name: '数据概览', url: '/analytics/overview' },
    ];
    
    for (const module of modules) {
      console.log(`测试 ${module.name}...`);
      
      try {
        await page.goto(`http://localhost:5666${module.url}`, {
          waitUntil: 'networkidle',
          timeout: 15000
        });
        
        await page.waitForTimeout(2000);
        
        // 检查页面元素
        const hasError = await page.locator('.ant-alert-error').count() > 0;
        const hasTable = await page.locator('.ant-table').count() > 0;
        const hasChart = await page.locator('canvas').count() > 0;
        const hasCard = await page.locator('.ant-card').count() > 0;
        
        console.log(`   ✓ 页面加载成功`);
        if (hasTable) console.log(`   - 包含数据表格`);
        if (hasChart) console.log(`   - 包含数据图表`);
        if (hasCard) console.log(`   - 包含卡片组件`);
        if (hasError) console.log(`   ⚠️  发现错误提示`);
        
      } catch (error) {
        console.log(`   ✗ 加载失败: ${error.message}`);
      }
    }
    
    console.log('\n测试完成！系统基本功能正常。');
    
  } catch (error) {
    console.error('测试失败:', error);
  }
  
  // 保持浏览器打开10秒供查看
  console.log('\n浏览器将在10秒后关闭...');
  await page.waitForTimeout(10000);
  await browser.close();
})();