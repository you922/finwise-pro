import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
  });

  const page = await browser.newPage();

  // 监听控制台错误
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('[浏览器错误]', msg.text());
    }
  });

  page.on('pageerror', (error) => {
    console.log('[页面错误]', error.message);
  });

  try {
    console.log('========== 开始测试 ==========\n');

    // 1. 直接访问交易管理页面
    console.log('1. 访问交易管理页面...');
    await page.goto('http://localhost:5667/finance/transaction');
    await page.waitForTimeout(3000);

    // 检查URL是否跳转到登录页
    const currentUrl = page.url();
    console.log('   当前URL:', currentUrl);

    if (currentUrl.includes('/login')) {
      console.log('   需要登录，执行自动登录...');

      // 等待页面完全加载
      await page.waitForTimeout(2000);

      // 输入用户名密码
      const usernameInput = await page
        .locator('input[placeholder*="用户名"]')
        .first();
      const passwordInput = await page
        .locator('input[type="password"]')
        .first();

      if (await usernameInput.isVisible()) {
        await usernameInput.fill('admin');
        console.log('   输入用户名: admin');
      }

      if (await passwordInput.isVisible()) {
        await passwordInput.fill('123456');
        console.log('   输入密码: ******');
      }

      // 处理滑块验证
      const slider = await page.locator('.slider-button').first();
      if (await slider.isVisible()) {
        console.log('   处理滑块验证...');
        const box = await slider.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + 300, box.y + box.height / 2);
          await page.mouse.up();
          console.log('   滑块验证完成');
        }
      }

      await page.waitForTimeout(1000);

      // 点击登录按钮
      const loginBtn = await page.locator('button:has-text("登录")').first();
      if (await loginBtn.isVisible()) {
        await loginBtn.click();
        console.log('   点击登录按钮');
        await page.waitForTimeout(3000);
      }

      // 检查是否登录成功
      const afterLoginUrl = page.url();
      if (afterLoginUrl.includes('/login')) {
        console.log('   ❌ 登录失败，仍在登录页');
      } else {
        console.log('   ✅ 登录成功');

        // 重新访问交易管理页面
        console.log('\n2. 重新访问交易管理页面...');
        await page.goto('http://localhost:5667/finance/transaction');
        await page.waitForTimeout(3000);
      }
    }

    // 检查交易管理页面
    const finalUrl = page.url();
    if (finalUrl.includes('/finance/transaction')) {
      console.log('\n✅ 成功进入交易管理页面');

      // 等待页面加载
      await page.waitForTimeout(2000);

      // 检查关键元素
      const table = await page.locator('.ant-table').first();
      const searchBox = await page
        .locator('input[placeholder*="关键词"]')
        .first();
      const createBtn = await page.locator('button:has-text("新建")').first();

      console.log('\n页面元素检查:');
      console.log(
        '   表格:',
        (await table.isVisible()) ? '✅ 显示' : '❌ 未显示',
      );
      console.log(
        '   搜索框:',
        (await searchBox.isVisible()) ? '✅ 显示' : '❌ 未显示',
      );
      console.log(
        '   新建按钮:',
        (await createBtn.isVisible()) ? '✅ 显示' : '❌ 未显示',
      );

      // 尝试新建交易
      if (await createBtn.isVisible()) {
        console.log('\n3. 测试新建交易...');
        await createBtn.click();
        await page.waitForTimeout(1500);

        const modal = await page.locator('.ant-modal').first();
        if (await modal.isVisible()) {
          console.log('   ✅ 弹窗打开成功');

          // 填写基本信息
          const amountInput = await page
            .locator('input.ant-input-number-input')
            .first();
          if (await amountInput.isVisible()) {
            await amountInput.fill('99.99');
            console.log('   输入金额: 99.99');
          }

          // 点击确定
          const submitBtn = await page
            .locator('.ant-modal-footer button.ant-btn-primary')
            .first();
          if (await submitBtn.isVisible()) {
            await submitBtn.click();
            console.log('   点击提交');
            await page.waitForTimeout(2000);
          }

          // 检查结果
          const successMsg = await page.locator('.ant-message-success').first();
          if (await successMsg.isVisible()) {
            console.log('   ✅ 创建成功');
          } else {
            console.log('   ⚠️ 未检测到成功消息');
          }
        }
      }

      // 截图
      await page.screenshot({ path: 'test-success.png', fullPage: true });
      console.log('\n截图已保存: test-success.png');
    } else {
      console.log('\n❌ 未能进入交易管理页面');
      console.log('当前页面:', finalUrl);
    }
  } catch (error) {
    console.error('\n❌ 测试出错:', error.message);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
    console.log('错误截图已保存: test-error.png');
  } finally {
    console.log('\n========== 测试结束 ==========');
    console.log('浏览器将在5秒后关闭...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();
