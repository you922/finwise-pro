<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">🎯 财务规划</h1>
      <p class="text-gray-600">智能财务规划向导，帮您制定个性化理财计划</p>
    </div>

    <!-- 规划向导步骤 -->
    <Card class="mb-6">
      <Steps :current="currentStep" class="mb-8">
        <Steps.Step title="基本信息" description="收入支出情况" />
        <Steps.Step title="目标设定" description="理财目标制定" />
        <Steps.Step title="风险评估" description="投资风险偏好" />
        <Steps.Step title="规划方案" description="个性化建议" />
      </Steps>

      <!-- 步骤1: 基本信息 -->
      <div v-if="currentStep === 0">
        <h3 class="text-lg font-medium mb-4">💼 收入支出信息</h3>
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item label="月平均收入">
              <InputNumber v-model:value="planningData.monthlyIncome" :precision="0" style="width: 100%" placeholder="请输入月收入" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="月平均支出">
              <InputNumber v-model:value="planningData.monthlyExpense" :precision="0" style="width: 100%" placeholder="请输入月支出" />
            </Form.Item>
          </Col>
        </Row>

        <h3 class="text-lg font-medium mb-4 mt-6">💰 资产负债情况</h3>
        <Row :gutter="16">
          <Col :span="8">
            <Form.Item label="现金及存款">
              <InputNumber v-model:value="planningData.cashAssets" :precision="0" style="width: 100%" />
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item label="投资资产">
              <InputNumber v-model:value="planningData.investmentAssets" :precision="0" style="width: 100%" />
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item label="负债总额">
              <InputNumber v-model:value="planningData.totalDebt" :precision="0" style="width: 100%" />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <!-- 步骤2: 目标设定 -->
      <div v-if="currentStep === 1">
        <h3 class="text-lg font-medium mb-4">🎯 理财目标设置</h3>
        <div class="space-y-6">
          <div v-for="(goal, index) in planningData.goals" :key="index" class="p-4 border border-gray-200 rounded-lg">
            <Row :gutter="16">
              <Col :span="8">
                <Form.Item label="目标名称">
                  <Input v-model:value="goal.name" placeholder="如：买房首付" />
                </Form.Item>
              </Col>
              <Col :span="8">
                <Form.Item label="目标金额">
                  <InputNumber v-model:value="goal.amount" :precision="0" style="width: 100%" />
                </Form.Item>
              </Col>
              <Col :span="6">
                <Form.Item label="目标期限">
                  <DatePicker v-model:value="goal.deadline" style="width: 100%" />
                </Form.Item>
              </Col>
              <Col :span="2">
                <Form.Item label=" ">
                  <Button type="text" danger @click="removeGoal(index)">🗑️</Button>
                </Form.Item>
              </Col>
            </Row>

            <Row :gutter="16">
              <Col :span="12">
                <Form.Item label="优先级">
                  <Select v-model:value="goal.priority">
                    <Select.Option value="high">高优先级</Select.Option>
                    <Select.Option value="medium">中优先级</Select.Option>
                    <Select.Option value="low">低优先级</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="目标类型">
                  <Select v-model:value="goal.type">
                    <Select.Option value="emergency">紧急基金</Select.Option>
                    <Select.Option value="house">购房</Select.Option>
                    <Select.Option value="education">教育</Select.Option>
                    <Select.Option value="retirement">退休</Select.Option>
                    <Select.Option value="travel">旅游</Select.Option>
                    <Select.Option value="other">其他</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Button type="dashed" block @click="addGoal">➕ 添加理财目标</Button>
        </div>
      </div>

      <!-- 步骤3: 风险评估 -->
      <div v-if="currentStep === 2">
        <h3 class="text-lg font-medium mb-4">⚖️ 投资风险评估</h3>
        <div class="space-y-6">
          <div v-for="(question, index) in riskQuestions" :key="index" class="p-4 bg-gray-50 rounded-lg">
            <h4 class="font-medium mb-3">{{ question.title }}</h4>
            <Radio.Group v-model:value="planningData.riskAnswers[index]">
              <div class="space-y-2">
                <div v-for="(option, optIndex) in question.options" :key="optIndex">
                  <Radio :value="optIndex">{{ option }}</Radio>
                </div>
              </div>
            </Radio.Group>
          </div>
        </div>
      </div>

      <!-- 步骤4: 规划方案 -->
      <div v-if="currentStep === 3">
        <div v-if="!planningResult" class="text-center py-12">
          <div class="text-6xl mb-4">🤖</div>
          <p class="text-gray-500 mb-6">正在为您生成个性化财务规划方案...</p>
          <Button type="primary" @click="generatePlan" loading>生成规划方案</Button>
        </div>

        <div v-else>
          <h3 class="text-lg font-medium mb-4">📋 您的专属财务规划方案</h3>
          
          <!-- 风险评估结果 -->
          <Card class="mb-4" title="风险偏好分析">
            <div class="flex items-center space-x-4">
              <div class="text-3xl">{{ getRiskEmoji() }}</div>
              <div>
                <p class="font-medium">{{ getRiskLevel() }}</p>
                <p class="text-sm text-gray-500">{{ getRiskDescription() }}</p>
              </div>
            </div>
          </Card>

          <!-- 资产配置建议 -->
          <Card class="mb-4" title="资产配置建议">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div v-for="allocation in assetAllocation" :key="allocation.type" class="text-center p-4 bg-gray-50 rounded-lg">
                <p class="text-sm text-gray-500">{{ allocation.name }}</p>
                <p class="text-xl font-bold" :class="allocation.color">{{ allocation.percentage }}%</p>
                <p class="text-xs text-gray-400">{{ allocation.description }}</p>
              </div>
            </div>
          </Card>

          <!-- 具体执行计划 -->
          <Card title="执行计划">
            <Timeline>
              <Timeline.Item v-for="(step, index) in executionPlan" :key="index" :color="step.color">
                <div class="mb-2">
                  <span class="font-medium">{{ step.title }}</span>
                  <Tag class="ml-2" :color="step.priority === 'high' ? 'red' : 'blue'">
                    {{ step.priority === 'high' ? '高优先级' : '普通' }}
                  </Tag>
                </div>
                <p class="text-sm text-gray-600">{{ step.description }}</p>
                <p class="text-xs text-gray-400 mt-1">预期完成时间: {{ step.timeline }}</p>
              </Timeline.Item>
            </Timeline>
          </Card>
        </div>
      </div>

      <!-- 导航按钮 -->
      <div class="flex justify-between mt-8">
        <Button v-if="currentStep > 0" @click="prevStep">上一步</Button>
        <div v-else></div>
        <Button v-if="currentStep < 3" type="primary" @click="nextStep">下一步</Button>
        <Button v-else type="primary" @click="savePlan">保存规划</Button>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Card, Steps, Row, Col, Form, InputNumber, Button, Select,
  DatePicker, Radio, Timeline, Tag
} from 'ant-design-vue';
import dayjs from 'dayjs';

defineOptions({ name: 'FinancialPlanning' });

const currentStep = ref(0);
const planningResult = ref(null);

// 规划数据
const planningData = ref({
  monthlyIncome: null,
  monthlyExpense: null,
  cashAssets: null,
  investmentAssets: null,
  totalDebt: null,
  goals: [],
  riskAnswers: []
});

// 风险评估问题
const riskQuestions = ref([
  {
    title: '如果您的投资在短期内出现20%的亏损，您会如何反应？',
    options: [
      '立即卖出，避免更大损失',
      '保持观望，等待市场恢复',
      '继续持有，甚至考虑加仓',
      '完全不担心，长期投资'
    ]
  },
  {
    title: '您更偏好哪种投资方式？',
    options: [
      '银行定期存款，安全稳定',
      '货币基金，流动性好',
      '混合型基金，平衡风险收益',
      '股票投资，追求高回报'
    ]
  },
  {
    title: '您的投资经验如何？',
    options: [
      '完全没有经验',
      '了解基本概念',
      '有一定实践经验',
      '经验丰富，熟悉各种产品'
    ]
  }
]);

// 资产配置建议（空数据，根据评估生成）
const assetAllocation = ref([]);

// 执行计划（空数据）
const executionPlan = ref([]);

// 方法实现
const nextStep = () => {
  if (currentStep.value < 3) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

const addGoal = () => {
  planningData.value.goals.push({
    name: '',
    amount: null,
    deadline: null,
    priority: 'medium',
    type: 'other'
  });
};

const removeGoal = (index: number) => {
  planningData.value.goals.splice(index, 1);
};

const generatePlan = () => {
  console.log('生成规划方案:', planningData.value);
  // 这里实现规划算法
  setTimeout(() => {
    planningResult.value = {
      riskLevel: 'moderate',
      recommendations: []
    };
    
    // 根据风险评估生成资产配置
    assetAllocation.value = [
      { type: 'cash', name: '现金类', percentage: 20, color: 'text-blue-600', description: '货币基金' },
      { type: 'bond', name: '债券类', percentage: 30, color: 'text-green-600', description: '债券基金' },
      { type: 'stock', name: '股票类', percentage: 40, color: 'text-red-600', description: '股票基金' },
      { type: 'alternative', name: '另类投资', percentage: 10, color: 'text-purple-600', description: 'REITs等' }
    ];

    // 生成执行计划
    executionPlan.value = [
      {
        title: '建立紧急基金',
        description: '准备3-6个月的生活费作为紧急基金',
        timeline: '1-2个月',
        color: 'red',
        priority: 'high'
      },
      {
        title: '开设投资账户',
        description: '选择合适的券商开设证券账户',
        timeline: '第3个月',
        color: 'blue',
        priority: 'normal'
      },
      {
        title: '开始定投计划',
        description: '按照资产配置比例开始定期投资',
        timeline: '第4个月开始',
        color: 'green',
        priority: 'normal'
      }
    ];
  }, 3000);
};

const getRiskEmoji = () => {
  const score = planningData.value.riskAnswers.reduce((sum, answer) => sum + (answer || 0), 0);
  if (score <= 3) return '🛡️';
  if (score <= 6) return '⚖️';
  return '🚀';
};

const getRiskLevel = () => {
  const score = planningData.value.riskAnswers.reduce((sum, answer) => sum + (answer || 0), 0);
  if (score <= 3) return '保守型投资者';
  if (score <= 6) return '平衡型投资者';
  return '积极型投资者';
};

const getRiskDescription = () => {
  const score = planningData.value.riskAnswers.reduce((sum, answer) => sum + (answer || 0), 0);
  if (score <= 3) return '偏好稳健投资，注重本金安全';
  if (score <= 6) return '平衡风险与收益，适度投资';
  return '愿意承担较高风险，追求高收益';
};

const savePlan = () => {
  console.log('保存财务规划:', planningData.value, planningResult.value);
};
</script>

<style scoped>
.grid { display: grid; }
</style>