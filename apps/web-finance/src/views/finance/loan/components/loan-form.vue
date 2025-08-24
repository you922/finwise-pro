<script lang="ts" setup>
import type { FormInstance, Rule } from 'ant-design-vue/es/form';

import type { Loan } from '#/types/finance';

import { computed, reactive, ref, watch } from 'vue';

import {
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
} from 'ant-design-vue';
import dayjs from 'dayjs';

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  loan: null,
});
// Emits
const emit = defineEmits<{
  submit: [Partial<Loan>];
  'update:visible': [boolean];
}>();
const FormItem = Form.Item;
const TextArea = Input.TextArea;

// Props
interface Props {
  visible: boolean;
  loan?: Loan | null;
}

// 表单实例
const formRef = ref<FormInstance>();

// 表单数据
const formData = reactive<Partial<Loan>>({
  borrower: '',
  lender: '',
  amount: 0,
  currency: 'CNY',
  startDate: dayjs().format('YYYY-MM-DD'),
  dueDate: '',
  description: '',
  status: 'active',
});

// 计算属性
const isEdit = computed(() => !!props.loan);
const modalTitle = computed(() => (isEdit.value ? '编辑贷款' : '新建贷款'));

// 表单规则
const rules: Record<string, Rule[]> = {
  borrower: [
    { required: true, message: '请输入借款人' },
    { max: 50, message: '借款人姓名最多50个字符' },
  ],
  lender: [
    { required: true, message: '请输入出借人' },
    { max: 50, message: '出借人姓名最多50个字符' },
  ],
  amount: [
    { required: true, message: '请输入贷款金额' },
    { type: 'number', min: 0.01, message: '贷款金额必须大于0' },
  ],
  currency: [{ required: true, message: '请选择货币' }],
  startDate: [{ required: true, message: '请选择开始日期' }],
  status: [{ required: true, message: '请选择状态' }],
};

// 监听属性变化
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      if (props.loan) {
        // 编辑模式，填充数据
        Object.assign(formData, {
          borrower: props.loan.borrower,
          lender: props.loan.lender,
          amount: props.loan.amount,
          currency: props.loan.currency,
          startDate: props.loan.startDate,
          dueDate: props.loan.dueDate || '',
          description: props.loan.description || '',
          status: props.loan.status,
        });
      } else {
        // 新建模式，重置数据
        formRef.value?.resetFields();
        Object.assign(formData, {
          borrower: '',
          lender: '',
          amount: 0,
          currency: 'CNY',
          startDate: dayjs().format('YYYY-MM-DD'),
          dueDate: '',
          description: '',
          status: 'active',
        });
      }
    }
  },
);

// 处理取消
function handleCancel() {
  emit('update:visible', false);
}

// 处理提交
async function handleSubmit() {
  try {
    await formRef.value?.validateFields();

    // 处理日期格式
    const submitData = {
      ...formData,
      startDate: dayjs(formData.startDate).format('YYYY-MM-DD'),
      dueDate: formData.dueDate
        ? dayjs(formData.dueDate).format('YYYY-MM-DD')
        : undefined,
    };

    emit('submit', submitData);
    emit('update:visible', false);
  } catch (error) {
    console.error('表单验证失败:', error);
  }
}
</script>

<template>
  <Modal
    :open="visible"
    :title="modalTitle"
    :width="600"
    @cancel="handleCancel"
    @ok="handleSubmit"
  >
    <Form ref="formRef" :model="formData" :rules="rules" layout="vertical">
      <FormItem label="借款人" name="borrower">
        <Input
          v-model:value="formData.borrower"
          placeholder="请输入借款人姓名"
          maxlength="50"
        />
      </FormItem>

      <FormItem label="出借人" name="lender">
        <Input
          v-model:value="formData.lender"
          placeholder="请输入出借人姓名"
          maxlength="50"
        />
      </FormItem>

      <FormItem label="贷款金额" name="amount">
        <InputNumber
          v-model:value="formData.amount"
          :min="0.01"
          :precision="2"
          placeholder="请输入贷款金额"
          style="width: 100%"
        />
      </FormItem>

      <FormItem label="货币" name="currency">
        <Select v-model:value="formData.currency">
          <Select.Option value="USD">USD</Select.Option>
          <Select.Option value="CNY">CNY</Select.Option>
          <Select.Option value="THB">THB</Select.Option>
          <Select.Option value="MMK">MMK</Select.Option>
        </Select>
      </FormItem>

      <FormItem label="开始日期" name="startDate">
        <DatePicker
          v-model:value="formData.startDate"
          format="YYYY-MM-DD"
          style="width: 100%"
        />
      </FormItem>

      <FormItem label="到期日期" name="dueDate">
        <DatePicker
          v-model:value="formData.dueDate"
          format="YYYY-MM-DD"
          style="width: 100%"
          placeholder="选择到期日期（可选）"
        />
      </FormItem>

      <FormItem label="状态" name="status">
        <Select v-model:value="formData.status">
          <Select.Option value="active">进行中</Select.Option>
          <Select.Option value="paid">已还清</Select.Option>
          <Select.Option value="overdue">已逾期</Select.Option>
        </Select>
      </FormItem>

      <FormItem label="描述" name="description">
        <TextArea
          v-model:value="formData.description"
          :rows="3"
          placeholder="请输入贷款描述信息（可选）"
          maxlength="200"
          show-count
        />
      </FormItem>
    </Form>
  </Modal>
</template>
