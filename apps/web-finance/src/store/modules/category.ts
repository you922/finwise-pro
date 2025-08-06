import type { Category } from '#/types/finance';

import { computed, ref } from 'vue';

import { defineStore } from 'pinia';

import { 
  createCategory as createCategoryApi,
  deleteCategory as deleteCategoryApi,
  getCategoryList, 
  getCategoryTree,
  updateCategory as updateCategoryApi,
} from '#/api/finance';

export const useCategoryStore = defineStore('finance-category', () => {
  // 状态
  const categories = ref<Category[]>([]);
  const categoryTree = ref<Category[]>([]);
  const loading = ref(false);

  // 计算属性
  const incomeCategories = computed(() =>
    categories.value.filter((c) => c.type === 'income'),
  );

  const expenseCategories = computed(() =>
    categories.value.filter((c) => c.type === 'expense'),
  );

  // 获取分类列表
  async function fetchCategories() {
    loading.value = true;
    try {
      const { items } = await getCategoryList();
      categories.value = items;
    } finally {
      loading.value = false;
    }
  }

  // 获取分类树
  async function fetchCategoryTree() {
    loading.value = true;
    try {
      const data = await getCategoryTree();
      categoryTree.value = data;
    } finally {
      loading.value = false;
    }
  }

  // 创建分类
  async function createCategory(data: Partial<Category>) {
    const newCategory = await createCategoryApi(data);
    categories.value.push(newCategory);
    return newCategory;
  }

  // 更新分类
  async function updateCategory(id: string, data: Partial<Category>) {
    const updatedCategory = await updateCategoryApi(id, data);
    const index = categories.value.findIndex((c) => c.id === id);
    if (index !== -1) {
      categories.value[index] = updatedCategory;
    }
    return updatedCategory;
  }

  // 删除分类
  async function deleteCategory(id: string) {
    await deleteCategoryApi(id);
    categories.value = categories.value.filter((c) => c.id !== id);
  }

  // 根据ID获取分类
  function getCategoryById(id: string) {
    return categories.value.find((c) => c.id === id);
  }

  return {
    categories,
    categoryTree,
    loading,
    incomeCategories,
    expenseCategories,
    fetchCategories,
    fetchCategoryTree,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
  };
});