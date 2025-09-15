import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('1. 访问系统...');
    await page.goto('http://localhost:5670');
    await page.waitForTimeout(3000);
    
    // 如果需要登录
    if (page.url().includes('login')) {
      console.log('2. 登录...');
      const usernameInput = await page.locator('input[type="text"]').first();
      const passwordInput = await page.locator('input[type="password"]').first();
      const loginButton = await page.locator('button[type="submit"]').first();
      
      await usernameInput.fill('admin');
      await passwordInput.fill('111111');
      await loginButton.click();
      await page.waitForTimeout(5000);
    }
    
    console.log('3. 展开侧边栏...');
    
    // 点击汉堡菜单图标展开侧边栏
    const menuToggle = await page.locator('[class*="menu-toggle"], [class*="sider-trigger"], .ant-layout-sider-trigger, [aria-label*="menu"]').first();
    if (await menuToggle.count() > 0) {
      await menuToggle.click();
      console.log('   已点击展开按钮');
      await page.waitForTimeout(2000);
    }
    
    // 再次尝试其他可能的展开按钮
    const possibleTriggers = [
      'button:has-text("☰")',
      'button[class*="hamburger"]',
      '[class*="collapsed"] button',
      '.ant-layout-sider-collapsed + .ant-layout-sider-trigger',
      '.vben-layout-header__menu-toggle'
    ];
    
    for (const selector of possibleTriggers) {
      const trigger = await page.locator(selector).first();
      if (await trigger.count() > 0 && await trigger.isVisible()) {
        console.log(`   找到展开按钮: ${selector}`);
        await trigger.click();
        await page.waitForTimeout(2000);
        break;
      }
    }
    
    console.log('4. 获取展开后的菜单...');
    
    // 获取所有菜单项文本
    const menuTexts = await page.locator('.ant-menu-title-content, [class*="menu-item"] span').allTextContents();
    
    console.log('\n当前菜单项:');
    console.log('===========');
    menuTexts.forEach((text, i) => {
      if (text.trim()) {
        console.log(`${i+1}. ${text}`);
      }
    });
    
    // 尝试获取带图标的菜单项
    const menuItems = await page.locator('.ant-menu-item, .ant-menu-submenu').evaluateAll(items => {
      return items.map(item => {
        const text = item.textContent?.trim() || '';
        const icon = item.querySelector('[class*="icon"]');
        const hasIcon = !!icon;
        return { text, hasIcon };
      }).filter(item => item.text);
    });
    
    console.log('\n菜单详情:');
    console.log('=========');
    menuItems.forEach((item, i) => {
      console.log(`${i+1}. ${item.text} ${item.hasIcon ? '[有图标]' : ''}`);
    });
    
    // 检查特定菜单
    const targetMenus = ['记一笔', '交易记录', '统计分析', '设置', '贷款管理', '系统工具'];
    console.log('\n目标菜单检查:');
    console.log('============');
    for (const menu of targetMenus) {
      const found = menuTexts.some(text => text.includes(menu)) || 
                   menuItems.some(item => item.text.includes(menu));
      console.log(`${found ? '✅' : '❌'} ${menu}`);
    }
    
    // 截图
    await page.screenshot({ path: 'expanded-menu.png', fullPage: true });
    console.log('\n截图保存: expanded-menu.png');
    
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();