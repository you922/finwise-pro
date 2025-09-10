// 财务管理相关 API 导出

export * from './category';
export * from './loan';
export * from './person';
export * from './transaction';
export * from './budget';
export * from './tag';

// 导出API对象
import * as categoryFunctions from './category';
import * as personFunctions from './person';
import * as transactionFunctions from './transaction';

export const categoryApi = categoryFunctions;
export const personApi = personFunctions;
export const transactionApi = transactionFunctions;

// 分类统计 - 直接从Mock服务获取
export async function getCategoryStatistics(params: any) {
  const { getCategoryStatistics: getMockStatistics } = await import('#/api/mock/finance-service');
  return await getMockStatistics(params);
}
