import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
  });

  const page = await browser.newPage();

  try {
    console.log('访问交易管理页面...');
    await page.goto('http://localhost:5667/finance/transaction');
    await page.waitForTimeout(3000);

    console.log('点击新建按钮...');
    const createBtn = await page
      .locator('button')
      .filter({ hasText: '新建' })
      .first();
    await createBtn.click();

    console.log('等待弹窗...');
    await page.waitForTimeout(2000);

    // 检查弹窗中的按钮
    console.log('\n检查弹窗按钮...');
    const modalFooterButtons = await page
      .locator('.ant-modal-footer button')
      .all();
    console.log(`找到 ${modalFooterButtons.length} 个按钮`);

    for (const [i, btn] of modalFooterButtons.entries()) {
      const text = await btn.textContent();
      const disabled = await btn.isDisabled();
      const classes = await btn.getAttribute('class');
      console.log(
        `按钮 ${i + 1}: 文本="${text}", 禁用=${disabled}, class="${classes}"`,
      );
    }

    // 填写必填字段
    console.log('\n填写必填字段...');

    // 1. 金额
    console.log('填写金额...');
    const amountInput = await page
      .locator('input.ant-input-number-input')
      .first();
    await amountInput.clear();
    await amountInput.fill('100');

    // 2. 选择分类 - 使用更精确的方式
    console.log('选择分类...');
    // 先找到分类的选择框（在弹窗内）
    const modal = await page.locator('.ant-modal-content');
    const categorySelect = await modal.locator('.ant-select').nth(1);
    await categorySelect.click();
    await page.waitForTimeout(500);

    // 选择第一个选项
    const firstOption = await page
      .locator('.ant-select-dropdown:visible .ant-select-item')
      .first();
    if (await firstOption.isVisible()) {
      const optionText = await firstOption.textContent();
      console.log(`选择分类: ${optionText}`);
      await firstOption.click();
      await page.waitForTimeout(500);
    }

    // 再次检查按钮状态
    console.log('\n填写后再次检查按钮...');
    const submitBtn = await page
      .locator('.ant-modal-footer button.ant-btn-primary')
      .first();
    if (await submitBtn.isVisible()) {
      const text = await submitBtn.textContent();
      const disabled = await submitBtn.isDisabled();
      console.log(`提交按钮: 文本="${text}", 禁用=${disabled}`);

      if (!disabled) {
        console.log('点击提交...');
        await submitBtn.click();
        await page.waitForTimeout(2000);

        // 检查是否有消息
        const successMsg = await page.locator('.ant-message-success');
        const errorMsg = await page.locator('.ant-message-error');

        if (await successMsg.isVisible()) {
          console.log('✅ 成功提示出现');
        }
        if (await errorMsg.isVisible()) {
          const error = await errorMsg.textContent();
          console.log('❌ 错误提示:', error);
        }
      }
    }
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    console.log('\n保持打开10秒供检查...');
    await page.waitForTimeout(10_000);
    await browser.close();
  }
})();
