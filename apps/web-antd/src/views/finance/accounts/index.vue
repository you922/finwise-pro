<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">🏦 账户管理</h1>
      <p class="text-gray-600">管理银行账户、电子钱包和投资账户</p>
    </div>

    <!-- 账户概览 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card class="text-center">
        <div class="space-y-2">
          <div class="text-3xl">💰</div>
          <p class="text-sm text-gray-500">总资产</p>
          <p class="text-2xl font-bold text-green-600">{{ formatCurrency(totalAssets) }}</p>
        </div>
      </Card>
      <Card class="text-center">
        <div class="space-y-2">
          <div class="text-3xl">🔴</div>
          <p class="text-sm text-gray-500">总负债</p>
          <p class="text-2xl font-bold text-red-600">{{ formatCurrency(Math.abs(totalLiabilities)) }}</p>
        </div>
      </Card>
      <Card class="text-center">
        <div class="space-y-2">
          <div class="text-3xl">📊</div>
          <p class="text-sm text-gray-500">净资产</p>
          <p class="text-2xl font-bold text-blue-600">{{ formatCurrency(netWorth) }}</p>
        </div>
      </Card>
      <Card class="text-center">
        <div class="space-y-2">
          <div class="text-3xl">🏪</div>
          <p class="text-sm text-gray-500">账户数</p>
          <p class="text-2xl font-bold text-purple-600">{{ accounts.length }}个</p>
        </div>
      </Card>
    </div>

    <!-- 账户列表 -->
    <div v-if="accounts.length === 0" class="text-center py-12">
      <div class="text-8xl mb-6">🏦</div>
      <h3 class="text-xl font-medium text-gray-800 mb-2">暂无账户信息</h3>
      <p class="text-gray-500 mb-6">添加您的银行账户、电子钱包等开始管理财务</p>
      <Button type="primary" size="large" @click="openAddAccountModal">
        ➕ 添加第一个账户
      </Button>
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card v-for="account in accounts" :key="account.id" class="hover:shadow-lg transition-shadow">
        <template #title>
          <div class="flex items-center space-x-2">
            <span class="text-xl">{{ account.emoji }}</span>
            <span>{{ account.name }}</span>
          </div>
        </template>
        <template #extra>
          <Dropdown :trigger="['click']">
            <template #overlay>
              <Menu>
                <Menu.Item @click="editAccount(account)">✏️ 编辑</Menu.Item>
                <Menu.Item @click="deleteAccount(account)" class="text-red-600">🗑️ 删除</Menu.Item>
              </Menu>
            </template>
            <Button type="text" size="small">⚙️</Button>
          </Dropdown>
        </template>
        
        <div class="space-y-4">
          <div class="text-center">
            <p class="text-2xl font-bold" :class="account.balance >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ account.balance.toLocaleString() }} {{ account.currency || 'CNY' }}
            </p>
            <p class="text-sm text-gray-500">{{ account.type }}</p>
            <p v-if="account.bank" class="text-xs text-gray-400">{{ account.bank }}</p>
            <p v-if="account.currency && account.currency !== 'CNY'" class="text-xs text-blue-500">{{ account.currency }}</p>
          </div>
          
          <div class="flex space-x-2">
            <Button type="primary" size="small" block @click="transfer(account)">💸 转账</Button>
            <Button size="small" block @click="viewDetails(account)">📊 明细</Button>
          </div>
        </div>
      </Card>
    </div>

    <!-- 添加账户模态框 -->
    <Modal 
      v-model:open="showAddModal" 
      title="➕ 添加新账户" 
      @ok="submitAccount"
      @cancel="cancelAdd"
      width="500px"
    >
      <Form ref="formRef" :model="accountForm" :rules="rules" layout="vertical">
        <Form.Item label="账户名称" name="name" required>
          <Input 
            v-model:value="accountForm.name" 
            placeholder="请输入账户名称，如：工商银行储蓄卡"
            size="large"
          />
        </Form.Item>
        
        <Row :gutter="16">
          <Col :span="8">
            <Form.Item label="账户类型" name="type" required>
              <Select v-model:value="accountForm.type" placeholder="选择类型" size="large" @change="handleTypeChange">
                <Select.Option value="savings">
                  <span>🏦 储蓄账户</span>
                </Select.Option>
                <Select.Option value="checking">
                  <span>📝 支票账户</span>
                </Select.Option>
                <Select.Option value="credit">
                  <span>💳 信用卡</span>
                </Select.Option>
                <Select.Option value="investment">
                  <span>📈 投资账户</span>
                </Select.Option>
                <Select.Option value="ewallet">
                  <span>📱 电子钱包</span>
                </Select.Option>
                <Select.Option value="CUSTOM">
                  <span>➕ 自定义类型</span>
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item label="初始余额" name="balance">
              <InputNumber
                v-model:value="accountForm.balance"
                :precision="2"
                style="width: 100%"
                placeholder="0.00"
                size="large"
              />
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item label="余额币种" name="currency">
              <Select v-model:value="accountForm.currency" placeholder="选择币种" size="large" @change="handleCurrencyChange">
                <Select.Option value="CNY">🇨🇳 人民币</Select.Option>
                <Select.Option value="USD">🇺🇸 美元</Select.Option>
                <Select.Option value="EUR">🇪🇺 欧元</Select.Option>
                <Select.Option value="JPY">🇯🇵 日元</Select.Option>
                <Select.Option value="GBP">🇬🇧 英镑</Select.Option>
                <Select.Option value="HKD">🇭🇰 港币</Select.Option>
                <Select.Option value="KRW">🇰🇷 韩元</Select.Option>
                <Select.Option value="CUSTOM">➕ 自定义币种</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <!-- 自定义账户类型输入 -->
        <div v-if="accountForm.type === 'CUSTOM'" class="mb-4">
          <Form.Item label="自定义账户类型" required>
            <Input v-model:value="accountForm.customTypeName" placeholder="请输入账户类型，如: 基金账户、股票账户等" />
          </Form.Item>
        </div>

        <!-- 自定义币种输入 -->
        <div v-if="accountForm.currency === 'CUSTOM'" class="mb-4">
          <Row :gutter="16">
            <Col :span="12">
              <Form.Item label="币种代码" required>
                <Input v-model:value="accountForm.customCurrencyCode" placeholder="如: THB, AUD 等" style="text-transform: uppercase" />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="币种名称" required>
                <Input v-model:value="accountForm.customCurrencyName" placeholder="如: 泰铢, 澳元 等" />
              </Form.Item>
            </Col>
          </Row>
        </div>
        
        <Form.Item label="银行/机构">
          <Select v-model:value="accountForm.bank" placeholder="选择银行或机构（可选）" allow-clear @change="handleBankChange">
            <Select.Option value="工商银行">🏦 工商银行</Select.Option>
            <Select.Option value="建设银行">🏗️ 建设银行</Select.Option>
            <Select.Option value="招商银行">💼 招商银行</Select.Option>
            <Select.Option value="农业银行">🌾 农业银行</Select.Option>
            <Select.Option value="中国银行">🏛️ 中国银行</Select.Option>
            <Select.Option value="交通银行">🚄 交通银行</Select.Option>
            <Select.Option value="支付宝">💙 支付宝</Select.Option>
            <Select.Option value="微信支付">💚 微信支付</Select.Option>
            <Select.Option value="CUSTOM">➕ 自定义银行</Select.Option>
          </Select>
        </Form.Item>

        <!-- 自定义银行输入 -->
        <div v-if="accountForm.bank === 'CUSTOM'" class="mb-4">
          <Form.Item label="自定义银行/机构名称" required>
            <Input v-model:value="accountForm.customBankName" placeholder="请输入银行或机构名称，如: 民生银行、京东金融等" />
          </Form.Item>
        </div>

        <Form.Item label="账户描述">
          <Input.TextArea 
            v-model:value="accountForm.description" 
            :rows="3" 
            placeholder="账户备注信息..."
          />
        </Form.Item>

        <Form.Item label="账户颜色">
          <div class="flex space-x-2">
            <div 
              v-for="color in accountColors" 
              :key="color"
              class="w-8 h-8 rounded-full cursor-pointer border-2 hover:scale-110 transition-all"
              :class="accountForm.color === color ? 'border-gray-800 scale-110' : 'border-gray-300'"
              :style="{ backgroundColor: color }"
              @click="accountForm.color = color"
            ></div>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  Card, Button, Modal, Form, Input, Select, Row, Col, 
  InputNumber, notification, Dropdown, Menu
} from 'ant-design-vue';

defineOptions({ name: 'AccountManagement' });

const accounts = ref<any[]>([]);
const showAddModal = ref(false);
const formRef = ref();

// 计算属性
const totalAssets = computed(() => {
  return accounts.value
    .filter(account => account.balance > 0)
    .reduce((sum, account) => sum + account.balance, 0);
});

const totalLiabilities = computed(() => {
  return accounts.value
    .filter(account => account.balance < 0)
    .reduce((sum, account) => sum + account.balance, 0);
});

const netWorth = computed(() => {
  return accounts.value.reduce((sum, account) => sum + account.balance, 0);
});

// 格式化货币
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(amount);
};

// 表单数据
const accountForm = ref({
  name: '',
  type: 'savings',
  customTypeName: '',
  balance: 0,
  currency: 'CNY',
  customCurrencyCode: '',
  customCurrencyName: '',
  bank: '',
  customBankName: '',
  description: '',
  color: '#1890ff'
});

// 账户颜色选项
const accountColors = ref([
  '#1890ff', '#52c41a', '#fa541c', '#722ed1', '#eb2f96', '#13c2c2',
  '#f5222d', '#fa8c16', '#fadb14', '#a0d911', '#52c41a', '#13a8a8'
]);

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入账户名称', trigger: 'blur' },
    { min: 2, max: 50, message: '账户名称长度在2-50个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择账户类型', trigger: 'change' }
  ],
  balance: [
    { type: 'number', min: -999999999, max: 999999999, message: '请输入有效的金额', trigger: 'blur' }
  ]
};

// 功能方法
const openAddAccountModal = () => {
  showAddModal.value = true;
  resetForm();
};

const submitAccount = async () => {
  try {
    // 表单验证
    await formRef.value.validate();
    
    // 处理自定义字段
    const finalType = accountForm.value.type === 'CUSTOM' 
      ? accountForm.value.customTypeName 
      : getAccountTypeText(accountForm.value.type);
      
    const finalCurrency = accountForm.value.currency === 'CUSTOM'
      ? `${accountForm.value.customCurrencyCode} (${accountForm.value.customCurrencyName})`
      : accountForm.value.currency;
      
    const finalBank = accountForm.value.bank === 'CUSTOM'
      ? accountForm.value.customBankName
      : accountForm.value.bank;
    
    // 创建新账户
    const newAccount = {
      id: Date.now().toString(),
      name: accountForm.value.name,
      type: finalType,
      balance: accountForm.value.balance || 0,
      currency: finalCurrency,
      bank: finalBank,
      description: accountForm.value.description,
      color: accountForm.value.color,
      emoji: getAccountEmoji(accountForm.value.type),
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    
    // 添加到账户列表
    accounts.value.push(newAccount);
    
    notification.success({
      message: '账户添加成功',
      description: `账户 "${newAccount.name}" 已成功创建`
    });
    
    // 关闭模态框
    showAddModal.value = false;
    resetForm();
    
    console.log('新增账户:', newAccount);
    
  } catch (error) {
    console.error('表单验证失败:', error);
    notification.error({
      message: '添加失败',
      description: '请检查表单信息是否正确'
    });
  }
};

const cancelAdd = () => {
  showAddModal.value = false;
  resetForm();
};

const handleTypeChange = (type: string) => {
  console.log('账户类型选择:', type);
  if (type !== 'CUSTOM') {
    accountForm.value.customTypeName = '';
  }
};

const handleCurrencyChange = (currency: string) => {
  console.log('币种选择:', currency);
  if (currency !== 'CUSTOM') {
    accountForm.value.customCurrencyCode = '';
    accountForm.value.customCurrencyName = '';
  }
};

const handleBankChange = (bank: string) => {
  console.log('银行选择:', bank);
  if (bank !== 'CUSTOM') {
    accountForm.value.customBankName = '';
  }
};

const resetForm = () => {
  accountForm.value = {
    name: '',
    type: 'savings',
    customTypeName: '',
    balance: 0,
    currency: 'CNY',
    customCurrencyCode: '',
    customCurrencyName: '',
    bank: '',
    customBankName: '',
    description: '',
    color: '#1890ff'
  };
};

const getAccountTypeText = (type: string) => {
  const typeMap = {
    'savings': '储蓄账户',
    'checking': '支票账户',
    'credit': '信用卡',
    'investment': '投资账户',
    'ewallet': '电子钱包'
  };
  return typeMap[type] || type;
};

const getAccountEmoji = (type: string) => {
  const emojiMap = {
    'savings': '🏦',
    'checking': '📝',
    'credit': '💳',
    'investment': '📈',
    'ewallet': '📱'
  };
  return emojiMap[type] || '🏦';
};

const editAccount = (account: any) => {
  console.log('编辑账户:', account);
  notification.info({
    message: '编辑功能',
    description: '账户编辑功能'
  });
};

const deleteAccount = (account: any) => {
  console.log('删除账户:', account);
  const index = accounts.value.findIndex(a => a.id === account.id);
  if (index !== -1) {
    accounts.value.splice(index, 1);
    notification.success({
      message: '账户已删除',
      description: `账户 "${account.name}" 已删除`
    });
  }
};

const transfer = (account: any) => {
  console.log('转账功能:', account);
  notification.info({
    message: '转账功能',
    description: `从 ${account.name} 转账功能`
  });
};

const viewDetails = (account: any) => {
  console.log('查看明细:', account);
  notification.info({
    message: '账户明细',
    description: `查看 ${account.name} 交易明细`
  });
};
</script>

<style scoped>
.grid { display: grid; }
</style>