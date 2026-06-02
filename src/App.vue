<script setup>
import { useColorMode } from '@vueuse/core';
// 初始化主题模式（自动/亮色/暗色）
useColorMode({
  emitAuto: true,
});
</script>

<template>
  <router-view />
</template>

<style>
#app {
  height: 100vh;
  margin: 0;
  padding: 0;
}
body {
  margin: 0;
}
</style>
