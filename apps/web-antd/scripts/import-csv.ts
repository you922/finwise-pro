import * as fs from 'node:fs';

const CSV_FILE =
  '/Users/fuwuqi/Downloads/Telegram Desktop/控天-控天_完全修正_带分类.csv';
const API_URL = 'http://localhost:3000/api/finance/transactions';

interface CSVRow {
  date: string;
  project: string;
  type: string;
  amount: string;
  payer: string;
  account: string;
  adeShare: string;
  memo: string;
  category: string;
}

// 解析CSV文件
function parseCSV(content: string): CSVRow[] {
  const lines = content.split('\n').slice(1); // 跳过表头
  const rows: CSVRow[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const columns = line.split(',');
    if (columns.length < 6) continue;

    rows.push({
      date: columns[0]?.trim() || '',
      project: columns[1]?.trim() || '',
      type: columns[2]?.trim() || '',
      amount: columns[3]?.trim() || '',
      payer: columns[4]?.trim() || '',
      account: columns[5]?.trim() || '',
      adeShare: columns[6]?.trim() || '',
      memo: columns[7]?.trim() || '',
      category: columns[9]?.trim() || '', // 分类在第10列（索引9）
    });
  }

  return rows;
}

// 转换日期格式 - 根据CSV顺序判断年份
// CSV顺序: 2024年8-12月 -> 2025年2-7月 -> 2025年8-10月
function parseDate(dateStr: string, previousDate: string = ''): string {
  // 提取月日
  const match = dateStr.match(/(\d+)月(\d+)日?/);
  if (match) {
    const month = Number.parseInt(match[1]);
    const day = match[2].padStart(2, '0');

    // 根据上一个日期和当前月份判断年份
    let year = 2024;
    if (previousDate) {
      const prevYear = Number.parseInt(previousDate.split('-')[0]);
      const prevMonth = Number.parseInt(previousDate.split('-')[1]);

      // 如果月份从大变小（例如12月->2月，或7月->8月），说明跨年了
      year = month < prevMonth ? prevYear + 1 : prevYear;
    } else if (month >= 8) {
      // 第一条记录，8-12月是2024年
      year = 2024;
    } else {
      // 第一条记录，1-7月是2025年
      year = 2025;
    }

    return `${year}-${String(month).padStart(2, '0')}-${day}`;
  }

  // 如果只有月份
  const monthMatch = dateStr.match(/(\d+)月/);
  if (monthMatch) {
    const month = Number.parseInt(monthMatch[1]);
    let year = 2024;

    if (previousDate) {
      const prevYear = Number.parseInt(previousDate.split('-')[0]);
      const prevMonth = Number.parseInt(previousDate.split('-')[1]);

      year = month < prevMonth ? prevYear + 1 : prevYear;
    } else if (month >= 8) {
      year = 2024;
    } else {
      year = 2025;
    }

    return `${year}-${String(month).padStart(2, '0')}-01`;
  }

  // 使用上一条的日期
  return previousDate || '2024-08-01';
}

// 解析金额，支持加法和乘法表达式
function parseAmount(amountStr: string): number {
  // 移除空格
  const cleaned = amountStr.trim();

  // 如果包含乘号（*或×或x），先处理乘法
  if (/[*×x]/.test(cleaned)) {
    // 提取乘法表达式，如 "200*3=600" 或 "200*3"
    const mulMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*[*×x]\s*(\d+(?:\.\d+)?)/);
    if (mulMatch) {
      const num1 = Number.parseFloat(mulMatch[1]);
      const num2 = Number.parseFloat(mulMatch[2]);
      if (!isNaN(num1) && !isNaN(num2)) {
        return num1 * num2;
      }
    }
  }

  // 如果包含加号，计算总和
  if (cleaned.includes('+')) {
    const parts = cleaned.split('+');
    let sum = 0;
    for (const part of parts) {
      const num = Number.parseFloat(part.replaceAll(/[^\d.]/g, ''));
      if (!isNaN(num)) {
        sum += num;
      }
    }
    return sum;
  }

  // 否则直接解析
  return Number.parseFloat(cleaned.replaceAll(/[^\d.]/g, '')) || 0;
}

// 根据分类名称获取分类ID
function getCategoryIdByName(categoryName: string): number {
  const categoryMap: Record<string, number> = {
    工资: 5,
    '佣金/返佣': 6,
    分红: 7,
    '服务器/技术': 8,
    广告推广: 9,
    '软件/工具': 10,
    固定资产: 11,
    退款: 12,
    '借款/转账': 13,
    其他支出: 14,
  };

  return categoryMap[categoryName] || 2; // 默认未分类支出
}

// 批量导入
async function importTransactions() {
  const content = fs.readFileSync(CSV_FILE, 'utf8');
  const rows = parseCSV(content);

  console.log(`共解析到 ${rows.length} 条记录`);

  let previousDate = '';
  let imported = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const transactionDate = parseDate(row.date, previousDate);
      if (transactionDate) {
        previousDate = transactionDate;
      }

      const amount = parseAmount(row.amount);
      if (amount <= 0) {
        console.log(`跳过无效金额的记录: ${row.project} (金额: ${row.amount})`);
        continue;
      }

      const transaction = {
        type: 'expense', // CSV中都是支出
        amount,
        currency: 'USD', // 美金现金
        transactionDate,
        description: row.project || '无描述',
        project: row.project,
        memo: `支出人: ${row.payer || '未知'} | 账户: ${row.account || '未知'} | 备注: ${row.memo || '无'}`,
        accountId: 1, // 默认使用美金现金账户 (id=1)
        categoryId: getCategoryIdByName(row.category), // 使用CSV中的分类
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      });

      if (response.ok) {
        imported++;
        console.log(
          `✓ 导入成功 [${imported}/${rows.length}]: ${row.project} - $${amount}`,
        );
      } else {
        failed++;
        console.error(`✗ 导入失败: ${row.project}`, await response.text());
      }

      // 避免请求过快
      await new Promise((resolve) => setTimeout(resolve, 10));
    } catch (error) {
      failed++;
      console.error(`✗ 处理失败: ${row.project}`, error);
    }
  }

  console.log(`\n导入完成！`);
  console.log(`成功: ${imported} 条`);
  console.log(`失败: ${failed} 条`);
}

importTransactions().catch(console.error);
