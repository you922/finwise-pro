<script lang="ts" setup>
import type { FormInstance, Rule } from 'ant-design-vue/es/form';

import type { Transaction } from '#/types/finance';

import { computed, h, nextTick, reactive, ref, watch } from 'vue';

import { PlusOutlined } from '@ant-design/icons-vue';
import {
  AutoComplete,
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Row,
  Select,
  Space,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useCategoryStore } from '#/store/modules/category';
import { usePersonStore } from '#/store/modules/person';
import TagSelector from '#/views/finance/tag/components/tag-selector.vue';

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  transaction: null,
});
// Emits
const emit = defineEmits<{
  submit: [Partial<Transaction>];
  'update:visible': [boolean];
}>();
const FormItem = Form.Item;
const TextArea = Input.TextArea;

// Props
interface Props {
  visible: boolean;
  transaction?: null | Transaction;
}

// Store
const categoryStore = useCategoryStore();
const personStore = usePersonStore();

// 表单实例
const formRef = ref<FormInstance>();

// 表单数据
const formData = reactive<Partial<Transaction> & { dateValue?: any }>({
  type: 'expense',
  amount: 0,
  categoryId: '',
  currency: 'CNY',
  date: dayjs().format('YYYY-MM-DD'),
  dateValue: dayjs(), // DatePicker使用的dayjs对象
  description: '',
  project: '',
  payer: '',
  payee: '',
  recorder: '管理员',
  status: 'completed',
  quantity: 1,
  tags: [],
});

// 最近使用的记录
const recentProjects = ref<string[]>([]);
const recentDescriptions = ref<string[]>([]);
const showQuickCategory = ref(false);
const newCategoryName = ref('');

// 计算属性
const isEdit = computed(() => !!props.transaction);
const modalTitle = computed(() => (isEdit.value ? '编辑交易' : '新建交易'));
const categories = computed(() => {
  return categoryStore.categories.filter((c) => c.type === formData.type);
});
const persons = computed(() => personStore.persons);

// 表单规则
const rules: Record<string, Rule[]> = {
  type: [{ required: true, message: '请选择交易类型' }],
  amount: [{ required: true, message: '请输入金额' }],
  categoryId: [{ required: true, message: '请选择分类' }],
  currency: [{ required: true, message: '请选择货币' }],
  dateValue: [{ required: true, message: '请选择日期' }],
  status: [{ required: true, message: '请选择状态' }],
};

// 监听属性变化
watch(
  () => props.visible,
  async (newVal) => {
    if (newVal) {
      if (props.transaction) {
        // 编辑模式，填充数据
        Object.assign(formData, {
          ...props.transaction,
          date: props.transaction.date,
          dateValue: dayjs(props.transaction.date), // 转换为dayjs对象
        });
      } else {
        // 新建模式，重置数据
        formRef.value?.resetFields();
        Object.assign(formData, {
          type: 'expense',
          amount: 0,
          categoryId: '',
          currency: 'CNY',
          date: dayjs().format('YYYY-MM-DD'),
          dateValue: dayjs(),
          description: '',
          project: '',
          payer: '',
          payee: '',
          recorder: '管理员',
          status: 'completed',
          quantity: 1,
          tags: [],
        });
      }

      // 加载最近使用的记录
      loadRecentRecords();

      // 聚焦到金额输入框
      await nextTick();
      setTimeout(() => {
        const amountInput = document.querySelector(
          '.transaction-amount-input input',
        ) as HTMLInputElement;
        amountInput?.focus();
        amountInput?.select();
      }, 100);
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

    // 确保必要字段有值
    if (!formData.amount || formData.amount <= 0) {
      message.error('请输入有效的金额');
      return;
    }

    if (!formData.categoryId) {
      message.error('请选择分类');
      return;
    }

    // 处理日期格式
    const submitData = {
      ...formData,
      date:
        typeof formData.date === 'string'
          ? formData.date
          : dayjs(formData.date).format('YYYY-MM-DD'),
      tags: formData.tags || [],
      quantity: formData.quantity || 1,
    };

    // 保存最近使用的记录
    if (formData.project || formData.description) {
      saveRecentRecords(formData.project || '', formData.description || '');
    }

    emit('submit', submitData);
    emit('update:visible', false);
  } catch (error: any) {
    console.error('表单验证失败:', error);
    if (error?.errorFields?.length > 0) {
      message.error(error.errorFields[0].errors[0]);
    }
  }
}

// 类型改变时重置分类
function handleTypeChange() {
  formData.categoryId = '';
  showQuickCategory.value = false;
}

// 日期改变时更新date字符串
function handleDateChange(value: any) {
  if (value) {
    formData.date = dayjs(value).format('YYYY-MM-DD');
  }
}

// 加载最近使用的记录
function loadRecentRecords() {
  // 从本地存储加载最近的项目和描述
  const recentData = localStorage.getItem('recentTransactionData');
  if (recentData) {
    const parsed = JSON.parse(recentData);
    recentProjects.value = parsed.projects || [];
    recentDescriptions.value = parsed.descriptions || [];
  }
}

// 保存最近使用的记录
function saveRecentRecords(project: string, description: string) {
  if (project && !recentProjects.value.includes(project)) {
    recentProjects.value = [project, ...recentProjects.value.slice(0, 4)];
  }
  if (description && !recentDescriptions.value.includes(description)) {
    recentDescriptions.value = [
      description,
      ...recentDescriptions.value.slice(0, 4),
    ];
  }

  localStorage.setItem(
    'recentTransactionData',
    JSON.stringify({
      projects: recentProjects.value,
      descriptions: recentDescriptions.value,
    }),
  );
}

// 快速创建分类
async function handleQuickCreateCategory() {
  if (!newCategoryName.value) {
    message.warning('请输入分类名称');
    return;
  }

  try {
    const newCategory = await categoryStore.createCategory({
      name: newCategoryName.value,
      type: formData.type as 'expense' | 'income',
      icon: formData.type === 'income' ? '💰' : '💸',
      color: formData.type === 'income' ? '#52c41a' : '#ff4d4f',
      budget: 0,
    });

    formData.categoryId = newCategory.id;
    showQuickCategory.value = false;
    newCategoryName.value = '';
    message.success('分类创建成功');
  } catch {
    message.error('创建分类失败');
  }
}

// 处理金额输入的快捷键
function handleAmountKeydown(e: KeyboardEvent) {
  // 支持数学表达式
  if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
    const expression = e.target.value;
    try {
      // 简单的数学表达式计算
      const result = new Function(`"use strict"; return (${expression})`)();
      if (!isNaN(result)) {
        formData.amount = Number.parseFloat(result.toFixed(2));
      }
    } catch {
      // 不是有效的表达式，保持原值
    }
  }
}
</script>

<template>
  <Modal
    :open="visible"
    :title="modalTitle"
    :width="1200"
    @cancel="handleCancel"
    @ok="handleSubmit"
  >
    <Form ref="formRef" :model="formData" :rules="rules" layout="vertical">
      <!-- 第一行：交易类型、金额、货币 -->
      <Row :gutter="16">
        <Col :span="6">
          <Form.Item label="交易类型" name="type">
            <Radio.Group 
              v-model:value="formData.type" 
              @change="handleTypeChange"
              button-style="solid"
              size="default"
              style="width: 100%; display: flex;"
            >
              <Radio.Button value="expense" style="flex: 1; text-align: center;">
                <span>💸 支出</span>
              </Radio.Button>
              <Radio.Button value="income" style="flex: 1; text-align: center;">
                <span>💰 收入</span>
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Col>
        <Col :span="10">
          <Form.Item label="金额" name="amount">
            <InputNumber
              v-model:value="formData.amount"
              :min="0"
              :precision="2"
              placeholder="请输入金额"
              class="transaction-amount-input"
              style="width: 100%; height: 40px; font-size: 16px;"
              @keydown="handleAmountKeydown"
              :formatter="
                (value) => `${formData.currency === 'USD' ? '$' : formData.currency === 'THB' ? '฿' : formData.currency === 'MMK' ? 'K' : '¥'} ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              "
              :parser="(value) => value.replace(/[\$¥฿K]\s?|(,*)/g, '')"
            />
          </Form.Item>
        </Col>
        <Col :span="8">
          <Form.Item label="货币" name="currency">
            <Radio.Group 
              v-model:value="formData.currency"
              button-style="solid"
              size="default"
              style="width: 100%; display: flex; gap: 4px;"
            >
              <Radio.Button value="CNY" style="flex: 1; text-align: center; padding: 0 8px;">
                <span>¥ CNY</span>
              </Radio.Button>
              <Radio.Button value="USD" style="flex: 1; text-align: center; padding: 0 8px;">
                <span>$ USD</span>
              </Radio.Button>
              <Radio.Button value="THB" style="flex: 1; text-align: center; padding: 0 8px;">
                <span>฿ THB</span>
              </Radio.Button>
              <Radio.Button value="MMK" style="flex: 1; text-align: center; padding: 0 8px;">
                <span>K MMK</span>
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Col>
      </Row>

      <!-- 第二行：分类选择 -->
      <Form.Item label="分类" name="categoryId">
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          <Button
            v-for="category in categories"
            :key="category.id"
            :type="formData.categoryId === category.id ? 'primary' : 'default'"
            @click="formData.categoryId = category.id"
            style="min-width: 100px; height: 38px; border-radius: 6px; font-size: 13px;"
            :style="formData.categoryId === category.id ? 
              `background: ${category.color}; border-color: ${category.color}; color: white;` : 
              `border-color: ${category.color}; color: ${category.color};`"
          >
            <span style="font-size: 14px; margin-right: 3px;">{{ category.icon }}</span>
            <span>{{ category.name }}</span>
          </Button>
          <Button
            @click="showQuickCategory = true"
            :icon="h(PlusOutlined)"
            style="min-width: 100px; height: 38px; border-radius: 6px;"
            type="dashed"
          >
            添加分类
          </Button>
        </div>
      </Form.Item>

      <!-- 快速创建分类 -->
      <Row v-if="showQuickCategory" :gutter="16" style="margin-bottom: 16px">
        <Col :span="24">
          <Space.Compact style="width: 400px;">
            <Input
              v-model:value="newCategoryName"
              placeholder="输入新分类名称"
              @press-enter="handleQuickCreateCategory"
            />
            <Button type="primary" @click="handleQuickCreateCategory">
              创建
            </Button>
            <Button @click="showQuickCategory = false">取消</Button>
          </Space.Compact>
        </Col>
      </Row>

      <!-- 第三行：日期、状态、项目 -->
      <Row :gutter="16">
        <Col :span="6">
          <Form.Item label="日期" name="dateValue">
            <DatePicker
              v-model:value="formData.dateValue"
              format="YYYY-MM-DD"
              style="width: 100%;"
              :allow-clear="false"
              @change="handleDateChange"
            />
          </Form.Item>
        </Col>
        <Col :span="9">
          <Form.Item label="状态" name="status">
            <Radio.Group 
              v-model:value="formData.status"
              button-style="solid"
              style="width: 100%; display: flex; gap: 4px;"
            >
              <Radio.Button value="completed" style="flex: 1; text-align: center;">
                <span>✅ 已完成</span>
              </Radio.Button>
              <Radio.Button value="pending" style="flex: 1; text-align: center;">
                <span>⏳ 待处理</span>
              </Radio.Button>
              <Radio.Button value="cancelled" style="flex: 1; text-align: center;">
                <span>❌ 已取消</span>
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Col>
        <Col :span="9">
          <Form.Item label="项目" name="project">
            <AutoComplete
              v-model:value="formData.project"
              :options="recentProjects.map((p) => ({ value: p }))"
              placeholder="请输入项目名称（可选）"
              allow-clear
            />
          </Form.Item>
        </Col>
      </Row>

      <!-- 第四行：付款人、收款人、数量、单价 -->
      <Row :gutter="16">
        <Col :span="6">
          <Form.Item label="付款人" name="payer">
            <Select
              v-model:value="formData.payer"
              placeholder="选择或输入付款人"
              allow-clear
              show-search
              mode="combobox"
              :filter-option="
                (input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
              "
            >
              <Select.Option
                v-for="person in persons.filter((p) =>
                  p.roles.includes('payer'),
                )"
                :key="person.id"
                :value="person.name"
              >
                {{ person.name }}
              </Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col :span="6">
          <Form.Item label="收款人" name="payee">
            <Select
              v-model:value="formData.payee"
              placeholder="选择或输入收款人"
              allow-clear
              show-search
              mode="combobox"
              :filter-option="
                (input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
              "
            >
              <Select.Option
                v-for="person in persons.filter((p) =>
                  p.roles.includes('payee'),
                )"
                :key="person.id"
                :value="person.name"
              >
                {{ person.name }}
              </Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col :span="6">
          <Form.Item label="数量" name="quantity">
            <InputNumber
              v-model:value="formData.quantity"
              :min="1"
              placeholder="默认为1"
              style="width: 100%"
            />
          </Form.Item>
        </Col>
        <Col :span="6">
          <Form.Item label="单价（自动计算）">
            <InputNumber
              :value="
                formData.amount && formData.quantity > 1
                  ? (formData.amount / formData.quantity).toFixed(2)
                  : ''
              "
              :disabled="true"
              placeholder="自动计算"
              style="width: 100%"
              :formatter="(value) => (value ? `${formData.currency === 'USD' ? '$' : formData.currency === 'THB' ? '฿' : formData.currency === 'MMK' ? 'K' : '¥'} ${value}` : '')"
            />
          </Form.Item>
        </Col>
      </Row>

      <!-- 第五行：标签和描述 -->
      <Row :gutter="16">
        <Col :span="12">
          <Form.Item label="标签" name="tags">
            <TagSelector v-model:value="formData.tags" placeholder="选择标签" />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item label="描述" name="description">
            <AutoComplete
              v-model:value="formData.description"
              :options="recentDescriptions.map((d) => ({ value: d }))"
              style="width: 100%"
            >
              <template #default>
                <TextArea
                  v-model:value="formData.description"
                  :rows="2"
                  placeholder="请输入描述信息（可选）"
                />
              </template>
            </AutoComplete>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  </Modal>
</template>
