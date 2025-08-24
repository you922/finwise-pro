// 基础API工厂函数
export function createBaseApi(entity: string) {
  return {
    getList: async (params?: any) => {
      // Mock实现
      return { items: [], total: 0 };
    },
    create: async (data: any) => {
      return { ...data, id: Date.now().toString() };
    },
    update: async (id: string, data: any) => {
      return { ...data, id };
    },
    delete: async (id: string) => {
      return { success: true };
    },
  };
}