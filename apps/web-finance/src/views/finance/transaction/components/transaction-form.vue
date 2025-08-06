<script lang="ts" setup>
import type { FormInstance, Rule } from 'ant-design-vue/es/form';
import type { Transaction } from '#/types/finance';

import { computed, reactive, ref, watch, nextTick, h } from 'vue';

import { 
  DatePicker, 
  Form, 
  Input, 
  InputNumber, 
  Modal, 
  Select,
  message,
  Row,
  Col,
  Button,
  Space,
  AutoComplete,
} from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';

import { useCategoryStore } from '#/store/modules/category';
import { usePersonStore } from '#/store/modules/person';
import TagSelector from '#/views/finance/tag/components/tag-selector.vue';

const FormItem = Form.Item;
const TextArea = Input.TextArea;

// Props
interface Props {
  visible: boolean;
  transaction?: Transaction | null;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  transaction: null,
});

// Emits
const emit = defineEmits<{
  'update:visible': [boolean];
  'submit': [Partial<Transaction>];
}>();

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
const modalTitle = computed(() => isEdit.value ? '编辑交易' : '新建交易');
const categories = computed(() => {
  return categoryStore.categories.filter(c => c.type === formData.type);
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
watch(() => props.visible, async (newVal) => {
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
      const amountInput = document.querySelector('.transaction-amount-input input') as HTMLInputElement;
      amountInput?.focus();
      amountInput?.select();
    }, 100);
  }
});

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
      date: typeof formData.date === 'string' 
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
    recentDescriptions.value = [description, ...recentDescriptions.value.slice(0, 4)];
  }
  
  localStorage.setItem('recentTransactionData', JSON.stringify({
    projects: recentProjects.value,
    descriptions: recentDescriptions.value,
  }));
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
      type: formData.type as 'income' | 'expense',
      icon: formData.type === 'income' ? '💰' : '💸',
      color: formData.type === 'income' ? '#52c41a' : '#ff4d4f',
      budget: 0,
    });
    
    formData.categoryId = newCategory.id;
    showQuickCategory.value = false;
    newCategoryName.value = '';
    message.success('分类创建成功');
  } catch (error) {
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
      const result = Function('"use strict"; return (' + expression + ')')();
      if (!isNaN(result)) {
        formData.amount = parseFloat(result.toFixed(2));
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
    :width="600"
    @cancel="handleCancel"
    @ok="handleSubmit"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="rules"
      layout="vertical"
    >
      <Row :gutter="16">
        <Col :span="8">
          <Form.Item label="交易类型" name="type">
            <Select v-model:value="formData.type" @change="handleTypeChange">
              <Select.Option value="income">收入</Select.Option>
              <Select.Option value="expense">支出</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col :span="16">
          <Form.Item label="分类" name="categoryId">
            <Space.Compact style="width: 100%">
              <Select 
                v-model:value="formData.categoryId" 
                placeholder="请选择分类"
                style="width: calc(100% - 32px)"
              >
                <Select.Option
                  v-for="category in categories"
                  :key="category.id"
                  :value="category.id"
                >
                  {{ category.icon }} {{ category.name }}
                </Select.Option>
              </Select>
              <Button 
                @click="showQuickCategory = true"
                :icon="h(PlusOutlined)"
                title="快速创建分类"
              />
            </Space.Compact>
          </Form.Item>
        </Col>
      </Row>

      <!-- 快速创建分类 -->
      <Row v-if="showQuickCategory" :gutter="16" style="margin-bottom: 16px">
        <Col :span="24">
          <Space.Compact style="width: 100%">
            <Input 
              v-model:value="newCategoryName"
              placeholder="输入新分类名称"
              @pressEnter="handleQuickCreateCategory"
            />
            <Button type="primary" @click="handleQuickCreateCategory">创建</Button>
            <Button @click="showQuickCategory = false">取消</Button>
          </Space.Compact>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <Form.Item label="金额" name="amount">
            <InputNumber
              v-model:value="formData.amount"
              :min="0"
              :precision="2"
              placeholder="请输入金额"
              class="transaction-amount-input"
              style="width: 100%"
              @keydown="handleAmountKeydown"
              :formatter="value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
              :parser="value => value.replace(/\¥\s?|(,*)/g, '')"
            />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item label="货币" name="currency">
            <Select v-model:value="formData.currency">
              <Select.Option value="USD">USD ($)</Select.Option>
              <Select.Option value="CNY">CNY (¥)</Select.Option>
              <Select.Option value="THB">THB (฿)</Select.Option>
              <Select.Option value="MMK">MMK (K)</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <Form.Item label="日期" name="dateValue">
            <DatePicker
              v-model:value="formData.dateValue"
              format="YYYY-MM-DD"
              style="width: 100%"
              :allowClear="false"
              @change="handleDateChange"
            />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item label="状态" name="status">
            <Select v-model:value="formData.status">
              <Select.Option value="pending">待处理</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label="项目" name="project">
        <AutoComplete
          v-model:value="formData.project"
          :options="recentProjects.map(p => ({ value: p }))"
          placeholder="请输入项目名称（可选）"
          allowClear
        />
      </Form.Item>

      <Row :gutter="16">
        <Col :span="12">
          <Form.Item label="付款人" name="payer">
            <Select
              v-model:value="formData.payer"
              placeholder="请选择或输入付款人"
              allowClear
              showSearch
              mode="combobox"
              :filterOption="(input, option) => 
                option.children.toLowerCase().includes(input.toLowerCase())"
            >
              <Select.Option
                v-for="person in persons.filter(p => p.roles.includes('payer'))"
                :key="person.id"
                :value="person.name"
              >
                {{ person.name }}
              </Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item label="收款人" name="payee">
            <Select
              v-model:value="formData.payee"
              placeholder="请选择或输入收款人"
              allowClear
              showSearch
              mode="combobox"
              :filterOption="(input, option) => 
                option.children.toLowerCase().includes(input.toLowerCase())"
            >
              <Select.Option
                v-for="person in persons.filter(p => p.roles.includes('payee'))"
                :key="person.id"
                :value="person.name"
              >
                {{ person.name }}
              </Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <Form.Item label="数量" name="quantity">
            <InputNumber
              v-model:value="formData.quantity"
              :min="1"
              placeholder="默认为1"
              style="width: 100%"
            />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item label="单价（选填）">
            <InputNumber
              :value="formData.amount && formData.quantity > 1 ? (formData.amount / formData.quantity).toFixed(2) : ''"
              :disabled="true"
              placeholder="自动计算"
              style="width: 100%"
              :formatter="value => value ? `¥ ${value}` : ''"
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label="标签" name="tags">
        <TagSelector v-model:value="formData.tags" placeholder="选择标签" />
      </Form.Item>
      
      <Form.Item label="描述" name="description">
        <AutoComplete
          v-model:value="formData.description"
          :options="recentDescriptions.map(d => ({ value: d }))"
          style="width: 100%"
        >
          <template #default>
            <TextArea
              v-model:value="formData.description"
              :rows="3"
              placeholder="请输入描述信息（可选）"
            />
          </template>
        </AutoComplete>
      </Form.Item>
    </Form>
  </Modal>
</template>