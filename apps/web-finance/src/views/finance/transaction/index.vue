<script lang="ts" setup>
import type { Transaction } from '#/types/finance';

import { computed, h, onMounted, onUnmounted, reactive, ref } from 'vue';

import { 
  DeleteOutlined, 
  EditOutlined, 
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue';
import { 
  Button, 
  Card, 
  DatePicker, 
  Form, 
  Input, 
  message, 
  Modal, 
  Popconfirm, 
  Select, 
  Space, 
  Table,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useCategoryStore } from '#/store/modules/category';
import { usePersonStore } from '#/store/modules/person';
import { useTransactionStore } from '#/store/modules/transaction';

import ImportExport from './components/import-export.vue';
import TransactionForm from './components/transaction-form.vue';

const { RangePicker } = DatePicker;
const FormItem = Form.Item;

// Store
const transactionStore = useTransactionStore();
const categoryStore = useCategoryStore();
const personStore = usePersonStore();

// 状态
const loading = ref(false);
const selectedRowKeys = ref<string[]>([]);
const formVisible = ref(false);
const currentTransaction = ref<Transaction | null>(null);
const searchForm = reactive({
  keyword: '',
  type: undefined as 'income' | 'expense' | undefined,
  categoryId: undefined as string | undefined,
  currency: undefined as string | undefined,
  dateRange: [] as any[],
});

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

// 计算属性
const transactions = computed(() => transactionStore.transactions);
const categories = computed(() => categoryStore.categories);
const persons = computed(() => personStore.persons);

// 表格列配置
const columns = [
  {
    title: '日期',
    dataIndex: 'date',
    key: 'date',
    width: 120,
    sorter: true,
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 80,
    customRender: ({ record }: { record: Transaction }) => {
      const color = record.type === 'income' ? 'green' : 'red';
      const text = record.type === 'income' ? '收入' : '支出';
      return h(Tag, { color }, () => text);
    },
  },
  {
    title: '分类',
    dataIndex: 'categoryId',
    key: 'categoryId',
    width: 120,
    customRender: ({ record }: { record: Transaction }) => {
      const category = categories.value.find(c => c.id === record.categoryId);
      return category?.name || '-';
    },
  },
  {
    title: '金额',
    dataIndex: 'amount',
    key: 'amount',
    width: 120,
    align: 'right' as const,
    customRender: ({ record }: { record: Transaction }) => {
      const color = record.type === 'income' ? 'text-green-600' : 'text-red-600';
      return h('span', { class: color }, `¥${record.amount.toFixed(2)}`);
    },
  },
  {
    title: '货币',
    dataIndex: 'currency',
    key: 'currency',
    width: 80,
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,
  },
  {
    title: '项目',
    dataIndex: 'project',
    key: 'project',
    width: 120,
  },
  {
    title: '付款人',
    dataIndex: 'payer',
    key: 'payer',
    width: 100,
  },
  {
    title: '收款人',
    dataIndex: 'payee',
    key: 'payee',
    width: 100,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    customRender: ({ record }: { record: Transaction }) => {
      const statusMap = {
        pending: { color: 'orange', text: '待处理' },
        completed: { color: 'green', text: '已完成' },
        cancelled: { color: 'red', text: '已取消' },
      };
      const status = statusMap[record.status];
      return h(Tag, { color: status.color }, () => status.text);
    },
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    fixed: 'right' as const,
    customRender: ({ record }: { record: Transaction }) => {
      return h(Space, {}, () => [
        h(Button, {
          size: 'small',
          type: 'link',
          onClick: () => handleEdit(record)
        }, () => [h(EditOutlined), ' 编辑']),
        h(Popconfirm, {
          title: '确定要删除这条记录吗？',
          onConfirm: () => handleDelete(record.id)
        }, () => h(Button, {
          size: 'small',
          type: 'link',
          danger: true
        }, () => [h(DeleteOutlined), ' 删除']))
      ]);
    },
  },
];

// 获取数据
async function fetchData() {
  loading.value = true;
  try {
    console.log('开始加载交易数据...');
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      type: searchForm.type,
      categoryId: searchForm.categoryId,
      currency: searchForm.currency,
      dateFrom: searchForm.dateRange[0] ? dayjs(searchForm.dateRange[0]).format('YYYY-MM-DD') : undefined,
      dateTo: searchForm.dateRange[1] ? dayjs(searchForm.dateRange[1]).format('YYYY-MM-DD') : undefined,
    };
    
    const result = await transactionStore.fetchTransactions(params);
    pagination.total = result.total;
    console.log('交易数据加载成功，共', result.total, '条');
  } catch (error) {
    console.error('加载交易数据失败:', error);
    message.error('加载交易数据失败，请刷新重试');
  } finally {
    loading.value = false;
  }
}

// 搜索
function handleSearch() {
  pagination.current = 1;
  fetchData();
}

// 重置搜索
function handleReset() {
  searchForm.keyword = '';
  searchForm.type = undefined;
  searchForm.categoryId = undefined;
  searchForm.currency = undefined;
  searchForm.dateRange = [];
  handleSearch();
}

// 新建
function handleCreate() {
  currentTransaction.value = null;
  formVisible.value = true;
}

// 编辑
function handleEdit(record: Transaction) {
  currentTransaction.value = record;
  formVisible.value = true;
}

// 处理表单提交
async function handleFormSubmit(formData: Partial<Transaction>) {
  try {
    console.log('提交交易数据:', formData);
    if (currentTransaction.value) {
      // 编辑
      await transactionStore.updateTransaction(currentTransaction.value.id, formData);
      message.success('更新成功');
    } else {
      // 新建
      await transactionStore.createTransaction(formData);
      message.success('创建成功');
    }
    fetchData();
  } catch (error: any) {
    console.error('提交失败:', error);
    message.error(error.message || '操作失败');
  }
}

// 删除
async function handleDelete(id: string) {
  try {
    await transactionStore.deleteTransaction(id);
    message.success('删除成功');
    fetchData();
  } catch (error) {
    message.error('删除失败');
  }
}

// 批量删除
async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择要删除的记录');
    return;
  }
  
  Modal.confirm({
    title: '批量删除确认',
    content: `确定要删除选中的 ${selectedRowKeys.value.length} 条记录吗？`,
    onOk: async () => {
      try {
        await transactionStore.batchDeleteTransactions(selectedRowKeys.value);
        message.success('批量删除成功');
        selectedRowKeys.value = [];
        fetchData();
      } catch (error) {
        message.error('批量删除失败');
      }
    },
  });
}


// 表格变化
function handleTableChange(paginationConfig: any, filters: any, sorter: any) {
  pagination.current = paginationConfig.current;
  pagination.pageSize = paginationConfig.pageSize;
  fetchData();
}

// 全局快捷键处理
function handleGlobalKeydown(e: KeyboardEvent) {
  // Ctrl/Cmd + N 新建交易
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    handleCreate();
  }
}

// 初始化
onMounted(async () => {
  try {
    console.log('开始加载交易页面数据...');
    
    // 加载基础数据
    const loadPromises = [
      categoryStore.fetchCategories().catch(err => {
        console.error('加载分类失败:', err);
        message.error('加载分类数据失败');
      }),
      personStore.fetchPersons().catch(err => {
        console.error('加载人员失败:', err);
        message.error('加载人员数据失败');
      }),
    ];
    
    await Promise.allSettled(loadPromises);
    console.log('基础数据加载完成');
    
    // 加载交易数据
    fetchData();
    
    // 添加快捷键支持
    document.addEventListener('keydown', handleGlobalKeydown);
  } catch (error) {
    console.error('页面初始化失败:', error);
    message.error('页面加载失败，请刷新重试');
  }
});

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown);
});
</script>

<template>
  <div class="p-4">
    <!-- 搜索区域 -->
    <Card class="mb-4">
      <Form layout="inline">
        <FormItem label="关键词">
          <Input
            v-model:value="searchForm.keyword"
            placeholder="请输入关键词"
            style="width: 200px"
            @pressEnter="handleSearch"
          />
        </FormItem>
        <FormItem label="类型">
          <Select
            v-model:value="searchForm.type"
            placeholder="请选择"
            style="width: 120px"
            allowClear
          >
            <Select.Option value="income">收入</Select.Option>
            <Select.Option value="expense">支出</Select.Option>
          </Select>
        </FormItem>
        <FormItem label="分类">
          <Select
            v-model:value="searchForm.categoryId"
            placeholder="请选择"
            style="width: 150px"
            allowClear
          >
            <Select.Option
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </Select.Option>
          </Select>
        </FormItem>
        <FormItem label="货币">
          <Select
            v-model:value="searchForm.currency"
            placeholder="请选择"
            style="width: 100px"
            allowClear
          >
            <Select.Option value="USD">USD</Select.Option>
            <Select.Option value="CNY">CNY</Select.Option>
            <Select.Option value="THB">THB</Select.Option>
            <Select.Option value="MMK">MMK</Select.Option>
          </Select>
        </FormItem>
        <FormItem label="日期范围">
          <RangePicker
            v-model:value="searchForm.dateRange"
            format="YYYY-MM-DD"
          />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSearch">
              <SearchOutlined />
              搜索
            </Button>
            <Button @click="handleReset">重置</Button>
          </Space>
        </FormItem>
      </Form>
    </Card>

    <!-- 操作区域 -->
    <Card>
      <div class="mb-4">
        <Space>
          <Button type="primary" @click="handleCreate">
            <PlusOutlined />
            新建交易
          </Button>
          <Button
            danger
            :disabled="selectedRowKeys.length === 0"
            @click="handleBatchDelete"
          >
            <DeleteOutlined />
            批量删除
          </Button>
          
          <!-- 导入导出 -->
          <ImportExport />
        </Space>
      </div>

      <!-- 表格 -->
      <Table
        v-model:selectedRowKeys="selectedRowKeys"
        :columns="columns"
        :dataSource="transactions"
        :loading="loading"
        :pagination="pagination"
        :rowKey="(record: Transaction) => record.id"
        :rowSelection="{
          type: 'checkbox',
          selectedRowKeys,
        }"
        :scroll="{ x: 1500 }"
        @change="handleTableChange"
      />
    </Card>

    <!-- 表单对话框 -->
    <TransactionForm
      v-model:visible="formVisible"
      :transaction="currentTransaction"
      @submit="handleFormSubmit"
    />
  </div>
</template>