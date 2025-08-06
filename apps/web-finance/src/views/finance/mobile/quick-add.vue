<template>
  <div class="mobile-quick-add">
    <div class="quick-add-header">
      <Button 
        type="text" 
        @click="handleClose"
        style="position: absolute; left: 8px; top: 8px;"
      >
        <CloseOutlined />
      </Button>
      <h3>快速记账</h3>
    </div>
    
    <div class="quick-add-body">
      <!-- 交易类型切换 -->
      <div class="type-switcher">
        <Button
          :type="formData.type === 'expense' ? 'primary' : 'default'"
          @click="formData.type = 'expense'"
          block
        >
          支出
        </Button>
        <Button
          :type="formData.type === 'income' ? 'primary' : 'default'"
          @click="formData.type = 'income'"
          block
        >
          收入
        </Button>
      </div>
      
      <!-- 金额输入 -->
      <div class="amount-input-wrapper">
        <div class="currency-symbol">¥</div>
        <input
          ref="amountInputRef"
          v-model="amountDisplay"
          type="text"
          class="amount-input"
          placeholder="0.00"
          @input="handleAmountInput"
          @keyup.enter="handleQuickSave"
        />
      </div>
      
      <!-- 分类选择 -->
      <div class="category-grid">
        <div
          v-for="category in quickCategories"
          :key="category.id"
          :class="['category-item', { active: formData.categoryId === category.id }]"
          @click="formData.categoryId = category.id"
        >
          <div class="category-icon">{{ category.icon || '📁' }}</div>
          <div class="category-name">{{ category.name }}</div>
        </div>
        <div class="category-item more" @click="showAllCategories = true">
          <div class="category-icon">
            <EllipsisOutlined />
          </div>
          <div class="category-name">更多</div>
        </div>
      </div>
      
      <!-- 可选信息 -->
      <div class="optional-fields">
        <div class="field-item" @click="showDatePicker = true">
          <CalendarOutlined />
          <span>{{ dayjs(formData.date).format('MM月DD日') }}</span>
          <RightOutlined />
        </div>
        
        <div class="field-item" @click="showDescriptionInput = true">
          <EditOutlined />
          <span>{{ formData.description || '添加备注' }}</span>
          <RightOutlined />
        </div>
        
        <div class="field-item" @click="showTagSelector = true">
          <TagsOutlined />
          <span>
            {{ selectedTagNames.length > 0 ? selectedTagNames.join(', ') : '添加标签' }}
          </span>
          <RightOutlined />
        </div>
      </div>
      
      <!-- 保存按钮 -->
      <div class="save-button-wrapper">
        <Button
          type="primary"
          size="large"
          block
          :loading="saving"
          :disabled="!canSave"
          @click="handleSave"
        >
          保存
        </Button>
      </div>
    </div>
    
    <!-- 所有分类抽屉 -->
    <Drawer
      v-model:open="showAllCategories"
      title="选择分类"
      placement="bottom"
      :height="'60%'"
    >
      <div class="all-categories">
        <div
          v-for="category in filteredCategories"
          :key="category.id"
          :class="['category-full-item', { active: formData.categoryId === category.id }]"
          @click="selectCategory(category.id)"
        >
          <span class="category-icon">{{ category.icon || '📁' }}</span>
          <span class="category-name">{{ category.name }}</span>
          <CheckOutlined v-if="formData.categoryId === category.id" />
        </div>
      </div>
    </Drawer>
    
    <!-- 日期选择器 -->
    <Modal
      v-model:open="showDatePicker"
      title="选择日期"
      width="90%"
      :footer="null"
    >
      <DatePicker
        v-model:value="formData.date"
        style="width: 100%"
        @change="showDatePicker = false"
      />
    </Modal>
    
    <!-- 备注输入 -->
    <Modal
      v-model:open="showDescriptionInput"
      title="添加备注"
      width="90%"
      @ok="showDescriptionInput = false"
    >
      <TextArea
        v-model:value="formData.description"
        :rows="4"
        placeholder="输入备注信息"
        :maxlength="200"
        showCount
      />
    </Modal>
    
    <!-- 标签选择 -->
    <Modal
      v-model:open="showTagSelector"
      title="选择标签"
      width="90%"
      @ok="showTagSelector = false"
    >
      <TagSelector v-model:value="formData.tags" />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import type { Transaction } from '#/types/finance';

import {
  CalendarOutlined,
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  EllipsisOutlined,
  RightOutlined,
  TagsOutlined,
} from '@ant-design/icons-vue';
import {
  Button,
  DatePicker,
  Drawer,
  Input,
  Modal,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import { computed, nextTick, onMounted, ref } from 'vue';

import { useCategoryStore } from '#/store/modules/category';
import { useTagStore } from '#/store/modules/tag';
import { useTransactionStore } from '#/store/modules/transaction';
import TagSelector from '#/views/finance/tag/components/tag-selector.vue';

const { TextArea } = Input;

const emit = defineEmits<{
  close: [];
  saved: [transaction: Transaction];
}>();

const categoryStore = useCategoryStore();
const tagStore = useTagStore();
const transactionStore = useTransactionStore();

const amountInputRef = ref<HTMLInputElement>();
const amountDisplay = ref('');
const saving = ref(false);

const showAllCategories = ref(false);
const showDatePicker = ref(false);
const showDescriptionInput = ref(false);
const showTagSelector = ref(false);

const formData = ref<Partial<Transaction>>({
  type: 'expense',
  amount: 0,
  categoryId: '',
  currency: 'CNY',
  date: dayjs().format('YYYY-MM-DD'),
  description: '',
  status: 'completed',
  tags: [],
});

// 快速访问的分类（最常用的6个）
const quickCategories = computed(() => {
  const categories = categoryStore.categories
    .filter(c => c.type === formData.value.type)
    .slice(0, 5);
  return categories;
});

const filteredCategories = computed(() => 
  categoryStore.categories.filter(c => c.type === formData.value.type)
);

const selectedTagNames = computed(() => {
  if (!formData.value.tags || formData.value.tags.length === 0) return [];
  return formData.value.tags
    .map(tagId => tagStore.tagMap.get(tagId)?.name)
    .filter(Boolean) as string[];
});

const canSave = computed(() => 
  formData.value.amount && 
  formData.value.amount > 0 && 
  formData.value.categoryId
);

const handleAmountInput = (e: Event) => {
  const input = e.target as HTMLInputElement;
  let value = input.value.replace(/[^\d.]/g, '');
  
  // 处理小数点
  const parts = value.split('.');
  if (parts.length > 2) {
    value = parts[0] + '.' + parts.slice(1).join('');
  }
  if (parts[1]?.length > 2) {
    value = parts[0] + '.' + parts[1].slice(0, 2);
  }
  
  amountDisplay.value = value;
  formData.value.amount = parseFloat(value) || 0;
};

const selectCategory = (categoryId: string) => {
  formData.value.categoryId = categoryId;
  showAllCategories.value = false;
};

const handleQuickSave = () => {
  if (canSave.value) {
    handleSave();
  }
};

const handleSave = async () => {
  if (!canSave.value) return;
  
  saving.value = true;
  try {
    const transaction = await transactionStore.createTransaction({
      ...formData.value,
      amount: formData.value.amount!,
      recorder: '管理员',
    });
    
    message.success('记账成功');
    emit('saved', transaction as Transaction);
    
    // 重置表单
    formData.value = {
      type: formData.value.type,
      amount: 0,
      categoryId: '',
      currency: 'CNY',
      date: dayjs().format('YYYY-MM-DD'),
      description: '',
      status: 'completed',
      tags: [],
    };
    amountDisplay.value = '';
    
    // 重新聚焦金额输入框
    nextTick(() => {
      amountInputRef.value?.focus();
    });
  } catch (error) {
    message.error('记账失败');
  } finally {
    saving.value = false;
  }
};

const handleClose = () => {
  emit('close');
};

onMounted(() => {
  // 自动聚焦金额输入框
  nextTick(() => {
    amountInputRef.value?.focus();
  });
});
</script>

<style scoped>
.mobile-quick-add {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.quick-add-header {
  position: relative;
  padding: 16px;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
}

.quick-add-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.quick-add-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.type-switcher {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
}

.amount-input-wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding: 12px 0;
  border-bottom: 2px solid #1890ff;
}

.currency-symbol {
  font-size: 24px;
  color: #1890ff;
  margin-right: 8px;
}

.amount-input {
  flex: 1;
  font-size: 36px;
  font-weight: 500;
  border: none;
  outline: none;
  text-align: right;
  color: #262626;
}

.amount-input::placeholder {
  color: #bfbfbf;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.category-item:active {
  transform: scale(0.95);
}

.category-item.active {
  border-color: #1890ff;
  background: rgba(24, 144, 255, 0.05);
}

.category-item.more {
  border-style: dashed;
}

.category-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.category-name {
  font-size: 12px;
  color: #595959;
  text-align: center;
}

.optional-fields {
  margin-bottom: 24px;
}

.field-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.field-item:active {
  background: #f5f5f5;
}

.field-item > span {
  flex: 1;
  margin: 0 12px;
  color: #595959;
}

.save-button-wrapper {
  position: sticky;
  bottom: 0;
  background: #fff;
  padding: 16px 0;
}

.all-categories {
  display: flex;
  flex-direction: column;
}

.category-full-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.category-full-item:active {
  background: #f5f5f5;
}

.category-full-item.active {
  color: #1890ff;
}

.category-full-item .category-icon {
  font-size: 20px;
  margin-right: 12px;
}

.category-full-item .category-name {
  flex: 1;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .quick-add-body {
    padding: 12px;
  }
  
  .category-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  
  .category-item {
    padding: 8px 4px;
  }
  
  .category-icon {
    font-size: 20px;
  }
  
  .category-name {
    font-size: 11px;
  }
}
</style>