import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    // 完全清除缓存
    storageState: undefined
  });
  const page = await context.newPage();
  
  try {
    console.log('1. 清除所有缓存，重新登录...');
    
    // 直接访问登录页
    await page.goto('http://localhost:5670/auth/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    console.log('2. 执行登录...');
    await page.fill('input[placeholder*="账号"]', 'admin');
    await page.fill('input[placeholder*="密码"]', '111111');
    await page.click('button:has-text("登录")');
    
    // 等待登录完成并跳转
    await page.waitForURL('**/workspace', { timeout: 10000 }).catch(() => {
      console.log('   等待workspace页面超时，继续...');
    });
    await page.waitForTimeout(3000);
    
    console.log('3. 检查侧边栏状态...');
    
    // 展开侧边栏（如果是折叠的）
    const trigger = await page.locator('.ant-layout-sider-trigger').count();
    if (trigger > 0) {
      const isCollapsed = await page.locator('.ant-layout-sider-collapsed').count();
      if (isCollapsed > 0) {
        console.log('   展开侧边栏...');
        await page.click('.ant-layout-sider-trigger');
        await page.waitForTimeout(1000);
      }
    }
    
    console.log('\n4. 获取菜单信息...');
    
    // 获取所有菜单项
    const allMenus = await page.locator('.ant-menu .ant-menu-title-content').allTextContents();
    
    console.log('\n所有菜单项（按显示顺序）:');
    console.log('========================');
    allMenus.forEach((text, index) => {
      console.log(`${index + 1}. ${text}`);
    });
    
    // 分类检查
    console.log('\n菜单分类检查:');
    console.log('-------------');
    
    const expectedMenus = [
      '记一笔',
      '交易记录', 
      '统计分析',
      '设置',
      '贷款管理',
      '系统工具'
    ];
    
    for (const menuName of expectedMenus) {
      const found = allMenus.includes(menuName);
      console.log(`${found ? '✅' : '❌'} ${menuName}`);
    }
    
    // 获取更详细的菜单信息
    const detailedMenus = await page.locator('.ant-menu-item, .ant-menu-submenu').evaluateAll(elements => {
      return elements.map(el => {
        const titleEl = el.querySelector('.ant-menu-title-content');
        const isActive = el.classList.contains('ant-menu-item-selected');
        const isSubmenu = el.classList.contains('ant-menu-submenu');
        const path = el.querySelector('a')?.getAttribute('href') || '';
        
        return {
          text: titleEl?.textContent?.trim() || '',
          isActive,
          isSubmenu,
          path,
          classes: Array.from(el.classList).join(' ')
        };
      }).filter(item => item.text);
    });
    
    console.log('\n详细菜单信息:');
    console.log('============');
    detailedMenus.forEach(menu => {
      console.log(`- ${menu.text}`);
      console.log(`  类型: ${menu.isSubmenu ? '父菜单' : '菜单项'}`);
      if (menu.path) console.log(`  路径: ${menu.path}`);
      if (menu.isActive) console.log(`  状态: 激活`);
    });
    
    // 截图
    await page.screenshot({ path: 'menu-after-clear-cache.png', fullPage: true });
    console.log('\n截图保存为: menu-after-clear-cache.png');
    
    console.log('\n✅ 完成！');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    await page.screenshot({ path: 'cache-clear-error.png' });
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();