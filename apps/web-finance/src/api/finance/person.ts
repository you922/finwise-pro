import type { PageParams, Person } from '#/types/finance';

import { personService } from '#/api/mock/finance-service';

// 获取人员列表
export async function getPersonList(params?: PageParams) {
  return personService.getList(params);
}

// 获取人员详情
export async function getPersonDetail(id: string) {
  const result = await personService.getDetail(id);
  if (!result) {
    throw new Error('Person not found');
  }
  return result;
}

// 创建人员
export async function createPerson(data: Partial<Person>) {
  return personService.create(data);
}

// 更新人员
export async function updatePerson(id: string, data: Partial<Person>) {
  return personService.update(id, data);
}

// 删除人员
export async function deletePerson(id: string) {
  return personService.delete(id);
}

// 搜索人员
export async function searchPersons(keyword: string) {
  return personService.search(keyword);
}
