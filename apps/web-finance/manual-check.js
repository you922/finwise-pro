import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false, // 有头模式
    devtools: true, // 打开开发者工具
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  // 监听控制台消息
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('❌ 控制台错误:', msg.text());
    } else if (msg.type() === 'warning') {
      console.log('⚠️  控制台警告:', msg.text());
    }
  });

  // 监听页面崩溃
  page.on('crash', () => {
    console.log('💥 页面崩溃了!');
  });

  // 监听网络错误
  page.on('response', (response) => {
    if (response.status() >= 400) {
      console.log(`🚫 网络错误 [${response.status()}]: ${response.url()}`);
    }
  });

  console.log('=================================');
  console.log('财务管理系统手动检查工具');
  console.log('=================================\n');

  console.log('正在打开系统...');
  await page.goto('http://localhost:5666/', {
    waitUntil: 'networkidle',
  });

  console.log('\n请手动执行以下操作：');
  console.log('1. 登录系统（用户名: vben, 密码: 123456）');
  console.log('2. 逐个点击以下菜单并检查是否正常：');
  console.log('   - 财务管理 > 财务概览');
  console.log('   - 财务管理 > 交易管理');
  console.log('   - 财务管理 > 分类管理');
  console.log('   - 财务管理 > 人员管理');
  console.log('   - 财务管理 > 贷款管理');
  console.log('   - 数据分析 > 数据概览');
  console.log('   - 数据分析 > 趋势分析');
  console.log('   - 系统工具 > 导入数据');
  console.log('   - 系统工具 > 导出数据');
  console.log('   - 系统工具 > 数据备份');
  console.log('   - 系统工具 > 预算管理');
  console.log('   - 系统工具 > 标签管理');

  console.log('\n需要检查的内容：');
  console.log('✓ 页面是否正常加载');
  console.log('✓ 是否有错误提示');
  console.log('✓ 表格是否显示正常');
  console.log('✓ 按钮是否可以点击');
  console.log('✓ 图表是否正常显示（数据分析页面）');

  console.log('\n控制台将实时显示错误信息...');
  console.log('按 Ctrl+C 结束检查\n');

  // 保持浏览器开启
  await new Promise(() => {});
})();
