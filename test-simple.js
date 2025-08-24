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

    console.log('填写金额...');
    const amountInput = await page
      .locator('input.ant-input-number-input')
      .first();
    await amountInput.clear();
    await amountInput.fill('100');

    console.log('点击提交...');
    const submitBtn = await page
      .locator('button')
      .filter({ hasText: '确定' })
      .first();
    await submitBtn.click();

    console.log('等待结果...');
    await page.waitForTimeout(3000);

    console.log('测试完成！');
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    console.log('浏览器将保持打开10秒，请手动检查...');
    await page.waitForTimeout(10_000);
    await browser.close();
  }
})();
