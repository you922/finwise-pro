import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false // 有头模式，方便观察
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 收集所有控制台错误
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({
        url: page.url(),
        error: msg.text()
      });
    }
  });

  // 收集所有网络错误
  const networkErrors = [];
  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });

  try {
    console.log('开始测试所有菜单页面...\n');
    
    // 访问首页
    await page.goto('http://localhost:5666/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // 检查是否需要登录
    if (page.url().includes('/auth/login')) {
      console.log('执行登录...');
      
      // 填写登录信息
      const usernameInput = await page.locator('input').first();
      await usernameInput.fill('vben');
      
      const passwordInput = await page.locator('input[type="password"]').first();
      await passwordInput.fill('123456');
      
      // 点击登录按钮
      const loginButton = await page.locator('button').filter({ hasText: '登录' }).first();
      await loginButton.click();
      
      // 等待登录完成
      await page.waitForTimeout(3000);
      console.log('登录成功\n');
    }

    // 定义所有需要测试的菜单路径
    const menuPaths = [
      { name: '工作台', path: '/dashboard/workspace' },
      { name: '财务概览', path: '/finance/dashboard' },
      { name: '交易管理', path: '/finance/transaction' },
      { name: '分类管理', path: '/finance/category' },
      { name: '人员管理', path: '/finance/person' },
      { name: '贷款管理', path: '/finance/loan' },
      { name: '数据概览', path: '/analytics/overview' },
      { name: '趋势分析', path: '/analytics/trends' },
      { name: '导入数据', path: '/tools/import' },
      { name: '导出数据', path: '/tools/export' },
      { name: '数据备份', path: '/tools/backup' },
      { name: '预算管理', path: '/tools/budget' },
      { name: '标签管理', path: '/tools/tags' },
    ];

    // 逐个访问每个菜单
    for (const menu of menuPaths) {
      console.log(`\n测试菜单: ${menu.name}`);
      console.log(`访问路径: ${menu.path}`);
      
      try {
        // 访问页面
        await page.goto(`http://localhost:5666${menu.path}`, {
          waitUntil: 'networkidle',
          timeout: 20000
        });
        
        // 等待页面加载
        await page.waitForTimeout(2000);
        
        // 检查页面状态
        const pageTitle = await page.title();
        console.log(`✓ 页面标题: ${pageTitle}`);
        
        // 检查是否有错误提示
        const errorAlerts = await page.locator('.ant-alert-error').count();
        if (errorAlerts > 0) {
          console.log(`⚠️  发现 ${errorAlerts} 个错误提示`);
        }
        
        // 检查是否有空状态
        const emptyStates = await page.locator('.ant-empty').count();
        if (emptyStates > 0) {
          console.log(`ℹ️  发现 ${emptyStates} 个空状态组件`);
        }
        
        // 检查主要内容区域
        const mainContent = await page.locator('.ant-card, .page-main, main').first();
        if (await mainContent.isVisible()) {
          console.log('✓ 主要内容区域已加载');
        } else {
          console.log('✗ 主要内容区域未找到');
        }
        
        // 对特定页面进行额外检查
        if (menu.path.includes('/finance/')) {
          // 检查表格
          const tables = await page.locator('.ant-table').count();
          if (tables > 0) {
            console.log(`✓ 找到 ${tables} 个数据表格`);
          }
          
          // 检查操作按钮
          const buttons = await page.locator('button').count();
          console.log(`✓ 找到 ${buttons} 个操作按钮`);
        }
        
        if (menu.path.includes('/analytics/')) {
          // 检查图表
          const charts = await page.locator('canvas').count();
          if (charts > 0) {
            console.log(`✓ 找到 ${charts} 个图表`);
          }
        }
        
        // 截图保存
        await page.screenshot({ 
          path: `test-screenshots/${menu.path.replace(/\//g, '-')}.png`,
          fullPage: true 
        });
        
      } catch (error) {
        console.log(`✗ 访问失败: ${error.message}`);
      }
    }
    
    // 输出总结
    console.log('\n========== 测试总结 ==========');
    
    if (consoleErrors.length > 0) {
      console.log('\n控制台错误:');
      consoleErrors.forEach((err, index) => {
        console.log(`${index + 1}. [${err.url}] ${err.error}`);
      });
    } else {
      console.log('\n✓ 没有控制台错误');
    }
    
    if (networkErrors.length > 0) {
      console.log('\n网络错误:');
      networkErrors.forEach((err, index) => {
        console.log(`${index + 1}. [${err.status}] ${err.url}`);
      });
    } else {
      console.log('\n✓ 没有网络错误');
    }
    
    console.log('\n测试完成！截图已保存到 test-screenshots 目录');
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    // 等待用户查看
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();