import * as fs from 'node:fs';

const INPUT_CSV = '/Users/fuwuqi/Downloads/Telegram Desktop/控天-控天_完全修正.csv';
const OUTPUT_CSV = '/Users/fuwuqi/Downloads/Telegram Desktop/控天-控天_完全修正_带分类.csv';

// 智能分类函数
function getCategory(project: string): string {
  const desc = project.toLowerCase();

  // 工资
  if (desc.includes('工资') || desc.match(/amy|天天|碧桂园|皇|香缇卡|财务|客服|小哥|代理ip|sy|超鹏|小白/)) {
    return '工资';
  }

  // 佣金/返佣
  if (desc.includes('佣金') || desc.includes('返佣')) {
    return '佣金/返佣';
  }

  // 分红
  if (desc.includes('分红') || desc.includes('散户')) {
    return '分红';
  }

  // 服务器/技术
  if (desc.match(/服务器|技术|chatgpt|openai|ai|接口|ip|nat|宝塔|cdn|oss|google|翻译|openrouter|deepseek|claude|cursor|bolt|硅基|chatwoot/)) {
    return '服务器/技术';
  }

  // 广告推广
  if (desc.match(/广告|推广|地推|投放|打流量/)) {
    return '广告推广';
  }

  // 软件/工具
  if (desc.match(/会员|007|u盘|processon|飞机|虚拟卡|小红卡|信用卡|cloudflare|uizard|esim/)) {
    return '软件/工具';
  }

  // 固定资产
  if (desc.match(/买车|电脑|笔记本|显示器|rog|硬盘|服务器.*购买|iphone|路由器|展示屏/)) {
    return '固定资产';
  }

  // 退款
  if (desc.includes('退款') || desc.includes('退费') || desc.includes('退')) {
    return '退款';
  }

  // 借款/转账
  if (desc.match(/借|转给|龙腾|投资款|换.*铢|换美金|换现金|报销|房租|生活费|办公室|出差|接待|保关|测试|开工红包/)) {
    return '借款/转账';
  }

  // 其他支出
  return '其他支出';
}

// 读取并处理CSV
const content = fs.readFileSync(INPUT_CSV, 'utf-8');
const lines = content.split('\n');

// 修改表头，添加"分类"列
const header = lines[0];
const newHeader = header.trimEnd() + ',分类\n';

// 处理每一行数据
const newLines = [newHeader];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) {
    newLines.push(line);
    continue;
  }

  const columns = line.split(',');
  if (columns.length < 2) {
    newLines.push(line);
    continue;
  }

  const project = columns[1]?.trim() || '';
  const category = getCategory(project);

  // 添加分类列
  const newLine = line.trimEnd() + ',' + category + '\n';
  newLines.push(newLine);
}

// 写入新文件
fs.writeFileSync(OUTPUT_CSV, newLines.join(''));

console.log(`✓ 已生成带分类的CSV文件: ${OUTPUT_CSV}`);
console.log(`共处理 ${lines.length - 1} 条记录`);
