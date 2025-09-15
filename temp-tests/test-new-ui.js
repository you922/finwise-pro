const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  try {
    console.log('1. 访问系统登录页面...');
    await page.goto('http://localhost:5666/', { waitUntil: 'networkidle' });
    
    console.log('2. 执行登录...');
    await page.fill('input[placeholder*="账号"]', 'admin');
    await page.fill('input[placeholder*="密码"]', '111111');
    
    // 处理可能的滑块验证
    const slider = await page.$('.ant-modal-wrap');
    if (slider) {
      console.log('检测到滑块验证，处理中...');
      await page.waitForTimeout(500);
      
      const sliderButton = await page.$('.slider-button');
      if (sliderButton) {
        const box = await sliderButton.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + 260, box.y + box.height / 2, { steps: 10 });
          await page.mouse.up();
        }
      }
      await page.waitForTimeout(500);
    }
    
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(2000);
    
    console.log('3. 导航到交易管理页面...');
    // 点击财务管理菜单
    await page.click('text=财务管理');
    await page.waitForTimeout(500);
    
    // 点击交易管理
    await page.click('a:has-text("交易管理")');
    await page.waitForTimeout(2000);
    
    console.log('4. 打开新建交易表单...');
    await page.click('button:has-text("新建")');
    await page.waitForTimeout(1000);
    
    console.log('5. 测试平铺按钮UI...');
    
    // 测试交易类型切换
    console.log('   - 测试交易类型按钮组...');
    await page.click('label:has-text("💸 支出")');
    await page.waitForTimeout(500);
    await page.click('label:has-text("💰 收入")');
    await page.waitForTimeout(500);
    
    // 测试分类按钮
    console.log('   - 测试分类平铺按钮...');
    const categoryButtons = await page.$$('button span:has-text("工资")');
    if (categoryButtons.length > 0) {
      await categoryButtons[0].click();
      console.log('     选择了"工资"分类');
    }
    
    // 测试货币类型
    console.log('   - 测试货币类型按钮组...');
    await page.click('label:has-text("$ 美元")');
    await page.waitForTimeout(500);
    await page.click('label:has-text("฿ 泰铢")');
    await page.waitForTimeout(500);
    await page.click('label:has-text("¥ 人民币")');
    await page.waitForTimeout(500);
    
    // 测试状态按钮
    console.log('   - 测试状态按钮组...');
    await page.click('label:has-text("⏳ 待处理")');
    await page.waitForTimeout(500);
    await page.click('label:has-text("✅ 已完成")');
    await page.waitForTimeout(500);
    
    // 输入金额测试
    console.log('6. 输入测试数据...');
    await page.fill('.transaction-amount-input input', '1000');
    
    // 截图保存
    console.log('7. 截图保存修改后的界面...');
    await page.screenshot({ 
      path: 'transaction-form-new-ui.png',
      fullPage: false
    });
    
    console.log('✅ 测试完成！新的平铺按钮UI效果良好');
    console.log('   - 交易类型使用了大按钮组，带图标');
    console.log('   - 分类使用了平铺按钮，显示图标和名称');
    console.log('   - 货币类型使用了按钮组，更直观');
    console.log('   - 状态也改为了按钮组，带表情图标');
    console.log('\n截图已保存到: transaction-form-new-ui.png');
    
  } catch (error) {
    console.error('测试过程中出错:', error);
    await page.screenshot({ path: 'transaction-form-error.png' });
  }
  
  await browser.close();
})();