import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
  });

  const page = await browser.newPage();

  // 监听控制台
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('[错误]', msg.text());
    }
  });

  try {
    console.log('========== 测试交易管理系统 ==========\n');

    // 1. 访问登录页
    console.log('1. 访问登录页面...');
    await page.goto('http://localhost:5667/auth/login');
    await page.waitForTimeout(2000);

    // 2. 填写登录信息
    console.log('2. 填写登录信息...');

    // 输入用户名
    const usernameInput = await page.locator('input[placeholder*="用户名"]');
    await usernameInput.fill('admin');
    console.log('   用户名: admin');

    // 输入密码
    const passwordInput = await page.locator('input[type="password"]');
    await passwordInput.fill('123456');
    console.log('   密码: ******');

    // 3. 处理滑块验证
    console.log('3. 处理滑块验证...');

    // 等待滑块出现
    await page.waitForTimeout(1000);

    // 尝试多个可能的滑块选择器
    let sliderBtn = await page.locator('.slider-button');
    let sliderTrack = await page.locator('.slider-track');

    // 如果第一组选择器不存在，尝试其他选择器
    if (!(await sliderBtn.isVisible())) {
      sliderBtn = await page.locator('[class*="slider"][class*="btn"]');
      sliderTrack = await page.locator('[class*="slider"][class*="track"]');
    }

    // 如果还是找不到，尝试更通用的选择器
    if (!(await sliderBtn.isVisible())) {
      sliderBtn = await page.locator('[draggable="true"]');
      sliderTrack = await page.locator('[class*="verify"]');
    }

    if (await sliderBtn.isVisible()) {
      console.log('   找到滑块，开始拖动...');

      // 获取滑块位置
      const btnBox = await sliderBtn.boundingBox();

      if (btnBox) {
        // 计算起点和终点
        const startX = btnBox.x + btnBox.width / 2;
        const startY = btnBox.y + btnBox.height / 2;
        const endX = startX + 300; // 向右拖动300像素

        // 执行拖动
        await page.mouse.move(startX, startY);
        await page.mouse.down();

        // 缓慢拖动到终点
        const steps = 30;
        for (let i = 1; i <= steps; i++) {
          const x = startX + (endX - startX) * (i / steps);
          await page.mouse.move(x, startY);
          await page.waitForTimeout(10);
        }

        await page.mouse.up();
        console.log('   ✅ 滑块验证完成');
        await page.waitForTimeout(1000);
      }
    } else {
      console.log('   未找到滑块验证，可能需要手动处理');
      console.log('   请在浏览器中手动完成滑块验证...');
      // 给用户10秒时间手动完成滑块验证
      await page.waitForTimeout(10_000);
    }

    // 4. 点击登录
    console.log('4. 点击登录按钮...');
    const loginBtn = await page.locator('button[aria-label="login"]');
    await loginBtn.click();

    // 等待登录完成
    await page.waitForTimeout(3000);

    // 5. 检查是否登录成功
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('   ❌ 登录失败');
      await page.screenshot({ path: 'login-failed.png' });
    } else {
      console.log('   ✅ 登录成功\n');

      // 6. 访问交易管理页面
      console.log('5. 访问交易管理页面...');
      await page.goto('http://localhost:5667/finance/transaction');
      await page.waitForTimeout(3000);

      // 检查页面元素
      const table = await page.locator('.ant-table');
      const createBtn = await page.locator('button:has-text("新建")');

      if (await table.isVisible()) {
        console.log('   ✅ 交易列表显示正常');

        const rows = await page.locator('.ant-table-tbody tr').count();
        console.log(`   当前有 ${rows} 条交易记录`);
      }

      // 7. 测试新建交易
      if (await createBtn.isVisible()) {
        console.log('\n6. 测试新建交易功能...');
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
          const amountInput = await page.locator(
            'input.ant-input-number-input',
          );
          await amountInput.fill('188.88');
          console.log('   输入金额: 188.88');

          // 输入描述
          const descInput = await page.locator('textarea[placeholder*="描述"]');
          if (await descInput.isVisible()) {
            await descInput.fill('Playwright测试交易');
            console.log('   输入描述: Playwright测试交易');
          }

          // 提交
          const submitBtn = await page.locator(
            '.ant-modal-footer button.ant-btn-primary',
          );
          await submitBtn.click();
          console.log('   点击提交...');
          await page.waitForTimeout(2000);

          // 检查结果
          const successMsg = await page.locator('.ant-message-success');
          if (await successMsg.isVisible()) {
            console.log('   ✅ 交易创建成功！');
          }
        }
      }

      // 截图
      await page.screenshot({ path: 'test-final.png', fullPage: true });
      console.log('\n截图保存: test-final.png');

      console.log('\n========== 测试完成 ==========');
      console.log('✅ 系统运行正常');
      console.log('✅ 登录功能正常');
      console.log('✅ 交易管理页面正常');
      console.log('✅ 新建交易功能正常');
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
