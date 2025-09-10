<script setup lang="ts">
import type { Dayjs } from 'dayjs';

import type { Category, Person, Transaction } from '#/types/finance';

import { computed, onMounted, ref } from 'vue';

import { Page, PageHeader, PageHeaderTitle, PageMain } from '@vben/common-ui';

import { SyncOutlined } from '@ant-design/icons-vue';
import {
  Button,
  Card,
  Col,
  Form,
  FormItem,
  Row,
  Select,
  SelectOption,
  Tabs,
  TabPane,
} from 'ant-design-vue';
import { RangePicker } from 'ant-design-vue/es/date-picker';
import dayjs from 'dayjs';

import { categoryApi, personApi, transactionApi } from '#/api/finance';

import CategoryPieChart from '../components/CategoryPieChart.vue';
import MonthlyComparisonChart from '../components/MonthlyComparisonChart.vue';
import PersonAnalysisChart from '../components/PersonAnalysisChart.vue';
import TrendChart from '../components/TrendChart.vue';
import KeyMetricsCards from '../components/KeyMetricsCards.vue';
import BudgetComparison from '../components/BudgetComparison.vue';
import SmartInsights from '../components/SmartInsights.vue';
import TagCloudAnalysis from '../components/TagCloudAnalysis.vue';
import TimeDimensionAnalysis from '../components/TimeDimensionAnalysis.vue';

const loading = ref(false);
const transactions = ref<Transaction[]>([]);
const categories = ref<Category[]>([]);
const persons = ref<Person[]>([]);

const dateRange = ref<[Dayjs, Dayjs]>([
  dayjs().startOf('month'),
  dayjs().endOf('month'),
]);

const groupBy = ref<'day' | 'month' | 'week'>('day');

const dateRangeStrings = computed<[string, string]>(() => [
  dateRange.value[0].format('YYYY-MM-DD'),
  dateRange.value[1].format('YYYY-MM-DD'),
]);

const currentYear = computed(() => dayjs().year());
const currentMonth = computed(() => dateRange.value[0].format('YYYY-MM'));

// 获取上一期间的交易数据（用于对比）
const previousPeriodTransactions = ref<Transaction[]>([]);

const fetchData = async () => {
  loading.value = true;
  try {
    // 计算上一期间的日期范围
    const periodDays = dateRange.value[1].diff(dateRange.value[0], 'day') + 1;
    const previousStart = dateRange.value[0].subtract(periodDays, 'day');
    const previousEnd = dateRange.value[0].subtract(1, 'day');
    
    // 获取日期范围内的交易数据
    const [transResult, prevTransResult, catResult, personResult] = await Promise.all([
      transactionApi.getTransactionList({
        page: 1,
        pageSize: 10_000, // 获取所有数据用于统计
        dateFrom: dateRangeStrings.value[0],
        dateTo: dateRangeStrings.value[1],
      }),
      transactionApi.getTransactionList({
        page: 1,
        pageSize: 10_000,
        dateFrom: previousStart.format('YYYY-MM-DD'),
        dateTo: previousEnd.format('YYYY-MM-DD'),
      }),
      categoryApi.getCategoryList({ page: 1, pageSize: 100 }),
      personApi.getPersonList({ page: 1, pageSize: 100 }),
    ]);

    transactions.value = transResult.data.items;
    previousPeriodTransactions.value = prevTransResult.data.items;
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

<template>
  <Page>
    <PageHeader>
      <PageHeaderTitle>数据概览</PageHeaderTitle>
    </PageHeader>
    <PageMain>
      <Card class="mb-4">
        <div class="mb-4 flex items-center justify-between">
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
              format="YYYY-MM-DD"
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

      <!-- 关键指标卡片 -->
      <div class="mb-4">
        <KeyMetricsCards
          :transactions="transactions"
          :date-range="dateRangeStrings"
          :previous-period-transactions="previousPeriodTransactions"
        />
      </div>

      <!-- 标签页内容 -->
      <Tabs default-active-key="1">
        <TabPane key="1" tab="核心指标">
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
        </TabPane>

        <TabPane key="2" tab="预算分析">
          <BudgetComparison
            :transactions="transactions"
            :categories="categories"
            :month="currentMonth"
          />
        </TabPane>

        <TabPane key="3" tab="智能洞察">
          <SmartInsights
            :transactions="transactions"
            :categories="categories"
            :persons="persons"
            :date-range="dateRangeStrings"
          />
        </TabPane>

        <TabPane key="4" tab="标签分析">
          <TagCloudAnalysis
            :transactions="transactions"
            type="all"
          />
        </TabPane>

        <TabPane key="5" tab="时间维度">
          <TimeDimensionAnalysis
            :transactions="transactions"
            type="expense"
          />
        </TabPane>
      </Tabs>
    </PageMain>
  </Page>
</template>
