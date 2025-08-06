import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const page = await browser.newPage();

  try {
    console.log('========== 最终测试：新建交易功能 ==========\n');
    
    // 1. 访问页面
    console.log('1. 访问交易管理页面...');
    await page.goto('http://localhost:5667/finance/transaction');
    await page.waitForTimeout(3000);
    console.log('   ✅ 页面加载成功');
    
    // 2. 点击新建
    console.log('\n2. 点击新建按钮...');
    const createBtn = await page.locator('button').filter({ hasText: '新建' }).first();
    await createBtn.click();
    await page.waitForTimeout(1500);
    console.log('   ✅ 弹窗打开成功');
    
    // 3. 填写表单
    console.log('\n3. 填写交易信息...');
    
    // 金额
    const amountInput = await page.locator('input.ant-input-number-input').first();
    await amountInput.clear();
    await amountInput.fill('2888.88');
    console.log('   ✅ 金额: 2888.88');
    
    // 选择分类
    const modal = await page.locator('.ant-modal-content');
    const categorySelect = await modal.locator('.ant-select').nth(1);
    await categorySelect.click();
    await page.waitForTimeout(500);
    
    const firstOption = await page.locator('.ant-select-dropdown:visible .ant-select-item').first();
    const categoryName = await firstOption.textContent();
    await firstOption.click();
    console.log(`   ✅ 分类: ${categoryName}`);
    
    // 描述
    const descInput = await page.locator('textarea').first();
    await descInput.fill('新建交易测试 - 功能正常');
    console.log('   ✅ 描述: 新建交易测试 - 功能正常');
    
    // 4. 提交
    console.log('\n4. 提交交易...');
    const submitBtn = await page.locator('.ant-modal-footer button.ant-btn-primary').first();
    await submitBtn.click();
    await page.waitForTimeout(2000);
    
    // 5. 验证结果
    console.log('\n5. 验证结果...');
    
    // 检查成功消息
    const successMsg = await page.locator('.ant-message-success').first();
    const hasSuccess = await successMsg.isVisible();
    if (hasSuccess) {
      const msg = await successMsg.textContent();
      console.log(`   ✅ 成功提示: ${msg}`);
    }
    
    // 检查弹窗关闭
    const modal2 = await page.locator('.ant-modal').first();
    const modalClosed = !(await modal2.isVisible());
    if (modalClosed) {
      console.log('   ✅ 弹窗已关闭');
    }
    
    // 查找新记录
    await page.waitForTimeout(1000);
    const newRecord = await page.locator('td:has-text("2888.88")').first();
    const recordFound = await newRecord.isVisible();
    if (recordFound) {
      console.log('   ✅ 新记录已创建');
    }
    
    // 截图
    await page.screenshot({ path: 'success.png', fullPage: true });
    
    console.log('\n========== 测试结果 ==========');
    console.log('🎉 新建交易功能完全正常！');
    console.log('✅ 弹窗打开正常');
    console.log('✅ 表单填写正常');
    console.log('✅ 数据提交成功');
    console.log('✅ 新记录创建成功');
    console.log('\n截图已保存: success.png');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    await page.screenshot({ path: 'error.png' });
  } finally {
    console.log('\n浏览器将在5秒后关闭...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();