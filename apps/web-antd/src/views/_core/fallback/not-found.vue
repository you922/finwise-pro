<script lang="ts" setup>
import { useRouter } from 'vue-router';

defineOptions({ name: 'Fallback404Demo' });

const router = useRouter();

function handleBackHome() {
  router.push('/dashboard-finance');
}
</script>

<template>
  <div
    class="bg-background flex h-screen w-screen flex-col items-center justify-center"
  >
    <h1 class="text-foreground mb-4 text-6xl font-bold">404</h1>
    <h2 class="text-foreground mb-2 text-2xl font-semibold">
      哎呀！未找到页面
    </h2>
    <p class="text-muted-foreground mb-8">抱歉，我们无法找到您要找的页面。</p>
    <button
      @click="handleBackHome"
      class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-6 py-2 transition-colors"
    >
      返回首页
    </button>
  </div>
</template>
