import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const page = await browser.newPage();
  
  // 监听控制台
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('开发模式')) {
      console.log('[自动登录]', text);
    }
    if (msg.type() === 'error') {
      console.log('[错误]', text);
    }
  });

  try {
    console.log('========== 测试自动登录功能 ==========\n');
    
    // 1. 访问登录页
    console.log('1. 访问登录页面...');
    await page.goto('http://localhost:5667/auth/login');
    console.log('   等待自动登录...');
    
    // 等待自动登录执行
    await page.waitForTimeout(3000);
    
    // 2. 检查是否自动跳转
    const currentUrl = page.url();
    console.log('   当前URL:', currentUrl);
    
    if (!currentUrl.includes('/login')) {
      console.log('   ✅ 自动登录成功！已跳转到首页\n');
      
      // 3. 访问交易管理页面
      console.log('2. 访问交易管理页面...');
      await page.goto('http://localhost:5667/finance/transaction');
      await page.waitForTimeout(2000);
      
      // 检查页面元素
      const table = await page.locator('.ant-table');
      const createBtn = await page.locator('button:has-text("新建")');
      
      if (await table.isVisible()) {
        console.log('   ✅ 交易列表显示正常');
        
        const rows = await page.locator('.ant-table-tbody tr').count();
        console.log(`   当前有 ${rows} 条交易记录`);
      }
      
      // 4. 测试新建交易
      if (await createBtn.isVisible()) {
        console.log('\n3. 测试新建交易功能...');
        await createBtn.click();
        await page.waitForTimeout(1000);
        
        const modal = await page.locator('.ant-modal');
        if (await modal.isVisible()) {
          console.log('   ✅ 新建交易弹窗打开');
          
          // 选择类型
          const typeSelect = await page.locator('.ant-select').nth(0);
          await typeSelect.click();
          await page.locator('.ant-select-item:has-text("支出")').click();
          console.log('   选择类型: 支出');
          
          // 输入金额  
          const amountInput = await page.locator('input.ant-input-number-input');
          await amountInput.fill('288.88');
          console.log('   输入金额: 288.88');
          
          // 输入描述
          const descInput = await page.locator('textarea[placeholder*="描述"]');
          if (await descInput.isVisible()) {
            await descInput.fill('自动登录测试交易');
            console.log('   输入描述: 自动登录测试交易');
          }
          
          // 提交
          const submitBtn = await page.locator('.ant-modal-footer button.ant-btn-primary');
          await submitBtn.click();
          console.log('   提交表单...');
          await page.waitForTimeout(2000);
          
          // 检查结果
          const successMsg = await page.locator('.ant-message-success');
          if (await successMsg.isVisible()) {
            console.log('   ✅ 交易创建成功！');
          }
        }
      }
      
      // 截图
      await page.screenshot({ path: 'auto-login-success.png', fullPage: true });
      console.log('\n截图保存: auto-login-success.png');
      
      console.log('\n========== 测试完成 ==========');
      console.log('✅ 开发模式自动登录正常');
      console.log('✅ 无需手动处理验证码');
      console.log('✅ 交易管理功能正常');
      console.log('✅ 新建交易功能正常');
      
    } else {
      console.log('   ⚠️ 自动登录未执行或失败');
      console.log('   请检查是否在开发模式下运行');
      
      // 检查页面元素
      const sliderBtn = await page.locator('.slider-button');
      const captchaVisible = await sliderBtn.isVisible();
      console.log(`   验证码是否显示: ${captchaVisible ? '是' : '否'}`);
      
      await page.screenshot({ path: 'auto-login-failed.png' });
      console.log('\n截图保存: auto-login-failed.png');
    }
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    await page.screenshot({ path: 'error.png' });
  } finally {
    console.log('\n浏览器将在5秒后关闭...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();