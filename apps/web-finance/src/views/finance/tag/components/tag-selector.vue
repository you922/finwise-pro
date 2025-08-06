<template>
  <div class="tag-selector">
    <Select
      v-model:value="selectedTags"
      mode="multiple"
      placeholder="选择标签"
      :options="tagOptions"
      :loading="loading"
      allowClear
      showSearch
      :filterOption="filterOption"
      @change="handleChange"
    >
      <template #tagRender="{ label, value, closable, onClose }">
        <Tag
          :color="getTagColor(value)"
          :closable="closable"
          @close="onClose"
          style="margin-right: 4px"
        >
          {{ label }}
        </Tag>
      </template>
    </Select>
    
    <!-- 快速创建标签 -->
    <div v-if="showQuickCreate" class="quick-create">
      <Button type="link" size="small" @click="showCreateModal = true">
        <PlusOutlined /> 创建新标签
      </Button>
    </div>
    
    <!-- 创建标签弹窗 -->
    <Modal
      v-model:open="showCreateModal"
      title="创建新标签"
      :width="400"
      @ok="handleCreateTag"
      @cancel="resetCreateForm"
    >
      <Form ref="createFormRef" :model="createForm" :rules="createRules">
        <FormItem label="标签名称" name="name">
          <Input
            v-model:value="createForm.name"
            placeholder="输入标签名称"
            @pressEnter="handleCreateTag"
          />
        </FormItem>
        <FormItem label="标签颜色" name="color">
          <div class="color-picker">
            <div
              v-for="color in presetColors"
              :key="color"
              :style="{ backgroundColor: color }"
              :class="['color-item', { active: createForm.color === color }]"
              @click="createForm.color = color"
            />
          </div>
        </FormItem>
        <FormItem label="描述" name="description">
          <TextArea
            v-model:value="createForm.description"
            placeholder="标签描述（可选）"
            :rows="2"
          />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import type { Tag as TagType } from '#/types/finance';
import type { FormInstance, Rule } from 'ant-design-vue';

import { PlusOutlined } from '@ant-design/icons-vue';
import {
  Button,
  Form,
  FormItem,
  Input,
  Modal,
  Select,
  Tag,
  message,
} from 'ant-design-vue';

const { TextArea } = Input;
import { computed, onMounted, ref, watch } from 'vue';

import { useTagStore } from '#/store/modules/tag';

interface Props {
  value?: string[];
  showQuickCreate?: boolean;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  value: () => [],
  showQuickCreate: true,
  placeholder: '选择标签',
});

const emit = defineEmits<{
  'update:value': [value: string[]];
  change: [value: string[]];
}>();

const tagStore = useTagStore();

const selectedTags = ref<string[]>([]);
const loading = ref(false);
const showCreateModal = ref(false);
const createFormRef = ref<FormInstance>();

const createForm = ref({
  name: '',
  color: '#1890ff',
  description: '',
});

const createRules: Record<string, Rule[]> = {
  name: [
    { required: true, message: '请输入标签名称' },
    { max: 20, message: '标签名称不能超过20个字符' },
    {
      validator: async (_rule, value) => {
        if (value && tagStore.isTagNameExists(value)) {
          return Promise.reject('标签名称已存在');
        }
        return Promise.resolve();
      },
    },
  ],
};

const presetColors = [
  '#1890ff',
  '#52c41a',
  '#faad14',
  '#f5222d',
  '#722ed1',
  '#13c2c2',
  '#eb2f96',
  '#fa8c16',
  '#a0d911',
  '#2f54eb',
];

const tagOptions = computed(() =>
  tagStore.sortedTags.map((tag) => ({
    label: tag.name,
    value: tag.id,
  }))
);

const filterOption = (input: string, option: any) => {
  return option.label.toLowerCase().includes(input.toLowerCase());
};

const getTagColor = (tagId: string) => {
  const tag = tagStore.tagMap.get(tagId);
  return tag?.color || '#1890ff';
};

const handleChange = (value: string[]) => {
  emit('update:value', value);
  emit('change', value);
};

const resetCreateForm = () => {
  createForm.value = {
    name: '',
    color: '#1890ff',
    description: '',
  };
  createFormRef.value?.resetFields();
};

const handleCreateTag = async () => {
  try {
    await createFormRef.value?.validate();
    await tagStore.createTag(createForm.value);
    message.success('标签创建成功');
    showCreateModal.value = false;
    resetCreateForm();
  } catch (error) {
    if (error !== 'Validation failed') {
      message.error('创建标签失败');
    }
  }
};

watch(
  () => props.value,
  (newValue) => {
    selectedTags.value = newValue;
  },
  { immediate: true }
);

onMounted(async () => {
  loading.value = true;
  try {
    await tagStore.fetchTags();
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.tag-selector {
  width: 100%;
}

.quick-create {
  margin-top: 8px;
}

.color-picker {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-item {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.color-item:hover {
  transform: scale(1.1);
}

.color-item.active {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}
</style>