<script lang="ts" setup>
import { useRouter } from 'vue-router';

defineOptions({ name: 'Fallback404Demo' });

const router = useRouter();

function handleBackHome() {
  router.push('/dashboard-finance');
}
</script>

<template>
  <div class="flex h-screen w-screen flex-col items-center justify-center bg-background">
    <h1 class="mb-4 text-6xl font-bold text-foreground">404</h1>
    <h2 class="mb-2 text-2xl font-semibold text-foreground">哎呀！未找到页面</h2>
    <p class="mb-8 text-muted-foreground">抱歉，我们无法找到您要找的页面。</p>
    <button
      @click="handleBackHome"
      class="rounded-md bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
    >
      返回首页
    </button>
  </div>
</template>
