<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">📱 费用追踪</h1>
      <p class="text-gray-600">智能费用追踪，支持小票OCR识别和自动分类</p>
    </div>

    <!-- 快速添加费用 -->
    <Card class="mb-6" title="⚡ 快速记录">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- 拍照记录 -->
        <div class="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 cursor-pointer" @click="openCamera">
          <div class="text-4xl mb-3">📷</div>
          <h3 class="font-medium mb-2">拍照记录</h3>
          <p class="text-sm text-gray-500">拍摄小票，自动识别金额和商家</p>
        </div>

        <!-- 语音记录 -->
        <div class="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 cursor-pointer" @click="startVoiceRecord">
          <div class="text-4xl mb-3">🎤</div>
          <h3 class="font-medium mb-2">语音记录</h3>
          <p class="text-sm text-gray-500">说出消费内容，智能转换为记录</p>
        </div>

        <!-- 手动输入 -->
        <div class="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 cursor-pointer" @click="showQuickAdd = true">
          <div class="text-4xl mb-3">✍️</div>
          <h3 class="font-medium mb-2">手动输入</h3>
          <p class="text-sm text-gray-500">快速手动输入费用信息</p>
        </div>
      </div>
    </Card>

    <!-- 今日费用汇总 -->
    <Card class="mb-6" title="📅 今日费用汇总">
      <div v-if="todayExpenses.length === 0" class="text-center py-8">
        <div class="text-6xl mb-4">💸</div>
        <p class="text-gray-500 mb-4">今天还没有费用记录</p>
        <Button type="primary" @click="openCamera">开始记录第一笔费用</Button>
      </div>
      <div v-else>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div class="text-center p-4 bg-red-50 rounded-lg">
            <p class="text-sm text-gray-500">今日支出</p>
            <p class="text-2xl font-bold text-red-600">¥{{ todayTotal.toLocaleString() }}</p>
          </div>
          <div class="text-center p-4 bg-blue-50 rounded-lg">
            <p class="text-sm text-gray-500">记录笔数</p>
            <p class="text-2xl font-bold text-blue-600">{{ todayExpenses.length }}</p>
          </div>
          <div class="text-center p-4 bg-green-50 rounded-lg">
            <p class="text-sm text-gray-500">主要类别</p>
            <p class="text-2xl font-bold text-green-600">{{ topCategory || '-' }}</p>
          </div>
        </div>
        
        <!-- 今日费用列表 -->
        <div class="space-y-3">
          <div v-for="expense in todayExpenses" :key="expense.id" 
               class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div class="flex items-center space-x-3">
              <span class="text-2xl">{{ expense.emoji }}</span>
              <div>
                <p class="font-medium">{{ expense.merchant || '未知商家' }}</p>
                <p class="text-sm text-gray-500">{{ expense.time }} · {{ expense.method }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-bold text-red-600">¥{{ expense.amount.toLocaleString() }}</p>
              <Tag size="small" :color="getCategoryColor(expense.category)">{{ expense.category }}</Tag>
            </div>
          </div>
        </div>
      </div>
    </Card>

    <!-- 费用分析 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <Card title="📊 本周费用趋势">
        <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div class="text-center">
            <div class="text-4xl mb-2">📈</div>
            <p class="text-gray-600">费用趋势分析</p>
            <p class="text-sm text-gray-500">每日费用变化图表</p>
          </div>
        </div>
      </Card>

      <Card title="🏪 商家排行">
        <div v-if="merchantRanking.length === 0" class="text-center py-8">
          <div class="text-4xl mb-3">🏪</div>
          <p class="text-gray-500">暂无商家数据</p>
        </div>
        <div v-else class="space-y-3">
          <div v-for="(merchant, index) in merchantRanking" :key="merchant.name" 
               class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center space-x-3">
              <span class="text-lg font-bold text-gray-400">{{ index + 1 }}</span>
              <span class="font-medium">{{ merchant.name }}</span>
            </div>
            <div class="text-right">
              <p class="font-semibold">¥{{ merchant.total.toLocaleString() }}</p>
              <p class="text-xs text-gray-500">{{ merchant.count }}次</p>
            </div>
          </div>
        </div>
      </Card>
    </div>

    <!-- 智能分析 -->
    <Card class="mb-6" title="🧠 智能分析">
      <div v-if="insights.length === 0" class="text-center py-8">
        <div class="text-4xl mb-3">🤖</div>
        <p class="text-gray-500">积累更多数据后将为您提供智能分析</p>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="insight in insights" :key="insight.id" class="p-4 border border-gray-200 rounded-lg">
          <div class="flex items-start space-x-3">
            <span class="text-2xl">{{ insight.emoji }}</span>
            <div>
              <h4 class="font-medium mb-1">{{ insight.title }}</h4>
              <p class="text-sm text-gray-600 mb-2">{{ insight.description }}</p>
              <Tag :color="insight.type === 'warning' ? 'orange' : insight.type === 'tip' ? 'blue' : 'green'">
                {{ insight.type === 'warning' ? '注意' : insight.type === 'tip' ? '建议' : '良好' }}
              </Tag>
            </div>
          </div>
        </div>
      </div>
    </Card>

    <!-- 快速添加模态框 -->
    <Modal v-model:open="showQuickAdd" title="✍️ 快速记录费用">
      <Form :model="quickExpenseForm" layout="vertical">
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item label="金额" required>
              <InputNumber v-model:value="quickExpenseForm.amount" :precision="2" style="width: 100%" placeholder="0.00" size="large" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="支付方式">
              <Select v-model:value="quickExpenseForm.method">
                <Select.Option value="cash">现金</Select.Option>
                <Select.Option value="card">刷卡</Select.Option>
                <Select.Option value="mobile">手机支付</Select.Option>
                <Select.Option value="online">网上支付</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row :gutter="16">
          <Col :span="12">
            <Form.Item label="消费类别">
              <Select v-model:value="quickExpenseForm.category" placeholder="选择或搜索类别" show-search>
                <Select.Option value="food">餐饮</Select.Option>
                <Select.Option value="transport">交通</Select.Option>
                <Select.Option value="shopping">购物</Select.Option>
                <Select.Option value="entertainment">娱乐</Select.Option>
                <Select.Option value="medical">医疗</Select.Option>
                <Select.Option value="education">教育</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="商家名称">
              <AutoComplete v-model:value="quickExpenseForm.merchant" :options="merchantSuggestions" placeholder="输入商家名称" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="消费描述">
          <Input.TextArea v-model:value="quickExpenseForm.description" :rows="2" placeholder="简单描述这笔消费..." />
        </Form.Item>

        <Form.Item label="添加标签">
          <Select v-model:value="quickExpenseForm.tags" mode="tags" placeholder="添加标签便于分类">
            <Select.Option value="必需品">必需品</Select.Option>
            <Select.Option value="一次性">一次性</Select.Option>
            <Select.Option value="定期">定期</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="是否分期">
          <div class="flex items-center space-x-4">
            <Switch v-model:checked="quickExpenseForm.isInstallment" />
            <span class="text-sm text-gray-500">如果是信用卡分期消费请开启</span>
          </div>
          <div v-if="quickExpenseForm.isInstallment" class="mt-3 grid grid-cols-2 gap-4">
            <Input placeholder="分期期数" />
            <InputNumber placeholder="每期金额" style="width: 100%" />
          </div>
        </Form.Item>
      </Form>
      
      <template #footer>
        <div class="flex justify-between">
          <Button @click="showQuickAdd = false">取消</Button>
          <Space>
            <Button @click="saveAndContinue">保存并继续</Button>
            <Button type="primary" @click="saveQuickExpense">保存</Button>
          </Space>
        </div>
      </template>
    </Modal>

    <!-- 相机拍摄模态框 -->
    <Modal v-model:open="showCamera" title="📷 拍摄小票" width="400px">
      <div class="text-center py-8">
        <div class="mb-4">
          <video ref="videoRef" autoplay muted style="width: 100%; max-width: 300px; border-radius: 8px;"></video>
        </div>
        <canvas ref="canvasRef" style="display: none;"></canvas>
        <div class="space-x-4">
          <Button type="primary" @click="capturePhoto">📸 拍照</Button>
          <Button @click="stopCamera">取消</Button>
        </div>
        <p class="text-xs text-gray-500 mt-2">请将小票置于画面中心</p>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Card, Button, Table, Tag, Modal, Form, Row, Col, InputNumber, 
  Select, AutoComplete, Input, Switch, Space
} from 'ant-design-vue';

defineOptions({ name: 'ExpenseTracking' });

const showQuickAdd = ref(false);
const showCamera = ref(false);
const videoRef = ref();
const canvasRef = ref();

// 今日费用（空数据）
const todayExpenses = ref([]);

// 商家排行（空数据） 
const merchantRanking = ref([]);

// 智能分析（空数据）
const insights = ref([]);

// 商家建议（空数据）
const merchantSuggestions = ref([]);

// 计算属性
const todayTotal = computed(() => 
  todayExpenses.value.reduce((sum, expense) => sum + expense.amount, 0)
);

const topCategory = computed(() => {
  if (todayExpenses.value.length === 0) return null;
  const categoryCount = {};
  todayExpenses.value.forEach(expense => {
    categoryCount[expense.category] = (categoryCount[expense.category] || 0) + 1;
  });
  return Object.keys(categoryCount).reduce((a, b) => categoryCount[a] > categoryCount[b] ? a : b);
});

// 快速费用表单
const quickExpenseForm = ref({
  amount: null,
  method: 'mobile',
  category: '',
  merchant: '',
  description: '',
  tags: [],
  isInstallment: false
});

// 方法实现
const getCategoryColor = (category: string) => {
  const colorMap = {
    'food': 'orange', 'transport': 'blue', 'shopping': 'purple',
    'entertainment': 'pink', 'medical': 'red', 'education': 'green'
  };
  return colorMap[category] || 'default';
};

const openCamera = async () => {
  try {
    showCamera.value = true;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.value.srcObject = stream;
  } catch (error) {
    console.error('无法访问相机:', error);
    alert('无法访问相机，请检查权限设置');
  }
};

const capturePhoto = () => {
  const canvas = canvasRef.value;
  const video = videoRef.value;
  const context = canvas.getContext('2d');
  
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0);
  
  const imageData = canvas.toDataURL('image/jpeg');
  console.log('拍摄的照片数据:', imageData);
  
  // 这里可以调用OCR API识别小票
  simulateOcrRecognition(imageData);
  
  stopCamera();
};

const stopCamera = () => {
  const video = videoRef.value;
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }
  showCamera.value = false;
};

const simulateOcrRecognition = (imageData: string) => {
  // 模拟OCR识别过程
  setTimeout(() => {
    console.log('OCR识别完成');
    // 可以自动填充表单数据
  }, 2000);
};

const startVoiceRecord = () => {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    console.log('开始语音识别');
    // 实现语音识别逻辑
  } else {
    alert('您的浏览器不支持语音识别功能');
  }
};

const saveQuickExpense = () => {
  console.log('保存快速费用:', quickExpenseForm.value);
  showQuickAdd.value = false;
  resetQuickForm();
};

const saveAndContinue = () => {
  console.log('保存并继续:', quickExpenseForm.value);
  resetQuickForm();
};

const resetQuickForm = () => {
  quickExpenseForm.value = {
    amount: null,
    method: 'mobile',
    category: '',
    merchant: '',
    description: '',
    tags: [],
    isInstallment: false
  };
};
</script>

<style scoped>
.grid { display: grid; }
</style>