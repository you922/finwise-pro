<script lang="ts" setup>
import type { Loan, LoanStatus } from '#/types/finance';

import { computed, h, onMounted, reactive, ref } from 'vue';

import { 
  BankOutlined,
  DeleteOutlined, 
  DollarOutlined,
  EditOutlined, 
  PlusCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue';
import { 
  Badge,
  Button, 
  Card, 
  Col,
  Descriptions,
  Empty,
  message, 
  Modal,
  Popconfirm, 
  Progress,
  Row,
  Select,
  Space, 
  Spin,
  Statistic,
  Table,
  Tag,
  Timeline,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useLoanStore } from '#/store/modules/loan';

import LoanForm from './components/loan-form.vue';
import RepaymentForm from './components/repayment-form.vue';

const DescriptionsItem = Descriptions.Item;
const TimelineItem = Timeline.Item;

// Store
const loanStore = useLoanStore();

// 状态
const loading = ref(false);
const loanFormVisible = ref(false);
const repaymentFormVisible = ref(false);
const currentLoan = ref<Loan | null>(null);
const statusFilter = ref<LoanStatus | 'all'>('all');
const expandedRowKeys = ref<string[]>([]);

// 状态映射
const statusMap: Record<LoanStatus, { text: string; color: string; status: any }> = {
  active: { text: '进行中', color: 'processing', status: 'processing' },
  paid: { text: '已还清', color: 'success', status: 'success' },
  overdue: { text: '已逾期', color: 'error', status: 'error' },
};

// 计算属性
const loans = computed(() => {
  if (statusFilter.value === 'all') {
    return loanStore.loans;
  }
  return loanStore.loans.filter(loan => loan.status === statusFilter.value);
});

const statistics = computed(() => loanStore.statistics);

// 表格列配置
const columns = [
  {
    title: '借款人',
    dataIndex: 'borrower',
    key: 'borrower',
    width: 120,
  },
  {
    title: '出借人',
    dataIndex: 'lender',
    key: 'lender',
    width: 120,
  },
  {
    title: '金额',
    dataIndex: 'amount',
    key: 'amount',
    width: 120,
    align: 'right' as const,
    customRender: ({ record }: { record: Loan }) => {
      return `¥${record.amount.toFixed(2)}`;
    },
  },
  {
    title: '货币',
    dataIndex: 'currency',
    key: 'currency',
    width: 80,
  },
  {
    title: '开始日期',
    dataIndex: 'startDate',
    key: 'startDate',
    width: 120,
  },
  {
    title: '到期日期',
    dataIndex: 'dueDate',
    key: 'dueDate',
    width: 120,
    customRender: ({ record }: { record: Loan }) => {
      if (!record.dueDate) return '-';
      const isOverdue = record.status === 'overdue' || 
        (record.status === 'active' && dayjs(record.dueDate).isBefore(dayjs()));
      return h('span', { 
        class: isOverdue ? 'text-red-500' : '' 
      }, record.dueDate);
    },
  },
  {
    title: '还款进度',
    key: 'progress',
    width: 150,
    customRender: ({ record }: { record: Loan }) => {
      const totalRepaid = record.repayments.reduce((sum, r) => sum + r.amount, 0);
      const percent = Math.min((totalRepaid / record.amount) * 100, 100);
      return h(Progress, {
        percent: percent,
        size: 'small',
        status: record.status === 'paid' ? 'success' : 'active'
      });
    },
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    customRender: ({ record }: { record: Loan }) => {
      const status = statusMap[record.status];
      return h(Badge, {
        status: status.status,
        text: status.text
      });
    },
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    fixed: 'right' as const,
    customRender: ({ record }: { record: Loan }) => {
      return h(Space, {}, () => {
        const buttons = [];
        
        if (record.status === 'active') {
          buttons.push(
            h(Button, {
              size: 'small',
              type: 'link',
              onClick: () => handleAddRepayment(record)
            }, () => [h(PlusCircleOutlined), ' 还款'])
          );
        }
        
        buttons.push(
          h(Button, {
            size: 'small',
            type: 'link',
            onClick: () => handleEdit(record)
          }, () => [h(EditOutlined), ' 编辑'])
        );
        
        buttons.push(
          h(Popconfirm, {
            title: '确定要删除这条贷款记录吗？',
            onConfirm: () => handleDelete(record.id)
          }, () => h(Button, {
            size: 'small',
            type: 'link',
            danger: true
          }, () => [h(DeleteOutlined), ' 删除']))
        );
        
        return buttons;
      });
    },
  },
];

// 展开行显示还款记录
const expandedRowRender = (record: Loan) => {
  if (record.repayments.length === 0) {
    return h(Empty, { description: '暂无还款记录' });
  }
  
  return h(Timeline, {}, () => 
    record.repayments.map((repayment) => 
      h(TimelineItem, { 
        key: repayment.id, 
        color: 'green' 
      }, () => 
        h(Space, {}, () => {
          const items = [
            h('span', {}, repayment.date),
            h('span', {}, `还款 ¥${repayment.amount.toFixed(2)}`)
          ];
          if (repayment.note) {
            items.push(h('span', {}, `(${repayment.note})`));
          }
          return items;
        })
      )
    )
  );
};

// 获取数据
async function fetchData() {
  loading.value = true;
  try {
    await Promise.all([
      loanStore.fetchLoans({ page: 1, pageSize: 100 }),
      loanStore.fetchStatistics(),
    ]);
  } finally {
    loading.value = false;
  }
}

// 新建
function handleCreate() {
  currentLoan.value = null;
  loanFormVisible.value = true;
}

// 编辑
function handleEdit(record: Loan) {
  currentLoan.value = record;
  loanFormVisible.value = true;
}

// 删除
async function handleDelete(id: string) {
  try {
    await loanStore.deleteLoan(id);
    message.success('删除成功');
  } catch (error) {
    message.error('删除失败');
  }
}

// 添加还款
function handleAddRepayment(loan: Loan) {
  currentLoan.value = loan;
  repaymentFormVisible.value = true;
}

// 处理贷款表单提交
async function handleLoanFormSubmit(formData: Partial<Loan>) {
  try {
    if (currentLoan.value) {
      // 编辑
      await loanStore.updateLoan(currentLoan.value.id, formData);
      message.success('更新成功');
    } else {
      // 新建
      await loanStore.createLoan(formData);
      message.success('创建成功');
    }
  } catch (error) {
    message.error('操作失败');
  }
}

// 处理还款表单提交
async function handleRepaymentFormSubmit(formData: any) {
  try {
    if (currentLoan.value) {
      await loanStore.addRepayment(currentLoan.value.id, formData);
      message.success('还款记录添加成功');
    }
  } catch (error) {
    message.error('操作失败');
  }
}

// 初始化
onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="p-4">
    <!-- 统计卡片 -->
    <Row :gutter="16" class="mb-4">
      <Col :lg="6" :md="12" :sm="24">
        <Card>
          <Statistic
            title="总出借金额"
            :value="statistics.totalLent"
            :precision="2"
            prefix="¥"
            :value-style="{ color: '#1890ff' }"
          />
        </Card>
      </Col>
      <Col :lg="6" :md="12" :sm="24">
        <Card>
          <Statistic
            title="已收回金额"
            :value="statistics.totalRepaid"
            :precision="2"
            prefix="¥"
            :value-style="{ color: '#52c41a' }"
          />
        </Card>
      </Col>
      <Col :lg="6" :md="12" :sm="24">
        <Card>
          <Statistic
            title="进行中贷款"
            :value="statistics.activeLoans"
            suffix="笔"
          />
        </Card>
      </Col>
      <Col :lg="6" :md="12" :sm="24">
        <Card>
          <Statistic
            title="逾期贷款"
            :value="statistics.overdueLoans"
            suffix="笔"
            :value-style="{ color: statistics.overdueLoans > 0 ? '#ff4d4f' : '' }"
          />
        </Card>
      </Col>
    </Row>

    <!-- 贷款列表 -->
    <Card>
      <div class="mb-4">
        <Space>
          <Button type="primary" @click="handleCreate">
            <PlusOutlined />
            新建贷款
          </Button>
          <Select
            v-model:value="statusFilter"
            style="width: 150px"
            placeholder="状态筛选"
          >
            <Select.Option value="all">全部</Select.Option>
            <Select.Option value="active">进行中</Select.Option>
            <Select.Option value="paid">已还清</Select.Option>
            <Select.Option value="overdue">已逾期</Select.Option>
          </Select>
        </Space>
      </div>

      <Table
        v-model:expandedRowKeys="expandedRowKeys"
        :columns="columns"
        :dataSource="loans"
        :loading="loading"
        :rowKey="(record: Loan) => record.id"
        :expandedRowRender="expandedRowRender"
        :scroll="{ x: 1200 }"
      />
    </Card>

    <!-- 贷款表单对话框 -->
    <LoanForm
      v-model:visible="loanFormVisible"
      :loan="currentLoan"
      @submit="handleLoanFormSubmit"
    />

    <!-- 还款表单对话框 -->
    <RepaymentForm
      v-model:visible="repaymentFormVisible"
      :loan="currentLoan"
      @submit="handleRepaymentFormSubmit"
    />
  </div>
</template>