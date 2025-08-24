// 财务管理相关 API 导出

export * from './category';
export * from './loan';
export * from './person';
export * from './transaction';
export * from './budget';
export * from './tag';

// 分类统计 - 直接从Mock服务获取
export async function getCategoryStatistics(params: any) {
  const { getCategoryStatistics: getMockStatistics } = await import('#/api/mock/finance-service');
  return await getMockStatistics(params);
}
