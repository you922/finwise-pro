<script setup lang="ts">
import type { Transaction, Category, Person } from '#/types/finance';

import { computed, ref } from 'vue';

import { Alert, Card, List, ListItem, ListItemMeta, Tag, Tooltip, Button } from 'ant-design-vue';
import {
  BulbOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  WarningOutlined,
  DollarOutlined,
  UserOutlined,
  TagOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  QuestionCircleOutlined,
  RightOutlined,
} from '@ant-design/icons-vue';
import dayjs from 'dayjs';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  persons: Person[];
  dateRange: [string, string];
}

interface Insight {
  id: string;
  type: 'warning' | 'opportunity' | 'trend' | 'anomaly' | 'achievement';
  icon: any;
  title: string;
  description: string;
  value?: string | number;
  severity: 'high' | 'medium' | 'low';
  actionable: boolean;
  tags: string[];
  details?: any;
}

const props = defineProps<Props>();
const expandedInsights = ref<Set<string>>(new Set());

// 分析洞察
const insights = computed<Insight[]>(() => {
  const results: Insight[] = [];
  
  if (!props.transactions.length) return results;
  
  const categoryMap = new Map(props.categories.map(c => [c.id, c]));
  const personMap = new Map(props.persons.map(p => [p.id, p]));
  
  // 1. 分析异常消费
  const avgDailyExpense = calculateAverageDailyExpense();
  const anomalies = findAnomalousTransactions(avgDailyExpense);
  if (anomalies.length > 0) {
    results.push({
      id: 'anomaly-1',
      type: 'anomaly',
      icon: ThunderboltOutlined,
      title: '发现异常消费模式',
      description: `最近有${anomalies.length}笔交易金额异常偏高，单笔超过日均消费的3倍`,
      value: `最高: ¥${Math.max(...anomalies.map(a => a.amount)).toFixed(2)}`,
      severity: 'high',
      actionable: true,
      tags: ['异常检测', '消费预警'],
      details: anomalies,
    });
  }
  
  // 2. 消费趋势分析
  const trend = analyzeSpendingTrend();
  if (trend.change !== 0) {
    results.push({
      id: 'trend-1',
      type: 'trend',
      icon: trend.change > 0 ? TrendingUpOutlined : TrendingDownOutlined,
      title: `支出${trend.change > 0 ? '上升' : '下降'}趋势`,
      description: `相比上期，支出${trend.change > 0 ? '增加' : '减少'}了${Math.abs(trend.change).toFixed(1)}%`,
      value: trend.details,
      severity: Math.abs(trend.change) > 20 ? 'high' : 'medium',
      actionable: trend.change > 20,
      tags: ['趋势分析'],
    });
  }
  
  // 3. 节省机会识别
  const savingOpportunities = findSavingOpportunities();
  if (savingOpportunities.length > 0) {
    const totalSaving = savingOpportunities.reduce((sum, s) => sum + s.potential, 0);
    results.push({
      id: 'opportunity-1',
      type: 'opportunity',
      icon: DollarOutlined,
      title: '发现节省机会',
      description: `通过优化${savingOpportunities[0].category}等类别的支出，预计每月可节省¥${totalSaving.toFixed(2)}`,
      severity: 'medium',
      actionable: true,
      tags: ['节省建议', '优化'],
      details: savingOpportunities,
    });
  }
  
  // 4. 高频交易分析
  const frequentPatterns = analyzeFrequentPatterns();
  if (frequentPatterns.length > 0) {
    results.push({
      id: 'pattern-1',
      type: 'trend',
      icon: TagOutlined,
      title: '高频消费习惯',
      description: `您在${frequentPatterns[0].category}类别消费最频繁，平均${frequentPatterns[0].frequency}天一次`,
      severity: 'low',
      actionable: false,
      tags: ['消费习惯'],
      details: frequentPatterns,
    });
  }
  
  // 5. 预算健康度评分
  const healthScore = calculateFinancialHealth();
  results.push({
    id: 'health-1',
    type: healthScore.score >= 70 ? 'achievement' : 'warning',
    icon: healthScore.score >= 70 ? BulbOutlined : WarningOutlined,
    title: `财务健康评分: ${healthScore.score}分`,
    description: healthScore.description,
    severity: healthScore.score < 50 ? 'high' : healthScore.score < 70 ? 'medium' : 'low',
    actionable: healthScore.score < 70,
    tags: ['健康度', '综合评估'],
    details: healthScore,
  });
  
  // 6. 周期性支出提醒
  const recurringExpenses = findRecurringExpenses();
  if (recurringExpenses.length > 0) {
    results.push({
      id: 'recurring-1',
      type: 'trend',
      icon: CalendarOutlined,
      title: '周期性支出检测',
      description: `发现${recurringExpenses.length}项固定支出，月度总额¥${recurringExpenses.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}`,
      severity: 'low',
      actionable: false,
      tags: ['固定支出'],
      details: recurringExpenses,
    });
  }
  
  // 7. 人员交易异常
  const personAnomalies = analyzePersonTransactions();
  if (personAnomalies.length > 0) {
    results.push({
      id: 'person-1',
      type: 'warning',
      icon: UserOutlined,
      title: '人员交易提醒',
      description: personAnomalies[0].description,
      severity: 'medium',
      actionable: true,
      tags: ['人员分析'],
      details: personAnomalies,
    });
  }
  
  return results.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
});

// 计算平均日消费
function calculateAverageDailyExpense(): number {
  const expenses = props.transactions.filter(t => t.type === 'expense');
  const days = dayjs(props.dateRange[1]).diff(dayjs(props.dateRange[0]), 'day') + 1;
  const total = expenses.reduce((sum, t) => sum + t.amount, 0);
  return total / days;
}

// 查找异常交易
function findAnomalousTransactions(avgDaily: number): Transaction[] {
  return props.transactions.filter(t => 
    t.type === 'expense' && t.amount > avgDaily * 3
  ).sort((a, b) => b.amount - a.amount).slice(0, 5);
}

// 分析支出趋势
function analyzeSpendingTrend(): any {
  const midDate = dayjs(props.dateRange[0]).add(
    dayjs(props.dateRange[1]).diff(dayjs(props.dateRange[0]), 'day') / 2,
    'day'
  );
  
  const firstHalf = props.transactions.filter(t => 
    t.type === 'expense' && dayjs(t.date).isBefore(midDate)
  );
  const secondHalf = props.transactions.filter(t => 
    t.type === 'expense' && dayjs(t.date).isAfter(midDate)
  );
  
  const firstTotal = firstHalf.reduce((sum, t) => sum + t.amount, 0);
  const secondTotal = secondHalf.reduce((sum, t) => sum + t.amount, 0);
  
  const change = firstTotal > 0 ? ((secondTotal - firstTotal) / firstTotal) * 100 : 0;
  
  return {
    change,
    details: `前期¥${firstTotal.toFixed(2)} → 后期¥${secondTotal.toFixed(2)}`,
  };
}

// 查找节省机会
function findSavingOpportunities(): any[] {
  const categoryExpenses = new Map<string, number>();
  const categoryCount = new Map<string, number>();
  
  props.transactions
    .filter(t => t.type === 'expense' && t.categoryId)
    .forEach(t => {
      categoryExpenses.set(t.categoryId, (categoryExpenses.get(t.categoryId) || 0) + t.amount);
      categoryCount.set(t.categoryId, (categoryCount.get(t.categoryId) || 0) + 1);
    });
  
  const opportunities: any[] = [];
  const categoryMap = new Map(props.categories.map(c => [c.id, c]));
  
  categoryExpenses.forEach((amount, categoryId) => {
    const count = categoryCount.get(categoryId) || 0;
    const category = categoryMap.get(categoryId);
    
    // 高频小额消费类别
    if (count > 10 && amount / count < 50) {
      opportunities.push({
        category: category?.name || '未知',
        potential: amount * 0.2, // 预计可节省20%
        suggestion: '考虑批量购买或寻找替代方案',
      });
    }
  });
  
  return opportunities.sort((a, b) => b.potential - a.potential).slice(0, 3);
}

// 分析高频模式
function analyzeFrequentPatterns(): any[] {
  const categoryFreq = new Map<string, number>();
  const categoryDates = new Map<string, string[]>();
  
  props.transactions
    .filter(t => t.type === 'expense' && t.categoryId)
    .forEach(t => {
      categoryFreq.set(t.categoryId, (categoryFreq.get(t.categoryId) || 0) + 1);
      const dates = categoryDates.get(t.categoryId) || [];
      dates.push(t.date);
      categoryDates.set(t.categoryId, dates);
    });
  
  const patterns: any[] = [];
  const categoryMap = new Map(props.categories.map(c => [c.id, c]));
  const days = dayjs(props.dateRange[1]).diff(dayjs(props.dateRange[0]), 'day') + 1;
  
  categoryFreq.forEach((count, categoryId) => {
    if (count >= 5) {
      const category = categoryMap.get(categoryId);
      patterns.push({
        category: category?.name || '未知',
        count,
        frequency: Math.round(days / count),
      });
    }
  });
  
  return patterns.sort((a, b) => b.count - a.count).slice(0, 5);
}

// 计算财务健康度
function calculateFinancialHealth(): any {
  const income = props.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = props.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  let score = 50; // 基础分
  const savingRate = income > 0 ? (income - expense) / income : 0;
  
  // 储蓄率评分 (最高30分)
  if (savingRate >= 0.3) score += 30;
  else if (savingRate >= 0.2) score += 25;
  else if (savingRate >= 0.1) score += 20;
  else if (savingRate >= 0) score += 10;
  else score -= 20;
  
  // 收支平衡评分 (最高20分)
  const balance = income - expense;
  if (balance > 0) score += 20;
  else if (balance > -1000) score += 10;
  else score -= 10;
  
  let description = '';
  if (score >= 80) description = '财务状况非常健康，继续保持！';
  else if (score >= 70) description = '财务状况良好，有改进空间';
  else if (score >= 50) description = '财务状况一般，建议优化支出结构';
  else description = '财务状况需要关注，建议制定改善计划';
  
  return {
    score: Math.max(0, Math.min(100, score)),
    description,
    savingRate: (savingRate * 100).toFixed(1),
    balance,
  };
}

// 查找周期性支出
function findRecurringExpenses(): any[] {
  const descriptionPattern = new Map<string, Transaction[]>();
  
  props.transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      // 简化描述用于匹配
      const key = t.description?.toLowerCase().replace(/\d+/g, '').trim() || '';
      if (key) {
        const list = descriptionPattern.get(key) || [];
        list.push(t);
        descriptionPattern.set(key, list);
      }
    });
  
  const recurring: any[] = [];
  
  descriptionPattern.forEach((transactions, pattern) => {
    if (transactions.length >= 2) {
      // 检查金额是否相近
      const amounts = transactions.map(t => t.amount);
      const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
      const isConsistent = amounts.every(a => Math.abs(a - avgAmount) / avgAmount < 0.1);
      
      if (isConsistent) {
        recurring.push({
          pattern,
          amount: avgAmount,
          count: transactions.length,
          transactions,
        });
      }
    }
  });
  
  return recurring.sort((a, b) => b.amount - a.amount).slice(0, 5);
}

// 分析人员交易
function analyzePersonTransactions(): any[] {
  const personStats = new Map<string, { total: number; count: number }>();
  
  props.transactions
    .filter(t => t.personId)
    .forEach(t => {
      const stats = personStats.get(t.personId) || { total: 0, count: 0 };
      stats.total += t.amount;
      stats.count++;
      personStats.set(t.personId, stats);
    });
  
  const anomalies: any[] = [];
  const personMap = new Map(props.persons.map(p => [p.id, p]));
  
  personStats.forEach((stats, personId) => {
    const person = personMap.get(personId);
    const avgAmount = stats.total / stats.count;
    
    // 检测异常高额或高频
    if (avgAmount > 1000 || stats.count > 20) {
      anomalies.push({
        person: person?.name || '未知',
        description: `与${person?.name}的交易${stats.count > 20 ? '频繁' : '金额较大'}，共${stats.count}笔，总额¥${stats.total.toFixed(2)}`,
        total: stats.total,
        count: stats.count,
        average: avgAmount,
      });
    }
  });
  
  return anomalies.sort((a, b) => b.total - a.total);
}

// 切换展开状态
function toggleInsight(id: string) {
  if (expandedInsights.value.has(id)) {
    expandedInsights.value.delete(id);
  } else {
    expandedInsights.value.add(id);
  }
}

// 获取洞察类型颜色
function getInsightColor(type: string): string {
  const colors: Record<string, string> = {
    warning: '#faad14',
    opportunity: '#52c41a',
    trend: '#1890ff',
    anomaly: '#ff4d4f',
    achievement: '#52c41a',
  };
  return colors[type] || '#8c8c8c';
}

// 获取严重程度标签颜色
function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    high: 'red',
    medium: 'orange',
    low: 'blue',
  };
  return colors[severity] || 'default';
}
</script>

<template>
  <Card title="智能洞察" class="smart-insights">
    <template #extra>
      <Tooltip title="基于AI分析的财务洞察和建议">
        <QuestionCircleOutlined />
      </Tooltip>
    </template>
    
    <List
      :data-source="insights"
      :pagination="false"
    >
      <template #renderItem="{ item }">
        <ListItem
          :key="item.id"
          class="insight-item"
          :class="{ expanded: expandedInsights.has(item.id) }"
        >
          <ListItemMeta>
            <template #avatar>
              <div
                class="insight-icon"
                :style="{ backgroundColor: getInsightColor(item.type) + '20', color: getInsightColor(item.type) }"
              >
                <component :is="item.icon" />
              </div>
            </template>
            
            <template #title>
              <div class="insight-title">
                <span>{{ item.title }}</span>
                <div class="insight-tags">
                  <Tag :color="getSeverityColor(item.severity)" size="small">
                    {{ item.severity === 'high' ? '重要' : item.severity === 'medium' ? '中等' : '一般' }}
                  </Tag>
                  <Tag v-if="item.actionable" color="blue" size="small">
                    可操作
                  </Tag>
                </div>
              </div>
            </template>
            
            <template #description>
              <div class="insight-content">
                <p class="insight-description">{{ item.description }}</p>
                <p v-if="item.value" class="insight-value">{{ item.value }}</p>
                
                <!-- 展开详情 -->
                <div v-if="expandedInsights.has(item.id) && item.details" class="insight-details">
                  <Alert
                    :type="item.type === 'warning' ? 'warning' : 'info'"
                    :message="'详细信息'"
                    :description="JSON.stringify(item.details, null, 2)"
                    class="mt-2"
                  />
                </div>
                
                <div class="insight-actions">
                  <Button
                    v-if="item.details"
                    type="link"
                    size="small"
                    @click="toggleInsight(item.id)"
                  >
                    {{ expandedInsights.has(item.id) ? '收起' : '查看详情' }}
                    <RightOutlined :rotate="expandedInsights.has(item.id) ? 90 : 0" />
                  </Button>
                  
                  <div class="insight-meta">
                    <Tag
                      v-for="tag in item.tags"
                      :key="tag"
                      size="small"
                    >
                      {{ tag }}
                    </Tag>
                  </div>
                </div>
              </div>
            </template>
          </ListItemMeta>
        </ListItem>
      </template>
    </List>
    
    <div v-if="!insights.length" class="empty-insights">
      <BulbOutlined style="font-size: 48px; color: #d9d9d9;" />
      <p style="margin-top: 16px; color: #8c8c8c;">暂无智能洞察，请选择数据范围</p>
    </div>
  </Card>
</template>

<style scoped>
.smart-insights {
  height: 100%;
}

.insight-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s;
}

.insight-item:last-child {
  border-bottom: none;
}

.insight-item.expanded {
  background: #fafafa;
  margin: 0 -16px;
  padding: 12px 16px;
}

.insight-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 20px;
}

.insight-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.insight-tags {
  display: flex;
  gap: 4px;
}

.insight-content {
  margin-top: 8px;
}

.insight-description {
  color: #595959;
  margin: 0;
}

.insight-value {
  margin: 4px 0 0 0;
  font-weight: 500;
  color: #262626;
}

.insight-details {
  margin-top: 12px;
}

.insight-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.insight-meta {
  display: flex;
  gap: 4px;
}

.empty-insights {
  text-align: center;
  padding: 40px 0;
}

:deep(.ant-alert-description) {
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 12px;
}
</style>