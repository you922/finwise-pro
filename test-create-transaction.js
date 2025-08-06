import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const page = await browser.newPage();
  
  // 监听所有控制台消息
  page.on('console', msg => {
    console.log(`[${msg.type()}]`, msg.text());
  });

  page.on('pageerror', error => {
    console.log('[页面错误]', error.message);
  });

  // 监听网络请求
  page.on('response', response => {
    if (response.url().includes('/api/finance/transaction') && response.status() !== 200) {
      console.log('[API错误]', response.url(), response.status());
    }
  });

  try {
    console.log('========== 测试新建交易功能 ==========\n');
    
    // 1. 直接访问交易管理页面（开发模式会自动登录）
    console.log('1. 访问交易管理页面...');
    await page.goto('http://localhost:5667/finance/transaction');
    await page.waitForTimeout(3000);
    
    // 检查页面是否正常加载
    const table = await page.locator('.ant-table').first();
    if (await table.isVisible()) {
      console.log('   ✅ 页面加载成功\n');
    }
    
    // 2. 查找并点击新建按钮
    console.log('2. 查找新建按钮...');
    
    // 尝试多个可能的选择器
    let createBtn = await page.locator('button:has-text("新建交易")').first();
    if (!(await createBtn.isVisible())) {
      createBtn = await page.locator('button:has-text("新建")').first();
    }
    if (!(await createBtn.isVisible())) {
      createBtn = await page.locator('button:has-text("添加")').first();
    }
    if (!(await createBtn.isVisible())) {
      createBtn = await page.locator('button.ant-btn-primary').first();
    }
    
    if (await createBtn.isVisible()) {
      console.log('   ✅ 找到新建按钮');
      await createBtn.click();
      console.log('   点击新建按钮...');
      await page.waitForTimeout(1500);
    } else {
      console.log('   ❌ 未找到新建按钮');
      // 截图看看页面
      await page.screenshot({ path: 'no-create-button.png' });
      console.log('   已保存截图: no-create-button.png');
    }
    
    // 3. 检查弹窗是否打开
    console.log('\n3. 检查弹窗状态...');
    const modal = await page.locator('.ant-modal').first();
    const modalVisible = await modal.isVisible();
    
    if (modalVisible) {
      console.log('   ✅ 弹窗已打开');
      
      // 获取弹窗标题
      const modalTitle = await page.locator('.ant-modal-title').first();
      if (await modalTitle.isVisible()) {
        const title = await modalTitle.textContent();
        console.log('   弹窗标题:', title);
      }
      
      // 4. 检查表单字段
      console.log('\n4. 检查表单字段...');
      
      // 检查各个输入框
      const typeSelect = await page.locator('.ant-select').nth(0);
      const categorySelect = await page.locator('.ant-select').nth(1);
      const amountInput = await page.locator('input.ant-input-number-input').first();
      const dateInput = await page.locator('.ant-picker-input input').first();
      const descTextarea = await page.locator('textarea').first();
      
      console.log('   类型选择器:', await typeSelect.isVisible() ? '✅' : '❌');
      console.log('   分类选择器:', await categorySelect.isVisible() ? '✅' : '❌');
      console.log('   金额输入框:', await amountInput.isVisible() ? '✅' : '❌');
      console.log('   日期选择器:', await dateInput.isVisible() ? '✅' : '❌');
      console.log('   描述输入框:', await descTextarea.isVisible() ? '✅' : '❌');
      
      // 5. 尝试填写表单
      console.log('\n5. 填写表单...');
      
      // 选择类型
      if (await typeSelect.isVisible()) {
        await typeSelect.click();
        await page.waitForTimeout(500);
        const expenseOption = await page.locator('.ant-select-item:has-text("支出")').first();
        if (await expenseOption.isVisible()) {
          await expenseOption.click();
          console.log('   选择类型: 支出');
        }
      }
      
      // 选择分类
      if (await categorySelect.isVisible()) {
        await categorySelect.click();
        await page.waitForTimeout(500);
        const categoryOptions = await page.locator('.ant-select-dropdown:visible .ant-select-item');
        const optionCount = await categoryOptions.count();
        console.log(`   可选分类数: ${optionCount}`);
        
        if (optionCount > 0) {
          await categoryOptions.first().click();
          console.log('   选择了第一个分类');
        }
      }
      
      // 输入金额
      if (await amountInput.isVisible()) {
        await amountInput.clear();
        await amountInput.fill('999.99');
        console.log('   输入金额: 999.99');
      }
      
      // 输入描述
      if (await descTextarea.isVisible()) {
        await descTextarea.fill('测试新建交易功能');
        console.log('   输入描述: 测试新建交易功能');
      }
      
      // 6. 提交表单
      console.log('\n6. 提交表单...');
      const submitBtn = await page.locator('.ant-modal-footer button.ant-btn-primary').first();
      if (await submitBtn.isVisible()) {
        const btnText = await submitBtn.textContent();
        console.log('   提交按钮文本:', btnText);
        
        await submitBtn.click();
        console.log('   点击提交按钮...');
        await page.waitForTimeout(2000);
        
        // 检查是否有错误提示
        const errorMsg = await page.locator('.ant-message-error').first();
        if (await errorMsg.isVisible()) {
          const error = await errorMsg.textContent();
          console.log('   ❌ 错误:', error);
        }
        
        // 检查是否有成功提示
        const successMsg = await page.locator('.ant-message-success').first();
        if (await successMsg.isVisible()) {
          const success = await successMsg.textContent();
          console.log('   ✅ 成功:', success);
        }
        
        // 检查弹窗是否关闭
        const modalStillVisible = await modal.isVisible();
        if (!modalStillVisible) {
          console.log('   ✅ 弹窗已关闭');
        } else {
          console.log('   ⚠️ 弹窗仍然显示');
          
          // 可能有验证错误，截图
          await page.screenshot({ path: 'form-validation-error.png' });
          console.log('   已保存截图: form-validation-error.png');
        }
      }
      
    } else {
      console.log('   ❌ 弹窗未打开');
      // 截图看看页面状态
      await page.screenshot({ path: 'no-modal.png' });
      console.log('   已保存截图: no-modal.png');
    }
    
    // 最终截图
    await page.screenshot({ path: 'test-result.png', fullPage: true });
    console.log('\n最终截图: test-result.png');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: 'error.png' });
  } finally {
    console.log('\n========== 测试结束 ==========');
    console.log('浏览器将在10秒后关闭...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
})();