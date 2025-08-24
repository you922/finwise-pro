<script setup lang="ts">
import type { Transaction } from '#/types/finance';
import type { EChartsOption } from '#/components/charts/useChart';

import { computed, onMounted, ref, watch } from 'vue';

import { Card, Empty, Spin, Tag as AntTag, Tooltip } from 'ant-design-vue';
import { TagsOutlined } from '@ant-design/icons-vue';

import { useChart } from '#/components/charts/useChart';
import { tagApi } from '#/api/finance';

interface Props {
  transactions: Transaction[];
  type?: 'all' | 'income' | 'expense';
}

interface TagData {
  id: string;
  name: string;
  value: number; // 总金额
  count: number; // 交易次数
  percentage: number;
  avgAmount: number;
  color: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'all',
});

const chartRef = ref<HTMLDivElement | null>(null);
const { setOptions } = useChart(chartRef);
const loading = ref(false);
const allTags = ref<any[]>([]);
const selectedTag = ref<string | null>(null);

// 获取所有标签
const fetchTags = async () => {
  loading.value = true;
  try {
    const result = await tagApi.getList({ page: 1, pageSize: 1000 });
    allTags.value = result.data.items || [];
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    allTags.value = [];
  } finally {
    loading.value = false;
  }
};

// 处理标签数据
const tagData = computed<TagData[]>(() => {
  const tagMap = new Map<string, { amount: number; count: number; transactions: Transaction[] }>();
  
  // 过滤交易
  const filteredTransactions = props.transactions.filter(t => {
    if (props.type === 'income') return t.type === 'income';
    if (props.type === 'expense') return t.type === 'expense';
    return true;
  });
  
  // 统计标签数据
  filteredTransactions.forEach(transaction => {
    if (transaction.tags && transaction.tags.length > 0) {
      transaction.tags.forEach(tagId => {
        const data = tagMap.get(tagId) || { amount: 0, count: 0, transactions: [] };
        data.amount += transaction.amount;
        data.count++;
        data.transactions.push(transaction);
        tagMap.set(tagId, data);
      });
    }
  });
  
  // 计算总金额
  const totalAmount = Array.from(tagMap.values()).reduce((sum, data) => sum + data.amount, 0);
  
  // 转换为展示数据
  const results: TagData[] = [];
  tagMap.forEach((data, tagId) => {
    const tag = allTags.value.find(t => t.id === tagId);
    if (tag) {
      results.push({
        id: tagId,
        name: tag.name,
        value: data.amount,
        count: data.count,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
        avgAmount: data.amount / data.count,
        color: tag.color || generateColor(tag.name),
      });
    }
  });
  
  // 按金额排序
  return results.sort((a, b) => b.value - a.value);
});

// 词云图数据
const wordCloudData = computed(() => {
  if (!tagData.value.length) return [];
  
  // 找出最大值和最小值用于归一化
  const maxValue = Math.max(...tagData.value.map(t => t.value));
  const minValue = Math.min(...tagData.value.map(t => t.value));
  const range = maxValue - minValue || 1;
  
  return tagData.value.map(tag => ({
    name: tag.name,
    value: tag.value,
    // 归一化到 20-80 的字体大小范围
    textStyle: {
      fontSize: 20 + ((tag.value - minValue) / range) * 60,
      color: tag.color,
    },
    emphasis: {
      textStyle: {
        fontSize: 25 + ((tag.value - minValue) / range) * 60,
        color: tag.color,
      },
    },
    data: tag,
  }));
});

// 图表配置
const chartOptions = computed<EChartsOption>(() => {
  if (!tagData.value.length) {
    return {};
  }
  
  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const data = params.data?.data;
        if (!data) return '';
        
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${data.name}</div>
            <div>总金额: ¥${data.value.toFixed(2)}</div>
            <div>交易次数: ${data.count}笔</div>
            <div>平均金额: ¥${data.avgAmount.toFixed(2)}</div>
            <div>占比: ${data.percentage.toFixed(1)}%</div>
          </div>
        `;
      },
    },
    series: [
      {
        type: 'wordCloud',
        shape: 'circle',
        left: 'center',
        top: 'center',
        width: '90%',
        height: '90%',
        sizeRange: [14, 60],
        rotationRange: [-45, 45],
        rotationStep: 15,
        gridSize: 8,
        drawOutOfBound: false,
        layoutAnimation: true,
        textStyle: {
          fontFamily: 'sans-serif',
          fontWeight: 'bold',
        },
        emphasis: {
          focus: 'self',
          textStyle: {
            shadowBlur: 10,
            shadowColor: '#333',
          },
        },
        data: wordCloudData.value,
      },
    ],
  };
});

// 生成颜色
function generateColor(name: string): string {
  const colors = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#ff9c6e',
  ];
  
  // 基于名称生成稳定的颜色索引
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

// 格式化金额
const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// 点击标签
const handleTagClick = (tagId: string) => {
  selectedTag.value = selectedTag.value === tagId ? null : tagId;
};

// 获取标签样式
const getTagStyle = (tag: TagData) => {
  const isSelected = selectedTag.value === tag.id;
  const opacity = selectedTag.value && !isSelected ? 0.3 : 1;
  
  return {
    fontSize: `${Math.min(24, 12 + tag.percentage / 5)}px`,
    padding: '4px 12px',
    margin: '4px',
    cursor: 'pointer',
    opacity,
    transition: 'all 0.3s',
    backgroundColor: isSelected ? tag.color : `${tag.color}20`,
    color: isSelected ? '#fff' : tag.color,
    border: `1px solid ${tag.color}`,
  };
};

onMounted(() => {
  fetchTags();
});

watch(chartOptions, (options) => {
  if (Object.keys(options).length > 0) {
    setOptions(options);
  }
});
</script>

<template>
  <Card title="标签云分析" class="tag-cloud-analysis">
    <template #extra>
      <div class="card-extra">
        <TagsOutlined />
        <span class="ml-2">{{ tagData.length }}个标签</span>
      </div>
    </template>
    
    <Spin :spinning="loading">
      <div v-if="tagData.length > 0">
        <!-- 词云图 -->
        <div ref="chartRef" style="height: 400px; margin-bottom: 24px;"></div>
        
        <!-- 标签列表 -->
        <div class="tag-list">
          <div class="tag-list-header">
            <h4>标签详情</h4>
            <span class="hint">点击标签查看详细信息</span>
          </div>
          
          <div class="tags-container">
            <Tooltip
              v-for="tag in tagData"
              :key="tag.id"
              placement="top"
            >
              <template #title>
                <div>
                  <div>总金额: {{ formatAmount(tag.value) }}</div>
                  <div>交易次数: {{ tag.count }}笔</div>
                  <div>平均: {{ formatAmount(tag.avgAmount) }}/笔</div>
                  <div>占比: {{ tag.percentage.toFixed(1) }}%</div>
                </div>
              </template>
              
              <div
                class="custom-tag"
                :style="getTagStyle(tag)"
                @click="handleTagClick(tag.id)"
              >
                <span class="tag-name">{{ tag.name }}</span>
                <span class="tag-count">({{ tag.count }})</span>
              </div>
            </Tooltip>
          </div>
          
          <!-- 选中标签的详细信息 -->
          <div v-if="selectedTag" class="tag-detail">
            <div class="detail-card">
              <h4>{{ tagData.find(t => t.id === selectedTag)?.name }}标签分析</h4>
              <div class="detail-stats">
                <div class="stat-item">
                  <span class="stat-label">总金额</span>
                  <span class="stat-value">{{ formatAmount(tagData.find(t => t.id === selectedTag)?.value || 0) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">交易次数</span>
                  <span class="stat-value">{{ tagData.find(t => t.id === selectedTag)?.count }}笔</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">平均金额</span>
                  <span class="stat-value">{{ formatAmount(tagData.find(t => t.id === selectedTag)?.avgAmount || 0) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">占比</span>
                  <span class="stat-value">{{ tagData.find(t => t.id === selectedTag)?.percentage.toFixed(1) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Empty
        v-else
        description="暂无标签数据"
        :image="Empty.PRESENTED_IMAGE_SIMPLE"
      >
        <template #extra>
          <div class="text-gray-500">
            请为交易添加标签以查看分析
          </div>
        </template>
      </Empty>
    </Spin>
  </Card>
</template>

<style scoped>
.tag-cloud-analysis {
  height: 100%;
}

.card-extra {
  display: flex;
  align-items: center;
  color: #8c8c8c;
}

.tag-list {
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
}

.tag-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.tag-list-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.hint {
  font-size: 12px;
  color: #8c8c8c;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.custom-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 16px;
  white-space: nowrap;
  user-select: none;
}

.custom-tag:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.tag-name {
  font-weight: 500;
}

.tag-count {
  opacity: 0.8;
  font-size: 0.9em;
}

.tag-detail {
  margin-top: 16px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.detail-card {
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.detail-card h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 500;
}

.detail-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
}
</style>