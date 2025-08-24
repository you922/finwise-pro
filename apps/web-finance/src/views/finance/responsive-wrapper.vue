<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

import MobileFinance from './mobile/index.vue';

const isMobile = ref(false);

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});
</script>

<template>
  <div class="responsive-wrapper">
    <!-- 移动端视图 -->
    <MobileFinance v-if="isMobile" />

    <!-- 桌面端视图 -->
    <slot v-else></slot>
  </div>
</template>

<style scoped>
.responsive-wrapper {
  width: 100%;
  height: 100%;
}
</style>
