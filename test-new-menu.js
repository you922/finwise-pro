import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('1. 访问系统...');
    await page.goto('http://localhost:5666');
    await page.waitForTimeout(3000);
    
    // 检查是否需要登录
    if (page.url().includes('login')) {
      console.log('2. 执行登录...');
      await page.fill('input[placeholder*="账号"]', 'admin');
      await page.fill('input[placeholder*="密码"]', '111111');
      await page.click('button:has-text("登录")');
      await page.waitForTimeout(3000);
    }
    
    console.log('\n3. 检查新菜单结构...');
    
    // 检查一级菜单是否存在
    const menuItems = [
      { text: '仪表板', exists: false },
      { text: '记一笔', exists: false },
      { text: '交易记录', exists: false },
      { text: '统计分析', exists: false },
      { text: '设置', exists: false },
      { text: '贷款管理', exists: false },
      { text: '系统工具', exists: false }
    ];
    
    for (const item of menuItems) {
      const menuItem = await page.locator(`.ant-menu-item:has-text("${item.text}"), .ant-menu-submenu:has-text("${item.text}")`).count();
      item.exists = menuItem > 0;
      console.log(`   - ${item.text}: ${item.exists ? '✅' : '❌'}`);
    }
    
    console.log('\n4. 测试"记一笔"快速记账...');
    const quickAddMenu = page.locator('.ant-menu-item:has-text("记一笔")');
    if (await quickAddMenu.count() > 0) {
      await quickAddMenu.click();
      await page.waitForTimeout(2000);
      
      // 检查是否弹出了新建交易窗口
      const modalVisible = await page.locator('.ant-modal').isVisible();
      console.log(`   - 新建交易窗口: ${modalVisible ? '✅ 已弹出' : '❌ 未弹出'}`);
      
      if (modalVisible) {
        // 关闭弹窗
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    } else {
      console.log('   - ❌ 未找到"记一笔"菜单');
    }
    
    console.log('\n5. 检查"统计分析"子菜单...');
    const statsMenu = page.locator('.ant-menu-submenu:has-text("统计分析")');
    if (await statsMenu.count() > 0) {
      await statsMenu.click();
      await page.waitForTimeout(1000);
      
      const subMenus = ['分类统计', '趋势分析', '月度报表', '年度总结'];
      for (const subMenu of subMenus) {
        const exists = await page.locator(`.ant-menu-item:has-text("${subMenu}")`).count() > 0;
        console.log(`   - ${subMenu}: ${exists ? '✅' : '❌'}`);
      }
    } else {
      console.log('   - ❌ 未找到"统计分析"菜单');
    }
    
    console.log('\n6. 检查是否去掉了"财务管理"二级菜单...');
    const financeMenu = await page.locator('.ant-menu-submenu:has-text("财务管理")').count();
    console.log(`   - 财务管理菜单: ${financeMenu === 0 ? '✅ 已移除' : '❌ 仍存在'}`);
    
    // 截图
    await page.screenshot({ path: 'new-menu-structure.png', fullPage: true });
    console.log('\n✅ 测试完成！截图保存为: new-menu-structure.png');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    await page.screenshot({ path: 'menu-test-error.png' });
  } finally {
    await browser.close();
  }
})();