import type { Tag } from '#/types/finance';

import { createBaseApi } from './base';

const baseTagApi = createBaseApi<Tag>('tag');

export const tagApi = {
  ...baseTagApi,
  
  // 获取标签列表
  getList: async (params?: { page?: number; pageSize?: number }) => {
    // 模拟标签数据
    const mockTags: Tag[] = [
      {
        id: 'tag-1',
        name: '日常开销',
        color: '#5470c6',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'tag-2',
        name: '餐饮',
        color: '#91cc75',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'tag-3',
        name: '交通',
        color: '#fac858',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'tag-4',
        name: '购物',
        color: '#ee6666',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'tag-5',
        name: '娱乐',
        color: '#73c0de',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'tag-6',
        name: '学习',
        color: '#3ba272',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'tag-7',
        name: '医疗',
        color: '#fc8452',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'tag-8',
        name: '投资',
        color: '#9a60b4',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    
    return {
      data: {
        items: mockTags,
        total: mockTags.length,
        page: params?.page || 1,
        pageSize: params?.pageSize || 100,
      },
    };
  },
};