<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">🏷️ 分类管理</h1>
      <p class="text-gray-600">管理收支分类，支持层级结构</p>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card title="📁 分类树结构">
        <div v-if="categories.length === 0" class="text-center py-8">
          <div class="text-6xl mb-4">🏷️</div>
          <p class="text-gray-500 mb-4">暂无分类数据</p>
          <Button type="primary" @click="openAddCategoryModal">➕ 添加分类</Button>
        </div>
        <div v-else class="space-y-3">
          <div v-for="category in categories" :key="category.id" class="p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <span class="text-2xl">{{ category.icon }}</span>
                <div>
                  <span class="font-medium text-lg">{{ category.name }}</span>
                  <div class="flex items-center space-x-2 mt-1">
                    <Tag :color="category.type === 'income' ? 'green' : 'red'" size="small">
                      {{ category.type === 'income' ? '📈 收入' : '📉 支出' }}
                    </Tag>
                    <Tag v-if="category.isSystem" color="blue" size="small">系统分类</Tag>
                  </div>
                </div>
              </div>
              <div class="text-right">
                <div class="space-x-2">
                  <Button type="link" size="small" @click="editCategory(category)">✏️ 编辑</Button>
                  <Button type="link" size="small" danger @click="deleteCategory(category)" :disabled="category.isSystem">🗑️ 删除</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      <Card title="📊 分类统计">
        <div v-if="categories.length === 0" class="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div class="text-center">
            <div class="text-4xl mb-2">📈</div>
            <p class="text-gray-600">添加分类后查看统计</p>
          </div>
        </div>
        <div v-else class="space-y-4">
          <!-- 分类统计数据 -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center p-3 bg-blue-50 rounded-lg">
              <p class="text-sm text-gray-500">总分类数</p>
              <p class="text-xl font-bold text-blue-600">{{ categoryStats.total }}</p>
            </div>
            <div class="text-center p-3 bg-green-50 rounded-lg">
              <p class="text-sm text-gray-500">收入分类</p>
              <p class="text-xl font-bold text-green-600">{{ categoryStats.income }}</p>
            </div>
            <div class="text-center p-3 bg-red-50 rounded-lg">
              <p class="text-sm text-gray-500">支出分类</p>
              <p class="text-xl font-bold text-red-600">{{ categoryStats.expense }}</p>
            </div>
            <div class="text-center p-3 bg-purple-50 rounded-lg">
              <p class="text-sm text-gray-500">预算总额</p>
              <p class="text-xl font-bold text-purple-600">¥{{ categoryStats.budgetTotal.toLocaleString() }}</p>
            </div>
          </div>

          <!-- 分类列表 -->
          <div class="space-y-2">
            <h4 class="font-medium">📈 收入分类</h4>
            <div class="space-y-2">
              <div v-for="category in incomeCategories" :key="category.id"
                   class="flex items-center justify-between p-2 bg-green-50 rounded">
                <div class="flex items-center space-x-2">
                  <span>{{ category.icon }}</span>
                  <span>{{ category.name }}</span>
                </div>
                <Tag :color="category.color" size="small">{{ category.isSystem ? '系统' : '自定义' }}</Tag>
              </div>
              <div v-if="incomeCategories.length === 0" class="text-center text-gray-500 py-2">
                暂无收入分类
              </div>
            </div>

            <h4 class="font-medium mt-4">📉 支出分类</h4>
            <div class="space-y-2">
              <div v-for="category in expenseCategories" :key="category.id"
                   class="flex items-center justify-between p-2 bg-red-50 rounded">
                <div class="flex items-center space-x-2">
                  <span>{{ category.icon }}</span>
                  <span>{{ category.name }}</span>
                </div>
                <Tag :color="category.color" size="small">{{ category.isSystem ? '系统' : '自定义' }}</Tag>
              </div>
              <div v-if="expenseCategories.length === 0" class="text-center text-gray-500 py-2">
                暂无支出分类
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>

    <!-- 编辑分类模态框 -->
    <Modal
      v-model:open="showEditModal"
      title="✏️ 编辑分类"
      @ok="submitEditCategory"
      @cancel="() => { showEditModal = false; editingCategory = null; }"
      width="500px"
    >
      <Form
        ref="editFormRef"
        :model="editForm"
        :rules="rules"
        layout="vertical"
        class="mt-4"
      >
        <Form.Item label="分类名称" name="name" required>
          <Input
            v-model:value="editForm.name"
            placeholder="请输入分类名称"
            size="large"
          />
        </Form.Item>

        <Form.Item label="图标" name="icon">
          <Select v-model:value="editForm.icon" placeholder="选择图标" size="large">
            <Select.Option value="🍽️">🍽️ 餐饮</Select.Option>
            <Select.Option value="🚗">🚗 交通</Select.Option>
            <Select.Option value="🛒">🛒 购物</Select.Option>
            <Select.Option value="🎮">🎮 娱乐</Select.Option>
            <Select.Option value="💻">💻 软件订阅</Select.Option>
            <Select.Option value="📊">📊 投资</Select.Option>
            <Select.Option value="🏥">🏥 医疗</Select.Option>
            <Select.Option value="🏠">🏠 住房</Select.Option>
            <Select.Option value="📚">📚 教育</Select.Option>
            <Select.Option value="💰">💰 工资</Select.Option>
            <Select.Option value="🎁">🎁 奖金</Select.Option>
            <Select.Option value="💼">💼 副业</Select.Option>
            <Select.Option value="CUSTOM">➕ 自定义图标</Select.Option>
          </Select>
        </Form.Item>

        <!-- 自定义图标输入 -->
        <div v-if="editForm.icon === 'CUSTOM'" class="mb-4">
          <Form.Item label="自定义图标" required>
            <Input v-model:value="editForm.customIcon" placeholder="请输入一个表情符号，如: 🍕, 🎬, 📚 等" />
          </Form.Item>
        </div>

        <Form.Item label="分类颜色">
          <div class="flex space-x-2">
            <div
              v-for="color in categoryColors"
              :key="color"
              class="w-8 h-8 rounded-full cursor-pointer border-2 hover:scale-110 transition-all"
              :class="editForm.color === color ? 'border-gray-800 scale-110' : 'border-gray-300'"
              :style="{ backgroundColor: color }"
              @click="editForm.color = color"
            ></div>
          </div>
        </Form.Item>
      </Form>
    </Modal>

    <!-- 添加分类模态框 -->
    <Modal
      v-model:open="showAddModal"
      title="➕ 添加新分类"
      @ok="submitCategory"
      @cancel="cancelAdd"
      width="500px"
    >
      <Form ref="formRef" :model="categoryForm" :rules="rules" layout="vertical">
        <Form.Item label="分类名称" name="name" required>
          <Input 
            v-model:value="categoryForm.name" 
            placeholder="请输入分类名称，如：餐饮、交通等"
            size="large"
          />
        </Form.Item>
        
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item label="分类类型" name="type" required>
              <Select v-model:value="categoryForm.type" placeholder="选择类型" size="large">
                <Select.Option value="income">
                  <span>📈 收入分类</span>
                </Select.Option>
                <Select.Option value="expense">
                  <span>📉 支出分类</span>
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="图标" name="icon">
              <Select v-model:value="categoryForm.icon" placeholder="选择图标" size="large" @change="handleIconChange">
                <Select.Option value="🍽️">🍽️ 餐饮</Select.Option>
                <Select.Option value="🚗">🚗 交通</Select.Option>
                <Select.Option value="🛒">🛒 购物</Select.Option>
                <Select.Option value="🎮">🎮 娱乐</Select.Option>
                <Select.Option value="🏥">🏥 医疗</Select.Option>
                <Select.Option value="🏠">🏠 住房</Select.Option>
                <Select.Option value="💰">💰 工资</Select.Option>
                <Select.Option value="📈">📈 投资</Select.Option>
                <Select.Option value="🎁">🎁 奖金</Select.Option>
                <Select.Option value="💼">💼 兼职</Select.Option>
                <Select.Option value="CUSTOM">➕ 自定义图标</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <!-- 自定义图标输入 -->
        <div v-if="categoryForm.icon === 'CUSTOM'" class="mb-4">
          <Form.Item label="自定义图标" required>
            <Input v-model:value="categoryForm.customIcon" placeholder="请输入一个表情符号，如: 🍕, 🎬, 📚 等" />
          </Form.Item>
        </div>

        <Row :gutter="16">
          <Col :span="12">
            <Form.Item label="月度预算" name="budget">
              <InputNumber
                v-model:value="categoryForm.budget"
                :precision="2"
                style="width: 100%"
                placeholder="0.00"
                :min="0"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="预算币种" name="budgetCurrency">
              <Select v-model:value="categoryForm.budgetCurrency" placeholder="选择币种" size="large" @change="handleBudgetCurrencyChange">
                <Select.Option value="CNY">🇨🇳 人民币</Select.Option>
                <Select.Option value="USD">🇺🇸 美元</Select.Option>
                <Select.Option value="EUR">🇪🇺 欧元</Select.Option>
                <Select.Option value="JPY">🇯🇵 日元</Select.Option>
                <Select.Option value="GBP">🇬🇧 英镑</Select.Option>
                <Select.Option value="HKD">🇭🇰 港币</Select.Option>
                <Select.Option value="KRW">🇰🇷 韩元</Select.Option>
                <Select.Option value="CUSTOM">➕ 自定义币种</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <!-- 自定义币种输入 -->
        <div v-if="categoryForm.budgetCurrency === 'CUSTOM'" class="mb-4">
          <Row :gutter="16">
            <Col :span="12">
              <Form.Item label="币种代码" required>
                <Input v-model:value="categoryForm.customCurrencyCode" placeholder="如: THB, AUD 等" style="text-transform: uppercase" />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="币种名称" required>
                <Input v-model:value="categoryForm.customCurrencyName" placeholder="如: 泰铢, 澳元 等" />
              </Form.Item>
            </Col>
          </Row>
        </div>
        
        <Form.Item label="分类描述">
          <Input.TextArea 
            v-model:value="categoryForm.description" 
            :rows="3" 
            placeholder="分类用途描述..."
          />
        </Form.Item>

        <Form.Item label="分类颜色">
          <div class="flex space-x-2">
            <div 
              v-for="color in categoryColors" 
              :key="color"
              class="w-8 h-8 rounded-full cursor-pointer border-2 hover:scale-110 transition-all"
              :class="categoryForm.color === color ? 'border-gray-800 scale-110' : 'border-gray-300'"
              :style="{ backgroundColor: color }"
              @click="categoryForm.color = color"
            ></div>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Card, Tag, Button, Modal, Form, Input, Select, Row, Col,
  InputNumber, notification
} from 'ant-design-vue';

import { useFinanceStore } from '#/store/finance';

defineOptions({ name: 'CategoryManagement' });

const financeStore = useFinanceStore();

// 使用 financeStore 的分类数据
const categories = computed(() => {
  return [...financeStore.incomeCategories, ...financeStore.expenseCategories];
});

// 初始化时加载数据
onMounted(async () => {
  await financeStore.fetchCategories();
});
const showAddModal = ref(false);
const showEditModal = ref(false);
const editingCategory = ref<any>(null);
const formRef = ref();
const editFormRef = ref();

// 表单数据
const categoryForm = ref({
  name: '',
  type: 'expense',
  icon: '🏷️',
  customIcon: '',
  budget: null,
  budgetCurrency: 'CNY',
  customCurrencyCode: '',
  customCurrencyName: '',
  description: '',
  color: '#1890ff'
});

// 编辑表单数据
const editForm = ref({
  name: '',
  icon: '🏷️',
  customIcon: '',
  color: '#1890ff'
});

// 分类颜色选项
const categoryColors = ref([
  '#1890ff', '#52c41a', '#fa541c', '#722ed1', '#eb2f96', '#13c2c2',
  '#f5222d', '#fa8c16', '#fadb14', '#a0d911', '#36cfc9', '#b37feb'
]);

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 20, message: '分类名称长度在2-20个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择分类类型', trigger: 'change' }
  ]
};

// 计算统计
const categoryStats = computed(() => {
  const incomeCategories = categories.value.filter(c => c.type === 'income');
  const expenseCategories = categories.value.filter(c => c.type === 'expense');

  return {
    total: categories.value.length,
    income: incomeCategories.length,
    expense: expenseCategories.length,
    budgetTotal: 0 // 预算功能待实现
  };
});

// 分类分组
const incomeCategories = computed(() => {
  return categories.value.filter(c => c.type === 'income');
});

const expenseCategories = computed(() => {
  return categories.value.filter(c => c.type === 'expense');
});

// 功能方法
const openAddCategoryModal = () => {
  showAddModal.value = true;
  resetForm();
};

const submitCategory = async () => {
  try {
    // 表单验证
    await formRef.value.validate();

    // 处理自定义图标
    const finalIcon = categoryForm.value.icon === 'CUSTOM'
      ? categoryForm.value.customIcon
      : categoryForm.value.icon;

    // 调用 store 创建分类
    await financeStore.createCategory({
      name: categoryForm.value.name,
      type: categoryForm.value.type,
      icon: finalIcon,
      color: categoryForm.value.color,
    });

    notification.success({
      message: '分类添加成功',
      description: `分类 "${categoryForm.value.name}" 已成功创建`
    });

    // 关闭模态框
    showAddModal.value = false;
    resetForm();

  } catch (error) {
    console.error('创建分类失败:', error);
    notification.error({
      message: '添加失败',
      description: '请检查表单信息是否正确'
    });
  }
};

const cancelAdd = () => {
  showAddModal.value = false;
  resetForm();
};

const resetForm = () => {
  categoryForm.value = {
    name: '',
    type: 'expense',
    icon: '🏷️',
    customIcon: '',
    budget: null,
    budgetCurrency: 'CNY',
    customCurrencyCode: '',
    customCurrencyName: '',
    description: '',
    color: '#1890ff'
  };
};

const handleIconChange = (icon: string) => {
  console.log('图标选择:', icon);
  if (icon !== 'CUSTOM') {
    categoryForm.value.customIcon = '';
  }
};

const handleBudgetCurrencyChange = (currency: string) => {
  console.log('预算币种选择:', currency);
  if (currency !== 'CUSTOM') {
    categoryForm.value.customCurrencyCode = '';
    categoryForm.value.customCurrencyName = '';
  }
};

const editCategory = (category: any) => {
  editingCategory.value = category;
  editForm.value = {
    name: category.name,
    icon: category.icon,
    customIcon: '',
    color: category.color || '#1890ff',
  };
  showEditModal.value = true;
};

const submitEditCategory = async () => {
  try {
    await editFormRef.value?.validate();

    // 处理自定义图标
    const finalIcon = editForm.value.icon === 'CUSTOM'
      ? editForm.value.customIcon
      : editForm.value.icon;

    // 调用 store 更新分类
    await financeStore.updateCategory(editingCategory.value.id, {
      name: editForm.value.name,
      icon: finalIcon,
      color: editForm.value.color,
    });

    notification.success({
      message: '分类更新成功',
      description: `分类 "${editForm.value.name}" 已更新`
    });

    showEditModal.value = false;
    editingCategory.value = null;

  } catch (error) {
    console.error('更新分类失败:', error);
    notification.error({
      message: '更新失败',
      description: '请检查表单信息是否正确'
    });
  }
};

const deleteCategory = (category: any) => {
  // 系统分类不允许删除
  if (category.isSystem) {
    notification.warning({
      message: '无法删除',
      description: '系统分类不允许删除'
    });
    return;
  }

  Modal.confirm({
    title: '确认删除',
    content: `确定要删除分类 "${category.name}" 吗？此操作不可恢复。`,
    okText: '确定',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      try {
        await financeStore.deleteCategory(category.id);
        notification.success({
          message: '分类已删除',
          description: `分类 "${category.name}" 已删除`
        });
      } catch (error) {
        console.error('删除分类失败:', error);
        notification.error({
          message: '删除失败',
          description: '删除分类时出错，请稍后重试'
        });
      }
    }
  });
};

const setBudget = (category: any) => {
  console.log('设置预算:', category);
  notification.info({
    message: '预算设置',
    description: `为分类 "${category.name}" 设置预算`
  });
};
</script>

<style scoped>
.grid { display: grid; }
</style>