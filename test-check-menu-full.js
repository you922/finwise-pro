import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('1. 访问系统...');
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
    
    console.log('3. 刷新页面加载最新菜单...');
    await page.reload();
    await page.waitForTimeout(3000);
    
    // 展开侧边栏
    const isCollapsed = await page.locator('.ant-layout-sider-collapsed').count();
    if (isCollapsed > 0) {
      console.log('   展开侧边栏...');
      await page.click('.ant-layout-sider-trigger');
      await page.waitForTimeout(1000);
    }
    
    console.log('\n4. 检查菜单结构...');
    
    // 获取所有可见的菜单项
    const menuItems = await page.locator('.ant-menu-item, .ant-menu-submenu').evaluateAll(elements => {
      return elements.map(el => {
        const titleEl = el.querySelector('.ant-menu-title-content');
        const iconEl = el.querySelector('.ant-menu-item-icon, .ant-menu-submenu-icon');
        const isSubmenu = el.classList.contains('ant-menu-submenu');
        const level = el.closest('.ant-menu-sub') ? 2 : 1;
        
        return {
          text: titleEl?.textContent?.trim() || '',
          hasIcon: !!iconEl,
          isSubmenu,
          level,
          visible: window.getComputedStyle(el).display !== 'none'
        };
      }).filter(item => item.text && item.visible);
    });
    
    console.log('\n当前菜单结构:');
    console.log('================');
    
    menuItems.forEach((item, index) => {
      const prefix = item.level === 2 ? '    └─ ' : '';
      const type = item.isSubmenu ? '[父菜单]' : '[菜单项]';
      const icon = item.hasIcon ? '✓' : '✗';
      console.log(`${prefix}${index + 1}. ${item.text} ${type} 图标:${icon}`);
    });
    
    console.log('\n期望的菜单顺序:');
    console.log('1. 记一笔 (快速记账)');
    console.log('2. 交易记录 (查看所有交易)');
    console.log('3. 统计分析 (各种报表)');
    console.log('4. 设置 (分类/预算/标签/人员)');
    console.log('5. 贷款管理');
    console.log('6. 系统工具 (导入导出等)');
    
    // 截图
    await page.screenshot({ path: 'menu-structure-check.png', fullPage: true });
    console.log('\n截图保存为: menu-structure-check.png');
    
    // 点击测试
    console.log('\n5. 测试菜单点击...');
    
    // 尝试点击"记一笔"
    const quickAddMenu = await page.locator('.ant-menu-item:has-text("记一笔")').count();
    if (quickAddMenu > 0) {
      console.log('   找到"记一笔"菜单，点击测试...');
      await page.click('.ant-menu-item:has-text("记一笔")');
      await page.waitForTimeout(2000);
      console.log('   当前URL:', page.url());
    } else {
      console.log('   ⚠️ 未找到"记一笔"菜单');
    }
    
    // 尝试点击"交易记录"  
    const transMenu = await page.locator('.ant-menu-item:has-text("交易记录")').count();
    if (transMenu > 0) {
      console.log('   找到"交易记录"菜单，点击测试...');
      await page.click('.ant-menu-item:has-text("交易记录")');
      await page.waitForTimeout(2000);
      console.log('   当前URL:', page.url());
    } else {
      console.log('   ⚠️ 未找到"交易记录"菜单');
    }
    
    console.log('\n✅ 检查完成！');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    await page.screenshot({ path: 'menu-error.png' });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();