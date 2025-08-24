import type { Category, PageParams } from '#/types/finance';

import { categoryService } from '#/api/mock/finance-service';

// 获取分类列表
export async function getCategoryList(params?: PageParams) {
  return categoryService.getList(params);
}

// 获取分类详情
export async function getCategoryDetail(id: string) {
  const result = await categoryService.getDetail(id);
  if (!result) {
    throw new Error('Category not found');
  }
  return result;
}

// 创建分类
export async function createCategory(data: Partial<Category>) {
  return categoryService.create(data);
}

// 更新分类
export async function updateCategory(id: string, data: Partial<Category>) {
  return categoryService.update(id, data);
}

// 删除分类
export async function deleteCategory(id: string) {
  return categoryService.delete(id);
}

// 获取分类树
export async function getCategoryTree() {
  return categoryService.getTree();
}
