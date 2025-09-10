<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">💰 交易管理</h1>
      <p class="text-gray-600">全面的收支交易记录管理系统</p>
    </div>

    <!-- 快速统计 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card class="text-center hover:shadow-lg transition-shadow">
        <div class="space-y-2">
          <div class="text-3xl">📈</div>
          <p class="text-sm text-gray-500">总收入</p>
          <p class="text-2xl font-bold text-green-600">¥0.00</p>
        </div>
      </Card>
      <Card class="text-center hover:shadow-lg transition-shadow">
        <div class="space-y-2">
          <div class="text-3xl">📉</div>
          <p class="text-sm text-gray-500">总支出</p>
          <p class="text-2xl font-bold text-red-600">¥0.00</p>
        </div>
      </Card>
      <Card class="text-center hover:shadow-lg transition-shadow">
        <div class="space-y-2">
          <div class="text-3xl">💎</div>
          <p class="text-sm text-gray-500">净收入</p>
          <p class="text-2xl font-bold text-purple-600">¥0.00</p>
        </div>
      </Card>
      <Card class="text-center hover:shadow-lg transition-shadow">
        <div class="space-y-2">
          <div class="text-3xl">📊</div>
          <p class="text-sm text-gray-500">交易笔数</p>
          <p class="text-2xl font-bold text-blue-600">0</p>
        </div>
      </Card>
    </div>

    <!-- 操作栏 -->
    <Card class="mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <Input 
            v-model:value="searchText" 
            :placeholder="isEnglish ? 'Search transactions...' : '搜索交易...'" 
            style="width: 300px" 
            @change="handleSearch"
          />
          <Select 
            v-model:value="filterType" 
            :placeholder="isEnglish ? 'Type' : '类型'" 
            style="width: 120px"
            @change="handleSearch"
          >
            <Select.Option value="">{{ isEnglish ? 'All' : '全部' }}</Select.Option>
            <Select.Option value="income">{{ isEnglish ? 'Income' : '收入' }}</Select.Option>
            <Select.Option value="expense">{{ isEnglish ? 'Expense' : '支出' }}</Select.Option>
          </Select>
          <Select 
            v-model:value="filterCategory" 
            :placeholder="isEnglish ? 'Category' : '分类'" 
            style="width: 150px"
            @change="handleSearch"
          >
            <Select.Option value="">{{ isEnglish ? 'All' : '全部' }}</Select.Option>
            <Select.Option value="salary">{{ isEnglish ? 'Salary' : '工资' }}</Select.Option>
            <Select.Option value="food">{{ isEnglish ? 'Food' : '餐饮' }}</Select.Option>
            <Select.Option value="transport">{{ isEnglish ? 'Transport' : '交通' }}</Select.Option>
            <Select.Option value="shopping">{{ isEnglish ? 'Shopping' : '购物' }}</Select.Option>
          </Select>
        </div>
        <div class="flex space-x-2">
          <Button type="primary" @click="addTransaction">
            ➕ 添加交易
          </Button>
          <Button @click="exportData">
            📥 导出数据
          </Button>
        </div>
      </div>
    </Card>

    <!-- 交易列表 -->
    <Card title="📋 交易记录">
      <div v-if="transactions.length === 0" class="text-center py-12">
        <div class="text-8xl mb-6">📊</div>
        <h3 class="text-xl font-medium text-gray-800 mb-2">暂无交易数据</h3>
        <p class="text-gray-500 mb-6">开始记录您的第一笔收入或支出吧！</p>
        <div class="space-x-4">
          <Button type="primary" size="large" @click="addTransaction">
            ➕ 添加收入
          </Button>
          <Button size="large" @click="addTransaction">
            ➖ 添加支出
          </Button>
        </div>
      </div>
      <Table v-else :columns="columns" :dataSource="transactions" :pagination="{ pageSize: 10 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'amount'">
            <span :class="record.type === 'income' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'">
              {{ record.type === 'income' ? '+' : '-' }}{{ Math.abs(record.amount).toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' }) }}
            </span>
          </template>
          <template v-else-if="column.dataIndex === 'category'">
            <Tag :color="getCategoryColor(record.category)">{{ record.category }}</Tag>
          </template>
          <template v-else-if="column.dataIndex === 'action'">
            <Space>
              <Button type="link" size="small" @click="editTransaction(record)">
                {{ isEnglish ? 'Edit' : '编辑' }}
              </Button>
              <Button type="link" size="small" danger @click="deleteTransaction(record)">
                {{ isEnglish ? 'Delete' : '删除' }}
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 添加交易模态框 -->
    <Modal v-model:open="showAddModal" :title="isEnglish ? '➕ Add Transaction' : '➕ 添加交易'" @ok="submitTransaction" width="600px">
      <Form :model="transactionForm" layout="vertical">
        <Row :gutter="16">
          <Col :span="8">
            <Form.Item label="类型" required>
              <Select v-model:value="transactionForm.type">
                <Select.Option value="income">收入</Select.Option>
                <Select.Option value="expense">支出</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item label="金额" required>
              <InputNumber v-model:value="transactionForm.amount" :precision="2" style="width: 100%" placeholder="请输入金额" size="large" />
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item label="币种" required>
              <Select v-model:value="transactionForm.currency" placeholder="选择币种" style="width: 100%" @change="handleCurrencyChange">
                <Select.Option value="CNY">🇨🇳 人民币 (CNY)</Select.Option>
                <Select.Option value="USD">🇺🇸 美元 (USD)</Select.Option>
                <Select.Option value="EUR">🇪🇺 欧元 (EUR)</Select.Option>
                <Select.Option value="JPY">🇯🇵 日元 (JPY)</Select.Option>
                <Select.Option value="GBP">🇬🇧 英镑 (GBP)</Select.Option>
                <Select.Option value="KRW">🇰🇷 韩元 (KRW)</Select.Option>
                <Select.Option value="HKD">🇭🇰 港币 (HKD)</Select.Option>
                <Select.Option value="SGD">🇸🇬 新加坡元 (SGD)</Select.Option>
                <Select.Option value="CUSTOM">➕ 自定义币种</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <!-- 自定义币种输入 -->
        <div v-if="transactionForm.currency === 'CUSTOM'" class="mb-4">
          <Row :gutter="16">
            <Col :span="12">
              <Form.Item label="币种代码" required>
                <Input v-model:value="transactionForm.customCurrencyCode" placeholder="如: THB, AUD 等" style="text-transform: uppercase" />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="币种名称" required>
                <Input v-model:value="transactionForm.customCurrencyName" placeholder="如: 泰铢, 澳元 等" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Row :gutter="16">
          <Col :span="12">
            <Form.Item label="分类" required>
              <Select v-model:value="transactionForm.category" placeholder="选择分类" @change="handleCategoryChange">
                <Select.Option value="salary">工资</Select.Option>
                <Select.Option value="food">餐饮</Select.Option>
                <Select.Option value="transport">交通</Select.Option>
                <Select.Option value="shopping">购物</Select.Option>
                <Select.Option value="entertainment">娱乐</Select.Option>
                <Select.Option value="medical">医疗</Select.Option>
                <Select.Option value="education">教育</Select.Option>
                <Select.Option value="housing">住房</Select.Option>
                <Select.Option value="CUSTOM">➕ 自定义分类</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="日期" required>
              <DatePicker v-model:value="transactionForm.date" style="width: 100%" />
            </Form.Item>
          </Col>
        </Row>

        <!-- 自定义分类输入 -->
        <div v-if="transactionForm.category === 'CUSTOM'" class="mb-4">
          <Form.Item label="自定义分类名称" required>
            <Input v-model:value="transactionForm.customCategoryName" placeholder="请输入分类名称，如: 投资收益、宠物用品等" />
          </Form.Item>
        </div>

        <Form.Item label="描述">
          <Input v-model:value="transactionForm.description" placeholder="交易描述..." />
        </Form.Item>

        <Form.Item label="账户">
          <Select v-model:value="transactionForm.account" placeholder="选择账户" @change="handleAccountChange">
            <Select.Option value="cash">💰 现金</Select.Option>
            <Select.Option value="bank">🏦 银行卡</Select.Option>
            <Select.Option value="alipay">💙 支付宝</Select.Option>
            <Select.Option value="wechat">💚 微信支付</Select.Option>
            <Select.Option value="creditcard">💳 信用卡</Select.Option>
            <Select.Option value="CUSTOM">➕ 自定义账户</Select.Option>
          </Select>
        </Form.Item>

        <!-- 自定义账户输入 -->
        <div v-if="transactionForm.account === 'CUSTOM'" class="mb-4">
          <Form.Item label="自定义账户名称" required>
            <Input v-model:value="transactionForm.customAccountName" placeholder="请输入账户名称，如: 招商银行、余额宝等" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  Card, Input, Select, Button, Table, Tag, Space, Modal, 
  Form, InputNumber, DatePicker, notification, Row, Col
} from 'ant-design-vue';
import dayjs from 'dayjs';

defineOptions({ name: 'TransactionManagement' });

const currentLanguage = ref('zh-CN');
const showAddModal = ref(false);
const showImportModal = ref(false);
const searchText = ref('');
const filterType = ref('');
const filterCategory = ref('');

// 多语言支持
const isEnglish = computed(() => currentLanguage.value === 'en-US');

// 表格列
const columns = [
  { 
    title: '日期', 
    dataIndex: 'date', 
    key: 'date', 
    width: 100 
  },
  { 
    title: '描述', 
    dataIndex: 'description', 
    key: 'description' 
  },
  { 
    title: '分类', 
    dataIndex: 'category', 
    key: 'category', 
    width: 100 
  },
  { 
    title: '金额', 
    dataIndex: 'amount', 
    key: 'amount', 
    width: 120 
  },
  { 
    title: '币种', 
    dataIndex: 'currency', 
    key: 'currency', 
    width: 80 
  },
  { 
    title: '账户', 
    dataIndex: 'account', 
    key: 'account', 
    width: 120 
  },
  { 
    title: '操作', 
    key: 'action', 
    width: 120 
  }
];

// 交易表单
const transactionForm = ref({
  type: 'expense',
  amount: null,
  currency: 'CNY',
  customCurrencyCode: '',
  customCurrencyName: '',
  description: '',
  category: '',
  customCategoryName: '',
  account: '',
  customAccountName: '',
  date: dayjs()
});

const transactions = ref([]);

// 功能实现
const getCategoryColor = (category: string) => {
  const colors = { 
    'salary': 'green', 'bonus': 'lime', 'investment': 'gold',
    'food': 'orange', 'transport': 'blue', 'shopping': 'purple',
    'entertainment': 'pink', 'other': 'default'
  };
  return colors[category] || 'default';
};

const addTransaction = () => {
  showAddModal.value = true;
};

const submitTransaction = () => {
  console.log('添加交易:', transactionForm.value);
  
  // 处理自定义字段
  const finalCurrency = transactionForm.value.currency === 'CUSTOM' 
    ? `${transactionForm.value.customCurrencyCode} (${transactionForm.value.customCurrencyName})`
    : transactionForm.value.currency;
    
  const finalCategory = transactionForm.value.category === 'CUSTOM'
    ? transactionForm.value.customCategoryName
    : transactionForm.value.category;
    
  const finalAccount = transactionForm.value.account === 'CUSTOM'
    ? transactionForm.value.customAccountName
    : transactionForm.value.account;
  
  // 添加到交易列表
  const newTransaction = {
    key: Date.now().toString(),
    date: transactionForm.value.date.format('YYYY-MM-DD'),
    description: transactionForm.value.description,
    category: finalCategory,
    amount: transactionForm.value.type === 'income' ? transactionForm.value.amount : -transactionForm.value.amount,
    type: transactionForm.value.type,
    account: finalAccount,
    currency: finalCurrency
  };
  
  transactions.value.unshift(newTransaction);
  
  notification.success({
    message: '交易已添加',
    description: `${transactionForm.value.type === 'income' ? '收入' : '支出'}记录已保存`
  });
  
  showAddModal.value = false;
  resetTransactionForm();
};

const resetTransactionForm = () => {
  transactionForm.value = {
    type: 'expense',
    amount: null,
    currency: 'CNY',
    customCurrencyCode: '',
    customCurrencyName: '',
    description: '',
    category: '',
    customCategoryName: '',
    account: '',
    customAccountName: '',
    date: dayjs()
  };
};

const exportData = () => {
  console.log('导出交易数据');
  notification.info({
    message: isEnglish.value ? 'Export Started' : '开始导出',
    description: isEnglish.value ? 'Transaction data export has started' : '交易数据导出已开始'
  });
};

const importData = () => {
  showImportModal.value = true;
};

const editTransaction = (record: any) => {
  console.log('编辑交易:', record);
  notification.info({
    message: isEnglish.value ? 'Edit Transaction' : '编辑交易',
    description: isEnglish.value ? 'Transaction edit feature' : '交易编辑功能'
  });
};

const deleteTransaction = (record: any) => {
  console.log('删除交易:', record);
  // 从列表中删除
  const index = transactions.value.findIndex(t => t.key === record.key);
  if (index !== -1) {
    transactions.value.splice(index, 1);
    notification.success({
      message: isEnglish.value ? 'Transaction Deleted' : '交易已删除',
      description: isEnglish.value ? 'Transaction has been removed' : '交易记录已删除'
    });
  }
};

const handleCurrencyChange = (currency: string) => {
  console.log('币种选择:', currency);
  if (currency !== 'CUSTOM') {
    transactionForm.value.customCurrencyCode = '';
    transactionForm.value.customCurrencyName = '';
  }
};

const handleCategoryChange = (category: string) => {
  console.log('分类选择:', category);
  if (category !== 'CUSTOM') {
    transactionForm.value.customCategoryName = '';
  }
};

const handleAccountChange = (account: string) => {
  console.log('账户选择:', account);
  if (account !== 'CUSTOM') {
    transactionForm.value.customAccountName = '';
  }
};

const handleSearch = () => {
  console.log('搜索交易:', searchText.value);
  // 实现搜索逻辑
};
</script>

<style scoped>
.grid { display: grid; }
</style>