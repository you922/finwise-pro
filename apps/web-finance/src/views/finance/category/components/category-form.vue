<script lang="ts" setup>
import type { FormInstance, Rule } from 'ant-design-vue/es/form';

import type { Category } from '#/types/finance';

import { computed, reactive, ref, watch } from 'vue';

import { Form, Input, Modal, Select } from 'ant-design-vue';

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  category: null,
  defaultType: 'income',
});

// Emits
const emit = defineEmits<{
  submit: [Partial<Category>];
  'update:visible': [boolean];
}>();

const FormItem = Form.Item;

// Props
interface Props {
  visible: boolean;
  category?: Category | null;
  defaultType?: 'expense' | 'income';
}

// 表单实例
const formRef = ref<FormInstance>();

// 表单数据
const formData = reactive<Partial<Category>>({
  name: '',
  type: props.defaultType,
});

// 计算属性
const isEdit = computed(() => !!props.category);
const modalTitle = computed(() => (isEdit.value ? '编辑分类' : '新建分类'));

// 表单规则
const rules: Record<string, Rule[]> = {
  name: [
    { required: true, message: '请输入分类名称' },
    { max: 20, message: '分类名称最多20个字符' },
  ],
  type: [{ required: true, message: '请选择分类类型' }],
};

// 监听属性变化
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      if (props.category) {
        // 编辑模式，填充数据
        Object.assign(formData, {
          name: props.category.name,
          type: props.category.type,
        });
      } else {
        // 新建模式，重置数据
        formRef.value?.resetFields();
        Object.assign(formData, {
          name: '',
          type: props.defaultType,
        });
      }
    }
  },
);

// 监听默认类型变化
watch(
  () => props.defaultType,
  (newVal) => {
    if (!props.category) {
      formData.type = newVal;
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
    emit('submit', { ...formData });
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
    :width="500"
    @cancel="handleCancel"
    @ok="handleSubmit"
  >
    <Form ref="formRef" :model="formData" :rules="rules" layout="vertical">
      <FormItem label="分类名称" name="name">
        <Input
          v-model:value="formData.name"
          placeholder="请输入分类名称"
          maxlength="20"
          show-count
        />
      </FormItem>

      <FormItem label="分类类型" name="type">
        <Select v-model:value="formData.type" :disabled="isEdit">
          <Select.Option value="income">收入</Select.Option>
          <Select.Option value="expense">支出</Select.Option>
        </Select>
      </FormItem>
    </Form>
  </Modal>
</template>
