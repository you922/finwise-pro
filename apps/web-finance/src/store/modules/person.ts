import type { Person } from '#/types/finance';

import { ref } from 'vue';

import { defineStore } from 'pinia';

import {
  createPerson as createPersonApi,
  deletePerson as deletePersonApi,
  getPersonList,
  searchPersons as searchPersonsApi,
  updatePerson as updatePersonApi,
} from '#/api/finance';

export const usePersonStore = defineStore('finance-person', () => {
  // 状态
  const persons = ref<Person[]>([]);
  const loading = ref(false);

  // 获取人员列表
  async function fetchPersons(params?: { page?: number; pageSize?: number }) {
    loading.value = true;
    try {
      const { items } = await getPersonList(params);
      persons.value = items;
      return items;
    } finally {
      loading.value = false;
    }
  }

  // 搜索人员
  async function searchPersons(keyword: string) {
    if (!keyword) {
      return persons.value;
    }
    const results = await searchPersonsApi(keyword);
    return results;
  }

  // 创建人员
  async function createPerson(data: Partial<Person>) {
    const newPerson = await createPersonApi(data);
    persons.value.push(newPerson);
    return newPerson;
  }

  // 更新人员
  async function updatePerson(id: string, data: Partial<Person>) {
    const updatedPerson = await updatePersonApi(id, data);
    const index = persons.value.findIndex((p) => p.id === id);
    if (index !== -1) {
      persons.value[index] = updatedPerson;
    }
    return updatedPerson;
  }

  // 删除人员
  async function deletePerson(id: string) {
    await deletePersonApi(id);
    persons.value = persons.value.filter((p) => p.id !== id);
  }

  // 根据ID获取人员
  function getPersonById(id: string) {
    return persons.value.find((p) => p.id === id);
  }

  // 根据名称获取人员
  function getPersonByName(name: string) {
    return persons.value.find((p) => p.name === name);
  }

  // 根据角色筛选人员
  function getPersonsByRole(role: Person['roles'][number]) {
    return persons.value.filter((p) => p.roles.includes(role));
  }

  return {
    persons,
    loading,
    fetchPersons,
    searchPersons,
    createPerson,
    updatePerson,
    deletePerson,
    getPersonById,
    getPersonByName,
    getPersonsByRole,
  };
});
