<script lang="ts" setup>
import { ref } from 'vue';

import {
  DownloadOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  UploadOutlined,
} from '@ant-design/icons-vue';
import {
  Alert,
  Button,
  Dropdown,
  Menu,
  message,
  Modal,
  Progress,
  Space,
  Upload,
} from 'ant-design-vue';

import { useCategoryStore } from '#/store/modules/category';
import { usePersonStore } from '#/store/modules/person';
import { useTransactionStore } from '#/store/modules/transaction';
import {
  exportAllData,
  exportTransactions,
  generateImportTemplate,
} from '#/utils/export';
import {
  importFromJSON,
  importTransactionsFromCSV,
  parseCSV,
  readFileAsText,
} from '#/utils/import';

const MenuItem = Menu.Item;

// Store
const transactionStore = useTransactionStore();
const categoryStore = useCategoryStore();
const personStore = usePersonStore();

// 状态
const importModalVisible = ref(false);
const importing = ref(false);
const importProgress = ref(0);
const importResults = ref<{
  errors: string[];
  newCategories: string[];
  newPersons: string[];
  success: number;
}>({
  success: 0,
  errors: [],
  newCategories: [],
  newPersons: [],
});

// 导出菜单点击
function handleExportMenuClick({ key }: { key: string }) {
  switch (key) {
    case 'csv': {
      exportTransactions(
        transactionStore.transactions,
        categoryStore.categories,
        personStore.persons,
      );
      message.success('导出CSV成功');
      break;
    }
    case 'json': {
      exportAllData(
        transactionStore.transactions,
        categoryStore.categories,
        personStore.persons,
      );
      message.success('导出备份成功');
      break;
    }
    case 'template': {
      downloadTemplate();
      message.success('模板下载成功');
      break;
    }
  }
}

// 下载导入模板
function downloadTemplate() {
  const template = generateImportTemplate();
  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', '交易导入模板.csv');
  link.style.visibility = 'hidden';

  document.body.append(link);
  link.click();
  link.remove();
}

// 处理文件上传
async function handleFileUpload(file: File) {
  importing.value = true;
  importProgress.value = 0;
  importResults.value = {
    success: 0,
    errors: [],
    newCategories: [],
    newPersons: [],
  };

  try {
    const content = await readFileAsText(file);
    importProgress.value = 20;

    if (file.name.endsWith('.json')) {
      // 导入JSON备份
      const jsonData = JSON.parse(content);
      const result = importFromJSON(jsonData);

      if (!result.valid) {
        message.error(result.error || '导入失败');
        return;
      }

      importProgress.value = 50;

      // 批量创建数据
      if (result.data) {
        // 创建分类
        for (const category of result.data.categories) {
          await categoryStore.createCategory(category);
        }
        importProgress.value = 60;

        // 创建人员
        for (const person of result.data.persons) {
          await personStore.createPerson(person);
        }
        importProgress.value = 70;

        // 创建交易
        for (const transaction of result.data.transactions) {
          await transactionStore.createTransaction(transaction);
        }
        importProgress.value = 100;

        importResults.value.success = result.data.transactions.length;
        message.success(
          `成功导入 ${result.data.transactions.length} 条交易记录`,
        );
      }
    } else if (file.name.endsWith('.csv')) {
      // 导入CSV
      const csvData = parseCSV(content);
      importProgress.value = 30;

      const result = importTransactionsFromCSV(
        csvData,
        categoryStore.categories,
        personStore.persons,
      );

      importProgress.value = 50;

      importResults.value = {
        success: result.transactions.length,
        errors: result.errors,
        newCategories: result.newCategories,
        newPersons: result.newPersons,
      };

      // 如果有新分类或人员，提示用户先创建
      if (result.newCategories.length > 0 || result.newPersons.length > 0) {
        importModalVisible.value = true;
        return;
      }

      // 批量创建交易
      let created = 0;
      for (const transaction of result.transactions) {
        await transactionStore.createTransaction(transaction);
        created++;
        importProgress.value = 50 + (created / result.transactions.length) * 50;
      }

      message.success(`成功导入 ${result.transactions.length} 条交易记录`);
    } else {
      message.error('不支持的文件格式');
    }
  } catch {
    message.error('导入失败：文件格式错误');
  } finally {
    importing.value = false;
    importProgress.value = 0;
  }

  // 阻止默认上传行为
  return false;
}

// 继续导入（忽略新分类和人员）
async function continueImport() {
  importModalVisible.value = false;
  message.warning('部分数据可能因为缺少分类或人员而不完整');
}
</script>

<template>
  <Space>
    <!-- 导出按钮 -->
    <Dropdown>
      <Button>
        <DownloadOutlined />
        导出数据
      </Button>
      <template #overlay>
        <Menu @click="handleExportMenuClick">
          <MenuItem key="csv">
            <FileExcelOutlined />
            导出为CSV
          </MenuItem>
          <MenuItem key="json">
            <FileTextOutlined />
            导出完整备份
          </MenuItem>
          <Menu.Divider />
          <MenuItem key="template">
            <DownloadOutlined />
            下载导入模板
          </MenuItem>
        </Menu>
      </template>
    </Dropdown>

    <!-- 导入按钮 -->
    <Upload
      accept=".csv,.json"
      :before-upload="handleFileUpload"
      :show-upload-list="false"
    >
      <Button>
        <UploadOutlined />
        导入数据
      </Button>
    </Upload>

    <!-- 导入进度 -->
    <Modal
      v-model:open="importing"
      title="正在导入数据"
      :footer="null"
      :closable="false"
    >
      <Progress :percent="importProgress" />
      <p class="mt-2 text-gray-600">请稍候，正在处理数据...</p>
    </Modal>

    <!-- 导入提示 -->
    <Modal
      v-model:open="importModalVisible"
      title="导入提示"
      @ok="continueImport"
    >
      <Alert type="warning" show-icon class="mb-4">
        <template #message>
          发现以下新的分类或人员，请先手动创建后再导入，或选择忽略继续导入。
        </template>
      </Alert>

      <div v-if="importResults.newCategories.length > 0" class="mb-4">
        <h4 class="mb-2 font-medium">
          <InfoCircleOutlined class="mr-1" />
          需要创建的分类：
        </h4>
        <ul class="list-disc pl-5">
          <li v-for="cat in importResults.newCategories" :key="cat">
            {{ cat }}
          </li>
        </ul>
      </div>

      <div v-if="importResults.newPersons.length > 0">
        <h4 class="mb-2 font-medium">
          <InfoCircleOutlined class="mr-1" />
          需要创建的人员：
        </h4>
        <ul class="list-disc pl-5">
          <li v-for="person in importResults.newPersons" :key="person">
            {{ person }}
          </li>
        </ul>
      </div>

      <div v-if="importResults.errors.length > 0" class="mt-4">
        <Alert
          type="error"
          show-icon
          :message="`发现 ${importResults.errors.length} 个错误`"
          :description="importResults.errors.join('；')"
        />
      </div>
    </Modal>
  </Space>
</template>
