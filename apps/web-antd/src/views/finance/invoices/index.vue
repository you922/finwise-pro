<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">📄 发票管理</h1>
      <p class="text-gray-600">管理进项发票、销项发票，支持OCR识别和自动记账</p>
    </div>

    <!-- 发票统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card class="text-center hover:shadow-lg transition-shadow">
        <div class="space-y-2">
          <div class="text-3xl">📤</div>
          <p class="text-sm text-gray-500">待开发票</p>
          <p class="text-2xl font-bold text-orange-600">{{ invoiceStats.pending }}</p>
        </div>
      </Card>
      <Card class="text-center hover:shadow-lg transition-shadow">
        <div class="space-y-2">
          <div class="text-3xl">✅</div>
          <p class="text-sm text-gray-500">已开发票</p>
          <p class="text-2xl font-bold text-green-600">{{ invoiceStats.issued }}</p>
        </div>
      </Card>
      <Card class="text-center hover:shadow-lg transition-shadow">
        <div class="space-y-2">
          <div class="text-3xl">📥</div>
          <p class="text-sm text-gray-500">收到发票</p>
          <p class="text-2xl font-bold text-blue-600">{{ invoiceStats.received }}</p>
        </div>
      </Card>
      <Card class="text-center hover:shadow-lg transition-shadow">
        <div class="space-y-2">
          <div class="text-3xl">💰</div>
          <p class="text-sm text-gray-500">发票金额</p>
          <p class="text-2xl font-bold text-purple-600">¥{{ invoiceStats.totalAmount.toLocaleString() }}</p>
        </div>
      </Card>
    </div>

    <!-- 操作工具栏 -->
    <Card class="mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <Input placeholder="搜索发票号码、客户..." style="width: 300px" />
          <Select placeholder="发票类型" style="width: 150px">
            <Select.Option value="sales">销项发票</Select.Option>
            <Select.Option value="purchase">进项发票</Select.Option>
            <Select.Option value="special">专用发票</Select.Option>
            <Select.Option value="ordinary">普通发票</Select.Option>
          </Select>
          <Select placeholder="状态" style="width: 120px">
            <Select.Option value="pending">待开具</Select.Option>
            <Select.Option value="issued">已开具</Select.Option>
            <Select.Option value="cancelled">已作废</Select.Option>
          </Select>
          <RangePicker placeholder="['开始日期', '结束日期']" />
        </div>
        <div class="flex space-x-2">
          <Button type="primary" @click="showCreateInvoice = true">
            📝 开具发票
          </Button>
          <Button @click="showOcrUpload = true">
            📷 OCR识别
          </Button>
          <Button @click="batchImport">
            📥 批量导入
          </Button>
        </div>
      </div>
    </Card>

    <!-- 发票列表 -->
    <Card title="📋 发票清单">
      <div v-if="invoices.length === 0" class="text-center py-12">
        <div class="text-8xl mb-6">📄</div>
        <h3 class="text-xl font-medium text-gray-800 mb-2">暂无发票记录</h3>
        <p class="text-gray-500 mb-6">开始管理您的发票，支持OCR自动识别</p>
        <div class="space-x-4">
          <Button type="primary" size="large" @click="showCreateInvoice = true">
            📝 开具发票
          </Button>
          <Button size="large" @click="showOcrUpload = true">
            📷 上传识别
          </Button>
        </div>
      </div>
      <Table v-else :columns="invoiceColumns" :dataSource="invoices" :pagination="{ pageSize: 10 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'amount'">
            <span class="font-semibold text-blue-600">
              ¥{{ record.amount.toLocaleString() }}
            </span>
          </template>
          <template v-else-if="column.dataIndex === 'status'">
            <Tag :color="getInvoiceStatusColor(record.status)">
              {{ getInvoiceStatusText(record.status) }}
            </Tag>
          </template>
          <template v-else-if="column.dataIndex === 'action'">
            <Space>
              <Button type="link" size="small">查看</Button>
              <Button type="link" size="small">编辑</Button>
              <Button type="link" size="small">下载</Button>
              <Button type="link" size="small" danger>作废</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- OCR上传模态框 -->
    <Modal v-model:open="showOcrUpload" title="📷 OCR发票识别" width="600px">
      <div class="text-center py-8">
        <Upload
          :customRequest="handleOcrUpload"
          accept="image/*,.pdf"
          list-type="picture-card"
          :show-upload-list="false"
          :multiple="false"
        >
          <div class="p-8">
            <div class="text-6xl mb-4">📷</div>
            <p class="text-lg font-medium mb-2">上传发票图片或PDF</p>
            <p class="text-sm text-gray-500">支持自动OCR识别发票信息</p>
            <p class="text-xs text-gray-400 mt-2">支持格式: JPG, PNG, PDF</p>
          </div>
        </Upload>
      </div>
      
      <div v-if="ocrResult" class="mt-6 p-4 bg-green-50 rounded-lg">
        <h4 class="font-medium text-green-800 mb-3">🎉 识别成功</h4>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div><span class="text-gray-600">发票号码:</span> {{ ocrResult.invoiceNumber }}</div>
          <div><span class="text-gray-600">开票日期:</span> {{ ocrResult.issueDate }}</div>
          <div><span class="text-gray-600">销售方:</span> {{ ocrResult.seller }}</div>
          <div><span class="text-gray-600">购买方:</span> {{ ocrResult.buyer }}</div>
          <div><span class="text-gray-600">金额:</span> ¥{{ ocrResult.amount }}</div>
          <div><span class="text-gray-600">税额:</span> ¥{{ ocrResult.tax }}</div>
        </div>
        <div class="mt-4">
          <Button type="primary" @click="saveOcrInvoice">保存到系统</Button>
          <Button @click="ocrResult = null" class="ml-2">重新识别</Button>
        </div>
      </div>
    </Modal>

    <!-- 创建发票模态框 -->
    <Modal v-model:open="showCreateInvoice" title="📝 开具发票" width="800px">
      <Form :model="invoiceForm" layout="vertical">
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item label="发票类型" required>
              <Select v-model:value="invoiceForm.type">
                <Select.Option value="sales">销项发票</Select.Option>
                <Select.Option value="purchase">进项发票</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="发票代码">
              <Input v-model:value="invoiceForm.code" placeholder="自动生成" />
            </Form.Item>
          </Col>
        </Row>

        <Row :gutter="16">
          <Col :span="12">
            <Form.Item label="客户/供应商" required>
              <AutoComplete
                v-model:value="invoiceForm.customer"
                :options="customerOptions"
                placeholder="输入或选择客户"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="开票日期" required>
              <DatePicker v-model:value="invoiceForm.issueDate" style="width: 100%" />
            </Form.Item>
          </Col>
        </Row>

        <!-- 发票项目明细 -->
        <Form.Item label="发票明细">
          <Table :columns="invoiceItemColumns" :dataSource="invoiceForm.items" :pagination="false" size="small">
            <template #footer>
              <Button type="dashed" block @click="addInvoiceItem">
                ➕ 添加明细项
              </Button>
            </template>
          </Table>
        </Form.Item>

        <!-- 税务信息 -->
        <Row :gutter="16">
          <Col :span="8">
            <Form.Item label="税率">
              <Select v-model:value="invoiceForm.taxRate">
                <Select.Option value="0">0% (免税)</Select.Option>
                <Select.Option value="3">3%</Select.Option>
                <Select.Option value="6">6%</Select.Option>
                <Select.Option value="9">9%</Select.Option>
                <Select.Option value="13">13%</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item label="金额合计">
              <Input :value="`¥${calculateTotal().toLocaleString()}`" disabled />
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item label="税额">
              <Input :value="`¥${calculateTax().toLocaleString()}`" disabled />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="备注">
          <Input.TextArea v-model:value="invoiceForm.notes" :rows="3" placeholder="发票备注信息..." />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Card, Input, Select, RangePicker, Button, Table, Tag, Space, Modal,
  Upload, Form, Row, Col, DatePicker, AutoComplete
} from 'ant-design-vue';
import dayjs from 'dayjs';

defineOptions({ name: 'InvoiceManagement' });

const showOcrUpload = ref(false);
const showCreateInvoice = ref(false);
const ocrResult = ref(null);

// 发票统计（无虚拟数据）
const invoiceStats = ref({
  pending: 0,
  issued: 0,
  received: 0,
  totalAmount: 0
});

// 发票列表（空数据）
const invoices = ref([]);

// 发票表格列
const invoiceColumns = [
  { title: '发票号码', dataIndex: 'invoiceNumber', key: 'invoiceNumber', width: 150 },
  { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
  { title: '客户/供应商', dataIndex: 'customer', key: 'customer' },
  { title: '开票日期', dataIndex: 'issueDate', key: 'issueDate', width: 120 },
  { title: '金额', dataIndex: 'amount', key: 'amount', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 200 }
];

// 发票明细表格列
const invoiceItemColumns = [
  { title: '项目名称', dataIndex: 'name', key: 'name' },
  { title: '规格型号', dataIndex: 'specification', key: 'specification' },
  { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 100 },
  { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice', width: 100 },
  { title: '金额', dataIndex: 'amount', key: 'amount', width: 100 },
  { title: '操作', key: 'action', width: 80 }
];

// 客户选项（空数据）
const customerOptions = ref([]);

// 发票表单
const invoiceForm = ref({
  type: 'sales',
  code: '',
  customer: '',
  issueDate: dayjs(),
  taxRate: 13,
  items: [],
  notes: ''
});

// 方法实现
const getInvoiceStatusColor = (status: string) => {
  const statusMap = { 'pending': 'orange', 'issued': 'green', 'cancelled': 'red' };
  return statusMap[status] || 'default';
};

const getInvoiceStatusText = (status: string) => {
  const textMap = { 'pending': '待开具', 'issued': '已开具', 'cancelled': '已作废' };
  return textMap[status] || status;
};

const calculateTotal = () => {
  return invoiceForm.value.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
};

const calculateTax = () => {
  return calculateTotal() * (invoiceForm.value.taxRate / 100);
};

const handleOcrUpload = (info) => {
  console.log('OCR上传处理:', info);
  // 模拟OCR识别结果
  setTimeout(() => {
    ocrResult.value = {
      invoiceNumber: 'INV' + Date.now(),
      issueDate: dayjs().format('YYYY-MM-DD'),
      seller: '示例公司',
      buyer: '客户公司',
      amount: '1000.00',
      tax: '130.00'
    };
  }, 2000);
};

const saveOcrInvoice = () => {
  console.log('保存OCR识别的发票:', ocrResult.value);
  showOcrUpload.value = false;
  ocrResult.value = null;
};

const addInvoiceItem = () => {
  invoiceForm.value.items.push({
    name: '',
    specification: '',
    quantity: 1,
    unitPrice: 0,
    amount: 0
  });
};

const batchImport = () => {
  console.log('批量导入发票');
};
</script>

<style scoped>
.grid { display: grid; }
</style>