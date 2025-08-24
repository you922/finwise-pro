import { chromium } from 'playwright';

(async () => {
  // 启动浏览器
  const browser = await chromium.launch({
    headless: false, // 使用有头模式方便观察
    slowMo: 500, // 减慢操作速度，方便观察
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  try {
    console.log('1. 访问系统...');
    await page.goto('http://localhost:5667');

    // 等待页面加载完成（通过等待某个元素出现）
    await page.waitForTimeout(3000);

    // 检查是否已自动登录
    const url = page.url();
    console.log('当前URL:', url);

    if (url.includes('/login')) {
      console.log('需要登录，执行登录操作...');
      // 如果还在登录页，说明自动登录没生效
      await page.waitForTimeout(1000);
    }

    // 导航到交易管理页面
    console.log('2. 导航到交易管理页面...');
    await page.goto('http://localhost:5667/finance/transaction');
    await page.waitForTimeout(2000);

    // 点击新建按钮
    console.log('3. 点击新建交易按钮...');
    const createButton = await page
      .locator('button:has-text("新建交易")')
      .first();
    await createButton.click();
    await page.waitForTimeout(1000);

    // 填写表单
    console.log('4. 填写交易表单...');

    // 选择交易类型（支出）
    await page.locator('.ant-select').first().click();
    await page.locator('.ant-select-item:has-text("支出")').click();
    await page.waitForTimeout(500);

    // 选择分类（等待分类加载）
    console.log('   选择分类...');
    await page.locator('.ant-select').nth(1).click();
    await page.waitForTimeout(500);
    const categoryOption = await page.locator('.ant-select-item').first();
    if (await categoryOption.isVisible()) {
      await categoryOption.click();
    }

    // 输入金额
    console.log('   输入金额...');
    await page.locator('input.ant-input-number-input').first().fill('299.99');

    // 选择货币
    console.log('   选择货币...');
    await page.locator('.ant-select').nth(2).click();
    await page.locator('.ant-select-item:has-text("CNY")').click();

    // 输入项目名称
    console.log('   输入项目名称...');
    const projectInput = await page.locator('input[placeholder*="项目"]');
    await projectInput.fill('测试项目');

    // 输入描述
    console.log('   输入描述...');
    const descTextarea = await page.locator('textarea[placeholder*="描述"]');
    await descTextarea.fill('这是通过Playwright自动测试创建的交易记录');

    // 提交表单
    console.log('5. 提交表单...');
    await page.locator('.ant-modal-footer button.ant-btn-primary').click();

    // 等待提交完成
    await page.waitForTimeout(2000);

    // 检查是否有成功提示
    const successMessage = await page.locator('.ant-message-success');
    if (await successMessage.isVisible()) {
      console.log('✅ 创建成功！');
    } else {
      console.log('⚠️ 未检测到成功消息，检查页面状态...');
    }

    // 验证新记录是否出现在列表中
    console.log('6. 验证新记录是否在列表中...');
    const newRecord = await page.locator('text=测试项目').first();
    if (await newRecord.isVisible()) {
      console.log('✅ 新记录已出现在列表中！');
    } else {
      console.log('⚠️ 未在列表中找到新记录');
    }

    console.log('\n测试完成！保持浏览器打开10秒供查看...');
    await page.waitForTimeout(10_000);
  } catch (error) {
    console.error('测试失败:', error);
    // 截图保存错误状态
    await page.screenshot({ path: 'test-error.png', fullPage: true });
    console.log('错误截图已保存为 test-error.png');
  } finally {
    await browser.close();
    console.log('浏览器已关闭');
  }
})();
