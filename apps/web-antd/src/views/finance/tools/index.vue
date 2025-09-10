<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">🛠️ 财务工具</h1>
      <p class="text-gray-600">实用的财务计算和分析工具</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card title="🏠 贷款计算器">
        <div class="space-y-4">
          <Input v-model:value="loanForm.amount" placeholder="请输入贷款金额" />
          <Input v-model:value="loanForm.rate" placeholder="请输入年利率 %" />
          <Input v-model:value="loanForm.years" placeholder="请输入贷款年限" />
          <Button type="primary" block @click="calculateLoan">计算月供</Button>
          <div v-if="loanResult.monthlyPayment" class="mt-4 p-3 bg-blue-50 rounded-lg text-center">
            <p class="font-medium text-blue-800">月供：¥{{ loanResult.monthlyPayment.toLocaleString() }}</p>
          </div>
        </div>
      </Card>
      
      <Card title="📈 投资计算器">
        <div class="space-y-4">
          <Input v-model:value="investmentForm.initial" placeholder="请输入初始投资金额" />
          <Input v-model:value="investmentForm.rate" placeholder="请输入年收益率 %" />
          <Input v-model:value="investmentForm.years" placeholder="请输入投资期限(年)" />
          <Button type="primary" block @click="calculateInvestment">计算收益</Button>
          <div v-if="investmentResult.finalValue" class="mt-4 p-3 bg-green-50 rounded-lg text-center">
            <p class="font-medium text-green-800">预期收益：¥{{ investmentResult.finalValue.toLocaleString() }}</p>
          </div>
        </div>
      </Card>
      
      <Card title="💱 汇率换算">
        <div class="space-y-4">
          <Input v-model:value="currencyForm.amount" placeholder="请输入金额" />
          <Select v-model:value="currencyForm.from" placeholder="原币种" style="width: 100%">
            <Select.Option value="CNY">🇨🇳 人民币</Select.Option>
            <Select.Option value="USD">🇺🇸 美元</Select.Option>
            <Select.Option value="EUR">🇪🇺 欧元</Select.Option>
          </Select>
          <Select v-model:value="currencyForm.to" placeholder="目标币种" style="width: 100%">
            <Select.Option value="USD">🇺🇸 美元</Select.Option>
            <Select.Option value="CNY">🇨🇳 人民币</Select.Option>
            <Select.Option value="EUR">🇪🇺 欧元</Select.Option>
          </Select>
          <Button type="primary" block @click="convertCurrency">立即换算</Button>
          <div v-if="currencyResult.converted" class="mt-4 p-3 bg-purple-50 rounded-lg text-center">
            <p class="font-medium text-purple-800">
              {{ currencyForm.amount }} {{ currencyForm.from }} = {{ currencyResult.converted }} {{ currencyForm.to }}
            </p>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Card, Input, Button, Select } from 'ant-design-vue';

defineOptions({ name: 'FinanceTools' });

// 贷款计算器表单
const loanForm = ref({
  amount: '',
  rate: '',
  years: ''
});

const loanResult = ref({
  monthlyPayment: null
});

// 投资计算器表单
const investmentForm = ref({
  initial: '',
  rate: '',
  years: ''
});

const investmentResult = ref({
  finalValue: null
});

// 汇率换算表单
const currencyForm = ref({
  amount: '',
  from: 'CNY',
  to: 'USD'
});

const currencyResult = ref({
  converted: null
});

// 计算方法
const calculateLoan = () => {
  const amount = parseFloat(loanForm.value.amount);
  const rate = parseFloat(loanForm.value.rate) / 100 / 12;
  const months = parseInt(loanForm.value.years) * 12;
  
  if (amount && rate && months) {
    const monthlyPayment = (amount * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    loanResult.value.monthlyPayment = monthlyPayment;
  }
};

const calculateInvestment = () => {
  const initial = parseFloat(investmentForm.value.initial);
  const rate = parseFloat(investmentForm.value.rate) / 100;
  const years = parseInt(investmentForm.value.years);
  
  if (initial && rate && years) {
    const finalValue = initial * Math.pow(1 + rate, years);
    investmentResult.value.finalValue = finalValue;
  }
};

const convertCurrency = () => {
  const amount = parseFloat(currencyForm.value.amount);
  // 模拟汇率（实际应用中应该调用汇率API）
  const rate = currencyForm.value.from === 'CNY' && currencyForm.value.to === 'USD' ? 0.14 : 7.15;
  
  if (amount) {
    currencyResult.value.converted = (amount * rate).toFixed(2);
  }
};
</script>

<style scoped>
.grid { display: grid; }
</style>