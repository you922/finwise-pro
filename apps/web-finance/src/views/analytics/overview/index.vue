<template>
  <Page>
    <PageHeader>
      <PageHeaderTitle>数据概览</PageHeaderTitle>
    </PageHeader>
    <PageMain>
      <Card class="mb-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium">筛选条件</h3>
          <Button @click="handleRefresh" :loading="loading">
            <SyncOutlined class="mr-1" />
            刷新数据
          </Button>
        </div>
        <Form layout="inline">
          <FormItem label="日期范围">
            <RangePicker
              v-model:value="dateRange"
              :format="'YYYY-MM-DD'"
              :placeholder="['开始日期', '结束日期']"
              style="width: 300px"
              @change="handleDateChange"
            />
          </FormItem>
          <FormItem label="统计周期">
            <Select
              v-model:value="groupBy"
              style="width: 120px"
              @change="handleRefresh"
            >
              <SelectOption value="day">按天</SelectOption>
              <SelectOption value="week">按周</SelectOption>
              <SelectOption value="month">按月</SelectOption>
            </Select>
          </FormItem>
        </Form>
      </Card>

      <Row :gutter="16">
        <Col :span="24" class="mb-4">
          <Card title="收支趋势图">
            <TrendChart
              :transactions="transactions"
              :date-range="dateRangeStrings"
              :group-by="groupBy"
            />
          </Card>
        </Col>
        
        <Col :span="12" class="mb-4">
          <Card title="收入分类分布">
            <CategoryPieChart
              :transactions="transactions"
              :categories="categories"
              type="income"
            />
          </Card>
        </Col>
        
        <Col :span="12" class="mb-4">
          <Card title="支出分类分布">
            <CategoryPieChart
              :transactions="transactions"
              :categories="categories"
              type="expense"
            />
          </Card>
        </Col>
        
        <Col :span="24" class="mb-4">
          <Card :title="`${currentYear}年月度收支对比`">
            <MonthlyComparisonChart
              :transactions="transactions"
              :year="currentYear"
            />
          </Card>
        </Col>
        
        <Col :span="24">
          <Card title="人员交易分析">
            <PersonAnalysisChart
              :transactions="transactions"
              :persons="persons"
              :limit="15"
            />
          </Card>
        </Col>
      </Row>
    </PageMain>
  </Page>
</template>

<script setup lang="ts">
import type { Category, Person, Transaction } from '#/types/finance';
import type { Dayjs } from 'dayjs';

import { computed, onMounted, ref } from 'vue';
import { Page, PageHeader, PageHeaderTitle, PageMain } from '@vben/common-ui';
import { Card, Form, FormItem, Row, Col, Button, Select, SelectOption } from 'ant-design-vue';
import { RangePicker } from 'ant-design-vue/es/date-picker';
import { SyncOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';

import { categoryApi, personApi, transactionApi } from '#/api/finance';

import TrendChart from '../components/TrendChart.vue';
import CategoryPieChart from '../components/CategoryPieChart.vue';
import MonthlyComparisonChart from '../components/MonthlyComparisonChart.vue';
import PersonAnalysisChart from '../components/PersonAnalysisChart.vue';

const loading = ref(false);
const transactions = ref<Transaction[]>([]);
const categories = ref<Category[]>([]);
const persons = ref<Person[]>([]);

const dateRange = ref<[Dayjs, Dayjs]>([
  dayjs().startOf('month'),
  dayjs().endOf('month'),
]);

const groupBy = ref<'day' | 'week' | 'month'>('day');

const dateRangeStrings = computed<[string, string]>(() => [
  dateRange.value[0].format('YYYY-MM-DD'),
  dateRange.value[1].format('YYYY-MM-DD'),
]);

const currentYear = computed(() => dayjs().year());

const fetchData = async () => {
  loading.value = true;
  try {
    // 获取日期范围内的交易数据
    const [transResult, catResult, personResult] = await Promise.all([
      transactionApi.getList({
        page: 1,
        pageSize: 10000, // 获取所有数据用于统计
        startDate: dateRangeStrings.value[0],
        endDate: dateRangeStrings.value[1],
      }),
      categoryApi.getList({ page: 1, pageSize: 100 }),
      personApi.getList({ page: 1, pageSize: 100 }),
    ]);
    
    transactions.value = transResult.data.items;
    categories.value = catResult.data.items;
    persons.value = personResult.data.items;
  } catch (error) {
    console.error('Failed to fetch data:', error);
  } finally {
    loading.value = false;
  }
};

const handleDateChange = () => {
  fetchData();
};

const handleRefresh = () => {
  fetchData();
};

onMounted(() => {
  fetchData();
});
</script>