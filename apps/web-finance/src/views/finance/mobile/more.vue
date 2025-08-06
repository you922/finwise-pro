<template>
  <div class="mobile-more">
    <!-- 用户信息 -->
    <div class="user-section">
      <div class="user-avatar">
        <UserOutlined />
      </div>
      <div class="user-info">
        <div class="user-name">管理员</div>
        <div class="user-desc">记账让生活更美好</div>
      </div>
    </div>
    
    <!-- 功能列表 -->
    <div class="menu-section">
      <div class="menu-group">
        <div class="menu-item" @click="navigateTo('Category')">
          <div class="menu-icon">
            <AppstoreOutlined />
          </div>
          <div class="menu-title">分类管理</div>
          <div class="menu-arrow">
            <RightOutlined />
          </div>
        </div>
        
        <div class="menu-item" @click="navigateTo('Person')">
          <div class="menu-icon">
            <TeamOutlined />
          </div>
          <div class="menu-title">人员管理</div>
          <div class="menu-arrow">
            <RightOutlined />
          </div>
        </div>
        
        <div class="menu-item" @click="navigateTo('Tag')">
          <div class="menu-icon">
            <TagsOutlined />
          </div>
          <div class="menu-title">标签管理</div>
          <div class="menu-arrow">
            <RightOutlined />
          </div>
        </div>
        
        <div class="menu-item" @click="navigateTo('Loan')">
          <div class="menu-icon">
            <BankOutlined />
          </div>
          <div class="menu-title">贷款管理</div>
          <div class="menu-arrow">
            <RightOutlined />
          </div>
        </div>
      </div>
      
      <div class="menu-group">
        <div class="menu-item" @click="showExportModal = true">
          <div class="menu-icon">
            <ExportOutlined />
          </div>
          <div class="menu-title">数据导出</div>
          <div class="menu-arrow">
            <RightOutlined />
          </div>
        </div>
        
        <div class="menu-item" @click="showImportModal = true">
          <div class="menu-icon">
            <ImportOutlined />
          </div>
          <div class="menu-title">数据导入</div>
          <div class="menu-arrow">
            <RightOutlined />
          </div>
        </div>
      </div>
      
      <div class="menu-group">
        <div class="menu-item" @click="showAbout = true">
          <div class="menu-icon">
            <InfoCircleOutlined />
          </div>
          <div class="menu-title">关于</div>
          <div class="menu-arrow">
            <RightOutlined />
          </div>
        </div>
      </div>
    </div>
    
    <!-- 导出弹窗 -->
    <Modal
      v-model:open="showExportModal"
      title="数据导出"
      @ok="handleExport"
    >
      <Form layout="vertical">
        <FormItem label="导出格式">
          <RadioGroup v-model:value="exportFormat">
            <Radio value="csv">CSV 格式</Radio>
            <Radio value="json">JSON 格式</Radio>
          </RadioGroup>
        </FormItem>
        
        <FormItem label="导出范围">
          <RadioGroup v-model:value="exportRange">
            <Radio value="all">全部数据</Radio>
            <Radio value="current-month">当前月份</Radio>
            <Radio value="custom">自定义范围</Radio>
          </RadioGroup>
        </FormItem>
        
        <FormItem v-if="exportRange === 'custom'" label="选择日期范围">
          <RangePicker
            v-model:value="exportDateRange"
            style="width: 100%"
          />
        </FormItem>
      </Form>
    </Modal>
    
    <!-- 导入弹窗 -->
    <Modal
      v-model:open="showImportModal"
      title="数据导入"
      :footer="null"
    >
      <ImportExport />
    </Modal>
    
    <!-- 关于弹窗 -->
    <Drawer
      v-model:open="showAbout"
      title="关于 TokenRecords"
      placement="bottom"
      :height="'50%'"
    >
      <div class="about-content">
        <div class="app-logo">
          <DollarOutlined style="font-size: 48px; color: #1890ff" />
        </div>
        <h2>TokenRecords 财务管理系统</h2>
        <p>版本：1.0.0</p>
        <p>一个简单易用的个人财务管理工具，帮助您记录和管理日常收支。</p>
        
        <Divider />
        
        <h3>主要功能</h3>
        <ul>
          <li>交易记录管理</li>
          <li>分类和标签系统</li>
          <li>预算管理</li>
          <li>统计分析</li>
          <li>数据导入导出</li>
        </ul>
        
        <Divider />
        
        <p style="text-align: center; color: #8c8c8c">
          © 2024 TokenRecords. All rights reserved.
        </p>
      </div>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import type { Dayjs } from 'dayjs';

import {
  AppstoreOutlined,
  BankOutlined,
  DollarOutlined,
  ExportOutlined,
  ImportOutlined,
  InfoCircleOutlined,
  RightOutlined,
  TagsOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons-vue';
import {
  DatePicker,
  Divider,
  Drawer,
  Form,
  FormItem,
  Modal,
  Radio,
  RadioGroup,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { useTransactionStore } from '#/store/modules/transaction';
import { useCategoryStore } from '#/store/modules/category';
import { usePersonStore } from '#/store/modules/person';
import { exportToCSV, exportToJSON } from '#/utils/export';
import ImportExport from '#/views/finance/transaction/components/import-export.vue';

const { RangePicker } = DatePicker;

const router = useRouter();
const transactionStore = useTransactionStore();
const categoryStore = useCategoryStore();
const personStore = usePersonStore();

const showExportModal = ref(false);
const showImportModal = ref(false);
const showAbout = ref(false);

const exportFormat = ref<'csv' | 'json'>('csv');
const exportRange = ref<'all' | 'current-month' | 'custom'>('all');
const exportDateRange = ref<[Dayjs, Dayjs]>([
  dayjs().startOf('month'),
  dayjs().endOf('month'),
]);

const navigateTo = (name: string) => {
  router.push({ name });
};

const handleExport = async () => {
  try {
    let transactions = transactionStore.transactions;
    
    // 根据选择的范围过滤数据
    if (exportRange.value === 'current-month') {
      const currentMonth = dayjs();
      transactions = transactions.filter((t) => {
        const date = dayjs(t.date);
        return date.year() === currentMonth.year() && 
               date.month() === currentMonth.month();
      });
    } else if (exportRange.value === 'custom' && exportDateRange.value) {
      const [start, end] = exportDateRange.value;
      transactions = transactions.filter((t) => {
        const date = dayjs(t.date);
        return date.isAfter(start.subtract(1, 'day')) && 
               date.isBefore(end.add(1, 'day'));
      });
    }
    
    // 准备导出数据
    const exportData = transactions.map((t) => {
      const category = categoryStore.categories.find((c) => c.id === t.categoryId);
      return {
        ...t,
        categoryName: category?.name || '',
        typeName: t.type === 'income' ? '收入' : '支出',
        statusName: t.status === 'completed' ? '已完成' : 
                    t.status === 'pending' ? '待处理' : '已取消',
      };
    });
    
    // 导出文件
    const filename = `transactions_${dayjs().format('YYYYMMDD')}`;
    if (exportFormat.value === 'csv') {
      exportToCSV(exportData, filename);
    } else {
      exportToJSON(exportData, filename);
    }
    
    message.success('导出成功');
    showExportModal.value = false;
  } catch (error) {
    message.error('导出失败');
  }
};
</script>

<style scoped>
.mobile-more {
  background: #f5f5f5;
  min-height: 100%;
  padding-bottom: 20px;
}

.user-section {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  padding: 24px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  color: #fff;
}

.user-avatar {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 4px;
}

.user-desc {
  font-size: 14px;
  opacity: 0.9;
}

.menu-section {
  padding: 12px 0;
}

.menu-group {
  background: #fff;
  margin-bottom: 12px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.3s;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background: #f5f5f5;
}

.menu-icon {
  font-size: 20px;
  color: #1890ff;
  margin-right: 12px;
  width: 24px;
  text-align: center;
}

.menu-title {
  flex: 1;
  font-size: 14px;
  color: #262626;
}

.menu-arrow {
  font-size: 12px;
  color: #bfbfbf;
}

.about-content {
  text-align: center;
  padding: 20px 0;
}

.app-logo {
  margin-bottom: 20px;
}

.about-content h2 {
  font-size: 20px;
  margin-bottom: 8px;
}

.about-content h3 {
  font-size: 16px;
  text-align: left;
  margin-bottom: 12px;
}

.about-content ul {
  text-align: left;
  padding-left: 20px;
}

.about-content li {
  margin-bottom: 8px;
  color: #595959;
}
</style>