<template>
  <div class="p-4">
    <PageWrapper title="系统设置" content="财务系统的个性化配置和偏好设置">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- 基本设置 -->
        <Card title="基本设置" class="lg:col-span-2">
          <Form :model="settings" layout="vertical">
            <Row :gutter="16">
              <Col :span="12">
                <Form.Item label="默认货币">
                  <Select v-model:value="settings.defaultCurrency" style="width: 100%">
                    <Select.Option value="CNY">人民币 (CNY)</Select.Option>
                    <Select.Option value="USD">美元 (USD)</Select.Option>
                    <Select.Option value="EUR">欧元 (EUR)</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="日期格式">
                  <Select v-model:value="settings.dateFormat" style="width: 100%">
                    <Select.Option value="YYYY-MM-DD">2024-12-28</Select.Option>
                    <Select.Option value="DD/MM/YYYY">28/12/2024</Select.Option>
                    <Select.Option value="MM-DD-YYYY">12-28-2024</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Row :gutter="16">
              <Col :span="12">
                <Form.Item label="财务年度开始月份">
                  <Select v-model:value="settings.fiscalYearStart" style="width: 100%">
                    <Select.Option value="1">1月</Select.Option>
                    <Select.Option value="4">4月</Select.Option>
                    <Select.Option value="7">7月</Select.Option>
                    <Select.Option value="10">10月</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="小数位数">
                  <InputNumber v-model:value="settings.decimalPlaces" :min="0" :max="4" style="width: 100%" />
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item label="界面主题">
              <Radio.Group v-model:value="settings.theme">
                <Radio.Button value="light">浅色主题</Radio.Button>
                <Radio.Button value="dark">深色主题</Radio.Button>
                <Radio.Button value="auto">跟随系统</Radio.Button>
              </Radio.Group>
            </Form.Item>
            
            <Divider />
            
            <h4 class="font-medium mb-3">通知设置</h4>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span>预算超支提醒</span>
                <Switch v-model:checked="settings.notifications.budgetAlert" />
              </div>
              <div class="flex items-center justify-between">
                <span>大额交易提醒</span>
                <Switch v-model:checked="settings.notifications.largeTransaction" />
              </div>
              <div class="flex items-center justify-between">
                <span>账单到期提醒</span>
                <Switch v-model:checked="settings.notifications.billReminder" />
              </div>
              <div class="flex items-center justify-between">
                <span>投资收益通知</span>
                <Switch v-model:checked="settings.notifications.investmentUpdate" />
              </div>
            </div>
            
            <Divider />
            
            <h4 class="font-medium mb-3">安全设置</h4>
            <div class="space-y-3">
              <Form.Item label="登录密码" help="建议定期更换密码">
                <Input.Password placeholder="输入新密码" />
              </Form.Item>
              <div class="flex items-center justify-between">
                <span>双因子认证</span>
                <Switch v-model:checked="settings.security.twoFactor" />
              </div>
              <div class="flex items-center justify-between">
                <span>自动锁定</span>
                <Switch v-model:checked="settings.security.autoLock" />
              </div>
            </div>
            
            <div class="mt-6 pt-4 border-t">
              <Space>
                <Button type="primary" @click="saveSettings">保存设置</Button>
                <Button @click="resetSettings">重置默认</Button>
                <Button @click="exportSettings">导出配置</Button>
              </Space>
            </div>
          </Form>
        </Card>

        <!-- 快速操作 -->
        <div class="space-y-4">
          <Card title="快速操作">
            <div class="space-y-3">
              <Button block @click="backupData">
                <Icon icon="mdi:backup-restore" class="mr-2" />
                备份数据
              </Button>
              <Button block @click="importData">
                <Icon icon="mdi:import" class="mr-2" />
                导入数据
              </Button>
              <Button block @click="clearCache">
                <Icon icon="mdi:cached" class="mr-2" />
                清除缓存
              </Button>
              <Button block danger @click="resetAllData">
                <Icon icon="mdi:delete-forever" class="mr-2" />
                重置数据
              </Button>
            </div>
          </Card>

          <Card title="系统信息">
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>版本:</span>
                <span>v2.0.1</span>
              </div>
              <div class="flex justify-between">
                <span>数据库大小:</span>
                <span>2.5 MB</span>
              </div>
              <div class="flex justify-between">
                <span>最后同步:</span>
                <span>{{ lastSyncTime }}</span>
              </div>
              <div class="flex justify-between">
                <span>在线状态:</span>
                <Tag color="green">正常</Tag>
              </div>
            </div>
          </Card>

          <Card title="技术支持">
            <div class="space-y-3">
              <Button block @click="checkUpdates">
                <Icon icon="mdi:update" class="mr-2" />
                检查更新
              </Button>
              <Button block @click="contactSupport">
                <Icon icon="mdi:help-circle" class="mr-2" />
                技术支持
              </Button>
              <Button block @click="viewDocs">
                <Icon icon="mdi:book-open" class="mr-2" />
                使用手册
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </PageWrapper>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { PageWrapper } from '@vben/common-ui';
import {
  Card, Form, Select, InputNumber, Row, Col, Radio, Divider,
  Switch, Input, Button, Space, Tag
} from 'ant-design-vue';
import { Icon } from '@iconify/vue';

defineOptions({ name: 'FinanceSettings' });

const lastSyncTime = ref(new Date().toLocaleString('zh-CN'));

// 设置数据
const settings = ref({
  defaultCurrency: 'CNY',
  dateFormat: 'YYYY-MM-DD',
  fiscalYearStart: '1',
  decimalPlaces: 2,
  theme: 'light',
  notifications: {
    budgetAlert: true,
    largeTransaction: true,
    billReminder: true,
    investmentUpdate: false
  },
  security: {
    twoFactor: false,
    autoLock: true
  }
});

// 设置操作方法
const saveSettings = () => {
  console.log('保存设置:', settings.value);
  // 实现设置保存逻辑
};

const resetSettings = () => {
  console.log('重置设置为默认值');
};

const exportSettings = () => {
  console.log('导出配置文件');
};

const backupData = () => {
  console.log('备份数据');
};

const importData = () => {
  console.log('导入数据');
};

const clearCache = () => {
  console.log('清除缓存');
};

const resetAllData = () => {
  console.log('重置所有数据');
};

const checkUpdates = () => {
  console.log('检查系统更新');
};

const contactSupport = () => {
  console.log('联系技术支持');
};

const viewDocs = () => {
  console.log('查看使用手册');
};
</script>

<style scoped>
:deep(.ant-form-item) {
  margin-bottom: 16px;
}
</style>