<template>
  <div class="budget-setting">
    <Modal
      v-model:open="visible"
      :title="title"
      width="500px"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <Form ref="formRef" :model="formData" :rules="rules" layout="vertical">
        <FormItem label="分类" name="categoryId">
          <Select
            v-model:value="formData.categoryId"
            placeholder="选择分类"
            :disabled="!!budget"
          >
            <SelectOption
              v-for="category in expenseCategories"
              :key="category.id"
              :value="category.id"
              :disabled="isCategoryBudgetExists(category.id)"
            >
              {{ category.icon }} {{ category.name }}
              <span v-if="isCategoryBudgetExists(category.id)" style="color: #999">
                (已设置预算)
              </span>
            </SelectOption>
          </Select>
        </FormItem>
        
        <Row :gutter="16">
          <Col :span="12">
            <FormItem label="预算周期" name="period">
              <Select
                v-model:value="formData.period"
                @change="handlePeriodChange"
              >
                <SelectOption value="monthly">月度预算</SelectOption>
                <SelectOption value="yearly">年度预算</SelectOption>
              </Select>
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="预算金额" name="amount">
              <InputNumber
                v-model:value="formData.amount"
                :min="0"
                :precision="2"
                placeholder="输入预算金额"
                style="width: 100%"
                :formatter="value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                :parser="value => value.replace(/\¥\s?|(,*)/g, '')"
              />
            </FormItem>
          </Col>
        </Row>
        
        <Row :gutter="16">
          <Col :span="12">
            <FormItem label="年份" name="year">
              <Select v-model:value="formData.year">
                <SelectOption
                  v-for="year in yearOptions"
                  :key="year"
                  :value="year"
                >
                  {{ year }}年
                </SelectOption>
              </Select>
            </FormItem>
          </Col>
          <Col :span="12" v-if="formData.period === 'monthly'">
            <FormItem label="月份" name="month">
              <Select v-model:value="formData.month">
                <SelectOption
                  v-for="month in 12"
                  :key="month"
                  :value="month"
                >
                  {{ month }}月
                </SelectOption>
              </Select>
            </FormItem>
          </Col>
        </Row>
        
        <FormItem label="货币" name="currency">
          <Select v-model:value="formData.currency">
            <SelectOption value="USD">USD ($)</SelectOption>
            <SelectOption value="CNY">CNY (¥)</SelectOption>
            <SelectOption value="THB">THB (฿)</SelectOption>
            <SelectOption value="MMK">MMK (K)</SelectOption>
          </Select>
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import type { Budget } from '#/types/finance';
import type { FormInstance, Rule } from 'ant-design-vue';

import {
  Col,
  Form,
  FormItem,
  InputNumber,
  Modal,
  Row,
  Select,
  SelectOption,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import { computed, ref, watch } from 'vue';

import { useBudgetStore } from '#/store/modules/budget';
import { useCategoryStore } from '#/store/modules/category';

interface Props {
  visible: boolean;
  budget?: Budget | null;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  budget: null,
});

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'success': [];
}>();

const budgetStore = useBudgetStore();
const categoryStore = useCategoryStore();

const formRef = ref<FormInstance>();
const formData = ref({
  categoryId: '',
  amount: 0,
  currency: 'CNY',
  period: 'monthly' as 'monthly' | 'yearly',
  year: dayjs().year(),
  month: dayjs().month() + 1,
});

const rules: Record<string, Rule[]> = {
  categoryId: [{ required: true, message: '请选择分类' }],
  amount: [
    { required: true, message: '请输入预算金额' },
    { type: 'number', min: 0.01, message: '预算金额必须大于0' },
  ],
  currency: [{ required: true, message: '请选择货币' }],
  period: [{ required: true, message: '请选择预算周期' }],
  year: [{ required: true, message: '请选择年份' }],
  month: [{ required: true, message: '请选择月份' }],
};

const title = computed(() => props.budget ? '编辑预算' : '设置预算');

const expenseCategories = computed(() =>
  categoryStore.categories.filter((c) => c.type === 'expense')
);

const yearOptions = computed(() => {
  const currentYear = dayjs().year();
  return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
});

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
});

const isCategoryBudgetExists = (categoryId: string) => {
  if (props.budget && props.budget.categoryId === categoryId) {
    return false;
  }
  return budgetStore.isBudgetExists(
    categoryId,
    formData.value.year,
    formData.value.period,
    formData.value.period === 'monthly' ? formData.value.month : undefined
  );
};

const handlePeriodChange = () => {
  if (formData.value.period === 'yearly') {
    formData.value.month = undefined as any;
  } else {
    formData.value.month = dayjs().month() + 1;
  }
};

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    
    const data = {
      ...formData.value,
      month: formData.value.period === 'monthly' ? formData.value.month : undefined,
    };
    
    if (props.budget) {
      await budgetStore.updateBudget(props.budget.id, data);
      message.success('预算更新成功');
    } else {
      await budgetStore.createBudget(data);
      message.success('预算设置成功');
    }
    
    emit('success');
    visible.value = false;
  } catch (error) {
    if (error !== 'Validation failed') {
      message.error(props.budget ? '更新预算失败' : '设置预算失败');
    }
  }
};

const handleCancel = () => {
  formRef.value?.resetFields();
  visible.value = false;
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      if (props.budget) {
        formData.value = {
          categoryId: props.budget.categoryId,
          amount: props.budget.amount,
          currency: props.budget.currency,
          period: props.budget.period,
          year: props.budget.year,
          month: props.budget.month || dayjs().month() + 1,
        };
      } else {
        formData.value = {
          categoryId: '',
          amount: 0,
          currency: 'CNY',
          period: 'monthly',
          year: dayjs().year(),
          month: dayjs().month() + 1,
        };
      }
    }
  }
);
</script>