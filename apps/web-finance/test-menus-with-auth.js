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
      const errorText = msg.text();
      // 忽略一些常见的无害错误
      if (!errorText.includes('validate error') && 
          !errorText.includes('ResizeObserver') &&
          !errorText.includes('Non-Error promise rejection')) {
        consoleErrors.push({
          url: page.url(),
          error: errorText
        });
      }
    }
  });

  try {
    console.log('开始测试所有菜单页面...\n');
    
    // 先访问一个内部页面来触发登录
    await page.goto('http://localhost:5666/finance/dashboard', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    // 处理登录
    if (page.url().includes('/auth/login')) {
      console.log('需要登录，正在处理...');
      
      // 等待页面稳定
      await page.waitForTimeout(2000);
      
      // 查找并填写用户名
      const usernameInput = await page.locator('input[type="text"]').first();
      await usernameInput.click();
      await usernameInput.fill('vben');
      
      // 查找并填写密码
      const passwordInput = await page.locator('input[type="password"]').first();
      await passwordInput.click();
      await passwordInput.fill('123456');
      
      // 提交表单
      await page.keyboard.press('Enter');
      
      // 等待登录处理
      await page.waitForTimeout(3000);
      
      // 检查是否登录成功
      if (!page.url().includes('/auth/login')) {
        console.log('✓ 登录成功\n');
      } else {
        console.log('⚠️  可能需要验证码，尝试点击登录按钮...');
        // 尝试找到并点击登录按钮
        const loginBtn = await page.locator('button').filter({ hasText: /登\s*录|Login/i }).first();
        if (await loginBtn.isVisible()) {
          await loginBtn.click();
          await page.waitForTimeout(3000);
        }
      }
    }

    // 定义所有需要测试的菜单路径
    const menuPaths = [
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

    console.log('开始逐个访问菜单...');
    
    // 逐个访问每个菜单
    for (const menu of menuPaths) {
      console.log(`\n===============================`);
      console.log(`测试菜单: ${menu.name}`);
      console.log(`访问路径: ${menu.path}`);
      
      try {
        // 访问页面
        const response = await page.goto(`http://localhost:5666${menu.path}`, {
          waitUntil: 'networkidle',
          timeout: 15000
        });
        
        // 等待页面加载
        await page.waitForTimeout(2000);
        
        // 检查是否被重定向到登录页
        if (page.url().includes('/auth/login')) {
          console.log('✗ 被重定向到登录页面');
          continue;
        }
        
        // 基本检查
        console.log(`✓ 页面加载成功`);
        console.log(`  当前URL: ${page.url()}`);
        
        // 检查页面元素
        const pageChecks = {
          '页面标题': await page.locator('h1, h2, .page-header-title').first().textContent().catch(() => '未找到'),
          '卡片组件': await page.locator('.ant-card').count(),
          '表格组件': await page.locator('.ant-table').count(),
          '表单组件': await page.locator('.ant-form').count(),
          '按钮数量': await page.locator('button').count(),
          '空状态': await page.locator('.ant-empty').count(),
        };
        
        // 输出检查结果
        for (const [key, value] of Object.entries(pageChecks)) {
          if (value !== '未找到' && value !== 0) {
            console.log(`  ${key}: ${value}`);
          }
        }
        
        // 特殊页面检查
        if (menu.path.includes('/analytics/')) {
          const charts = await page.locator('canvas, .echarts-container, [class*="chart"]').count();
          if (charts > 0) {
            console.log(`  ✓ 图表组件: ${charts} 个`);
          } else {
            console.log(`  ⚠️  未找到图表组件`);
          }
        }
        
        if (menu.path.includes('/finance/transaction')) {
          // 检查交易表格
          const rows = await page.locator('.ant-table-row').count();
          console.log(`  表格行数: ${rows}`);
        }
        
        // 检查是否有错误提示
        const errors = await page.locator('.ant-alert-error, .ant-message-error').count();
        if (errors > 0) {
          console.log(`  ⚠️  错误提示: ${errors} 个`);
        }
        
        // 截图
        await page.screenshot({ 
          path: `test-screenshots${menu.path.replace(/\//g, '-')}.png`,
          fullPage: false // 只截取可见区域
        });
        
      } catch (error) {
        console.log(`✗ 访问失败: ${error.message}`);
      }
    }
    
    // 输出总结
    console.log('\n===============================');
    console.log('测试总结');
    console.log('===============================');
    
    if (consoleErrors.length > 0) {
      console.log('\n控制台错误:');
      consoleErrors.forEach((err, index) => {
        console.log(`${index + 1}. [${err.url}]`);
        console.log(`   ${err.error}`);
      });
    } else {
      console.log('\n✓ 没有发现控制台错误');
    }
    
    console.log('\n✓ 测试完成！');
    console.log('截图已保存到 test-screenshots 目录');
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    // 等待用户查看
    await page.waitForTimeout(10000);
    await browser.close();
  }
})();