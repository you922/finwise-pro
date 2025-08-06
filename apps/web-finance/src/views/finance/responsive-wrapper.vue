<template>
  <div class="responsive-wrapper">
    <!-- 移动端视图 -->
    <MobileFinance v-if="isMobile" />
    
    <!-- 桌面端视图 -->
    <slot v-else></slot>
  </div>
</template>

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

<style scoped>
.responsive-wrapper {
  height: 100%;
  width: 100%;
}
</style>