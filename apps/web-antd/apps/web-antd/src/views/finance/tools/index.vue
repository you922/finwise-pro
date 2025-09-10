<template>
  <div class="p-4">
    <PageWrapper title="财务工具" content="实用的财务计算和分析工具">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <!-- 贷款计算器 -->
        <Card title="贷款计算器" class="tool-card">
          <template #extra>
            <Icon icon="mdi:calculator" class="text-lg" />
          </template>
          <Form layout="vertical" size="small">
            <Form.Item label="贷款金额">
              <InputNumber v-model:value="loanCalculator.principal" :precision="0" style="width: 100%" placeholder="100000" />
            </Form.Item>
            <Form.Item label="年利率(%)">
              <InputNumber v-model:value="loanCalculator.rate" :precision="2" :step="0.1" style="width: 100%" placeholder="4.35" />
            </Form.Item>
            <Form.Item label="贷款期限(年)">
              <InputNumber v-model:value="loanCalculator.years" :precision="0" style="width: 100%" placeholder="20" />
            </Form.Item>
            <Button type="primary" block @click="calculateLoan">计算</Button>
          </Form>
          
          <div v-if="loanResult.monthlyPayment" class="mt-4 p-3 bg-blue-50 rounded-lg">
            <div class="text-center">
              <p class="text-sm text-gray-600">月供金额</p>
              <p class="text-xl font-bold text-blue-600">{{ formatCurrency(loanResult.monthlyPayment) }}</p>
            </div>
            <Divider />
            <div class="space-y-1 text-xs">
              <div class="flex justify-between">
                <span>总利息:</span>
                <span>{{ formatCurrency(loanResult.totalInterest) }}</span>
              </div>
              <div class="flex justify-between">
                <span>总还款:</span>
                <span>{{ formatCurrency(loanResult.totalPayment) }}</span>
              </div>
            </div>
          </div>
        </Card>

        <!-- 投资收益计算器 -->
        <Card title="投资收益计算器" class="tool-card">
          <template #extra>
            <Icon icon="mdi:trending-up" class="text-lg" />
          </template>
          <Form layout="vertical" size="small">
            <Form.Item label="初始投资">
              <InputNumber v-model:value="investmentCalculator.initial" style="width: 100%" placeholder="50000" />
            </Form.Item>
            <Form.Item label="年收益率(%)">
              <InputNumber v-model:value="investmentCalculator.rate" :precision="2" style="width: 100%" placeholder="8" />
            </Form.Item>
            <Form.Item label="投资期限(年)">
              <InputNumber v-model:value="investmentCalculator.years" style="width: 100%" placeholder="5" />
            </Form.Item>
            <Form.Item label="复利计算">
              <Switch v-model:checked="investmentCalculator.compound" />
            </Form.Item>
            <Button type="primary" block @click="calculateInvestment">计算收益</Button>
          </Form>
          
          <div v-if="investmentResult.finalValue" class="mt-4 p-3 bg-green-50 rounded-lg">
            <div class="text-center">
              <p class="text-sm text-gray-600">预期收益</p>
              <p class="text-xl font-bold text-green-600">{{ formatCurrency(investmentResult.profit) }}</p>
            </div>
            <Divider />
            <div class="space-y-1 text-xs">
              <div class="flex justify-between">
                <span>最终价值:</span>
                <span>{{ formatCurrency(investmentResult.finalValue) }}</span>
              </div>
              <div class="flex justify-between">
                <span>收益率:</span>
                <span>{{ investmentResult.totalReturn.toFixed(2) }}%</span>
              </div>
            </div>
          </div>
        </Card>

        <!-- 汇率换算 -->
        <Card title="汇率换算" class="tool-card">
          <template #extra>
            <Icon icon="mdi:currency-usd" class="text-lg" />
          </template>
          <Form layout="vertical" size="small">
            <Form.Item label="金额">
              <InputNumber v-model:value="currencyConverter.amount" style="width: 100%" placeholder="1000" />
            </Form.Item>
            <Form.Item label="原币种">
              <Select v-model:value="currencyConverter.from" style="width: 100%">
                <Select.Option value="CNY">人民币(CNY)</Select.Option>
                <Select.Option value="USD">美元(USD)</Select.Option>
                <Select.Option value="EUR">欧元(EUR)</Select.Option>
                <Select.Option value="JPY">日元(JPY)</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="目标币种">
              <Select v-model:value="currencyConverter.to" style="width: 100%">
                <Select.Option value="USD">美元(USD)</Select.Option>
                <Select.Option value="CNY">人民币(CNY)</Select.Option>
                <Select.Option value="EUR">欧元(EUR)</Select.Option>
                <Select.Option value="JPY">日元(JPY)</Select.Option>
              </Select>
            </Form.Item>
            <Button type="primary" block @click="convertCurrency">换算</Button>
          </Form>
          
          <div v-if="currencyResult.converted" class="mt-4 p-3 bg-purple-50 rounded-lg text-center">
            <p class="text-sm text-gray-600">换算结果</p>
            <p class="text-lg font-bold text-purple-600">
              {{ currencyResult.converted }} {{ currencyConverter.to }}
            </p>
            <p class="text-xs text-gray-500 mt-1">
              汇率: 1 {{ currencyConverter.from }} = {{ currencyResult.rate }} {{ currencyConverter.to }}
            </p>
          </div>
        </Card>

        <!-- 退休规划计算器 -->
        <Card title="退休规划" class="tool-card">
          <template #extra>
            <Icon icon="mdi:account-clock" class="text-lg" />
          </template>
          <Form layout="vertical" size="small">
            <Form.Item label="当前年龄">
              <InputNumber v-model:value="retirementPlanner.currentAge" :min="18" :max="65" style="width: 100%" />
            </Form.Item>
            <Form.Item label="退休年龄">
              <InputNumber v-model:value="retirementPlanner.retirementAge" :min="50" :max="70" style="width: 100%" />
            </Form.Item>
            <Form.Item label="目标退休金">
              <InputNumber v-model:value="retirementPlanner.targetAmount" style="width: 100%" />
            </Form.Item>
            <Form.Item label="年投资收益率(%)">
              <InputNumber v-model:value="retirementPlanner.returnRate" :precision="1" style="width: 100%" />
            </Form.Item>
            <Button type="primary" block @click="calculateRetirement">规划计算</Button>
          </Form>
          
          <div v-if="retirementResult.monthlyInvestment" class="mt-4 p-3 bg-orange-50 rounded-lg">
            <div class="text-center">
              <p class="text-sm text-gray-600">需月投资</p>
              <p class="text-lg font-bold text-orange-600">{{ formatCurrency(retirementResult.monthlyInvestment) }}</p>
            </div>
            <Divider />
            <div class="space-y-1 text-xs">
              <div class="flex justify-between">
                <span>投资年限:</span>
                <span>{{ retirementResult.yearsToInvest }}年</span>
              </div>
              <div class="flex justify-between">
                <span>总投入:</span>
                <span>{{ formatCurrency(retirementResult.totalInvestment) }}</span>
              </div>
            </div>
          </div>
        </Card>

        <!-- 税收计算器 -->
        <Card title="个税计算器" class="tool-card">
          <template #extra>
            <Icon icon="mdi:file-document" class="text-lg" />
          </template>
          <Form layout="vertical" size="small">
            <Form.Item label="月收入">
              <InputNumber v-model:value="taxCalculator.income" style="width: 100%" placeholder="15000" />
            </Form.Item>
            <Form.Item label="社保基数">
              <InputNumber v-model:value="taxCalculator.socialBase" style="width: 100%" placeholder="8000" />
            </Form.Item>
            <Form.Item label="公积金基数">
              <InputNumber v-model:value="taxCalculator.fundBase" style="width: 100%" placeholder="8000" />
            </Form.Item>
            <Form.Item label="专项扣除">
              <InputNumber v-model:value="taxCalculator.deduction" style="width: 100%" placeholder="2000" />
            </Form.Item>
            <Button type="primary" block @click="calculateTax">计算个税</Button>
          </Form>
          
          <div v-if="taxResult.netIncome" class="mt-4 p-3 bg-cyan-50 rounded-lg">
            <div class="text-center">
              <p class="text-sm text-gray-600">税后收入</p>
              <p class="text-lg font-bold text-cyan-600">{{ formatCurrency(taxResult.netIncome) }}</p>
            </div>
            <Divider />
            <div class="space-y-1 text-xs">
              <div class="flex justify-between">
                <span>个人所得税:</span>
                <span>{{ formatCurrency(taxResult.tax) }}</span>
              </div>
              <div class="flex justify-between">
                <span>五险一金:</span>
                <span>{{ formatCurrency(taxResult.socialInsurance) }}</span>
              </div>
            </div>
          </div>
        </Card>

        <!-- 财务比率分析 -->
        <Card title="财务比率分析" class="tool-card">
          <template #extra>
            <Icon icon="mdi:chart-pie" class="text-lg" />
          </template>
          <div class="space-y-4">
            <div v-for="ratio in financialRatios" :key="ratio.name" class="flex items-center justify-between">
              <div>
                <p class="font-medium">{{ ratio.name }}</p>
                <p class="text-xs text-gray-500">{{ ratio.description }}</p>
              </div>
              <div class="text-right">
                <p class="font-bold" :class="ratio.color">{{ ratio.value }}</p>
                <p class="text-xs text-gray-500">{{ ratio.status }}</p>
              </div>
            </div>
          </div>
          <Button type="primary" block @click="analyzeRatios" class="mt-4">详细分析</Button>
        </Card>
      </div>
    </PageWrapper>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { PageWrapper } from '@vben/common-ui';
import {
  Card, Form, InputNumber, Button, Switch, Select, Divider
} from 'ant-design-vue';
import { Icon } from '@iconify/vue';

defineOptions({ name: 'FinanceTools' });

// 计算器数据
const loanCalculator = ref({
  principal: 500000,
  rate: 4.35,
  years: 20
});

const loanResult = ref({});

const investmentCalculator = ref({
  initial: 50000,
  rate: 8,
  years: 5,
  compound: true
});

const investmentResult = ref({});

const currencyConverter = ref({
  amount: 1000,
  from: 'CNY',
  to: 'USD'
});

const currencyResult = ref({});

const retirementPlanner = ref({
  currentAge: 30,
  retirementAge: 60,
  targetAmount: 2000000,
  returnRate: 7.0
});

const retirementResult = ref({});

const taxCalculator = ref({
  income: 15000,
  socialBase: 8000,
  fundBase: 8000,
  deduction: 2000
});

const taxResult = ref({});

// 财务比率
const financialRatios = ref([
  {
    name: '储蓄率',
    description: '储蓄占收入比例',
    value: '35%',
    status: '优秀',
    color: 'text-green-600'
  },
  {
    name: '负债收入比',
    description: '负债占收入比例', 
    value: '25%',
    status: '良好',
    color: 'text-blue-600'
  },
  {
    name: '紧急基金',
    description: '月支出倍数',
    value: '6.5个月',
    status: '充足',
    color: 'text-green-600'
  }
]);

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(amount);
};

// 计算方法
const calculateLoan = () => {
  const { principal, rate, years } = loanCalculator.value;
  const monthlyRate = rate / 100 / 12;
  const numPayments = years * 12;
  
  const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
                         (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  const totalPayment = monthlyPayment * numPayments;
  const totalInterest = totalPayment - principal;
  
  loanResult.value = {
    monthlyPayment,
    totalPayment,
    totalInterest
  };
};

const calculateInvestment = () => {
  const { initial, rate, years, compound } = investmentCalculator.value;
  
  let finalValue;
  if (compound) {
    finalValue = initial * Math.pow(1 + rate / 100, years);
  } else {
    finalValue = initial + (initial * rate / 100 * years);
  }
  
  const profit = finalValue - initial;
  const totalReturn = (profit / initial) * 100;
  
  investmentResult.value = {
    finalValue,
    profit,
    totalReturn
  };
};

const convertCurrency = () => {
  // 模拟汇率数据
  const rates = {
    'CNY-USD': 0.14,
    'USD-CNY': 7.15,
    'CNY-EUR': 0.13,
    'EUR-CNY': 7.68
  };
  
  const rateKey = `${currencyConverter.value.from}-${currencyConverter.value.to}`;
  const rate = rates[rateKey] || 1;
  const converted = (currencyConverter.value.amount * rate).toFixed(2);
  
  currencyResult.value = {
    converted,
    rate: rate.toFixed(4)
  };
};

const calculateRetirement = () => {
  const { currentAge, retirementAge, targetAmount, returnRate } = retirementPlanner.value;
  const yearsToInvest = retirementAge - currentAge;
  const monthlyRate = returnRate / 100 / 12;
  const numPayments = yearsToInvest * 12;
  
  const monthlyInvestment = (targetAmount * monthlyRate) /
                           (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  const totalInvestment = monthlyInvestment * numPayments;
  
  retirementResult.value = {
    monthlyInvestment,
    yearsToInvest,
    totalInvestment
  };
};

const calculateTax = () => {
  const { income, socialBase, fundBase, deduction } = taxCalculator.value;
  
  // 社保公积金计算 (简化版)
  const socialInsurance = socialBase * 0.105 + fundBase * 0.07; // 约10.5% + 7%
  
  // 应纳税所得额
  const taxableIncome = income - socialInsurance - 5000 - deduction; // 5000为起征点
  
  // 个税计算 (简化版累进税率)
  let tax = 0;
  if (taxableIncome > 0) {
    if (taxableIncome <= 3000) {
      tax = taxableIncome * 0.03;
    } else if (taxableIncome <= 12000) {
      tax = 3000 * 0.03 + (taxableIncome - 3000) * 0.1;
    } else {
      tax = 3000 * 0.03 + 9000 * 0.1 + (taxableIncome - 12000) * 0.2;
    }
  }
  
  const netIncome = income - socialInsurance - tax;
  
  taxResult.value = {
    tax,
    socialInsurance,
    netIncome
  };
};

const analyzeRatios = () => {
  console.log('进行详细财务比率分析');
};
</script>

<style scoped>
.tool-card {
  height: fit-content;
}

.tool-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
}
</style>