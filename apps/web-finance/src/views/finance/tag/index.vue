<script setup lang="ts">
import type { FormInstance, Rule } from 'ant-design-vue';

import type { Tag as TagType } from '#/types/finance';

import { computed, onMounted, ref } from 'vue';

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue';
import {
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  Popconfirm,
  Row,
  Space,
  Tag,
  Typography,
} from 'ant-design-vue';

import { useTagStore } from '#/store/modules/tag';
import { useTransactionStore } from '#/store/modules/transaction';

const { TextArea } = Input;

const { Text } = Typography;

const tagStore = useTagStore();
const transactionStore = useTransactionStore();

const searchKeyword = ref('');
const editModalVisible = ref(false);
const editingTag = ref<null | TagType>(null);
const editFormRef = ref<FormInstance>();

const editForm = ref({
  name: '',
  color: '#1890ff',
  description: '',
});

const editRules: Record<string, Rule[]> = {
  name: [
    { required: true, message: '请输入标签名称' },
    { max: 20, message: '标签名称不能超过20个字符' },
    {
      validator: async (_rule, value) => {
        if (value && tagStore.isTagNameExists(value, editingTag.value?.id)) {
          throw '标签名称已存在';
        }
      },
    },
  ],
  color: [{ required: true, message: '请选择标签颜色' }],
  description: [{ max: 100, message: '描述不能超过100个字符' }],
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
  '#ff7875',
  '#595959',
];

const tags = computed(() => tagStore.sortedTags);

const filteredTags = computed(() => {
  if (!searchKeyword.value) return tags.value;

  const keyword = searchKeyword.value.toLowerCase();
  return tags.value.filter(
    (tag) =>
      tag.name.toLowerCase().includes(keyword) ||
      tag.description?.toLowerCase().includes(keyword),
  );
});

const getUsageCount = (tagId: string) => {
  return transactionStore.transactions.filter((t) => t.tags?.includes(tagId))
    .length;
};

const showEditModal = (tag: null | TagType) => {
  editingTag.value = tag;
  if (tag) {
    editForm.value = {
      name: tag.name,
      color: tag.color || '#1890ff',
      description: tag.description || '',
    };
  } else {
    resetEditForm();
  }
  editModalVisible.value = true;
};

const resetEditForm = () => {
  editForm.value = {
    name: '',
    color: '#1890ff',
    description: '',
  };
  editFormRef.value?.resetFields();
  editingTag.value = null;
};

const handleSave = async () => {
  try {
    await editFormRef.value?.validate();

    if (editingTag.value) {
      await tagStore.updateTag(editingTag.value.id, editForm.value);
      message.success('标签更新成功');
    } else {
      await tagStore.createTag(editForm.value);
      message.success('标签创建成功');
    }

    editModalVisible.value = false;
    resetEditForm();
  } catch (error) {
    if (error !== 'Validation failed') {
      message.error(editingTag.value ? '更新标签失败' : '创建标签失败');
    }
  }
};

const handleDelete = async (id: string) => {
  try {
    const usageCount = getUsageCount(id);
    if (usageCount > 0) {
      Modal.confirm({
        title: '标签正在使用中',
        content: `该标签已被 ${usageCount} 个交易使用，删除后这些交易将失去此标签。确定要删除吗？`,
        onOk: async () => {
          await tagStore.deleteTag(id);
          message.success('标签删除成功');
        },
      });
    } else {
      await tagStore.deleteTag(id);
      message.success('标签删除成功');
    }
  } catch {
    message.error('删除标签失败');
  }
};

onMounted(async () => {
  await tagStore.fetchTags();
  await transactionStore.fetchTransactions();
});
</script>

<template>
  <div class="tag-management">
    <Card>
      <template #title>
        <Space>
          <span>标签管理</span>
          <Badge
            :count="tags.length"
            :number-style="{ backgroundColor: '#52c41a' }"
          />
        </Space>
      </template>

      <template #extra>
        <Space>
          <Input
            v-model:value="searchKeyword"
            placeholder="搜索标签"
            style="width: 200px"
            allow-clear
          >
            <template #prefix>
              <SearchOutlined />
            </template>
          </Input>
          <Button type="primary" @click="showEditModal(null)">
            <PlusOutlined /> 新建标签
          </Button>
        </Space>
      </template>

      <div class="tag-list">
        <Row :gutter="[16, 16]">
          <Col v-for="tag in filteredTags" :key="tag.id" :span="6">
            <Card hoverable class="tag-card">
              <div class="tag-content">
                <div class="tag-header">
                  <Tag :color="tag.color" style="font-size: 14px">
                    {{ tag.name }}
                  </Tag>
                </div>
                <div v-if="tag.description" class="tag-description">
                  {{ tag.description }}
                </div>
                <div class="tag-meta">
                  <Text type="secondary" style="font-size: 12px">
                    {{ getUsageCount(tag.id) }} 次使用
                  </Text>
                </div>
                <div class="tag-actions">
                  <Button type="link" size="small" @click="showEditModal(tag)">
                    <EditOutlined /> 编辑
                  </Button>
                  <Popconfirm
                    title="确定要删除这个标签吗？"
                    @confirm="handleDelete(tag.id)"
                  >
                    <Button type="link" size="small" danger>
                      <DeleteOutlined /> 删除
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        <Empty v-if="filteredTags.length === 0" description="暂无标签" />
      </div>
    </Card>

    <!-- 编辑/新建标签弹窗 -->
    <Modal
      v-model:open="editModalVisible"
      :title="editingTag ? '编辑标签' : '新建标签'"
      :width="480"
      @ok="handleSave"
      @cancel="resetEditForm"
    >
      <Form ref="editFormRef" :model="editForm" :rules="editRules">
        <FormItem label="标签名称" name="name">
          <Input
            v-model:value="editForm.name"
            placeholder="输入标签名称"
            :maxlength="20"
            show-count
          />
        </FormItem>
        <FormItem label="标签颜色" name="color">
          <div class="color-picker">
            <div
              v-for="color in presetColors"
              :key="color"
              :style="{ backgroundColor: color }"
              class="color-item"
              :class="[{ active: editForm.color === color }]"
              @click="editForm.color = color"
            ></div>
          </div>
        </FormItem>
        <FormItem label="描述" name="description">
          <TextArea
            v-model:value="editForm.description"
            placeholder="标签描述（可选）"
            :rows="3"
            :maxlength="100"
            show-count
          />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<style scoped>
.tag-management {
  padding: 16px;
}

.tag-list {
  margin-top: 16px;
}

.tag-card {
  height: 100%;
}

.tag-card :deep(.ant-card-body) {
  padding: 16px;
}

.tag-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tag-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
}

.tag-description {
  display: -webkit-box;
  min-height: 36px;
  overflow: hidden;
  -webkit-line-clamp: 2;
  font-size: 12px;
  color: #595959;
  text-align: center;
  -webkit-box-orient: vertical;
}

.tag-meta {
  padding: 4px 0;
  text-align: center;
}

.tag-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  padding-top: 8px;
  margin-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-item {
  width: 32px;
  height: 32px;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 4px;
  transition: all 0.3s;
}

.color-item:hover {
  transform: scale(1.1);
}

.color-item.active {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgb(24 144 255 / 20%);
}
</style>
