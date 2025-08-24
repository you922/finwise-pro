<script lang="ts" setup>
import type { FormInstance, Rule } from 'ant-design-vue/es/form';

import type { Person } from '#/types/finance';

import { computed, reactive, ref, watch } from 'vue';

import { Checkbox, Form, Input, Modal } from 'ant-design-vue';

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  person: null,
});
// Emits
const emit = defineEmits<{
  submit: [Partial<Person>];
  'update:visible': [boolean];
}>();
const FormItem = Form.Item;
const TextArea = Input.TextArea;
const CheckboxGroup = Checkbox.Group;

// Props
interface Props {
  visible: boolean;
  person?: null | Person;
}

// 表单实例
const formRef = ref<FormInstance>();

// 表单数据
const formData = reactive<Partial<Person>>({
  name: '',
  roles: [],
  contact: '',
  description: '',
});

// 角色选项
const roleOptions = [
  { label: '付款人', value: 'payer' },
  { label: '收款人', value: 'payee' },
  { label: '借款人', value: 'borrower' },
  { label: '出借人', value: 'lender' },
];

// 计算属性
const isEdit = computed(() => !!props.person);
const modalTitle = computed(() => (isEdit.value ? '编辑人员' : '新建人员'));

// 表单规则
const rules: Record<string, Rule[]> = {
  name: [
    { required: true, message: '请输入人员姓名' },
    { max: 50, message: '人员姓名最多50个字符' },
  ],
  roles: [{ required: true, message: '请选择至少一个角色', type: 'array' }],
  contact: [{ max: 100, message: '联系方式最多100个字符' }],
  description: [{ max: 200, message: '描述最多200个字符' }],
};

// 监听属性变化
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      if (props.person) {
        // 编辑模式，填充数据
        Object.assign(formData, {
          name: props.person.name,
          roles: [...props.person.roles],
          contact: props.person.contact || '',
          description: props.person.description || '',
        });
      } else {
        // 新建模式，重置数据
        formRef.value?.resetFields();
        Object.assign(formData, {
          name: '',
          roles: [],
          contact: '',
          description: '',
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
      <FormItem label="人员姓名" name="name">
        <Input
          v-model:value="formData.name"
          placeholder="请输入人员姓名"
          maxlength="50"
          show-count
        />
      </FormItem>

      <FormItem label="角色" name="roles">
        <CheckboxGroup v-model:value="formData.roles" :options="roleOptions" />
      </FormItem>

      <FormItem label="联系方式" name="contact">
        <Input
          v-model:value="formData.contact"
          placeholder="请输入联系方式（手机号、邮箱等）"
          maxlength="100"
        />
      </FormItem>

      <FormItem label="描述" name="description">
        <TextArea
          v-model:value="formData.description"
          placeholder="请输入人员描述信息"
          :rows="3"
          maxlength="200"
          show-count
        />
      </FormItem>
    </Form>
  </Modal>
</template>
