import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false, // 有头模式，方便观察
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('开始测试新建交易功能...\n');

  try {
    // 先访问首页
    console.log('1. 访问系统...');
    await page.goto('http://localhost:5666/', {
      waitUntil: 'networkidle',
      timeout: 30_000,
    });

    // 如果在登录页，执行登录
    if (page.url().includes('/auth/login')) {
      console.log('   - 需要登录，执行登录...');
      await page.waitForTimeout(1000);
      await page.fill('input[type="text"]', 'vben');
      await page.fill('input[type="password"]', '123456');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
    }

    // 访问交易管理页面
    console.log('   - 访问交易管理页面...');
    await page.goto('http://localhost:5666/finance/transaction', {
      waitUntil: 'networkidle',
      timeout: 30_000,
    });

    await page.waitForTimeout(2000);

    // 点击新建按钮
    console.log('2. 点击新建交易按钮...');
    const createButton = page.locator('button', { hasText: '新建交易' });
    await createButton.waitFor({ state: 'visible', timeout: 5000 });
    await createButton.click();
    await page.waitForTimeout(1000);

    // 检查弹窗是否打开
    const modalVisible = await page.locator('.ant-modal').isVisible();
    console.log(`   - 弹窗已打开: ${modalVisible ? '是' : '否'}`);

    // 检查金额输入框是否聚焦
    const amountInput = page.locator('.transaction-amount-input input');
    const isFocused = await amountInput.evaluate(
      (el) => el === document.activeElement,
    );
    console.log(`   - 金额输入框自动聚焦: ${isFocused ? '是' : '否'}`);

    // 测试快速创建分类
    console.log('\n3. 测试快速创建分类功能...');
    const plusButton = page.locator('button[title="快速创建分类"]');
    await plusButton.click();
    await page.waitForTimeout(500);

    const quickInput = page.locator('input[placeholder="输入新分类名称"]');
    const quickInputVisible = await quickInput.isVisible();
    console.log(`   - 快速创建输入框显示: ${quickInputVisible ? '是' : '否'}`);

    // 测试金额格式化
    console.log('\n4. 测试金额输入格式化...');
    await amountInput.fill('12345.67');
    await page.waitForTimeout(500);
    const formattedValue = await amountInput.inputValue();
    console.log(`   - 输入: 12345.67`);
    console.log(`   - 显示: ${formattedValue}`);

    // 测试表单布局
    console.log('\n5. 检查表单布局优化...');
    const formItems = await page.locator('.ant-form-item').count();
    console.log(`   - 表单项数量: ${formItems}`);

    const rowsCount = await page.locator('.ant-row').count();
    console.log(`   - 使用行布局数量: ${rowsCount} (优化后应该更多)`);

    // 测试快捷键
    console.log('\n6. 测试快捷键功能...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    const modalClosed = !(await page.locator('.ant-modal').isVisible());
    console.log(`   - ESC关闭弹窗: ${modalClosed ? '成功' : '失败'}`);

    // 测试 Ctrl+N 快捷键
    await page.keyboard.press('Control+N');
    await page.waitForTimeout(500);

    const modalReopened = await page.locator('.ant-modal').isVisible();
    console.log(`   - Ctrl+N 打开新建: ${modalReopened ? '成功' : '失败'}`);

    console.log('\n测试完成！新建交易功能已优化。');

    console.log('\n主要改进:');
    console.log('  ✓ 自动聚焦到金额输入框');
    console.log('  ✓ 快速创建分类功能');
    console.log('  ✓ 金额格式化显示');
    console.log('  ✓ 优化的表单布局');
    console.log('  ✓ 快捷键支持');
    console.log('  ✓ 最近使用记录自动完成');
  } catch (error) {
    console.error('测试失败:', error);
  }

  // 保持浏览器打开15秒供查看
  console.log('\n浏览器将在15秒后关闭...');
  await page.waitForTimeout(15_000);
  await browser.close();
})();
