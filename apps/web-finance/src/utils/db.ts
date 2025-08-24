// IndexedDB 工具类
import type { Category, Loan, Person, Transaction } from '#/types/finance';

const DB_NAME = 'TokenRecordsDB';
const DB_VERSION = 2; // 升级版本号以添加新表

// 数据表名称
export const STORES = {
  TRANSACTIONS: 'transactions',
  CATEGORIES: 'categories',
  PERSONS: 'persons',
  LOANS: 'loans',
  TAGS: 'tags',
  BUDGETS: 'budgets',
} as const;

// IndexedDB 实例
let db: IDBDatabase | null = null;

// 初始化数据库
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open database'));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // 创建交易表
      if (!database.objectStoreNames.contains(STORES.TRANSACTIONS)) {
        const transactionStore = database.createObjectStore(
          STORES.TRANSACTIONS,
          {
            keyPath: 'id',
          },
        );
        transactionStore.createIndex('type', 'type', { unique: false });
        transactionStore.createIndex('categoryId', 'categoryId', {
          unique: false,
        });
        transactionStore.createIndex('date', 'date', { unique: false });
        transactionStore.createIndex('currency', 'currency', { unique: false });
        transactionStore.createIndex('status', 'status', { unique: false });
      }

      // 创建分类表
      if (!database.objectStoreNames.contains(STORES.CATEGORIES)) {
        const categoryStore = database.createObjectStore(STORES.CATEGORIES, {
          keyPath: 'id',
        });
        categoryStore.createIndex('type', 'type', { unique: false });
        categoryStore.createIndex('parentId', 'parentId', { unique: false });
      }

      // 创建人员表
      if (!database.objectStoreNames.contains(STORES.PERSONS)) {
        const personStore = database.createObjectStore(STORES.PERSONS, {
          keyPath: 'id',
        });
        personStore.createIndex('name', 'name', { unique: false });
      }

      // 创建贷款表
      if (!database.objectStoreNames.contains(STORES.LOANS)) {
        const loanStore = database.createObjectStore(STORES.LOANS, {
          keyPath: 'id',
        });
        loanStore.createIndex('status', 'status', { unique: false });
        loanStore.createIndex('borrower', 'borrower', { unique: false });
        loanStore.createIndex('lender', 'lender', { unique: false });
      }

      // 创建标签表
      if (!database.objectStoreNames.contains(STORES.TAGS)) {
        const tagStore = database.createObjectStore(STORES.TAGS, {
          keyPath: 'id',
        });
        tagStore.createIndex('name', 'name', { unique: false });
      }

      // 创建预算表
      if (!database.objectStoreNames.contains(STORES.BUDGETS)) {
        const budgetStore = database.createObjectStore(STORES.BUDGETS, {
          keyPath: 'id',
        });
        budgetStore.createIndex('categoryId', 'categoryId', { unique: false });
        budgetStore.createIndex('year', 'year', { unique: false });
        budgetStore.createIndex('period', 'period', { unique: false });
      }
    };
  });
}

// 获取数据库实例
export async function getDB(): Promise<IDBDatabase> {
  if (!db) {
    db = await initDB();
  }
  return db;
}

// 通用的添加数据方法
export async function add<T>(storeName: string, data: T): Promise<T> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    // 确保数据可以被IndexedDB存储（深拷贝并序列化）
    const serializedData = JSON.parse(JSON.stringify(data));
    const request = store.add(serializedData);

    request.onsuccess = () => {
      resolve(data);
    };

    request.onerror = () => {
      console.error('IndexedDB add error:', request.error);
      reject(
        new Error(
          `Failed to add data to ${storeName}: ${request.error?.message}`,
        ),
      );
    };
  });
}

// 通用的更新数据方法
export async function update<T>(storeName: string, data: T): Promise<T> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    // 确保数据可以被IndexedDB存储（深拷贝并序列化）
    const serializedData = JSON.parse(JSON.stringify(data));
    const request = store.put(serializedData);

    request.onsuccess = () => {
      resolve(data);
    };

    request.onerror = () => {
      console.error('IndexedDB update error:', request.error);
      reject(
        new Error(
          `Failed to update data in ${storeName}: ${request.error?.message}`,
        ),
      );
    };
  });
}

// 通用的删除数据方法
export async function remove(storeName: string, id: string): Promise<void> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to delete data from ${storeName}`));
    };
  });
}

// 通用的获取单条数据方法
export async function get<T>(storeName: string, id: string): Promise<null | T> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(new Error(`Failed to get data from ${storeName}`));
    };
  });
}

// 通用的获取所有数据方法
export async function getAll<T>(storeName: string): Promise<T[]> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      reject(new Error(`Failed to get all data from ${storeName}`));
    };
  });
}

// 按索引查询
export async function getByIndex<T>(
  storeName: string,
  indexName: string,
  value: any,
): Promise<T[]> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      reject(new Error(`Failed to get data by index from ${storeName}`));
    };
  });
}

// 清空数据表
export async function clear(storeName: string): Promise<void> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to clear ${storeName}`));
    };
  });
}

// 批量添加数据
export async function addBatch<T>(
  storeName: string,
  dataList: T[],
): Promise<void> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    dataList.forEach((data) => {
      // 确保数据可以被IndexedDB存储（深拷贝并序列化）
      const serializedData = JSON.parse(JSON.stringify(data));
      store.add(serializedData);
    });

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      console.error('IndexedDB addBatch error:', transaction.error);
      reject(
        new Error(
          `Failed to add batch data to ${storeName}: ${transaction.error?.message}`,
        ),
      );
    };
  });
}

// 导出数据库
export async function exportDatabase(): Promise<{
  categories: Category[];
  loans: Loan[];
  persons: Person[];
  transactions: Transaction[];
}> {
  const transactions = await getAll<Transaction>(STORES.TRANSACTIONS);
  const categories = await getAll<Category>(STORES.CATEGORIES);
  const persons = await getAll<Person>(STORES.PERSONS);
  const loans = await getAll<Loan>(STORES.LOANS);

  return {
    transactions,
    categories,
    persons,
    loans,
  };
}

// 导入数据库
export async function importDatabase(data: {
  categories?: Category[];
  loans?: Loan[];
  persons?: Person[];
  transactions?: Transaction[];
}): Promise<void> {
  if (data.categories) {
    await clear(STORES.CATEGORIES);
    await addBatch(STORES.CATEGORIES, data.categories);
  }

  if (data.persons) {
    await clear(STORES.PERSONS);
    await addBatch(STORES.PERSONS, data.persons);
  }

  if (data.transactions) {
    await clear(STORES.TRANSACTIONS);
    await addBatch(STORES.TRANSACTIONS, data.transactions);
  }

  if (data.loans) {
    await clear(STORES.LOANS);
    await addBatch(STORES.LOANS, data.loans);
  }
}
