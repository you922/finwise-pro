import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const page = await browser.newPage();
  
  // 只监听错误
  page.on('pageerror', error => {
    console.log('[页面错误]', error.message);
  });

  try {
    console.log('========== 测试新建交易 ==========\n');
    
    // 1. 访问页面
    console.log('1. 访问交易管理页面...');
    await page.goto('http://localhost:5667/finance/transaction');
    await page.waitForTimeout(3000);
    
    // 2. 点击新建
    console.log('2. 点击新建按钮...');
    const createBtn = await page.locator('button').filter({ hasText: '新建' }).first();
    await createBtn.click();
    await page.waitForTimeout(1500);
    
    // 3. 填写表单
    console.log('3. 填写交易信息...');
    
    // 金额
    const amountInput = await page.locator('input.ant-input-number-input').first();
    await amountInput.clear();
    await amountInput.fill('888.88');
    console.log('   金额: 888.88');
    
    // 选择分类
    const categorySelect = await page.locator('.ant-select').nth(1);
    await categorySelect.click();
    await page.waitForTimeout(500);
    
    const categoryOption = await page.locator('.ant-select-dropdown:visible .ant-select-item').first();
    if (await categoryOption.isVisible()) {
      await categoryOption.click();
      console.log('   分类: 已选择');
    }
    
    // 描述
    const descInput = await page.locator('textarea').first();
    if (await descInput.isVisible()) {
      await descInput.fill('测试交易 - ' + new Date().toLocaleTimeString());
      console.log('   描述: 已填写');
    }
    
    // 4. 提交
    console.log('4. 提交交易...');
    const submitBtn = await page.locator('.ant-modal-footer button.ant-btn-primary').first();
    await submitBtn.click();
    await page.waitForTimeout(2000);
    
    // 5. 检查结果
    console.log('5. 检查结果...');
    
    // 检查成功消息
    const successMsg = await page.locator('.ant-message-success').first();
    const hasSuccess = await successMsg.isVisible();
    
    // 检查弹窗是否关闭
    const modal = await page.locator('.ant-modal').first();
    const modalClosed = !(await modal.isVisible());
    
    // 检查新记录
    await page.waitForTimeout(1000);
    const newRecord = await page.locator('td:has-text("888.88")').first();
    const recordFound = await newRecord.isVisible();
    
    console.log('\n========== 测试结果 ==========');
    console.log(`✅ 弹窗打开: 成功`);
    console.log(`${hasSuccess ? '✅' : '❌'} 成功提示: ${hasSuccess ? '显示' : '未显示'}`);
    console.log(`${modalClosed ? '✅' : '❌'} 弹窗关闭: ${modalClosed ? '已关闭' : '未关闭'}`);
    console.log(`${recordFound ? '✅' : '❌'} 新记录: ${recordFound ? '已创建' : '未找到'}`);
    
    if (hasSuccess && modalClosed && recordFound) {
      console.log('\n🎉 新建交易功能正常！');
    } else {
      console.log('\n⚠️ 新建交易功能存在问题');
      await page.screenshot({ path: 'transaction-issue.png' });
      console.log('已保存截图: transaction-issue.png');
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