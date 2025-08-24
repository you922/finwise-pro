<script lang="ts" setup>
import type { FormInstance, Rule } from 'ant-design-vue/es/form';

import type { Loan, LoanRepayment } from '#/types/finance';

import { computed, reactive, ref, watch } from 'vue';

import { DatePicker, Form, Input, InputNumber, Modal } from 'ant-design-vue';
import dayjs from 'dayjs';

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  loan: null,
});
// Emits
const emit = defineEmits<{
  submit: [Partial<LoanRepayment>];
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
const formData = reactive<Partial<LoanRepayment>>({
  amount: 0,
  currency: 'CNY',
  date: dayjs().format('YYYY-MM-DD'),
  note: '',
});

// 计算属性
const remainingAmount = computed(() => {
  if (!props.loan) return 0;
  const totalRepaid = props.loan.repayments.reduce(
    (sum, r) => sum + r.amount,
    0,
  );
  return props.loan.amount - totalRepaid;
});

// 表单规则
const rules: Record<string, Rule[]> = {
  amount: [
    { required: true, message: '请输入还款金额' },
    { type: 'number', min: 0.01, message: '还款金额必须大于0' },
    {
      validator: (rule, value) => {
        if (value > remainingAmount.value) {
          return Promise.reject(
            `还款金额不能超过剩余金额 ¥${remainingAmount.value.toFixed(2)}`,
          );
        }
        return Promise.resolve();
      },
    },
  ],
  currency: [{ required: true, message: '请选择货币' }],
  date: [{ required: true, message: '请选择还款日期' }],
  note: [{ max: 200, message: '备注最多200个字符' }],
};

// 监听属性变化
watch(
  () => props.visible,
  (newVal) => {
    if (newVal && props.loan) {
      // 重置表单
      formRef.value?.resetFields();
      Object.assign(formData, {
        amount: remainingAmount.value,
        currency: props.loan.currency,
        date: dayjs().format('YYYY-MM-DD'),
        note: '',
      });
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
      date: dayjs(formData.date).format('YYYY-MM-DD'),
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
    title="添加还款记录"
    :width="500"
    @cancel="handleCancel"
    @ok="handleSubmit"
  >
    <div v-if="loan" class="mb-4">
      <p>借款人：{{ loan.borrower }}</p>
      <p>出借人：{{ loan.lender }}</p>
      <p>贷款金额：¥{{ loan.amount.toFixed(2) }}</p>
      <p>
        剩余金额：<span class="font-bold text-red-500"
          >¥{{ remainingAmount.toFixed(2) }}</span
        >
      </p>
    </div>

    <Form ref="formRef" :model="formData" :rules="rules" layout="vertical">
      <FormItem label="还款金额" name="amount">
        <InputNumber
          v-model:value="formData.amount"
          :min="0.01"
          :max="remainingAmount"
          :precision="2"
          placeholder="请输入还款金额"
          style="width: 100%"
        />
      </FormItem>

      <FormItem label="货币" name="currency">
        <Input v-model:value="formData.currency" disabled />
      </FormItem>

      <FormItem label="还款日期" name="date">
        <DatePicker
          v-model:value="formData.date"
          format="YYYY-MM-DD"
          style="width: 100%"
        />
      </FormItem>

      <FormItem label="备注" name="note">
        <TextArea
          v-model:value="formData.note"
          :rows="3"
          placeholder="请输入备注信息（可选）"
          maxlength="200"
          show-count
        />
      </FormItem>
    </Form>
  </Modal>
</template>
