<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">⚙️ 系统设置</h1>
      <p class="text-gray-600">财务系统的个性化配置和偏好设置</p>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card title="🔧 基本设置">
        <Form :model="settings" layout="vertical">
          <Divider>通知设置</Divider>
          
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <div>
                <span class="font-medium">💰 预算提醒</span>
                <p class="text-sm text-gray-500">预算接近或超支时提醒</p>
              </div>
              <Switch v-model:checked="settings.notifications.budget" @change="saveNotificationSettings" />
            </div>
            <div class="flex justify-between items-center">
              <div>
                <span class="font-medium">🔔 账单提醒</span>
                <p class="text-sm text-gray-500">账单到期前提醒缴费</p>
              </div>
              <Switch v-model:checked="settings.notifications.bills" @change="saveNotificationSettings" />
            </div>
            <div class="flex justify-between items-center">
              <div>
                <span class="font-medium">📊 投资更新</span>
                <p class="text-sm text-gray-500">投资收益变化通知</p>
              </div>
              <Switch v-model:checked="settings.notifications.investment" @change="saveNotificationSettings" />
            </div>
            <div class="flex justify-between items-center">
              <div>
                <span class="font-medium">💾 自动备份</span>
                <p class="text-sm text-gray-500">定期自动备份数据</p>
              </div>
              <Switch v-model:checked="settings.autoBackup" @change="toggleAutoBackup" />
            </div>
          </div>

          <Divider>高级设置</Divider>

          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span>🎨 紧凑模式</span>
              <Switch v-model:checked="settings.compactMode" @change="toggleCompactMode" />
            </div>
            <div class="flex justify-between items-center">
              <span>🔒 自动锁屏</span>
              <Switch v-model:checked="settings.autoLock" @change="toggleAutoLock" />
            </div>
            <div class="flex justify-between items-center">
              <span>📈 数据统计</span>
              <Switch v-model:checked="settings.analytics" @change="toggleAnalytics" />
            </div>
          </div>

          <div class="mt-6 space-x-4">
            <Button type="primary" @click="saveAllSettings">💾 保存所有设置</Button>
            <Button @click="resetAllSettings">🔄 恢复默认</Button>
            <Button @click="exportAllSettings">📤 导出配置</Button>
          </div>
        </Form>
      </Card>
      
      <Card title="📊 系统状态">
        <div class="space-y-3">
          <div class="flex justify-between">
            <span>系统版本:</span>
            <span>v1.0.0</span>
          </div>
          <div class="flex justify-between">
            <span>数据库大小:</span>
            <span>空</span>
          </div>
          <div class="flex justify-between">
            <span>在线状态:</span>
            <Tag color="green">正常</Tag>
          </div>
          <div class="flex justify-between">
            <span>数据记录:</span>
            <span>0条</span>
          </div>
        </div>
        <div class="mt-4 space-y-2">
          <Button block @click="backupData" :loading="operationLoading.backup">
            🗄️ 备份数据
          </Button>
          <Button block @click="importData" :loading="operationLoading.import">
            📥 导入数据
          </Button>
          <Button block @click="clearCache" :loading="operationLoading.cache">
            🧹 清除缓存
          </Button>
          <Button block danger @click="resetSystem" :loading="operationLoading.reset">
            🗑️ 重置系统
          </Button>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  Card, Select, Switch, Tag, Button, Form, 
  Divider, notification, Modal 
} from 'ant-design-vue';

defineOptions({ name: 'FinanceSettings' });

// 系统设置
const settings = ref({
  defaultCurrency: 'CNY',
  notifications: {
    budget: true,
    bills: true,
    investment: false
  },
  autoBackup: true,
  compactMode: false,
  autoLock: false,
  analytics: true
});

// 操作加载状态
const operationLoading = ref({
  backup: false,
  import: false,
  cache: false,
  reset: false
});

// 功能方法
const saveCurrencySettings = (currency: string) => {
  console.log('货币设置更改为:', currency);
  localStorage.setItem('app-currency', currency);
  notification.success({
    message: '货币设置已更新',
    description: `默认货币已设置为 ${currency}`
  });
};


const saveNotificationSettings = () => {
  console.log('通知设置已保存:', settings.value.notifications);
  localStorage.setItem('app-notifications', JSON.stringify(settings.value.notifications));
  notification.info({
    message: '通知设置已保存',
    description: '通知偏好设置已更新'
  });
};

const toggleAutoBackup = (enabled: boolean) => {
  console.log('自动备份:', enabled);
  localStorage.setItem('app-auto-backup', enabled.toString());
  notification.info({
    message: enabled ? '自动备份已启用' : '自动备份已禁用',
    description: enabled ? '系统将定期自动备份数据' : '已关闭自动备份功能'
  });
};

const toggleCompactMode = (enabled: boolean) => {
  console.log('紧凑模式:', enabled);
  document.documentElement.classList.toggle('compact', enabled);
  localStorage.setItem('app-compact-mode', enabled.toString());
  notification.info({
    message: enabled ? '紧凑模式已启用' : '紧凑模式已禁用'
  });
};

const toggleAutoLock = (enabled: boolean) => {
  console.log('自动锁屏:', enabled);
  localStorage.setItem('app-auto-lock', enabled.toString());
  notification.info({
    message: enabled ? '自动锁屏已启用' : '自动锁屏已禁用'
  });
};

const toggleAnalytics = (enabled: boolean) => {
  console.log('数据统计:', enabled);
  localStorage.setItem('app-analytics', enabled.toString());
  notification.info({
    message: enabled ? '数据统计已启用' : '数据统计已禁用'
  });
};

const backupData = async () => {
  operationLoading.value.backup = true;
  try {
    // 模拟备份过程
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 创建备份数据
    const backupData = {
      settings: settings.value,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    
    // 下载备份文件
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finwise-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    notification.success({
      message: '数据备份成功',
      description: '备份文件已下载到本地'
    });
  } catch (error) {
    notification.error({
      message: '备份失败',
      description: '数据备份过程中出现错误'
    });
  } finally {
    operationLoading.value.backup = false;
  }
};

const importData = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      operationLoading.value.import = true;
      try {
        const text = await file.text();
        const importedData = JSON.parse(text);
        
        // 验证数据格式
        if (importedData.settings && importedData.version) {
          settings.value = { ...settings.value, ...importedData.settings };
          
          notification.success({
            message: '数据导入成功',
            description: '设置已从备份文件恢复'
          });
        } else {
          throw new Error('无效的备份文件格式');
        }
      } catch (error) {
        notification.error({
          message: '导入失败',
          description: '备份文件格式无效或已损坏'
        });
      } finally {
        operationLoading.value.import = false;
      }
    }
  };
  input.click();
};

const clearCache = async () => {
  operationLoading.value.cache = true;
  try {
    // 模拟清除缓存过程
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 清除各种缓存
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    
    // 清除localStorage中的缓存数据
    const keysToKeep = ['app-language', 'app-theme', 'app-currency'];
    Object.keys(localStorage).forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    notification.success({
      message: '缓存清除成功',
      description: '系统缓存已清理完成'
    });
  } catch (error) {
    notification.error({
      message: '清除失败',
      description: '缓存清除过程中出现错误'
    });
  } finally {
    operationLoading.value.cache = false;
  }
};

const resetSystem = () => {
  Modal.confirm({
    title: '⚠️ 确认重置系统',
    content: '此操作将删除所有数据和设置，且不可恢复。确定要继续吗？',
    okText: '确定重置',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      operationLoading.value.reset = true;
      try {
        // 模拟重置过程
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 清除所有本地数据
        localStorage.clear();
        sessionStorage.clear();
        
        notification.success({
          message: '系统重置成功',
          description: '系统将重新加载以应用重置'
        });
        
        // 延迟重新加载
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
      } catch (error) {
        notification.error({
          message: '重置失败',
          description: '系统重置过程中出现错误'
        });
      } finally {
        operationLoading.value.reset = false;
      }
    }
  });
};

const saveAllSettings = () => {
  console.log('保存所有设置:', settings.value);
  localStorage.setItem('app-all-settings', JSON.stringify(settings.value));
  notification.success({
    message: '设置保存成功',
    description: '所有配置已保存'
  });
};

const resetAllSettings = () => {
  settings.value = {
    defaultCurrency: 'CNY',
    notifications: {
      budget: true,
      bills: true,
      investment: false
    },
    autoBackup: true,
    compactMode: false,
    autoLock: false,
    analytics: true
  };
  
  notification.success({
    message: '设置已重置',
    description: '所有设置已恢复为默认值'
  });
};

const exportAllSettings = () => {
  const settingsData = {
    settings: settings.value,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };
  
  const blob = new Blob([JSON.stringify(settingsData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finwise-pro-settings-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  notification.success({
    message: '设置导出成功',
    description: '配置文件已下载'
  });
};

// 初始化
onMounted(() => {
  // 从localStorage恢复设置
  try {
    const savedSettings = localStorage.getItem('app-all-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      settings.value = { ...settings.value, ...parsed };
    }
    
    settings.value.defaultCurrency = localStorage.getItem('app-currency') || 'CNY';
    
  } catch (error) {
    console.error('设置恢复失败:', error);
  }
  
  console.log('系统设置页面加载完成');
});
</script>

<style scoped>
.grid { display: grid; }
</style>