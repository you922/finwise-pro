<template>
  <div class="p-4">
    <PageWrapper title="交易管理" content="全面的收支交易记录管理系统">
      <!-- 搜索和操作栏 -->
      <Card class="mb-4">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-4">
            <Input.Search
              v-model:value="searchText"
              placeholder="搜索交易记录..."
              style="width: 300px"
              @search="onSearch"
            />
            <Select v-model:value="filterType" style="width: 120px" placeholder="类型">
              <Select.Option value="">全部</Select.Option>
              <Select.Option value="income">收入</Select.Option>
              <Select.Option value="expense">支出</Select.Option>
            </Select>
            <Select v-model:value="filterCategory" style="width: 150px" placeholder="分类">
              <Select.Option value="">全部分类</Select.Option>
              <Select.Option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</Select.Option>
            </Select>
            <RangePicker v-model:value="dateFilter" @change="onDateChange" />
          </div>
          <div class="flex items-center space-x-2">
            <Button type="primary" @click="showAddModal = true">
              <Icon icon="mdi:plus" class="mr-1" />
              添加交易
            </Button>
            <Button @click="exportData">
              <Icon icon="mdi:download" class="mr-1" />
              导出
            </Button>
            <Dropdown :trigger="['click']">
              <template #overlay>
                <Menu @click="handleBatchAction">
                  <Menu.Item key="delete">批量删除</Menu.Item>
                  <Menu.Item key="export">导出选中</Menu.Item>
                  <Menu.Item key="categorize">批量分类</Menu.Item>
                </Menu>
              </template>
              <Button>
                批量操作
                <Icon icon="mdi:chevron-down" class="ml-1" />
              </Button>
            </Dropdown>
          </div>
        </div>
      </Card>

      <!-- 交易统计卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card class="text-center">
          <Statistic title="总收入" :value="statistics.totalIncome" :precision="2" prefix="¥" value-style="color: #3f8600" />
        </Card>
        <Card class="text-center">
          <Statistic title="总支出" :value="statistics.totalExpense" :precision="2" prefix="¥" value-style="color: #cf1322" />
        </Card>
        <Card class="text-center">
          <Statistic title="净收入" :value="statistics.netIncome" :precision="2" prefix="¥" />
        </Card>
        <Card class="text-center">
          <Statistic title="交易笔数" :value="statistics.transactionCount" suffix="笔" />
        </Card>
      </div>

      <!-- 交易列表 -->
      <Card title="交易记录">
        <template #extra>
          <Space>
            <Tooltip title="刷新数据">
              <Button @click="refreshData" :loading="loading">
                <Icon icon="mdi:refresh" />
              </Button>
            </Tooltip>
            <Tooltip title="列设置">
              <Button @click="showColumnSetting = true">
                <Icon icon="mdi:cog" />
              </Button>
            </Tooltip>
          </Space>
        </template>

        <Table
          :columns="columns"
          :dataSource="filteredTransactions"
          :loading="loading"
          :scroll="{ x: 1200 }"
          :pagination="{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / 共 ${total} 条`
          }"
          :rowSelection="rowSelection"
          @change="handleTableChange"
        >
          <!-- 自定义列模板 -->
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'amount'">
              <span :class="record.type === 'income' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
                {{ record.type === 'income' ? '+' : '-' }}{{ formatCurrency(Math.abs(record.amount)) }}
              </span>
            </template>
            <template v-else-if="column.dataIndex === 'category'">
              <Tag :color="getCategoryColor(record.category)">{{ record.category }}</Tag>
            </template>
            <template v-else-if="column.dataIndex === 'status'">
              <Tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</Tag>
            </template>
            <template v-else-if="column.dataIndex === 'action'">
              <Space>
                <Button type="link" size="small" @click="editTransaction(record)">
                  <Icon icon="mdi:pencil" />
                </Button>
                <Button type="link" size="small" danger @click="deleteTransaction(record)">
                  <Icon icon="mdi:delete" />
                </Button>
                <Button type="link" size="small" @click="viewDetails(record)">
                  <Icon icon="mdi:eye" />
                </Button>
              </Space>
            </template>
          </template>
        </Table>
      </Card>

      <!-- 添加/编辑交易模态框 -->
      <Modal
        v-model:open="showAddModal"
        :title="editingTransaction ? '编辑交易' : '添加交易'"
        width="600px"
        @ok="handleSubmit"
        @cancel="resetForm"
      >
        <Form ref="formRef" :model="formData" :rules="rules" layout="vertical">
          <Row :gutter="16">
            <Col :span="12">
              <Form.Item label="交易类型" name="type">
                <Select v-model:value="formData.type">
                  <Select.Option value="income">收入</Select.Option>
                  <Select.Option value="expense">支出</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="金额" name="amount">
                <InputNumber
                  v-model:value="formData.amount"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                  placeholder="请输入金额"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row :gutter="16">
            <Col :span="12">
              <Form.Item label="分类" name="category">
                <Select v-model:value="formData.category" placeholder="选择分类">
                  <Select.Option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="账户" name="account">
                <Select v-model:value="formData.account" placeholder="选择账户">
                  <Select.Option v-for="acc in accountOptions" :key="acc.id" :value="acc.name">{{ acc.name }}</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row :gutter="16">
            <Col :span="12">
              <Form.Item label="交易日期" name="date">
                <DatePicker v-model:value="formData.date" style="width: 100%" />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="状态" name="status">
                <Select v-model:value="formData.status">
                  <Select.Option value="completed">已完成</Select.Option>
                  <Select.Option value="pending">待处理</Select.Option>
                  <Select.Option value="cancelled">已取消</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="描述" name="description">
            <Input.TextArea v-model:value="formData.description" :rows="3" placeholder="请输入交易描述..." />
          </Form.Item>

          <Form.Item label="标签">
            <Select v-model:value="formData.tags" mode="tags" placeholder="添加标签（可多选）">
              <Select.Option v-for="tag in commonTags" :key="tag" :value="tag">{{ tag }}</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="附件">
            <Upload
              v-model:fileList="formData.attachments"
              :customRequest="handleUpload"
              list-type="picture-card"
              :multiple="true"
            >
              <div>
                <Icon icon="mdi:plus" />
                <div style="margin-top: 8px">上传</div>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </PageWrapper>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { PageWrapper } from '@vben/common-ui';
import {
  Card, Table, Button, Input, Select, RangePicker, Modal, Form, 
  Row, Col, InputNumber, DatePicker, Space, Tag, Tooltip, 
  Dropdown, Menu, Statistic, Upload
} from 'ant-design-vue';
import { Icon } from '@iconify/vue';
import dayjs from 'dayjs';

defineOptions({ name: 'TransactionManagement' });

const searchText = ref('');
const filterType = ref('');
const filterCategory = ref('');
const dateFilter = ref();
const loading = ref(false);
const showAddModal = ref(false);
const showColumnSetting = ref(false);
const editingTransaction = ref(null);
const selectedRowKeys = ref([]);

// 表格分页
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0
});

// 分类和账户选项
const categories = ref(['餐饮', '交通', '购物', '娱乐', '医疗', '教育', '投资', '薪资', '奖金', '其他']);
const accountOptions = ref([
  { id: '1', name: '工商银行储蓄卡' },
  { id: '2', name: '支付宝余额' },
  { id: '3', name: '微信钱包' },
  { id: '4', name: '招商银行信用卡' }
]);

const commonTags = ref(['必需品', '固定支出', '一次性', '投资', '紧急', '娱乐', '礼物']);

// 交易数据
const transactions = ref([
  {
    key: '1',
    id: 'T001',
    date: '2024-12-28',
    type: 'expense',
    amount: 156.80,
    category: '餐饮',
    account: '支付宝余额',
    description: '午餐 - 麦当劳',
    status: 'completed',
    tags: ['必需品'],
    payee: '麦当劳',
    location: '上海市浦东新区',
    receipt: true
  },
  {
    key: '2',
    id: 'T002',
    date: '2024-12-28',
    type: 'income',
    amount: 12000.00,
    category: '薪资',
    account: '工商银行储蓄卡',
    description: '12月工资',
    status: 'completed',
    tags: ['固定收入'],
    payer: '公司财务部',
    location: '',
    receipt: false
  },
  {
    key: '3',
    id: 'T003',
    date: '2024-12-27',
    type: 'expense',
    amount: 89.50,
    category: '交通',
    account: '微信钱包',
    description: '地铁卡充值',
    status: 'completed',
    tags: ['交通', '必需品'],
    payee: '上海地铁',
    location: '人民广场站',
    receipt: true
  }
]);

// 表格列配置
const columns = [
  {
    title: '交易ID',
    dataIndex: 'id',
    key: 'id',
    width: 100,
    fixed: 'left'
  },
  {
    title: '日期',
    dataIndex: 'date',
    key: 'date',
    width: 110,
    sorter: true
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 80,
    filters: [
      { text: '收入', value: 'income' },
      { text: '支出', value: 'expense' }
    ]
  },
  {
    title: '金额',
    dataIndex: 'amount',
    key: 'amount',
    width: 120,
    sorter: true
  },
  {
    title: '分类',
    dataIndex: 'category',
    key: 'category',
    width: 100
  },
  {
    title: '账户',
    dataIndex: 'account',
    key: 'account',
    width: 150
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100
  },
  {
    title: '操作',
    key: 'action',
    width: 120,
    fixed: 'right'
  }
];

// 表单数据
const formData = ref({
  type: 'expense',
  amount: null,
  category: '',
  account: '',
  date: dayjs(),
  description: '',
  status: 'completed',
  tags: [],
  attachments: []
});

// 表单验证规则
const rules = {
  type: [{ required: true, message: '请选择交易类型' }],
  amount: [{ required: true, message: '请输入金额' }],
  category: [{ required: true, message: '请选择分类' }],
  account: [{ required: true, message: '请选择账户' }],
  date: [{ required: true, message: '请选择日期' }]
};

// 计算统计数据
const statistics = computed(() => {
  const income = filteredTransactions.value
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expense = filteredTransactions.value
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  return {
    totalIncome: income,
    totalExpense: expense,
    netIncome: income - expense,
    transactionCount: filteredTransactions.value.length
  };
});

// 过滤交易数据
const filteredTransactions = computed(() => {
  let filtered = transactions.value;
  
  if (searchText.value) {
    filtered = filtered.filter(t => 
      t.description.toLowerCase().includes(searchText.value.toLowerCase()) ||
      t.id.toLowerCase().includes(searchText.value.toLowerCase())
    );
  }
  
  if (filterType.value) {
    filtered = filtered.filter(t => t.type === filterType.value);
  }
  
  if (filterCategory.value) {
    filtered = filtered.filter(t => t.category === filterCategory.value);
  }
  
  return filtered;
});

// 行选择配置
const rowSelection = {
  selectedRowKeys: selectedRowKeys,
  onChange: (keys: string[]) => {
    selectedRowKeys.value = keys;
  }
};

// 方法实现
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(amount);
};

const getCategoryColor = (category: string) => {
  const colorMap = {
    '餐饮': 'orange',
    '交通': 'blue',
    '购物': 'purple',
    '娱乐': 'pink',
    '医疗': 'red',
    '教育': 'green',
    '投资': 'gold',
    '薪资': 'cyan',
    '奖金': 'lime',
    '其他': 'default'
  };
  return colorMap[category] || 'default';
};

const getStatusColor = (status: string) => {
  const statusMap = {
    'completed': 'success',
    'pending': 'warning',
    'cancelled': 'error'
  };
  return statusMap[status] || 'default';
};

const getStatusText = (status: string) => {
  const textMap = {
    'completed': '已完成',
    'pending': '待处理',
    'cancelled': '已取消'
  };
  return textMap[status] || status;
};

const onSearch = () => {
  console.log('搜索:', searchText.value);
  pagination.value.current = 1;
};

const onDateChange = () => {
  console.log('日期筛选:', dateFilter.value);
  pagination.value.current = 1;
};

const refreshData = () => {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    console.log('数据已刷新');
  }, 1000);
};

const exportData = () => {
  console.log('导出交易数据');
  // 实现导出逻辑
};

const handleBatchAction = ({ key }) => {
  console.log('批量操作:', key, selectedRowKeys.value);
};

const handleTableChange = (pag, filters, sorter) => {
  pagination.value = pag;
  console.log('表格变化:', pag, filters, sorter);
};

const editTransaction = (record) => {
  editingTransaction.value = record;
  formData.value = { ...record };
  showAddModal.value = true;
};

const deleteTransaction = (record) => {
  console.log('删除交易:', record);
  // 实现删除逻辑
};

const viewDetails = (record) => {
  console.log('查看详情:', record);
  // 实现详情查看
};

const handleSubmit = () => {
  console.log('提交表单:', formData.value);
  showAddModal.value = false;
  resetForm();
};

const resetForm = () => {
  formData.value = {
    type: 'expense',
    amount: null,
    category: '',
    account: '',
    date: dayjs(),
    description: '',
    status: 'completed',
    tags: [],
    attachments: []
  };
  editingTransaction.value = null;
};

const handleUpload = (info) => {
  console.log('文件上传:', info);
};

onMounted(() => {
  pagination.value.total = transactions.value.length;
});
</script>

<style scoped>
:deep(.ant-table-thead > tr > th) {
  background-color: #fafafa;
  font-weight: 600;
}

:deep(.ant-statistic-content-value) {
  font-size: 24px;
}
</style>