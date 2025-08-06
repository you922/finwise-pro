<script lang="ts" setup>
import type { Category } from '#/types/finance';

import { computed, h, onMounted, ref } from 'vue';

import { 
  DeleteOutlined, 
  EditOutlined, 
  PlusOutlined,
} from '@ant-design/icons-vue';
import { 
  Button, 
  Card, 
  message, 
  Popconfirm, 
  Space, 
  Table,
  Tabs,
  Tag,
} from 'ant-design-vue';

import { useCategoryStore } from '#/store/modules/category';

import CategoryForm from './components/category-form.vue';

const TabPane = Tabs.TabPane;

// Store
const categoryStore = useCategoryStore();

// 状态
const loading = ref(false);
const formVisible = ref(false);
const currentCategory = ref<Category | null>(null);
const activeTab = ref<'income' | 'expense'>('income');

// 计算属性
const categories = computed(() => categoryStore.categories);
const incomeCategories = computed(() => categoryStore.incomeCategories);
const expenseCategories = computed(() => categoryStore.expenseCategories);

// 当前显示的分类
const displayCategories = computed(() => {
  return activeTab.value === 'income' ? incomeCategories.value : expenseCategories.value;
});

// 表格列配置
const columns = [
  {
    title: '分类名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 100,
    customRender: ({ record }: { record: Category }) => {
      const color = record.type === 'income' ? 'green' : 'red';
      const text = record.type === 'income' ? '收入' : '支出';
      return h(Tag, { color }, () => text);
    },
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    customRender: ({ record }: { record: Category }) => {
      return h(Space, {}, () => [
        h(Button, {
          size: 'small',
          type: 'link',
          onClick: () => handleEdit(record)
        }, () => [h(EditOutlined), ' 编辑']),
        h(Popconfirm, {
          title: '确定要删除这个分类吗？',
          placement: 'topRight',
          onConfirm: () => handleDelete(record.id)
        }, () => h(Button, {
          size: 'small',
          type: 'link',
          danger: true
        }, () => [h(DeleteOutlined), ' 删除']))
      ]);
    },
  },
];

// 获取数据
async function fetchData() {
  loading.value = true;
  try {
    await categoryStore.fetchCategories();
  } finally {
    loading.value = false;
  }
}

// 新建
function handleCreate() {
  currentCategory.value = null;
  formVisible.value = true;
}

// 编辑
function handleEdit(record: Category) {
  currentCategory.value = record;
  formVisible.value = true;
}

// 删除
async function handleDelete(id: string) {
  try {
    await categoryStore.deleteCategory(id);
    message.success('删除成功');
  } catch (error) {
    message.error('删除失败');
  }
}

// 处理表单提交
async function handleFormSubmit(formData: Partial<Category>) {
  try {
    if (currentCategory.value) {
      // 编辑
      await categoryStore.updateCategory(currentCategory.value.id, formData);
      message.success('更新成功');
    } else {
      // 新建
      await categoryStore.createCategory({
        ...formData,
        type: activeTab.value, // 使用当前标签页的类型
      });
      message.success('创建成功');
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
    <Card>
      <div class="mb-4">
        <Button type="primary" @click="handleCreate">
          <PlusOutlined />
          新建分类
        </Button>
      </div>

      <Tabs v-model:activeKey="activeTab">
        <TabPane key="income" tab="收入分类">
          <Table
            :columns="columns"
            :dataSource="incomeCategories"
            :loading="loading"
            :rowKey="(record: Category) => record.id"
          />
        </TabPane>
        <TabPane key="expense" tab="支出分类">
          <Table
            :columns="columns"
            :dataSource="expenseCategories"
            :loading="loading"
            :rowKey="(record: Category) => record.id"
          />
        </TabPane>
      </Tabs>
    </Card>

    <!-- 表单对话框 -->
    <CategoryForm
      v-model:visible="formVisible"
      :category="currentCategory"
      :defaultType="activeTab"
      @submit="handleFormSubmit"
    />
  </div>
</template>