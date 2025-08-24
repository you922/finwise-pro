import type { Tag } from '#/types/finance';

import { defineStore } from 'pinia';

import { add, getAll, remove, STORES, update } from '#/utils/db';

interface TagState {
  tags: Tag[];
  loading: boolean;
}

export const useTagStore = defineStore('tag', {
  state: (): TagState => ({
    tags: [],
    loading: false,
  }),

  getters: {
    // 按名称排序的标签
    sortedTags: (state) => {
      return [...state.tags].sort((a, b) => a.name.localeCompare(b.name));
    },

    // 获取标签映射
    tagMap: (state) => {
      return new Map(state.tags.map((tag) => [tag.id, tag]));
    },
  },

  actions: {
    // 获取所有标签
    async fetchTags() {
      this.loading = true;
      try {
        const tags = await getAll<Tag>(STORES.TAGS);
        this.tags = tags;
      } catch (error) {
        console.error('获取标签失败:', error);
      } finally {
        this.loading = false;
      }
    },

    // 创建标签
    async createTag(tag: Partial<Tag>) {
      try {
        const newTag: Tag = {
          id: crypto.randomUUID(),
          name: tag.name || '',
          color: tag.color || '#1890ff',
          description: tag.description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await add(STORES.TAGS, newTag);
        this.tags.push(newTag);
        return newTag;
      } catch (error) {
        console.error('创建标签失败:', error);
        throw error;
      }
    },

    // 更新标签
    async updateTag(id: string, updates: Partial<Tag>) {
      try {
        const index = this.tags.findIndex((t) => t.id === id);
        if (index === -1) throw new Error('标签不存在');

        const updatedTag = {
          ...this.tags[index],
          ...updates,
          updated_at: new Date().toISOString(),
        };

        await update(STORES.TAGS, updatedTag);
        this.tags[index] = updatedTag;
        return updatedTag;
      } catch (error) {
        console.error('更新标签失败:', error);
        throw error;
      }
    },

    // 删除标签
    async deleteTag(id: string) {
      try {
        await remove(STORES.TAGS, id);
        const index = this.tags.findIndex((t) => t.id === id);
        if (index !== -1) {
          this.tags.splice(index, 1);
        }
      } catch (error) {
        console.error('删除标签失败:', error);
        throw error;
      }
    },

    // 批量删除标签
    async deleteTags(ids: string[]) {
      try {
        for (const id of ids) {
          await remove(STORES.TAGS, id);
        }
        this.tags = this.tags.filter((t) => !ids.includes(t.id));
      } catch (error) {
        console.error('批量删除标签失败:', error);
        throw error;
      }
    },

    // 检查标签名称是否已存在
    isTagNameExists(name: string, excludeId?: string): boolean {
      return this.tags.some((t) => t.name === name && t.id !== excludeId);
    },
  },
});
