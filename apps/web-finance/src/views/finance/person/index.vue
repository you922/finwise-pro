<script lang="ts" setup>
import type { Person, PersonRole } from '#/types/finance';

import { computed, onMounted, reactive, ref } from 'vue';

import { 
  DeleteOutlined, 
  EditOutlined, 
  PhoneOutlined,
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons-vue';
import { 
  Avatar,
  Button, 
  Card, 
  Col,
  Descriptions,
  Empty,
  Input,
  List,
  message, 
  Popconfirm, 
  Row,
  Space, 
  Spin,
  Tag,
} from 'ant-design-vue';

import { usePersonStore } from '#/store/modules/person';

import PersonForm from './components/person-form.vue';

const DescriptionsItem = Descriptions.Item;

// Store
const personStore = usePersonStore();

// 状态
const loading = ref(false);
const formVisible = ref(false);
const currentPerson = ref<Person | null>(null);
const viewMode = ref<'card' | 'list'>('card');
const searchKeyword = ref('');

// 角色映射
const roleMap: Record<PersonRole, { text: string; color: string }> = {
  payer: { text: '付款人', color: 'blue' },
  payee: { text: '收款人', color: 'green' },
  borrower: { text: '借款人', color: 'orange' },
  lender: { text: '出借人', color: 'purple' },
};

// 计算属性
const persons = computed(() => {
  if (!searchKeyword.value) {
    return personStore.persons;
  }
  const keyword = searchKeyword.value.toLowerCase();
  return personStore.persons.filter(person =>
    person.name.toLowerCase().includes(keyword) ||
    person.contact?.toLowerCase().includes(keyword) ||
    person.description?.toLowerCase().includes(keyword)
  );
});

// 获取数据
async function fetchData() {
  loading.value = true;
  try {
    await personStore.fetchPersons();
  } finally {
    loading.value = false;
  }
}

// 新建
function handleCreate() {
  currentPerson.value = null;
  formVisible.value = true;
}

// 编辑
function handleEdit(record: Person) {
  currentPerson.value = record;
  formVisible.value = true;
}

// 删除
async function handleDelete(id: string) {
  try {
    await personStore.deletePerson(id);
    message.success('删除成功');
  } catch (error) {
    message.error('删除失败');
  }
}

// 处理表单提交
async function handleFormSubmit(formData: Partial<Person>) {
  try {
    if (currentPerson.value) {
      // 编辑
      await personStore.updatePerson(currentPerson.value.id, formData);
      message.success('更新成功');
    } else {
      // 新建
      await personStore.createPerson(formData);
      message.success('创建成功');
    }
  } catch (error) {
    message.error('操作失败');
  }
}

// 初始化
onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="p-4">
    <!-- 搜索和操作区域 -->
    <Card class="mb-4">
      <Row :gutter="16" align="middle">
        <Col :span="8">
          <Input
            v-model:value="searchKeyword"
            placeholder="搜索人员姓名、联系方式或描述"
            allowClear
          >
            <template #prefix>
              <SearchOutlined />
            </template>
          </Input>
        </Col>
        <Col :span="16" class="text-right">
          <Space>
            <Button type="primary" @click="handleCreate">
              <PlusOutlined />
              新建人员
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>

    <!-- 人员列表 -->
    <Spin :spinning="loading">
      <Row v-if="persons.length > 0" :gutter="[16, 16]">
        <Col
          v-for="person in persons"
          :key="person.id"
          :lg="8"
          :md="12"
          :sm="24"
        >
          <Card hoverable>
            <template #title>
              <Space>
                <Avatar size="large">
                  <template #icon>
                    <UserOutlined />
                  </template>
                </Avatar>
                <span>{{ person.name }}</span>
              </Space>
            </template>
            <template #extra>
              <Space>
                <Button
                  size="small"
                  type="text"
                  @click="handleEdit(person)"
                >
                  <EditOutlined />
                </Button>
                <Popconfirm
                  title="确定要删除这个人员吗？"
                  placement="topRight"
                  @confirm="() => handleDelete(person.id)"
                >
                  <Button
                    size="small"
                    type="text"
                    danger
                  >
                    <DeleteOutlined />
                  </Button>
                </Popconfirm>
              </Space>
            </template>

            <Descriptions :column="1" size="small">
              <DescriptionsItem label="角色">
                <Space wrap>
                  <Tag
                    v-for="role in person.roles"
                    :key="role"
                    :color="roleMap[role].color"
                  >
                    {{ roleMap[role].text }}
                  </Tag>
                </Space>
              </DescriptionsItem>
              <DescriptionsItem v-if="person.contact" label="联系方式">
                <Space>
                  <PhoneOutlined />
                  {{ person.contact }}
                </Space>
              </DescriptionsItem>
              <DescriptionsItem v-if="person.description" label="描述">
                {{ person.description }}
              </DescriptionsItem>
              <DescriptionsItem label="创建时间">
                {{ person.created_at }}
              </DescriptionsItem>
            </Descriptions>
          </Card>
        </Col>
      </Row>
      <Empty v-else description="暂无人员数据" />
    </Spin>

    <!-- 表单对话框 -->
    <PersonForm
      v-model:visible="formVisible"
      :person="currentPerson"
      @submit="handleFormSubmit"
    />
  </div>
</template>